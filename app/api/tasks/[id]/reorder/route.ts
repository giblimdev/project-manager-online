// app/api/tasks/[id]/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import type { Priority, TaskStatus } from "@/lib/generated/prisma/client";

// ✅ Interface pour les requêtes de réorganisation avec typage strict
interface ReorderRequest {
  readonly direction?: "up" | "down";
  readonly newPosition?: number;
  readonly targetTaskId?: string;
  readonly insertAfter?: boolean; // Pour insérer après la tâche cible
}

// ✅ Interface pour les réponses d'API fortement typée
interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
  readonly details?: string;
}

// ✅ Interface pour la réponse détaillée de la tâche
interface TaskReorderResponse {
  id: string;
  title: string;
  position: number;
  status: TaskStatus;
  priority: Priority;
  userStoryId: string;
  affectedTasks?: {
    id: string;
    title: string;
    position: number;
  }[];
}

// ✅ Interface pour les paramètres de route Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Fonctions utilitaires avec typage strict
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
 * PUT /api/tasks/[id]/reorder
 * Réorganise une tâche selon différents modes : direction, position absolue, ou position relative
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<TaskReorderResponse>>> {
  try {
    // ✅ Authentification avec gestion d'erreur
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
          details: "Session utilisateur requise pour réorganiser les tâches",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // ✅ Validation de l'UUID
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

    // ✅ Validation du body JSON
    let body: ReorderRequest;
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

    const { direction, newPosition, targetTaskId, insertAfter } = body;

    // ✅ Validation des paramètres de réorganisation
    const hasDirection = direction && ["up", "down"].includes(direction);
    const hasPosition = typeof newPosition === "number" && newPosition >= 0;
    const hasTargetTask = targetTaskId && isValidUUID(targetTaskId);

    if (!hasDirection && !hasPosition && !hasTargetTask) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Paramètres de réorganisation invalides",
          details:
            "Au moins un paramètre requis : direction ('up'/'down'), newPosition (nombre), ou targetTaskId (UUID)",
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que la tâche existe et que l'utilisateur peut la modifier selon votre schéma
    const currentTask = await prisma.task.findFirst({
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
          // Propriétaire du projet via la feature
          {
            userStory: {
              feature: {
                Project: {
                  user: {
                    some: {
                      id: session.user.id,
                    },
                  },
                },
              },
            },
          },
          // Membre du projet via la feature
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
        userStory: {
          include: {
            feature: {
              include: {
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
      },
    });

    if (!currentTask) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Tâche non trouvée ou accès refusé",
          details:
            "Vous devez être créateur, assigné à la tâche, ou membre du projet pour la réorganiser",
        },
        { status: 404 }
      );
    }

    // ✅ Réorganisation par position absolue
    if (hasPosition) {
      // Vérifier que la position est valide
      const tasksCount = await prisma.task.count({
        where: {
          userStoryId: currentTask.userStoryId,
        },
      });

      if (newPosition! >= tasksCount || newPosition! < 0) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Position invalide",
            details: `Position doit être entre 0 et ${tasksCount - 1}`,
          },
          { status: 400 }
        );
      }

      // Mise à jour de la position avec recalcul des autres tâches
      await prisma.$transaction(async (tx) => {
        const allTasks = await tx.task.findMany({
          where: {
            userStoryId: currentTask.userStoryId,
          },
          orderBy: { position: "asc" },
        });

        // Retirer la tâche actuelle de la liste
        const filteredTasks = allTasks.filter((task) => task.id !== id);

        // Insérer à la nouvelle position
        filteredTasks.splice(newPosition!, 0, currentTask);

        // Mettre à jour les positions
        for (let i = 0; i < filteredTasks.length; i++) {
          await tx.task.update({
            where: { id: filteredTasks[i].id },
            data: { position: i },
          });
        }
      });

      const updatedTask = await prisma.task.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          position: true,
          status: true,
          priority: true,
          userStoryId: true,
        },
      });

      return NextResponse.json<ApiResponse<TaskReorderResponse>>({
        success: true,
        data: updatedTask!,
        message: `Tâche déplacée à la position ${newPosition}`,
      });
    }

    // ✅ Réorganisation par rapport à une autre tâche
    if (hasTargetTask) {
      const targetTask = await prisma.task.findFirst({
        where: {
          id: targetTaskId!,
          userStoryId: currentTask.userStoryId, // Même user story
        },
      });

      if (!targetTask) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Tâche cible non trouvée",
            details: "La tâche cible doit appartenir à la même user story",
          },
          { status: 404 }
        );
      }

      if (targetTask.id === currentTask.id) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Réorganisation invalide",
            details: "Une tâche ne peut pas être déplacée vers elle-même",
          },
          { status: 400 }
        );
      }

      // Réorganisation avec insertion avant ou après la cible
      await prisma.$transaction(async (tx) => {
        const allTasks = await tx.task.findMany({
          where: {
            userStoryId: currentTask.userStoryId,
          },
          orderBy: { position: "asc" },
        });

        // Retirer la tâche actuelle
        const filteredTasks = allTasks.filter((task) => task.id !== id);

        // Trouver l'index de la tâche cible
        const targetIndex = filteredTasks.findIndex(
          (task) => task.id === targetTaskId
        );
        const insertIndex = insertAfter ? targetIndex + 1 : targetIndex;

        // Insérer à la nouvelle position
        filteredTasks.splice(insertIndex, 0, currentTask);

        // Mettre à jour les positions
        for (let i = 0; i < filteredTasks.length; i++) {
          await tx.task.update({
            where: { id: filteredTasks[i].id },
            data: { position: i },
          });
        }
      });

      const [updatedTask, affectedTasks] = await Promise.all([
        prisma.task.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            position: true,
            status: true,
            priority: true,
            userStoryId: true,
          },
        }),
        prisma.task.findMany({
          where: {
            userStoryId: currentTask.userStoryId,
            id: { in: [id, targetTaskId!] },
          },
          select: {
            id: true,
            title: true,
            position: true,
          },
          orderBy: { position: "asc" },
        }),
      ]);

      return NextResponse.json<ApiResponse<TaskReorderResponse>>({
        success: true,
        data: {
          ...updatedTask!,
          affectedTasks,
        },
        message: `Tâche déplacée ${
          insertAfter ? "après" : "avant"
        } la tâche cible`,
      });
    }

    // ✅ Réorganisation directionnelle (up/down)
    if (hasDirection) {
      const allTasks = await prisma.task.findMany({
        where: {
          userStoryId: currentTask.userStoryId,
        },
        orderBy: { position: "asc" },
      });

      const currentIndex = allTasks.findIndex((task) => task.id === id);
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      // ✅ Vérifier les limites avec messages explicites
      if (newIndex < 0) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Déplacement impossible",
            details: "La tâche est déjà en première position",
          },
          { status: 400 }
        );
      }

      if (newIndex >= allTasks.length) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Déplacement impossible",
            details: "La tâche est déjà en dernière position",
          },
          { status: 400 }
        );
      }

      const targetTask = allTasks[newIndex];

      // ✅ Échanger les positions avec transaction pour garantir la cohérence
      await prisma.$transaction([
        prisma.task.update({
          where: { id: currentTask.id },
          data: { position: targetTask.position },
        }),
        prisma.task.update({
          where: { id: targetTask.id },
          data: { position: currentTask.position },
        }),
      ]);

      const [updatedTask, affectedTasks] = await Promise.all([
        prisma.task.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            position: true,
            status: true,
            priority: true,
            userStoryId: true,
          },
        }),
        prisma.task.findMany({
          where: {
            userStoryId: currentTask.userStoryId,
            id: { in: [id, targetTask.id] },
          },
          select: {
            id: true,
            title: true,
            position: true,
          },
          orderBy: { position: "asc" },
        }),
      ]);

      return NextResponse.json<ApiResponse<TaskReorderResponse>>({
        success: true,
        data: {
          ...updatedTask!,
          affectedTasks,
        },
        message: `Tâche déplacée vers le ${
          direction === "up" ? "haut" : "bas"
        }`,
      });
    }

    // Ne devrait jamais arriver grâce aux validations précédentes
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Paramètres de réorganisation non traités",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la réorganisation de la tâche:", error);

    // ✅ Gestion des erreurs Prisma spécifiques
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
              error: "Conflit de position",
              details:
                "Une contrainte d'unicité a été violée lors de la réorganisation",
            },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Référence invalide",
              details: "Contrainte de clé étrangère violée",
            },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur lors de la réorganisation de la tâche",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
