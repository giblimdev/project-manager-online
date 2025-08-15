// app/api/epics/[id]/route.ts
// Route API pour gérer un épic spécifique par son ID : récupération, mise à jour et suppression

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import type { Priority } from "@/lib/generated/prisma/client";

interface UpdateEpicRequest {
  name?: string;
  description?: string | null;
  priority?: Priority;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number;
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return typeof err === "object" && err !== null && "code" in err && "message" in err;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
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
      return NextResponse.json({ success: false, error: "Épic non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: epic });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Erreur lors de la récupération de l'épic:", errorMessage);
    return NextResponse.json(
      {
        success: false,
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

    const existingEpic = await prisma.epic.findUnique({
      where: { id },
      include: { initiative: true },
    });

    if (!existingEpic) {
      return NextResponse.json({ success: false, error: "Épic non trouvé" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ success: false, error: "Le nom ne peut pas être vide" }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() ?? null;
    }

    if (body.priority !== undefined) {
      const validPriorities: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json({ success: false, error: "Priorité invalide" }, { status: 400 });
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
          return NextResponse.json({ success: false, error: "Format de date de début invalide" }, { status: 400 });
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
          return NextResponse.json({ success: false, error: "Format de date de fin invalide" }, { status: 400 });
        }
        updateData.endDate = parsedEndDate;
      } else {
        updateData.endDate = null;
      }
    }

    if (body.progress !== undefined) {
      if (body.progress < 0 || body.progress > 1) {
        return NextResponse.json({ success: false, error: "Le progrès doit être compris entre 0 et 1" }, { status: 400 });
      }
      updateData.progress = body.progress;
    }

    // Validate start/end date coherence
    const finalStartDate = updateData.startDate ?? existingEpic.startDate;
    const finalEndDate = updateData.endDate ?? existingEpic.endDate;
    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { success: false, error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    const updatedEpic = await prisma.epic.update({
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

    return NextResponse.json({ success: true, data: updatedEpic });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Erreur lors de la mise à jour de l'épic:", errorMessage);
    if (isPrismaError(error)) {
      if (error.code === "P2025") {
        return NextResponse.json({ success: false, error: "Épic non trouvé" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json(
          { success: false, error: "Un épic avec ce nom existe déjà dans cette initiative" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour de l'épic", details: errorMessage },
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
      return NextResponse.json({ success: false, error: "Épic non trouvé" }, { status: 404 });
    }

    const hasFeatures = existingEpic.features.length > 0;
    const hasUserStories = existingEpic.features.some(f => f.userStories.length > 0);
    const hasTasks = existingEpic.features.some(f =>
      f.userStories.some(s => s.tasks.length > 0)
    );

    if (hasFeatures || hasUserStories || hasTasks) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de supprimer l'épic car il contient des éléments liés (features, user stories ou tasks)",
        },
        { status: 400 }
      );
    }

    await prisma.epic.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Épic supprimé avec succès" }, { status: 200 });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("Erreur lors de la suppression de l'épic:", errorMessage);
    if (isPrismaError(error) && error.code === "P2025") {
      return NextResponse.json({ success: false, error: "Épic non trouvé" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression de l'épic", details: errorMessage },
      { status: 500 }
    );
  }
}
