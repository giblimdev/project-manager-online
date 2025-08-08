// app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { TaskStatus, Priority } from "@/lib/generated/prisma/client";

// ✅ Interface pour les requêtes de mise à jour
interface UpdateTaskRequest {
  readonly title?: string;
  readonly description?: string | null;
  readonly priority?: Priority;
  readonly status?: TaskStatus;
  readonly type?: string;
  readonly dueDate?: string | null;
  readonly startDate?: string | null;
  readonly estimatedHours?: number | null;
  readonly actualHours?: number | null;
  readonly labels?: string[];
  readonly tags?: string[];
  readonly assigneeIds?: string[];
}

// ✅ Interface pour les réponses API
interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
  readonly details?: string;
}

// ✅ Interface pour les paramètres Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Fonctions utilitaires
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" && err !== null && "code" in err && "message" in err
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Erreur inconnue";
}

/**
 * GET /api/tasks/[id]
 * Récupère une tâche spécifique avec ses relations
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    // ✅ Authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
          details: "Session utilisateur requise pour accéder aux tâches",
        },
        { status: 401 }
      );
    }

    // ✅ Await params dans Next.js 15
    const { id } = await params;

    // ✅ Validation UUID
    if (!isValidUUID(id)) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Format UUID invalide",
          details: `La valeur '${id}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Requête Prisma simple avec relations essentielles
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          // Créateur de la tâche
          { creatorId: session.user.id },
          // Assigné à la tâche
          { assignees: { some: { id: session.user.id } } },
          // Créateur de la user story parente
          {
            userStory: {
              creatorId: session.user.id,
            },
          },
          // Assigné à la user story parente
          {
            userStory: {
              UserStoryAssignees: {
                some: {
                  users: {
                    id: session.user.id,
                  },
                },
              },
            },
          },
          // Membre du projet
          {
            userStory: {
              feature: {
                Project: {
                  members: {
                    some: {
                      userId: session.user.id,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        userStory: {
          select: {
            id: true,
            title: true,
            description: true,
            feature: {
              select: {
                id: true,
                name: true,
                Project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
          },
        },
        dependents: {
          include: {
            dependentTask: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
              take: 5,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { date: "desc" },
          take: 20,
        },
        files: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!task) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Tâche non trouvée",
          details:
            "La tâche spécifiée n'existe pas ou vous n'avez pas les permissions pour y accéder",
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: task,
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la tâche:", error);

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur lors de la récupération de la tâche",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * Met à jour une tâche existante
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    // ✅ Authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
          details: "Session utilisateur requise pour modifier les tâches",
        },
        { status: 401 }
      );
    }

    // ✅ Await params dans Next.js 15
    const { id } = await params;

    // ✅ Validation UUID
    if (!isValidUUID(id)) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Format UUID invalide",
          details: `La valeur '${id}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Validation du JSON body
    let body: UpdateTaskRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Corps de requête JSON invalide",
          details: "Le body doit contenir un JSON valide",
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que la tâche existe et que l'utilisateur peut la modifier
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          { assignees: { some: { id: session.user.id } } },
          {
            userStory: {
              creatorId: session.user.id,
            },
          },
          {
            userStory: {
              UserStoryAssignees: {
                some: {
                  users: {
                    id: session.user.id,
                  },
                },
              },
            },
          },
          {
            userStory: {
              feature: {
                Project: {
                  members: {
                    some: {
                      userId: session.user.id,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        status: true,
        completedAt: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Tâche non trouvée ou accès refusé",
          details:
            "Vous devez être créateur, assigné à la tâche, ou membre du projet",
        },
        { status: 404 }
      );
    }

    // ✅ Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validation et mise à jour des champs
    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Le titre est requis",
            details: "Le titre ne peut pas être vide",
          },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.priority !== undefined) {
      if (!Object.values(Priority).includes(body.priority)) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Priorité invalide",
            details: `Valeurs autorisées: ${Object.values(Priority).join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
      updateData.priority = body.priority;
    }

    if (body.status !== undefined) {
      if (!Object.values(TaskStatus).includes(body.status)) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Statut invalide",
            details: `Valeurs autorisées: ${Object.values(TaskStatus).join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
      updateData.status = body.status;

      // Gestion automatique de la date de completion
      if (
        body.status === TaskStatus.DONE &&
        existingTask.status !== TaskStatus.DONE
      ) {
        updateData.completedAt = new Date();
      } else if (body.status !== TaskStatus.DONE && existingTask.completedAt) {
        updateData.completedAt = null;
      }
    }

    if (body.type !== undefined) {
      updateData.type = body.type;
    }

    // Gestion des dates
    if (body.dueDate !== undefined) {
      if (body.dueDate) {
        const dueDate = new Date(body.dueDate);
        if (isNaN(dueDate.getTime())) {
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Format de date d'échéance invalide",
            },
            { status: 400 }
          );
        }
        updateData.dueDate = dueDate;
      } else {
        updateData.dueDate = null;
      }
    }

    if (body.startDate !== undefined) {
      if (body.startDate) {
        const startDate = new Date(body.startDate);
        if (isNaN(startDate.getTime())) {
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Format de date de début invalide",
            },
            { status: 400 }
          );
        }
        updateData.startDate = startDate;
      } else {
        updateData.startDate = null;
      }
    }

    // Validation des heures
    if (body.estimatedHours !== undefined) {
      if (
        body.estimatedHours !== null &&
        (body.estimatedHours < 0 || body.estimatedHours > 1000)
      ) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Heures estimées invalides",
            details: "Les heures estimées doivent être entre 0 et 1000",
          },
          { status: 400 }
        );
      }
      updateData.estimatedHours = body.estimatedHours;
    }

    if (body.actualHours !== undefined) {
      if (
        body.actualHours !== null &&
        (body.actualHours < 0 || body.actualHours > 1000)
      ) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Heures actuelles invalides",
            details: "Les heures actuelles doivent être entre 0 et 1000",
          },
          { status: 400 }
        );
      }
      updateData.actualHours = body.actualHours;
    }

    // Validation des labels et tags
    if (body.labels !== undefined) {
      if (
        !Array.isArray(body.labels) ||
        body.labels.some((label) => typeof label !== "string")
      ) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Labels invalides",
            details: "Les labels doivent être un tableau de chaînes",
          },
          { status: 400 }
        );
      }
      updateData.labels = body.labels.slice(0, 10);
    }

    if (body.tags !== undefined) {
      if (
        !Array.isArray(body.tags) ||
        body.tags.some((tag) => typeof tag !== "string")
      ) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Tags invalides",
            details: "Les tags doivent être un tableau de chaînes",
          },
          { status: 400 }
        );
      }
      updateData.tags = body.tags.slice(0, 10);
    }

    // Gérer les assignations
    if (body.assigneeIds !== undefined) {
      if (body.assigneeIds.length > 0) {
        // Validation des UUIDs
        const invalidUUIDs = body.assigneeIds.filter((id) => !isValidUUID(id));
        if (invalidUUIDs.length > 0) {
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Format UUID invalide pour assigneeIds",
              details: `UUIDs invalides: ${invalidUUIDs.join(", ")}`,
            },
            { status: 400 }
          );
        }

        // Vérifier que tous les assignés existent et sont actifs
        const validAssignees = await prisma.user.findMany({
          where: {
            id: { in: body.assigneeIds },
            isActive: true,
          },
          select: { id: true, name: true, email: true },
        });

        if (validAssignees.length !== body.assigneeIds.length) {
          const foundIds = validAssignees.map((u) => u.id);
          const missingIds = body.assigneeIds.filter(
            (id) => !foundIds.includes(id)
          );
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Assignés non trouvés ou inactifs",
              details: `IDs manquants: ${missingIds.join(", ")}`,
            },
            { status: 404 }
          );
        }

        updateData.assignees = {
          set: validAssignees.map((user) => ({ id: user.id })),
        };
      } else {
        updateData.assignees = { set: [] };
      }
    }

    // ✅ Mise à jour de la tâche
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        userStory: {
          select: {
            id: true,
            title: true,
            feature: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: updatedTask,
      message: "Tâche mise à jour avec succès",
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);

    // Gestion des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Tâche non trouvée",
              details: "La tâche spécifiée n'existe plus",
            },
            { status: 404 }
          );
        case "P2002":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Contrainte d'unicité violée",
            },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Référence invalide",
            },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la tâche",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Supprime une tâche après vérification des dépendances
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    // ✅ Authentification
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
          details: "Session utilisateur requise pour supprimer les tâches",
        },
        { status: 401 }
      );
    }

    // ✅ Await params dans Next.js 15
    const { id } = await params;

    // ✅ Validation UUID
    if (!isValidUUID(id)) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Format UUID invalide",
          details: `La valeur '${id}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que la tâche existe et que l'utilisateur peut la supprimer
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          { creatorId: session.user.id },
          {
            userStory: {
              creatorId: session.user.id,
            },
          },
          {
            userStory: {
              UserStoryAssignees: {
                some: {
                  users: {
                    id: session.user.id,
                  },
                },
              },
            },
          },
          {
            userStory: {
              feature: {
                Project: {
                  members: {
                    some: {
                      userId: session.user.id,
                      isActive: true,
                      role: { in: ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"] },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        dependents: {
          select: {
            id: true,
            dependentTask: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        _count: {
          select: {
            timeEntries: true,
            files: true,
            comments: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Tâche non trouvée ou accès refusé",
          details:
            "Vous devez être créateur de la tâche ou administrateur du projet",
        },
        { status: 404 }
      );
    }

    // ✅ Vérifier les contraintes métier avant suppression
    const blockers: string[] = [];

    if (existingTask.dependents.length > 0) {
      blockers.push(`${existingTask.dependents.length} dépendance(s)`);
    }

    if (existingTask._count.timeEntries > 0) {
      blockers.push(`${existingTask._count.timeEntries} entrée(s) de temps`);
    }

    if (existingTask._count.comments > 0) {
      blockers.push(`${existingTask._count.comments} commentaire(s)`);
    }

    if (existingTask._count.files > 0) {
      blockers.push(`${existingTask._count.files} fichier(s)`);
    }

    if (blockers.length > 0) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Impossible de supprimer la tâche",
          details: `Éléments bloquants: ${blockers.join(
            ", "
          )}. Supprimez d'abord ces éléments.`,
        },
        { status: 400 }
      );
    }

    // ✅ Suppression sécurisée avec transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer d'abord les relations
      await tx.task.update({
        where: { id },
        data: {
          assignees: { set: [] },
        },
      });

      // Puis supprimer la tâche
      await tx.task.delete({
        where: { id },
      });
    });

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
      message: "Tâche supprimée avec succès",
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de la tâche:", error);

    // Gestion des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Tâche non trouvée",
            },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Contraintes de clé étrangère",
              details: "Des éléments liés empêchent la suppression",
            },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur lors de la suppression de la tâche",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
