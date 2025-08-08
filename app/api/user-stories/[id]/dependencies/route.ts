// app/api/user-stories/[id]/dependencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const dependencySchema = z.object({
  dependsOnUserStoryId: z.string().cuid(),
  type: z.string().default("DEPENDS_ON"),
  description: z.string().optional(),
});

/**
 * POST /api/user-stories/[id]/dependencies
 * Ajoute une dépendance à la User Story
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ✅ Await params

    if (!id) {
      return NextResponse.json(
        { error: "ID de la User Story requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = dependencySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Vérifier que les deux User Stories existent
    const [dependentUserStory, dependsOnUserStory] = await Promise.all([
      prisma.userStory.findUnique({
        where: { id },
        select: { id: true },
      }),
      prisma.userStory.findUnique({
        where: { id: data.dependsOnUserStoryId },
        select: { id: true },
      }),
    ]);

    if (!dependentUserStory) {
      return NextResponse.json(
        { error: "User Story dépendante non trouvée" },
        { status: 404 }
      );
    }

    if (!dependsOnUserStory) {
      return NextResponse.json(
        { error: "User Story de dépendance non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de dépendance circulaire
    const existingDependency = await prisma.userStoryDependency.findFirst({
      where: {
        dependentUserStoryId: data.dependsOnUserStoryId,
        dependsOnUserStoryId: id,
      },
    });

    if (existingDependency) {
      return NextResponse.json(
        { error: "Une dépendance circulaire serait créée" },
        { status: 409 }
      );
    }

    // Créer la dépendance
    const dependency = await prisma.userStoryDependency.create({
      data: {
        dependentUserStoryId: id,
        dependsOnUserStoryId: data.dependsOnUserStoryId,
        type: data.type,
        description: data.description,
      },
      include: {
        dependsOnUserStory: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la dépendance:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
