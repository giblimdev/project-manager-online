// @/app/api/features/[id]/order/route.ts

// Rôle : Route API pour mettre à jour l'ordre d'une feature spécifique
// Responsabilités : Validation des paramètres, mise à jour ordre en DB, gestion d'erreurs, sécurité
// Composants utilisés : NextRequest, NextResponse, Prisma ORM, zod validation
// Types utilisés : SimpleFeature, Priority, ApiResponse
// Libs externes : @/lib/prisma, @/lib/generated/prisma/client
// Utilisé par : hooks useFeatures, composants features, drag & drop interface

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Priority } from "@/lib/generated/prisma/client";

// Type pour les paramètres de route Next.js 15
interface RouteParams {
  params: Promise<{ id: string }>;
}

// Type pour la réponse API standardisée
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  details?: string;
}

// Type pour une Feature complète
interface FeatureData {
  id: string;
  name: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
}

// Type pour les données de mise à jour d'ordre
interface OrderUpdateData {
  order: number;
  position?: number;
}

// PATCH - Mettre à jour l'ordre d'une feature spécifique
export async function PATCH(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse<ApiResponse<FeatureData>>> {
  try {
    // Extraction des paramètres de route (Next.js 15)
    const { id } = await context.params;

    // Validation de l'ID
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la feature requis et valide",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Extraction et validation du body
    let body: OrderUpdateData;
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

    // Validation de l'ordre
    if (typeof body.order !== "number" || !Number.isInteger(body.order)) {
      return NextResponse.json(
        {
          success: false,
          error: "L'ordre doit être un nombre entier",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validation des limites de l'ordre
    if (body.order < 0 || body.order > 999999) {
      return NextResponse.json(
        {
          success: false,
          error: "L'ordre doit être entre 0 et 999999",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Vérification de l'existence de la feature
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        order: true,
        epicId: true,
        parentId: true,
        status: true,
      },
    });

    if (!existingFeature) {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Vérification du statut de la feature (éviter de modifier des features archivées)
    if (
      existingFeature.status === "CANCELLED" ||
      existingFeature.status === "ARCHIVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de modifier l'ordre d'une feature annulée ou archivée",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // Mise à jour de l'ordre avec transaction pour éviter les conflits
    const updatedFeature = await prisma.$transaction(async (tx) => {
      // Vérifier s'il y a conflit d'ordre dans le même epic
      const conflictingFeature = await tx.feature.findFirst({
        where: {
          epicId: existingFeature.epicId,
          order: body.order,
          id: { not: id },
        },
        select: { id: true, name: true, order: true },
      });

      // Si conflit, décaler les autres features
      if (conflictingFeature) {
        await tx.feature.updateMany({
          where: {
            epicId: existingFeature.epicId,
            order: { gte: body.order },
            id: { not: id },
          },
          data: {
            order: { increment: 1 },
            updatedAt: new Date(),
          },
        });
      }

      // Mettre à jour la feature cible
      return await tx.feature.update({
        where: { id },
        data: {
          order: body.order,
          position: body.position ?? undefined,
          updatedAt: new Date(),
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

    return NextResponse.json({
      success: true,
      data: updatedFeature,
      message: `Ordre de la feature "${existingFeature.name}" mis à jour avec succès`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'ordre:", error);

    // Gestion des erreurs spécifiques Prisma
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Conflit d'ordre détecté",
          details: "Une autre feature a déjà cet ordre",
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
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
        error: "Erreur interne lors de la mise à jour de l'ordre",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET - Récupérer les informations d'ordre d'une feature
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse<ApiResponse<{ order: number; position: number }>>> {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la feature requis",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const feature = await prisma.feature.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        order: true,
        position: true,
        status: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        order: feature.order,
        position: feature.position,
      },
      message: `Ordre de la feature "${feature.name}" récupéré`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération de l'ordre:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de l'ordre",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
