// @/app/api/features/reorder/route.ts

// Rôle : Route API pour réorganiser plusieurs features en une seule transaction
// Responsabilités : Validation batch, réorganisation en masse, transactions atomiques, gestion hiérarchie
// Composants utilisés : NextRequest, NextResponse, Prisma transactions, zod validation
// Types utilisés : ReorderRequest, FeatureData, Priority, ApiResponse
// Libs externes : @/lib/prisma, @/lib/generated/prisma/client
// Utilisé par : hooks useFeatures, drag & drop features, tri automatique

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Priority } from "@/lib/generated/prisma/client";

// Type pour une demande de réorganisation individuelle
export interface ReorderRequest {
  featureId: string;
  newOrder: number;
  newPosition?: number;
  targetPosition?: "before" | "after" | "first" | "last";
  referenceFeatureId?: string;
}

// Type pour les données de la requête batch
interface BatchReorderRequest {
  epicId: string;
  reorders: ReorderRequest[];
  strategy?: "preserve_gaps" | "compact" | "auto";
  validateHierarchy?: boolean;
}

// Type pour les résultats de réorganisation
interface ReorderResult {
  featureId: string;
  oldOrder: number;
  newOrder: number;
  oldPosition: number;
  newPosition: number;
  success: boolean;
  error?: string;
}

// Type pour la réponse API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  details?: string;
  stats?: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}

// Type pour les statistiques de réorganisation
interface ReorganizationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  conflicts: number;
  hierarchyViolations: number;
}

// Fonction utilitaire pour valider les données de réorganisation
function validateReorderRequest(request: ReorderRequest): {
  isValid: boolean;
  error?: string;
} {
  if (!request.featureId || typeof request.featureId !== "string") {
    return {
      isValid: false,
      error: "featureId requis et doit être une chaîne",
    };
  }

  if (
    typeof request.newOrder !== "number" ||
    !Number.isInteger(request.newOrder)
  ) {
    return { isValid: false, error: "newOrder requis et doit être un entier" };
  }

  if (request.newOrder < 0 || request.newOrder > 999999) {
    return { isValid: false, error: "newOrder doit être entre 0 et 999999" };
  }

  if (request.newPosition !== undefined) {
    if (
      typeof request.newPosition !== "number" ||
      !Number.isInteger(request.newPosition)
    ) {
      return { isValid: false, error: "newPosition doit être un entier" };
    }
    if (request.newPosition < 0) {
      return { isValid: false, error: "newPosition doit être positif ou zéro" };
    }
  }

  if (
    request.targetPosition &&
    !["before", "after", "first", "last"].includes(request.targetPosition)
  ) {
    return {
      isValid: false,
      error: 'targetPosition doit être "before", "after", "first", ou "last"',
    };
  }

  return { isValid: true };
}

// Fonction pour détecter les conflits d'ordre
async function detectOrderConflicts(
  epicId: string,
  reorders: ReorderRequest[],
  tx: any
): Promise<{ conflicts: ReorderRequest[]; safe: ReorderRequest[] }> {
  const orderMap = new Map<number, string[]>();

  // Grouper par ordre
  reorders.forEach((reorder) => {
    const existing = orderMap.get(reorder.newOrder) || [];
    existing.push(reorder.featureId);
    orderMap.set(reorder.newOrder, existing);
  });

  // Vérifier les conflits en base
  const conflicts: ReorderRequest[] = [];
  const safe: ReorderRequest[] = [];

  for (const reorder of reorders) {
    const duplicatesInRequest = orderMap.get(reorder.newOrder) || [];
    const hasRequestConflict = duplicatesInRequest.length > 1;

    // Vérifier conflit en base
    const existingFeature = await tx.feature.findFirst({
      where: {
        epicId,
        order: reorder.newOrder,
        id: { not: reorder.featureId },
      },
      select: { id: true, name: true },
    });

    if (hasRequestConflict || existingFeature) {
      conflicts.push(reorder);
    } else {
      safe.push(reorder);
    }
  }

  return { conflicts, safe };
}

// Fonction pour résoudre automatiquement les conflits
async function resolveOrderConflicts(
  epicId: string,
  conflictingReorders: ReorderRequest[],
  strategy: "preserve_gaps" | "compact" | "auto",
  tx: any
): Promise<ReorderRequest[]> {
  const resolved: ReorderRequest[] = [];

  // Récupérer tous les ordres existants
  const existingOrders = await tx.feature.findMany({
    where: { epicId },
    select: { id: true, order: true },
    orderBy: { order: "asc" },
  });

  const usedOrders = new Set(
    existingOrders.map((f: { order: any }) => f.order)
  );

  for (const conflict of conflictingReorders) {
    let newOrder = conflict.newOrder;

    switch (strategy) {
      case "compact":
        // Trouver le premier ordre disponible après l'ordre désiré
        while (usedOrders.has(newOrder)) {
          newOrder++;
        }
        break;

      case "preserve_gaps":
        // Trouver le prochain ordre avec espacement (multiples de 10)
        newOrder = Math.ceil(newOrder / 10) * 10;
        while (usedOrders.has(newOrder)) {
          newOrder += 10;
        }
        break;

      case "auto":
      default:
        // Stratégie intelligente basée sur la densité
        const density =
          existingOrders.length /
          (Math.max(...existingOrders.map((f: { order: any }) => f.order)) ||
            1);
        const increment = density > 0.5 ? 1 : 10;

        while (usedOrders.has(newOrder)) {
          newOrder += increment;
        }
        break;
    }

    usedOrders.add(newOrder);
    resolved.push({
      ...conflict,
      newOrder,
    });
  }

  return resolved;
}

// PATCH - Réorganiser plusieurs features en une seule transaction
export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ReorderResult[]>>> {
  try {
    // Extraction et validation du body
    let body: BatchReorderRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Format JSON invalide",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validation des champs requis
    if (!body.epicId || typeof body.epicId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "epicId requis et doit être une chaîne",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.reorders) || body.reorders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "reorders doit être un tableau non vide",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validation individuelle de chaque réorganisation
    for (let i = 0; i < body.reorders.length; i++) {
      const validation = validateReorderRequest(body.reorders[i]);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: `Réorganisation ${i}: ${validation.error}`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Limitation du nombre de réorganisations simultanées
    if (body.reorders.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum 100 réorganisations simultanées autorisées",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const strategy = body.strategy || "auto";
    const validateHierarchy = body.validateHierarchy ?? true;

    // Vérifier que l'epic existe
    const epic = await prisma.epic.findUnique({
      where: { id: body.epicId },
      select: { id: true, name: true, status: true },
    });

    if (!epic) {
      return NextResponse.json(
        {
          success: false,
          error: "Epic non trouvé",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Vérifier le statut de l'epic
    if (epic.status === "CANCELLED" || epic.status === "ARCHIVED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de réorganiser les features d'un epic annulé ou archivé",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Exécuter la réorganisation en transaction
    const results = await prisma.$transaction(async (tx) => {
      const stats: ReorganizationStats = {
        total: body.reorders.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        conflicts: 0,
        hierarchyViolations: 0,
      };

      const results: ReorderResult[] = [];

      // Vérifier que toutes les features appartiennent à l'epic
      const featureIds = body.reorders.map((r) => r.featureId);
      const existingFeatures = await tx.feature.findMany({
        where: {
          id: { in: featureIds },
          epicId: body.epicId,
        },
        select: {
          id: true,
          name: true,
          order: true,
          position: true,
          status: true,
          parentId: true,
        },
      });

      if (existingFeatures.length !== featureIds.length) {
        const found = new Set(existingFeatures.map((f) => f.id));
        const missing = featureIds.filter((id) => !found.has(id));
        throw new Error(
          `Features non trouvées ou n'appartenant pas à cet epic: ${missing.join(
            ", "
          )}`
        );
      }

      // Créer un map pour accès rapide
      const featureMap = new Map(existingFeatures.map((f) => [f.id, f]));

      // Détecter et résoudre les conflits d'ordre
      const { conflicts, safe } = await detectOrderConflicts(
        body.epicId,
        body.reorders,
        tx
      );
      stats.conflicts = conflicts.length;

      let resolvedConflicts: ReorderRequest[] = [];
      if (conflicts.length > 0) {
        resolvedConflicts = await resolveOrderConflicts(
          body.epicId,
          conflicts,
          strategy,
          tx
        );
      }

      const allReorders = [...safe, ...resolvedConflicts];

      // Validation de la hiérarchie si demandée
      if (validateHierarchy) {
        for (const reorder of allReorders) {
          const feature = featureMap.get(reorder.featureId);
          if (feature?.parentId) {
            const parent = featureMap.get(feature.parentId);
            if (parent && reorder.newOrder <= parent.order) {
              stats.hierarchyViolations++;
              results.push({
                featureId: reorder.featureId,
                oldOrder: feature.order,
                newOrder: reorder.newOrder,
                oldPosition: feature.position,
                newPosition: reorder.newPosition || feature.position,
                success: false,
                error:
                  "Violation de hiérarchie: l'enfant ne peut pas avoir un ordre inférieur au parent",
              });
              stats.failed++;
              continue;
            }
          }
        }
      }

      // Effectuer les réorganisations
      for (const reorder of allReorders) {
        try {
          const feature = featureMap.get(reorder.featureId);
          if (!feature) {
            results.push({
              featureId: reorder.featureId,
              oldOrder: 0,
              newOrder: reorder.newOrder,
              oldPosition: 0,
              newPosition: reorder.newPosition || 0,
              success: false,
              error: "Feature non trouvée",
            });
            stats.failed++;
            continue;
          }

          // Vérifier le statut de la feature
          if (feature.status === "CANCELLED" || feature.status === "ARCHIVED") {
            results.push({
              featureId: reorder.featureId,
              oldOrder: feature.order,
              newOrder: reorder.newOrder,
              oldPosition: feature.position,
              newPosition: reorder.newPosition || feature.position,
              success: false,
              error: "Feature annulée ou archivée",
            });
            stats.skipped++;
            continue;
          }

          // Si pas de changement, ignorer
          if (
            feature.order === reorder.newOrder &&
            feature.position === (reorder.newPosition || feature.position)
          ) {
            results.push({
              featureId: reorder.featureId,
              oldOrder: feature.order,
              newOrder: reorder.newOrder,
              oldPosition: feature.position,
              newPosition: reorder.newPosition || feature.position,
              success: true,
            });
            stats.skipped++;
            continue;
          }

          const updated = await tx.feature.update({
            where: { id: reorder.featureId },
            data: {
              order: reorder.newOrder,
              position: reorder.newPosition ?? feature.position,
              updatedAt: new Date(),
            },
            select: {
              id: true,
              name: true,
              order: true,
              position: true,
            },
          });

          results.push({
            featureId: reorder.featureId,
            oldOrder: feature.order,
            newOrder: updated.order,
            oldPosition: feature.position,
            newPosition: updated.position,
            success: true,
          });
          stats.successful++;
        } catch (updateError: any) {
          console.error(
            `Erreur mise à jour feature ${reorder.featureId}:`,
            updateError
          );

          const feature = featureMap.get(reorder.featureId);
          results.push({
            featureId: reorder.featureId,
            oldOrder: feature?.order || 0,
            newOrder: reorder.newOrder,
            oldPosition: feature?.position || 0,
            newPosition: reorder.newPosition || 0,
            success: false,
            error: updateError?.message || "Erreur de mise à jour",
          });
          stats.failed++;
        }
      }

      return { results, stats };
    });

    // Construire la réponse
    const message = `Réorganisation terminée: ${results.stats.successful} succès, ${results.stats.failed} échecs, ${results.stats.skipped} ignorées`;

    return NextResponse.json({
      success: results.stats.failed === 0,
      data: results.results,
      message,
      timestamp: new Date().toISOString(),
      stats: {
        total: results.stats.total,
        successful: results.stats.successful,
        failed: results.stats.failed,
        skipped: results.stats.skipped,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la réorganisation batch:", error);

    // Gestion des erreurs spécifiques Prisma
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Conflit d'ordre détecté lors de la réorganisation",
          details: "Des features ont des ordres conflictuels",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Une ou plusieurs features non trouvées",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Référence invalide (epic ou parent)",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de la réorganisation des features",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET - Obtenir un aperçu des ordres actuels pour un epic
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url);
    const epicId = searchParams.get("epicId");

    if (!epicId) {
      return NextResponse.json(
        {
          success: false,
          error: "epicId requis en paramètre",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const features = await prisma.feature.findMany({
      where: { epicId },
      select: {
        id: true,
        name: true,
        order: true,
        position: true,
        status: true,
        parentId: true,
      },
      orderBy: [{ order: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    });

    // Analyser la distribution des ordres
    const orders = features.map((f) => f.order);
    const gaps = [];
    for (let i = 1; i < orders.length; i++) {
      const gap = orders[i] - orders[i - 1];
      if (gap > 1) {
        gaps.push({ from: orders[i - 1], to: orders[i], size: gap });
      }
    }

    const stats = {
      totalFeatures: features.length,
      minOrder: Math.min(...orders) || 0,
      maxOrder: Math.max(...orders) || 0,
      averageGap:
        orders.length > 1
          ? (Math.max(...orders) - Math.min(...orders)) / (orders.length - 1)
          : 0,
      gaps: gaps.length,
      duplicates: orders.length - new Set(orders).size,
    };

    return NextResponse.json({
      success: true,
      data: {
        features: features.map((f) => ({
          id: f.id,
          name: f.name,
          order: f.order,
          position: f.position,
          status: f.status,
          hasParent: !!f.parentId,
        })),
        stats,
        gaps,
      },
      message: `${features.length} features trouvées pour l'epic`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des ordres:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des informations d'ordre",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
