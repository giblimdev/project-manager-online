// app/api/user-stories/[id]/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const reorderSchema = z.object({
  direction: z.enum(["up", "down"]),
  newPosition: z.number().int().optional(),
});

/**
 * PUT /api/user-stories/[id]/reorder
 * Réorganise une User Story dans la liste
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ✅ Await params

    if (!id) {
      return NextResponse.json(
        { error: "ID de la User Story requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = reorderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { direction, newPosition } = validationResult.data;

    // Récupérer la User Story à déplacer
    const userStory = await prisma.userStory.findUnique({
      where: { id },
      select: { id: true, position: true, featureId: true },
    });

    if (!userStory) {
      return NextResponse.json(
        { error: "User Story non trouvée" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      if (newPosition !== undefined) {
        // Position spécifique fournie
        await tx.userStory.update({
          where: { id },
          data: { position: newPosition },
        });
      } else {
        // Déplacement relatif (up/down)
        const userStories = await tx.userStory.findMany({
          where: { featureId: userStory.featureId },
          select: { id: true, position: true },
          orderBy: { position: "asc" },
        });

        const currentIndex = userStories.findIndex((us) => us.id === id);
        if (currentIndex === -1) return;

        const newIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= userStories.length) return;

        // Échanger les positions
        const currentUserStory = userStories[currentIndex];
        const targetUserStory = userStories[newIndex];

        await tx.userStory.update({
          where: { id: currentUserStory.id },
          data: { position: targetUserStory.position },
        });

        await tx.userStory.update({
          where: { id: targetUserStory.id },
          data: { position: currentUserStory.position },
        });
      }
    });

    return NextResponse.json({ message: "User Story réorganisée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la réorganisation de la User Story:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
