// app/api/epics/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Priority } from "@/lib/generated/prisma/client";

interface UpdateEpicRequest {
  name?: string;
  description?: string | null;
  priority?: Priority;
  status?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  progress?: number;
}

function isError(err: unknown): err is Error {
  return err instanceof Error;
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" && err !== null && "code" in err && "message" in err
  );
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Erreur inconnue";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const epic = await prisma.epic.findUnique({
      where: { id },
      include: {
        initiative: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
          },
        },
        features: {
          include: {
            userStories: {
              select: {
                id: true,
                title: true,
                status: true,
                storyPoints: true,
              },
            },
          },
        },
      },
    });

    if (!epic) {
      return NextResponse.json({ error: "Épic non trouvé" }, { status: 404 });
    }

    return NextResponse.json(epic);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de l'épic:", error);

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'épic",
        details: errorMessage,
      },
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
    const body: UpdateEpicRequest = await request.json();

    // Vérifier que l'épic existe
    const existingEpic = await prisma.epic.findUnique({
      where: { id },
      include: { initiative: true },
    });

    if (!existingEpic) {
      return NextResponse.json({ error: "Épic non trouvé" }, { status: 404 });
    }

    const updateData: any = {};

    // Mise à jour conditionnelle des champs
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Le nom ne peut pas être vide" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.priority !== undefined) {
      const validPriorities: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          { error: "Priorité invalide" },
          { status: 400 }
        );
      }
      updateData.priority = body.priority;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.startDate !== undefined) {
      if (body.startDate) {
        const parsedStartDate = new Date(body.startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            { error: "Format de date de début invalide" },
            { status: 400 }
          );
        }
        updateData.startDate = parsedStartDate;
      } else {
        updateData.startDate = null;
      }
    }

    if (body.endDate !== undefined) {
      if (body.endDate) {
        const parsedEndDate = new Date(body.endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            { error: "Format de date de fin invalide" },
            { status: 400 }
          );
        }
        updateData.endDate = parsedEndDate;
      } else {
        updateData.endDate = null;
      }
    }

    if (body.progress !== undefined) {
      if (body.progress < 0 || body.progress > 1) {
        return NextResponse.json(
          { error: "Le progrès doit être compris entre 0 et 1" },
          { status: 400 }
        );
      }
      updateData.progress = body.progress;
    }

    // Validation des dates
    const finalStartDate = updateData.startDate ?? existingEpic.startDate;
    const finalEndDate = updateData.endDate ?? existingEpic.endDate;

    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    const epic = await prisma.epic.update({
      where: { id },
      data: updateData,
      include: {
        initiative: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        features: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    return NextResponse.json(epic);
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de l'épic:", error);

    if (isPrismaError(error)) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Épic non trouvé" }, { status: 404 });
      }

      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Un épic avec ce nom existe déjà dans cette initiative" },
          { status: 409 }
        );
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de l'épic",
        details: errorMessage,
      },
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

    // Vérifier que l'épic existe et récupérer les éléments liés
    const existingEpic = await prisma.epic.findUnique({
      where: { id },
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
    });

    if (!existingEpic) {
      return NextResponse.json({ error: "Épic non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des éléments liés
    const hasFeatures = existingEpic.features.length > 0;
    const hasUserStories = existingEpic.features.some(
      (feature) => feature.userStories.length > 0
    );
    const hasTasks = existingEpic.features.some((feature) =>
      feature.userStories.some((story) => story.tasks.length > 0)
    );

    if (hasFeatures || hasUserStories || hasTasks) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer l'épic car il contient des éléments liés (features, user stories ou tasks)",
        },
        { status: 400 }
      );
    }

    await prisma.epic.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Épic supprimé avec succès" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de l'épic:", error);

    if (isPrismaError(error)) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "Épic non trouvé" }, { status: 404 });
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de l'épic",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
