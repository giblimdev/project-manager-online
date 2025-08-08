// app/api/features/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Priority } from "@/lib/generated/prisma/client";

interface UpdateFeatureRequest {
  name?: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  priority?: Priority;
  status?: string;
  storyPoints?: number | null;
  businessValue?: number | null;
  technicalRisk?: number | null;
  effort?: number | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  progress?: number;
  position?: number;
  parentId?: string | null;
  userId?: string | null;
}

// ✅ Interfaces pour les réponses avec types corrects
interface FeatureResponse {
  id: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  epic: {
    id: string;
    name: string;
    initiativeId: string;
    initiative: {
      id: string;
      name: string;
      projectId: string;
      project: {
        id: string;
        name: string;
        key: string;
      };
    };
  };
  users?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: {
    id: string;
    name: string;
    status: string;
    progress: number;
  }[];
  userStories?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    storyPoints: number | null;
    priority: Priority;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    tasks: {
      id: string;
      title: string;
      status: string;
      priority: Priority;
    }[];
    assignees: {
      id: string;
      name: string | null;
      email: string;
    }[];
  }[];
  dependencies?: {
    id: string;
    type: string;
    description: string | null;
    createdAt: Date;
    dependsOnFeature: {
      id: string;
      name: string;
      status: string;
    };
  }[];
  dependents?: {
    id: string;
    type: string;
    description: string | null;
    createdAt: Date;
    dependentFeature: {
      id: string;
      name: string;
      status: string;
    };
  }[];
}

// ✅ CORRECTION : Interface pour les erreurs avec format string
interface SuccessResponse {
  message: string;
}

interface ErrorResponse {
  error: string;
  details?: string; // ← CORRECTION : details doit être string, pas objet
}

type DeleteResponse = SuccessResponse | ErrorResponse;

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
): Promise<NextResponse<FeatureResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Requête Prisma conforme à votre schéma
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        epic: {
          select: {
            id: true,
            name: true,
            initiativeId: true,
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
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
        userStories: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
              },
            },
            // ✅ Utilisation correcte de UserStoryAssignees selon votre schéma
            UserStoryAssignees: {
              include: {
                users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        dependencies: {
          include: {
            dependsOnFeature: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        dependents: {
          include: {
            dependentFeature: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json(
        { error: "Feature non trouvée" },
        { status: 404 }
      );
    }

    // ✅ Formatage de la réponse avec transformation correcte des données
    const response: FeatureResponse = {
      id: feature.id,
      name: feature.name,
      description: feature.description,
      acceptanceCriteria: feature.acceptanceCriteria,
      priority: feature.priority,
      status: feature.status,
      storyPoints: feature.storyPoints,
      businessValue: feature.businessValue,
      technicalRisk: feature.technicalRisk,
      effort: feature.effort,
      startDate: feature.startDate,
      endDate: feature.endDate,
      progress: feature.progress,
      position: feature.position,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      epicId: feature.epicId,
      parentId: feature.parentId,
      projectId: feature.projectId,
      userId: feature.userId,
      epic: feature.epic,
      users: feature.users,
      parent: feature.parent,
      children: feature.children,
      userStories: feature.userStories?.map((story) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        status: story.status,
        storyPoints: story.storyPoints,
        priority: story.priority,
        position: story.position,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
        tasks: story.tasks,
        // ✅ Transformation correcte des assignés depuis UserStoryAssignees
        assignees:
          story.UserStoryAssignees?.map((assignment) => assignment.users) || [],
      })),
      dependencies: feature.dependencies,
      dependents: feature.dependents,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la feature:", error);

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de la feature",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<FeatureResponse | ErrorResponse>> {
  try {
    const { id } = await params;
    const body: UpdateFeatureRequest = await request.json();

    // Vérifier que la feature existe
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        epicId: true,
        parentId: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!existingFeature) {
      return NextResponse.json(
        { error: "Feature non trouvée" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // ✅ Validation et mise à jour conditionnelle des champs
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

    if (body.acceptanceCriteria !== undefined) {
      updateData.acceptanceCriteria = body.acceptanceCriteria?.trim() || null;
    }

    if (body.priority !== undefined) {
      const validPriorities: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
      if (!validPriorities.includes(body.priority)) {
        return NextResponse.json(
          {
            error:
              "Priorité invalide. Valeurs autorisées: CRITICAL, HIGH, MEDIUM, LOW",
          },
          { status: 400 }
        );
      }
      updateData.priority = body.priority;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // ✅ Validation des valeurs numériques
    if (body.storyPoints !== undefined) {
      if (
        body.storyPoints !== null &&
        (body.storyPoints < 0 ||
          !Number.isInteger(body.storyPoints) ||
          body.storyPoints > 100)
      ) {
        return NextResponse.json(
          {
            error:
              "Les points d'histoire doivent être un entier entre 0 et 100",
          },
          { status: 400 }
        );
      }
      updateData.storyPoints = body.storyPoints;
    }

    if (body.businessValue !== undefined) {
      if (
        body.businessValue !== null &&
        (body.businessValue < 0 ||
          body.businessValue > 100 ||
          !Number.isInteger(body.businessValue))
      ) {
        return NextResponse.json(
          { error: "La valeur métier doit être un entier entre 0 et 100" },
          { status: 400 }
        );
      }
      updateData.businessValue = body.businessValue;
    }

    if (body.technicalRisk !== undefined) {
      if (
        body.technicalRisk !== null &&
        (body.technicalRisk < 0 ||
          body.technicalRisk > 100 ||
          !Number.isInteger(body.technicalRisk))
      ) {
        return NextResponse.json(
          { error: "Le risque technique doit être un entier entre 0 et 100" },
          { status: 400 }
        );
      }
      updateData.technicalRisk = body.technicalRisk;
    }

    if (body.effort !== undefined) {
      if (
        body.effort !== null &&
        (body.effort < 0 ||
          !Number.isInteger(body.effort) ||
          body.effort > 1000)
      ) {
        return NextResponse.json(
          { error: "L'effort doit être un entier entre 0 et 1000" },
          { status: 400 }
        );
      }
      updateData.effort = body.effort;
    }

    if (body.progress !== undefined) {
      if (
        body.progress < 0 ||
        body.progress > 1 ||
        !Number.isFinite(body.progress)
      ) {
        return NextResponse.json(
          { error: "Le progrès doit être un nombre décimal entre 0 et 1" },
          { status: 400 }
        );
      }
      updateData.progress = body.progress;
    }

    if (body.position !== undefined) {
      if (!Number.isInteger(body.position) || body.position < 0) {
        return NextResponse.json(
          { error: "La position doit être un entier positif ou zéro" },
          { status: 400 }
        );
      }
      updateData.position = body.position;
    }

    // ✅ Gestion des dates avec validation
    if (body.startDate !== undefined) {
      if (body.startDate) {
        const parsedStartDate = new Date(body.startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            {
              error:
                "Format de date de début invalide (utilisez le format ISO 8601)",
            },
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
            {
              error:
                "Format de date de fin invalide (utilisez le format ISO 8601)",
            },
            { status: 400 }
          );
        }
        updateData.endDate = parsedEndDate;
      } else {
        updateData.endDate = null;
      }
    }

    // ✅ Gestion de la hiérarchie avec validation de cycles
    if (body.parentId !== undefined) {
      if (body.parentId) {
        // Vérifier que le parent existe et appartient au même epic
        const parentFeature = await prisma.feature.findUnique({
          where: { id: body.parentId },
          select: {
            id: true,
            epicId: true,
            name: true,
            parentId: true,
          },
        });

        if (!parentFeature) {
          return NextResponse.json(
            { error: "Feature parent non trouvée" },
            { status: 404 }
          );
        }

        if (parentFeature.epicId !== existingFeature.epicId) {
          return NextResponse.json(
            { error: "La feature parent doit appartenir au même epic" },
            { status: 400 }
          );
        }

        // Vérifier qu'on ne crée pas un cycle
        if (body.parentId === id) {
          return NextResponse.json(
            { error: "Une feature ne peut pas être son propre parent" },
            { status: 400 }
          );
        }

        // ✅ Vérification récursive des cycles
        const checkCycleRecursive = async (
          currentParentId: string,
          targetId: string,
          visited: Set<string> = new Set()
        ): Promise<boolean> => {
          if (visited.has(currentParentId)) {
            return true; // Cycle détecté
          }

          if (currentParentId === targetId) {
            return true; // Cycle direct détecté
          }

          visited.add(currentParentId);

          const parentOfParent = await prisma.feature.findUnique({
            where: { id: currentParentId },
            select: { parentId: true },
          });

          if (parentOfParent?.parentId) {
            return checkCycleRecursive(
              parentOfParent.parentId,
              targetId,
              visited
            );
          }

          return false;
        };

        if (await checkCycleRecursive(body.parentId, id)) {
          return NextResponse.json(
            {
              error:
                "Cette assignation créerait un cycle dans la hiérarchie des features",
            },
            { status: 400 }
          );
        }

        updateData.parentId = body.parentId;
      } else {
        updateData.parentId = null;
      }
    }

    // ✅ Gestion de l'utilisateur assigné
    if (body.userId !== undefined) {
      if (body.userId) {
        const user = await prisma.user.findUnique({
          where: { id: body.userId },
          select: {
            id: true,
            isActive: true,
            name: true,
            email: true,
          },
        });

        if (!user) {
          return NextResponse.json(
            { error: "Utilisateur non trouvé" },
            { status: 404 }
          );
        }

        if (!user.isActive) {
          return NextResponse.json(
            {
              error:
                "L'utilisateur n'est pas actif et ne peut pas être assigné",
            },
            { status: 400 }
          );
        }

        updateData.userId = body.userId;
      } else {
        updateData.userId = null;
      }
    }

    // ✅ Validation finale des dates
    const finalStartDate = updateData.startDate ?? existingFeature.startDate;
    const finalEndDate = updateData.endDate ?? existingFeature.endDate;

    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    // ✅ Mise à jour de la feature
    const updatedFeature = await prisma.feature.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        epic: {
          select: {
            id: true,
            name: true,
            initiativeId: true,
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
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userStories: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            priority: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
        dependencies: {
          include: {
            dependsOnFeature: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        dependents: {
          include: {
            dependentFeature: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // ✅ Formatage de la réponse
    const response: FeatureResponse = {
      id: updatedFeature.id,
      name: updatedFeature.name,
      description: updatedFeature.description,
      acceptanceCriteria: updatedFeature.acceptanceCriteria,
      priority: updatedFeature.priority,
      status: updatedFeature.status,
      storyPoints: updatedFeature.storyPoints,
      businessValue: updatedFeature.businessValue,
      technicalRisk: updatedFeature.technicalRisk,
      effort: updatedFeature.effort,
      startDate: updatedFeature.startDate,
      endDate: updatedFeature.endDate,
      progress: updatedFeature.progress,
      position: updatedFeature.position,
      createdAt: updatedFeature.createdAt,
      updatedAt: updatedFeature.updatedAt,
      epicId: updatedFeature.epicId,
      parentId: updatedFeature.parentId,
      projectId: updatedFeature.projectId,
      userId: updatedFeature.userId,
      epic: updatedFeature.epic,
      users: updatedFeature.users,
      parent: updatedFeature.parent,
      children: updatedFeature.children,
      userStories: updatedFeature.userStories?.map((story) => ({
        id: story.id,
        title: story.title,
        description: null, // Non inclus dans cette requête
        status: story.status,
        storyPoints: story.storyPoints,
        priority: story.priority,
        position: story.position,
        createdAt: story.createdAt,
        updatedAt: story.updatedAt,
        tasks: [], // Non inclus dans cette requête
        assignees: [], // Non inclus dans cette requête
      })),
      dependencies: updatedFeature.dependencies,
      dependents: updatedFeature.dependents,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la feature:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Feature non trouvée" },
            { status: 404 }
          );
        case "P2002":
          return NextResponse.json(
            { error: "Une feature avec ce nom existe déjà dans cet epic" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            {
              error: "Référence invalide (contrainte de clé étrangère violée)",
            },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de la feature",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ✅ CORRECTION : Fonction DELETE avec types de retour corrects
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteResponse>> {
  try {
    const { id } = await params;

    // ✅ Vérifier que la feature existe et récupérer tous les éléments liés
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
      include: {
        children: {
          select: { id: true, name: true },
        },
        userStories: {
          include: {
            tasks: {
              select: { id: true, title: true },
            },
            UserStoryAssignees: {
              select: { A: true },
            },
          },
        },
        dependencies: {
          select: {
            id: true,
            dependsOnFeature: {
              select: { id: true, name: true },
            },
          },
        },
        dependents: {
          select: {
            id: true,
            dependentFeature: {
              select: { id: true, name: true },
            },
          },
        },
        files: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existingFeature) {
      return NextResponse.json(
        { error: "Feature non trouvée" },
        { status: 404 }
      );
    }

    // ✅ Vérifier s'il y a des éléments liés - FORMAT STRING pour details
    const blockers: string[] = [];
    const allDetails: string[] = [];

    if (existingFeature.children.length > 0) {
      blockers.push(`${existingFeature.children.length} sous-feature(s)`);
      allDetails.push(
        `Sous-features: ${existingFeature.children
          .map((child) => child.name)
          .join(", ")}`
      );
    }

    if (existingFeature.userStories.length > 0) {
      blockers.push(`${existingFeature.userStories.length} user story(ies)`);
      allDetails.push(
        `User stories: ${existingFeature.userStories
          .slice(0, 3)
          .map((story) => story.title)
          .join(", ")}${existingFeature.userStories.length > 3 ? "..." : ""}`
      );
    }

    const totalTasks = existingFeature.userStories.reduce(
      (sum, story) => sum + story.tasks.length,
      0
    );
    if (totalTasks > 0) {
      blockers.push(`${totalTasks} tâche(s)`);
    }

    const totalAssignees = existingFeature.userStories.reduce(
      (sum, story) => sum + story.UserStoryAssignees.length,
      0
    );
    if (totalAssignees > 0) {
      allDetails.push(`${totalAssignees} assignation(s) d'utilisateur`);
    }

    if (existingFeature.dependencies.length > 0) {
      blockers.push(
        `${existingFeature.dependencies.length} dépendance(s) sortante(s)`
      );
      allDetails.push(
        `Dépend de: ${existingFeature.dependencies
          .map((dep) => dep.dependsOnFeature.name)
          .join(", ")}`
      );
    }

    if (existingFeature.dependents.length > 0) {
      blockers.push(
        `${existingFeature.dependents.length} dépendance(s) entrante(s)`
      );
      allDetails.push(
        `Requis par: ${existingFeature.dependents
          .map((dep) => dep.dependentFeature.name)
          .join(", ")}`
      );
    }

    if (existingFeature.files.length > 0) {
      blockers.push(`${existingFeature.files.length} fichier(s)`);
      allDetails.push(
        `Fichiers: ${existingFeature.files
          .slice(0, 3)
          .map((file) => file.name)
          .join(", ")}${existingFeature.files.length > 3 ? "..." : ""}`
      );
    }

    if (blockers.length > 0) {
      // ✅ CORRECTION : details comme string au lieu d'objet complexe
      const detailsString = [
        `Éléments bloquants: ${blockers.join(", ")}`,
        ...allDetails,
        "Suggestion: Veuillez d'abord supprimer ou réassigner les éléments liés avant de supprimer cette feature.",
      ].join(" | ");

      return NextResponse.json(
        {
          error:
            "Impossible de supprimer la feature car elle contient des éléments liés",
          details: detailsString,
        },
        { status: 400 }
      );
    }

    // ✅ Suppression sécurisée de la feature
    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        message: `Feature "${existingFeature.name}" supprimée avec succès`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de la feature:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Feature non trouvée" },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json(
            {
              error: "Impossible de supprimer : contraintes de clé étrangère",
              details:
                "Des éléments liés empêchent la suppression. Utilisez GET pour voir les détails.",
            },
            { status: 400 }
          );
        case "P2014":
          return NextResponse.json(
            { error: "Opération impossible : relation requise manquante" },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression de la feature",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
