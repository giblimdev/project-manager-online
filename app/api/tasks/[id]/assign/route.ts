// app/api/tasks/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

interface AssignTaskRequest {
  readonly assigneeIds: string[];
  readonly action: "add" | "remove" | "replace";
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: AssignTaskRequest = await request.json();

    if (!body.assigneeIds || !Array.isArray(body.assigneeIds)) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Liste des assignés requise",
        },
        { status: 400 }
      );
    }

    if (!["add", "remove", "replace"].includes(body.action)) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Action invalide",
        },
        { status: 400 }
      );
    }

    // Vérifier que la tâche existe et que l'utilisateur peut la modifier
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          { assignees: { some: { id: session.user.id } } },
        ],
      },
      include: {
        assignees: {
          select: { id: true },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Tâche non trouvée ou accès refusé",
        },
        { status: 404 }
      );
    }

    // Vérifier que les utilisateurs à assigner existent et sont actifs
    const validUsers = await prisma.user.findMany({
      where: {
        id: { in: body.assigneeIds },
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    });

    if (validUsers.length !== body.assigneeIds.length) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Un ou plusieurs utilisateurs non trouvés ou inactifs",
        },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (body.action) {
      case "add":
        updateData = {
          assignees: {
            connect: body.assigneeIds.map((userId) => ({ id: userId })),
          },
        };
        break;

      case "remove":
        updateData = {
          assignees: {
            disconnect: body.assigneeIds.map((userId) => ({ id: userId })),
          },
        };
        break;

      case "replace":
        updateData = {
          assignees: {
            set: body.assigneeIds.map((userId) => ({ id: userId })),
          },
        };
        break;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: updatedTask,
      message: "Assignations mises à jour avec succès",
    });
  } catch (error: unknown) {
    console.error("Error updating task assignments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
