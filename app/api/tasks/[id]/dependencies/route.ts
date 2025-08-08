// app/api/tasks/[id]/dependencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

interface CreateDependencyRequest {
  readonly dependsOnTaskId: string;
  readonly type?: string;
  readonly description?: string;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export async function GET(
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

    const dependencies = await prisma.taskDependency.findMany({
      where: {
        OR: [{ dependentTaskId: id }, { dependsOnTaskId: id }],
      },
      include: {
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: { dependencies },
    });
  } catch (error: unknown) {
    console.error("Error fetching task dependencies:", error);
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

export async function POST(
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
    const body: CreateDependencyRequest = await request.json();

    if (!body.dependsOnTaskId) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "L'ID de la tâche dépendante est requis",
        },
        { status: 400 }
      );
    }

    if (id === body.dependsOnTaskId) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Une tâche ne peut pas dépendre d'elle-même",
        },
        { status: 400 }
      );
    }

    // Vérifier que les deux tâches existent et que l'utilisateur y a accès
    const [dependentTask, dependsOnTask] = await Promise.all([
      prisma.task.findFirst({
        where: {
          id,
          OR: [
            { creatorId: session.user.id },
            { assignees: { some: { id: session.user.id } } },
          ],
        },
      }),
      prisma.task.findFirst({
        where: {
          id: body.dependsOnTaskId,
          OR: [
            { creatorId: session.user.id },
            { assignees: { some: { id: session.user.id } } },
          ],
        },
      }),
    ]);

    if (!dependentTask || !dependsOnTask) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Une ou plusieurs tâches non trouvées",
        },
        { status: 404 }
      );
    }

    // Vérifier qu'il n'y a pas de dépendance circulaire
    const existingDependency = await prisma.taskDependency.findFirst({
      where: {
        dependentTaskId: body.dependsOnTaskId,
        dependsOnTaskId: id,
      },
    });

    if (existingDependency) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Dépendance circulaire détectée",
        },
        { status: 400 }
      );
    }

    // Créer la dépendance
    const dependency = await prisma.taskDependency.create({
      data: {
        dependentTaskId: id,
        dependsOnTaskId: body.dependsOnTaskId,
        type: body.type || "DEPENDS_ON",
        description: body.description,
      },
      include: {
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: dependency,
      message: "Dépendance créée avec succès",
    });
  } catch (error: unknown) {
    console.error("Error creating task dependency:", error);
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
