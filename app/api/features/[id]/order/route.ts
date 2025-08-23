// @/app/api/features/[id]/order/route.ts
// RÔLE : API route pour la mise à jour de l'ordre et de la position d'une feature spécifique
// RESPONSABILITÉS :
// - Gestion de la méthode PATCH pour modifier l'ordre d'une feature
// - Validation des données d'entrée (order, position optionnelle)
// - Interaction avec la base de données via Prisma
// - Gestion des erreurs et retour de réponses JSON standardisées
// COMPOSANTS/LIBS UTILISÉS :
// - Next.js 15 API Routes avec params asynchrones
// - Prisma Client via lib/prisma.ts (instance centralisée)
// - Zod pour la validation des données
// - TypeScript strict mode

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schéma de validation pour la mise à jour de l'ordre
const UpdateOrderSchema = z.object({
  order: z.number().int().min(0).describe("Nouvel ordre de la feature"),
  position: z.number().int().min(0).optional().describe("Position optionnelle dans la hiérarchie"),
});

type UpdateOrderData = z.infer<typeof UpdateOrderSchema>;

// ✅ Interface mise à jour pour Next.js 15 - params est maintenant une Promise
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/features/[id]/order
 * Met à jour l'ordre et optionnellement la position d'une feature
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // ✅ Await des params dans Next.js 15
    const { id: featureId } = await params;

    if (!featureId || typeof featureId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "ID de feature requis et doit être une chaîne valide",
        },
        { status: 400 }
      );
    }

    // Parse et validation du body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
        },
        { status: 400 }
      );
    }

    // Validation des données avec Zod
    const validationResult = UpdateOrderSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      
      return NextResponse.json(
        {
          success: false,
          error: `Données invalides: ${errorMessages}`,
        },
        { status: 400 }
      );
    }

    const { order, position }: UpdateOrderData = validationResult.data;

    // Vérifier que la feature existe
    const existingFeature = await prisma.feature.findUnique({
      where: { id: featureId },
      select: {
        id: true,
        projectId: true,
        order: true,
        position: true,
        name: true,
      },
    });

    if (!existingFeature) {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
        },
        { status: 404 }
      );
    }

    // Si un autre feature a déjà le même ordre, on fait un swap
    const conflictingFeature = await prisma.feature.findFirst({
      where: {
        projectId: existingFeature.projectId,
        order: order,
        id: { not: featureId },
      },
      select: { id: true, order: true },
    });

    // Transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Si il y a un conflit d'ordre, on échange les ordres
      if (conflictingFeature) {
        await tx.feature.update({
          where: { id: conflictingFeature.id },
          data: { order: existingFeature.order },
        });
      }

      // Mise à jour de la feature cible
      const updateData: { order: number; position?: number } = { order };
      if (typeof position === "number") {
        updateData.position = position;
      }

      const updatedFeature = await tx.feature.update({
        where: { id: featureId },
        data: updateData,
        select: {
          id: true,
          name: true,
          order: true,
          position: true,
          updatedAt: true,
        },
      });

      return updatedFeature;
    });

    return NextResponse.json({
      success: true,
      message: "Ordre de la feature mis à jour avec succès",
      data: result,
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'ordre:", error);

    // Gestion spécifique des erreurs Prisma
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Conflit d'ordre détecté",
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes("Record to update not found")) {
        return NextResponse.json(
          {
            success: false,
            error: "Feature non trouvée",
          },
          { status: 404 }
        );
      }

      if (error.message.includes("@prisma/client did not initialize")) {
        return NextResponse.json(
          {
            success: false,
            error: "Erreur de connexion à la base de données",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur lors de la mise à jour de l'ordre",
      },
      { status: 500 }
    );
  }
}

/**
 * Méthodes non supportées
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Méthode GET non supportée sur cette route",
    },
    { status: 405 }
  );
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Méthode POST non supportée sur cette route",
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Méthode PUT non supportée sur cette route",
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Méthode DELETE non supportée sur cette route",
    },
    { status: 405 }
  );
}
