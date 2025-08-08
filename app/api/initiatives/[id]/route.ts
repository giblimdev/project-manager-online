// app/api/initiatives/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface UpdateInitiativeRequest {
  name?: string;
  description?: string;
  objective?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  budget?: number;
  roi?: number;
  userId?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const initiative = await prisma.initiative.findUnique({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        epics: {
          include: {
            features: {
              select: {
                id: true,
                name: true,
                status: true,
                progress: true,
                storyPoints: true,
              },
            },
          },
        },
      },
    });

    if (!initiative) {
      return NextResponse.json(
        { error: "Initiative non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(initiative);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'initiative:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'initiative" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: UpdateInitiativeRequest = await request.json();

    // Vérifier que l'initiative existe
    const existingInitiative = await prisma.initiative.findUnique({
      where: {
        id,
      },
      include: {
        project: true,
      },
    });

    if (!existingInitiative) {
      return NextResponse.json(
        { error: "Initiative non trouvée" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Mise à jour conditionnelle des champs
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.roi !== undefined) updateData.roi = body.roi;
    if (body.userId !== undefined) updateData.userId = body.userId;

    const initiative = await prisma.initiative.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        epics: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    return NextResponse.json(initiative);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'initiative:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'initiative" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Vérifier que l'initiative existe
    const existingInitiative = await prisma.initiative.findUnique({
      where: {
        id,
      },
      include: {
        epics: {
          include: {
            features: {
              include: {
                userStories: {
                  include: {
                    tasks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingInitiative) {
      return NextResponse.json(
        { error: "Initiative non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des éléments liés
    const hasEpics = existingInitiative.epics.length > 0;
    const hasFeatures = existingInitiative.epics.some(
      (epic) => epic.features.length > 0
    );
    const hasUserStories = existingInitiative.epics.some((epic) =>
      epic.features.some((feature) => feature.userStories.length > 0)
    );
    const hasTasks = existingInitiative.epics.some((epic) =>
      epic.features.some((feature) =>
        feature.userStories.some((story) => story.tasks.length > 0)
      )
    );

    if (hasEpics || hasFeatures || hasUserStories || hasTasks) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer l'initiative car elle contient des éléments liés (epics, features, user stories ou tasks)",
        },
        { status: 400 }
      );
    }

    await prisma.initiative.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Initiative supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'initiative:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'initiative" },
      { status: 500 }
    );
  }
}
