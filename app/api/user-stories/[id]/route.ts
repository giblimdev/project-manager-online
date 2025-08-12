// app/api/user-stories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { Priority, TaskStatus } from "@/lib/generated/prisma/client";

// ✅ Interface pour les réponses API avec typage générique strict
interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
  readonly details?: string;
}

// ✅ Interface pour les paramètres de route Next.js 15 (CORRECTION PRINCIPALE)
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Schéma de validation pour mise à jour avec enums corrects
const updateUserStorySchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200).optional(),
  description: z.string().max(2000).optional(),
  acceptanceCriteria: z.string().max(5000).optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  status: z
    .enum([
      "TODO",
      "IN_PROGRESS",
      "CODE_REVIEW",
      "TESTING",
      "DONE",
      "BLOCKED",
      "CANCELLED",
    ])
    .optional(),
  storyPoints: z.number().int().min(1).max(100).optional(),
  businessValue: z.number().int().min(1).max(100).optional(),
  technicalRisk: z.number().int().min(1).max(100).optional(),
  effort: z.number().int().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  labels: z.array(z.string().min(1).max(50)).max(10).optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  estimatedHours: z.number().positive().max(1000).optional(),
  actualHours: z.number().positive().max(1000).optional(),
  featureId: z.string().cuid("ID de feature invalide").optional(),
  assigneeIds: z
    .array(z.string().cuid("ID d'assigné invalide"))
    .max(10)
    .optional(),
});

// ✅ Type pour les données validées
type UpdateUserStoryData = z.infer<typeof updateUserStorySchema>;

// ✅ Interface pour la réponse détaillée d'une User Story selon votre schéma
interface UserStoryDetailResponse {
  id: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: TaskStatus;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: Date;
  updatedAt: Date;
  featureId: string;
  creatorId: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  assignees: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }[];
  feature: {
    id: string;
    name: string;
    epic: {
      id: string;
      name: string;
      initiative: {
        id: string;
        name: string;
      };
    };
  };
  tasks: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    position: number;
    creator: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    assignees: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    }[];
  }[];
  dependencies: {
    dependsOnUserStory: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }[];
  dependents: {
    dependentUserStory: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  timeEntries: {
    id: string;
    description: string | null;
    hours: number;
    date: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
  files: {
    id: string;
    name: string;
    type: string;
    mimeType: string | null;
    path: string | null;
    description: string | null;
    isFolder: boolean;
    createdAt: Date;
    authors: {
      id: string;
      name: string | null;
      email: string;
    }[];
  }[];
  sprints: {
    id: string;
    name: string;
    status: string;
    startDate: Date;
    endDate: Date;
  }[];
  _count: {
    tasks: number;
    comments: number;
    timeEntries: number;
    files: number;
  };
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
 * GET /api/user-stories/[id]
 * Récupère une User Story spécifique avec toutes ses relations selon votre schéma
 */
export async function GET(
  request: NextRequest,
  // ✅ CORRECTION : params est maintenant Promise<> dans Next.js 15
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<UserStoryDetailResponse>>> {
  try {
    // ✅ Authentification avec gestion d'erreur améliorée
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
          details: "Session utilisateur requise pour accéder aux User Stories",
        },
        { status: 401 }
      );
    }

    // ✅ CORRECTION : Await params dans Next.js 15
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

    // ✅ Requête Prisma complète selon votre schéma avec permissions optimisées
    const userStory = await prisma.userStory.findFirst({
      where: {
        id,
        OR: [
          // Créateur de la User Story
          { creatorId: session.user.id },
          // Assigné à la User Story via UserStoryAssignees
          {
            UserStoryAssignees: {
              some: {
                users: {
                  id: session.user.id,
                },
              },
            },
          },
          // Propriétaire du projet via la feature
          {
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
          // Membre du projet via ProjectMember
          {
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
        // ✅ UserStoryAssignees selon votre schéma
        UserStoryAssignees: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
            epic: {
              select: {
                id: true,
                name: true,
                initiative: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
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
          },
          orderBy: { position: "asc" },
          take: 20, // Limiter pour les performances
        },
        dependencies: {
          include: {
            dependsOnUserStory: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        dependents: {
          include: {
            dependentUserStory: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
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
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Limiter pour les performances
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: "desc" },
          take: 20, // Limiter pour les performances
        },
        // ✅ CORRECTION : Utilisation d'author au lieu d'uploader
        files: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10, // Limiter pour les performances
        },
        sprints: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            comments: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    if (!userStory) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "User Story non trouvée",
          details:
            "La User Story spécifiée n'existe pas ou vous n'avez pas les permissions pour y accéder",
        },
        { status: 404 }
      );
    }

    // ✅ Formatage de la réponse avec assignés extraits de UserStoryAssignees
    const response: UserStoryDetailResponse = {
      ...userStory,
      assignees: userStory.UserStoryAssignees.map((usa) => usa.users),
      files: userStory.files.map((file) => ({
        ...file,
        authors: file.author, // Renommer author en authors pour la cohérence
      })),
    } as UserStoryDetailResponse;

    return NextResponse.json<ApiResponse<UserStoryDetailResponse>>({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la User Story:", error);

    const errorMessage = getErrorMessage(error);

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur lors de la récupération de la User Story",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user-stories/[id]
 * Met à jour une User Story existante avec validation complète
 */
export async function PUT(
  request: NextRequest,
  // ✅ CORRECTION : params est maintenant Promise<> dans Next.js 15
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
          details: "Session utilisateur requise pour modifier les User Stories",
        },
        { status: 401 }
      );
    }

    // ✅ CORRECTION : Await params dans Next.js 15
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
    let body: unknown;
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

    // ✅ Validation Zod avec gestion d'erreur
    const validationResult = updateUserStorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Données invalides",
          details: validationResult.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // ✅ Vérifier que la User Story existe et que l'utilisateur peut la modifier
    const existingUserStory = await prisma.userStory.findFirst({
      where: {
        id,
        OR: [
          // Créateur de la User Story
          { creatorId: session.user.id },
          // Assigné à la User Story
          {
            UserStoryAssignees: {
              some: {
                users: {
                  id: session.user.id,
                },
              },
            },
          },
          // Propriétaire du projet
          {
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
          // Membre du projet avec permissions
          {
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
        ],
      },
      select: { id: true, featureId: true },
    });

    if (!existingUserStory) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "User Story non trouvée ou accès refusé",
          details:
            "Vous devez être créateur, assigné à la User Story, ou membre du projet pour la modifier",
        },
        { status: 404 }
      );
    }

    // ✅ Vérifications conditionnelles avec validation complète
    if (data.featureId && data.featureId !== existingUserStory.featureId) {
      const feature = await prisma.feature.findUnique({
        where: { id: data.featureId },
        select: { id: true },
      });

      if (!feature) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: "Feature non trouvée",
            details: `La feature avec l'ID ${data.featureId} n'existe pas`,
          },
          { status: 404 }
        );
      }
    }

    // ✅ Validation des assignés si fournis
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const validAssignees = await prisma.user.findMany({
        where: {
          id: { in: data.assigneeIds },
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      });

      if (validAssignees.length !== data.assigneeIds.length) {
        const foundIds = validAssignees.map((u) => u.id);
        const missingIds = data.assigneeIds.filter(
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
    }

    // ✅ Mise à jour avec transaction pour garantir la cohérence
    const updatedUserStory = await prisma.$transaction(async (tx) => {
      // Gérer les assignés si fournis
      if (data.assigneeIds !== undefined) {
        // Supprimer toutes les assignations existantes
        await tx.userStoryAssignees.deleteMany({
          where: { B: id },
        });

        // Ajouter les nouvelles assignations si nécessaire
        if (data.assigneeIds.length > 0) {
          await tx.userStoryAssignees.createMany({
            data: data.assigneeIds.map((assigneeId) => ({
              A: assigneeId,
              B: id,
            })),
          });
        }
      }

      // Préparer les données de mise à jour en filtrant les undefined
      const updateData: any = { updatedAt: new Date() };

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== "assigneeIds") {
          updateData[key] = value;
        }
      });

      // Mise à jour de la User Story
      return tx.userStory.update({
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
          UserStoryAssignees: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          feature: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              comments: true,
            },
          },
        },
      });
    });

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        ...updatedUserStory,
        assignees: updatedUserStory.UserStoryAssignees.map((usa) => usa.users),
      },
      message: "User Story mise à jour avec succès",
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour de la User Story:", error);

    // ✅ Gestion des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "User Story non trouvée",
              details: "La User Story spécifiée n'existe plus",
            },
            { status: 404 }
          );
        case "P2002":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Contrainte d'unicité violée",
              details: "Une contrainte de base de données a été violée",
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

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la User Story",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-stories/[id]
 * Supprime une User Story après vérification des contraintes métier
 */
export async function DELETE(
  request: NextRequest,
  // ✅ CORRECTION : params est maintenant Promise<> dans Next.js 15
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
          details:
            "Session utilisateur requise pour supprimer les User Stories",
        },
        { status: 401 }
      );
    }

    // ✅ CORRECTION : Await params dans Next.js 15
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

    // ✅ Vérifier que la User Story existe et que l'utilisateur peut la supprimer
    const existingUserStory = await prisma.userStory.findFirst({
      where: {
        id,
        OR: [
          // Créateur de la User Story
          { creatorId: session.user.id },
          // Assigné à la User Story
          {
            UserStoryAssignees: {
              some: {
                users: {
                  id: session.user.id,
                },
              },
            },
          },
          // Propriétaire du projet
          {
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
          // Membre du projet avec rôle admin
          {
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
        ],
      },
      include: {
        _count: {
          select: {
            tasks: true,
            dependencies: true,
            dependents: true,
            comments: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    if (!existingUserStory) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "User Story non trouvée ou accès refusé",
          details:
            "Vous devez être créateur de la User Story ou administrateur du projet pour la supprimer",
        },
        { status: 404 }
      );
    }

    // ✅ Vérifier les contraintes métier avant suppression
    const blockers: string[] = [];
    const details: string[] = [];

    if (existingUserStory._count.dependents > 0) {
      blockers.push(
        `${existingUserStory._count.dependents} User Story(ies) dépendante(s)`
      );
      details.push("Supprimez d'abord les dépendances vers cette User Story");
    }

    if (existingUserStory._count.tasks > 0) {
      blockers.push(`${existingUserStory._count.tasks} tâche(s) associée(s)`);
      details.push(
        "Supprimez ou déplacez les tâches avant de supprimer la User Story"
      );
    }

    if (existingUserStory._count.timeEntries > 0) {
      blockers.push(
        `${existingUserStory._count.timeEntries} entrée(s) de temps`
      );
      details.push(
        "Supprimez les entrées de temps avant de supprimer la User Story"
      );
    }

    if (existingUserStory._count.comments > 0) {
      blockers.push(`${existingUserStory._count.comments} commentaire(s)`);
      details.push("Des commentaires sont associés à cette User Story");
    }

    if (existingUserStory._count.files > 0) {
      blockers.push(`${existingUserStory._count.files} fichier(s)`);
      details.push("Des fichiers sont associés à cette User Story");
    }

    if (blockers.length > 0) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Impossible de supprimer la User Story",
          details: [
            `Éléments bloquants: ${blockers.join(", ")}`,
            "Actions recommandées:",
            ...details.map((detail, index) => `${index + 1}. ${detail}`),
          ].join(" | "),
        },
        { status: 400 }
      );
    }

    // ✅ Suppression avec transaction pour gérer toutes les dépendances
    await prisma.$transaction([
      // Supprimer les assignations
      prisma.userStoryAssignees.deleteMany({
        where: { B: id },
      }),
      // Supprimer les dépendances
      prisma.userStoryDependency.deleteMany({
        where: {
          OR: [{ dependentUserStoryId: id }, { dependsOnUserStoryId: id }],
        },
      }),
      // Supprimer la User Story elle-même
      prisma.userStory.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
      message: "User Story supprimée avec succès",
    });
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression de la User Story:", error);

    // ✅ Gestion des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "User Story non trouvée",
              details: "La User Story spécifiée n'existe plus",
            },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "Impossible de supprimer : contraintes de clé étrangère",
              details:
                "Des éléments liés empêchent la suppression. Vérifiez les dépendances.",
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
        error: "Erreur lors de la suppression de la User Story",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
