// @/app/api/features/route.ts
// RÔLE : Route API corrigée avec logs debug pour diagnostic et validation optimisée des features

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Priority } from "@/lib/generated/prisma/client";
import type {
  SimpleFeature,
  FeatureWithHierarchy,
  ApiResponse,
  FeatureStats,
} from "@/types/feature";

// GET - Récupérer les features avec support hiérarchique
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<FeatureWithHierarchy[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const epicId = searchParams.get("epicId");
    const projectId = searchParams.get("projectId");
    const includeHierarchy = searchParams.get("includeHierarchy") === "true";
    const includeStats = searchParams.get("includeStats") === "true";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const parentId = searchParams.get("parentId");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    // Construction du filtre WHERE
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;
    if (epicId) whereClause.epicId = epicId;
    if (status) whereClause.status = status;
    if (priority && Object.values(Priority).includes(priority as Priority)) {
      whereClause.priority = priority as Priority;
    }
    if (parentId === "null") {
      whereClause.parentId = null;
    } else if (parentId) {
      whereClause.parentId = parentId;
    }

    // Configuration de la sélection avec relations conditionnelles
    const selectConfig: any = {
      id: true,
      name: true,
      order: true,
      description: true,
      acceptanceCriteria: true,
      priority: true,
      status: true,
      storyPoints: true,
      businessValue: true,
      technicalRisk: true,
      effort: true,
      startDate: true,
      endDate: true,
      progress: true,
      position: true,
      createdAt: true,
      updatedAt: true,
      epicId: true,
      parentId: true,
      projectId: true,
      userId: true,
    };

    if (includeHierarchy) {
      selectConfig.parent = {
        select: {
          id: true,
          name: true,
          order: true,
          status: true,
          priority: true,
          progress: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          epicId: true,
          parentId: true,
          projectId: true,
          userId: true,
        },
      };
      selectConfig.children = {
        select: {
          id: true,
          name: true,
          order: true,
          status: true,
          priority: true,
          progress: true,
          storyPoints: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          epicId: true,
          parentId: true,
          projectId: true,
          userId: true,
        },
        orderBy: [{ order: "asc" as const }, { position: "asc" as const }],
      };
      selectConfig.epic = {
        select: { id: true, name: true, status: true },
      };
    }

    // Exécuter la requête avec pagination optionnelle
    const queryOptions: any = {
      where: whereClause,
      select: selectConfig,
      orderBy: [
        { order: "asc" as const },
        { position: "asc" as const },
        { createdAt: "desc" as const },
      ],
    };
    if (limit) {
      queryOptions.take = limit;
      queryOptions.skip = offset;
    }
    const features = await prisma.feature.findMany(queryOptions);

    // Calculer les statistiques si demandées
    let stats: FeatureStats | undefined;
    if (includeStats) {
      const allFeatures = await prisma.feature.findMany({
        where: whereClause,
        select: {
          status: true,
          priority: true,
          parentId: true,
          storyPoints: true,
          progress: true,
          children: { select: { id: true } },
        },
      });

      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      let totalStoryPoints = 0;
      let totalProgress = 0;
      let withParent = 0;
      let withChildren = 0;
      allFeatures.forEach((feature) => {
        byStatus[feature.status] = (byStatus[feature.status] || 0) + 1;
        byPriority[feature.priority] = (byPriority[feature.priority] || 0) + 1;
        if (feature.parentId) withParent++;
        if (feature.children && feature.children.length > 0) withChildren++;
        if (feature.storyPoints) totalStoryPoints += feature.storyPoints;
        totalProgress += feature.progress;
      });
      stats = {
        total: allFeatures.length,
        byStatus,
        byPriority,
        withParent,
        withChildren,
        totalStoryPoints,
        averageProgress:
          allFeatures.length > 0 ? totalProgress / allFeatures.length : 0,
      };
    }

    // Construire la réponse
    const response: ApiResponse<FeatureWithHierarchy[]> = {
      success: true,
      data: features as FeatureWithHierarchy[],
      count: features.length,
      timestamp: new Date().toISOString(),
    };
    if (stats) (response as any).stats = stats;
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des features:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des features",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle feature avec validation complète et debug
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SimpleFeature>>> {
  try {
    let body: any;
    try {
      body = await request.json();
      console.log("🔍 DEBUG - Payload reçu pour création feature:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("❌ Erreur parsing JSON:", parseError);
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
    if (
      !body.name ||
      typeof body.name !== "string" ||
      body.name.trim().length === 0
    ) {
      console.error("❌ Validation échouée: name manquant ou invalide");
      return NextResponse.json(
        {
          success: false,
          error: "Le nom de la feature est requis et ne peut pas être vide",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // CORRECTION CRITIQUE : projectId est maintenant obligatoire (pas epicId)
    if (!body.projectId || typeof body.projectId !== "string") {
      console.error("❌ Validation échouée: projectId manquant");
      return NextResponse.json(
        {
          success: false,
          error: "Le projectId est requis",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (body.priority && !Object.values(Priority).includes(body.priority)) {
      console.error("❌ Validation échouée: priority invalide");
      return NextResponse.json(
        {
          success: false,
          error: `Priorité invalide. Valeurs autorisées: ${Object.values(
            Priority
          ).join(", ")}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validation des métriques
    const numericFields = [
      "storyPoints",
      "businessValue",
      "technicalRisk",
      "effort",
      "progress",
    ];
    for (const field of numericFields) {
      if (body[field] !== undefined && body[field] !== null) {
        const value = Number(body[field]);
        if (isNaN(value) || value < 0) {
          console.error(`❌ Validation échouée: ${field} invalide`);
          return NextResponse.json(
            {
              success: false,
              error: `${field} doit être un nombre positif ou null`,
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        if (
          ["businessValue", "technicalRisk", "progress"].includes(field) &&
          value > 100
        ) {
          console.error(`❌ Validation échouée: ${field} > 100`);
          return NextResponse.json(
            {
              success: false,
              error: `${field} ne peut pas dépasser 100`,
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
      }
    }

    console.log("✅ Validation réussie, début de la transaction");

    // Exécuter la création en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier que le projet existe
      const project = await tx.project.findUnique({
        where: { id: body.projectId },
        select: { id: true, name: true, status: true },
      });
      if (!project) throw new Error("Projet non trouvé");
      if (project.status === "CANCELLED" || project.status === "ARCHIVED") {
        throw new Error(
          "Impossible de créer une feature dans un projet annulé ou archivé"
        );
      }

      // Vérifier l'epic si fourni
      if (body.epicId) {
        const epic = await tx.epic.findUnique({
          where: { id: body.epicId },
          select: { id: true, name: true, status: true },
        });
        if (!epic) throw new Error("Epic non trouvé");
        if (epic.status === "CANCELLED" || epic.status === "ARCHIVED") {
          throw new Error(
            "Impossible de créer une feature dans un epic annulé ou archivé"
          );
        }
      }

      // Validation du parent si fourni
      if (body.parentId) {
        const parentFeature = await tx.feature.findUnique({
          where: { id: body.parentId },
          select: { id: true, projectId: true, order: true, status: true },
        });
        if (!parentFeature) throw new Error("Feature parent non trouvée");
        if (parentFeature.projectId !== body.projectId) {
          throw new Error("La feature parent doit appartenir au même projet");
        }
        if (
          parentFeature.status === "CANCELLED" ||
          parentFeature.status === "ARCHIVED"
        ) {
          throw new Error(
            "Impossible de créer une feature enfant sous un parent annulé ou archivé"
          );
        }
      }

      // Obtenir le prochain order disponible
      const lastFeature = await tx.feature.findFirst({
        where: { projectId: body.projectId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder =
        body.order || (lastFeature ? lastFeature.order + 10 : 1000);

      // Obtenir la prochaine position disponible
      const lastPosition = await tx.feature.findFirst({
        where: { projectId: body.projectId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const nextPosition =
        body.position || (lastPosition ? lastPosition.position + 1 : 0);

      console.log(`🔧 Création feature avec order: ${nextOrder}, position: ${nextPosition}`);

      // Créer la feature
      return await tx.feature.create({
        data: {
          name: body.name.trim(),
          order: nextOrder,
          description: body.description?.trim() || null,
          acceptanceCriteria: body.acceptanceCriteria?.trim() || null,
          priority: body.priority || Priority.MEDIUM,
          status: body.status || "ACTIVE",
          storyPoints: body.storyPoints ? Number(body.storyPoints) : null,
          businessValue: body.businessValue ? Number(body.businessValue) : null,
          technicalRisk: body.technicalRisk ? Number(body.technicalRisk) : null,
          effort: body.effort ? Number(body.effort) : null,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          progress: body.progress ? Number(body.progress) : 0,
          position: nextPosition,
          epicId: body.epicId || null,
          parentId: body.parentId || null,
          projectId: body.projectId,
          userId: body.userId || null,
        },
        select: {
          id: true,
          name: true,
          order: true,
          description: true,
          acceptanceCriteria: true,
          priority: true,
          status: true,
          storyPoints: true,
          businessValue: true,
          technicalRisk: true,
          effort: true,
          startDate: true,
          endDate: true,
          progress: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          epicId: true,
          parentId: true,
          projectId: true,
          userId: true,
        },
      });
    });

    console.log("✅ Feature créée avec succès:", result.id);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Feature "${result.name}" créée avec succès`,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Erreur lors de la création de la feature:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Une feature avec ces informations existe déjà (contrainte d'unicité)",
          details: error.meta?.target
            ? `Champ en conflit: ${error.meta.target}`
            : undefined,
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Référence invalide (epic, parent, projet ou utilisateur)",
          details: error.meta?.field_name
            ? `Champ invalide: ${error.meta.field_name}`
            : undefined,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Enregistrement requis non trouvé",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }
    // Erreurs métier personnalisées
    if (
      error?.message?.includes("Projet non trouvé") ||
      error?.message?.includes("Epic non trouvé") ||
      error?.message?.includes("Feature parent non trouvée") ||
      error?.message?.includes("appartenir au même") ||
      error?.message?.includes("annulé ou archivé")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de la création de la feature",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
