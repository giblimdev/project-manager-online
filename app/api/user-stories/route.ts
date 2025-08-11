// @/app/api/user-stories/route.ts
/*
 * API Route pour la gestion des User Stories
 * Rôle : Gestion CRUD des user stories au niveau global
 * Responsabilités :
 * - Récupération globale des user stories (GET)
 * - Création de nouvelles user stories (POST)
 * - Gestion des erreurs et validation avec Zod
 * - Authentification et autorisation côté serveur
 * - Logging des opérations
 *
 * Composants utilisés :
 * - Prisma : ORM pour base de données
 * - better-auth : Authentification côté serveur
 * - Zod : Validation des données
 * - Next.js 15 : API Routes avec nouvelles structures
 * - TypeScript : Typage strict mode
 *
 * Relations Prisma :
 * - UserStory avec Feature, User, Tasks, Comments, Files
 * - UserStoryAssignees pour les assignations (table de liaison)
 * - UserStoryDependency pour les dépendances
 * - Sprint relation many-to-many via SprintUserStories
 * - Project permissions via ProjectMember
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Priority, TaskStatus, UserRole } from "@/lib/generated/prisma";

// Schéma de validation pour la création d'user story
const createUserStorySchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  description: z.string().optional().nullable(),
  acceptanceCriteria: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  storyPoints: z.number().int().min(0).max(100).optional().nullable(),
  businessValue: z.number().int().min(0).max(100).optional().nullable(),
  technicalRisk: z.number().int().min(0).max(100).optional().nullable(),
  effort: z.number().int().min(0).max(100).optional().nullable(),
  estimatedHours: z.number().min(0).max(1000).optional().nullable(),
  labels: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  featureId: z.string().min(1, "Une feature doit être sélectionnée"),
  assigneeIds: z.array(z.string()).default([]),
  sprintIds: z.array(z.string()).default([]),
  position: z.number().int().min(0).default(0),
});

// Schéma pour les paramètres de requête GET
const getUserStoriesQuerySchema = z.object({
  projectId: z.string().optional(),
  featureId: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().optional(),
  sprintId: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  orderBy: z
    .enum(["title", "priority", "status", "createdAt", "updatedAt", "position"])
    .default("position"),
  orderDirection: z.enum(["asc", "desc"]).default("asc"),
});

type CreateUserStoryInput = z.infer<typeof createUserStorySchema>;
type GetUserStoriesQuery = z.infer<typeof getUserStoriesQuerySchema>;

// Interface pour la gestion d'erreurs Zod
interface ZodErrorResponse {
  error: string;
  details: Array<{
    code: string;
    path: (string | number)[];
    message: string;
    expected?: string;
    received?: string;
  }>;
}

// Fonction utilitaire pour formater les erreurs Zod
function formatZodError(zodError: z.ZodError): ZodErrorResponse {
  return {
    error: "Validation échouée",
    details: zodError.issues.map((issue) => ({
      code: issue.code,
      path: issue.path as (string | number)[],
      message: issue.message,
      expected: "expected" in issue ? String(issue.expected) : undefined,
      received: "received" in issue ? String(issue.received) : undefined,
    })),
  };
}

// Fonction utilitaire pour extraire l'utilisateur depuis les headers/cookies
async function getCurrentUser(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(
      "better-auth.session_token"
    )?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

// Fonction utilitaire pour vérifier les permissions utilisateur
async function checkPermissions(userId: string, projectId?: string) {
  if (!projectId) return { hasAccess: true, role: "ADMIN" as UserRole };

  try {
    const membership = await prisma.projectMember.findFirst({
      where: {
        userId,
        projectId,
        isActive: true,
      },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return {
      hasAccess: !!membership,
      role: membership?.role,
      project: membership?.project,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    return { hasAccess: false, role: null, project: null };
  }
}

// GET - Récupérer les user stories avec filtres et pagination
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = getUserStoriesQuerySchema.parse(queryParams);

    // Construction du filtre WHERE basé sur le schéma réel
    const where: any = {};

    // Filtrage par feature
    if (validatedQuery.featureId) {
      where.featureId = validatedQuery.featureId;
    }

    // Filtrage par projet via la feature (correction selon le schéma)
    if (validatedQuery.projectId) {
      where.feature = {
        projectId: validatedQuery.projectId,
      };
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority;
    }

    // Filtrage par assigné via table UserStoryAssignees
    if (validatedQuery.assigneeId) {
      where.UserStoryAssignees = {
        some: {
          A: validatedQuery.assigneeId, // A = userId dans la table de liaison
        },
      };
    }

    // Filtrage par sprint (relation many-to-many)
    if (validatedQuery.sprintId) {
      where.sprints = {
        some: {
          id: validatedQuery.sprintId,
        },
      };
    }

    // Recherche textuelle
    if (validatedQuery.search) {
      const searchTerm = validatedQuery.search.toLowerCase();
      where.OR = [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          tags: {
            hasSome: [searchTerm],
          },
        },
        {
          labels: {
            hasSome: [searchTerm],
          },
        },
      ];
    }

    // Configuration de l'ordre de tri
    const orderBy: any = {};
    orderBy[validatedQuery.orderBy] = validatedQuery.orderDirection;

    // Requête avec relations complètes
    const [userStories, totalCount] = await Promise.all([
      prisma.userStory.findMany({
        where,
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
              projectId: true,
              epic: {
                select: {
                  id: true,
                  name: true,
                  initiative: {
                    select: {
                      id: true,
                      name: true,
                      project: {
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
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          comments: {
            select: {
              id: true,
            },
          },
          files: {
            select: {
              id: true,
              name: true,
              type: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          timeEntries: {
            select: {
              id: true,
              hours: true,
              date: true,
            },
          },
          dependencies: {
            include: {
              dependsOnUserStory: {
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
              dependentUserStory: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true,
                },
              },
            },
          },
          sprints: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
            orderBy: {
              startDate: "desc",
            },
          },
          Epic: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              comments: true,
              files: true,
              timeEntries: true,
            },
          },
        },
        orderBy,
        take: validatedQuery.limit,
        skip: validatedQuery.offset,
      }),
      prisma.userStory.count({ where }),
    ]);

    const pagination = {
      total: totalCount,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
      pages: Math.ceil(totalCount / validatedQuery.limit),
      currentPage: Math.floor(validatedQuery.offset / validatedQuery.limit) + 1,
      hasNext: validatedQuery.offset + validatedQuery.limit < totalCount,
      hasPrev: validatedQuery.offset > 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: userStories,
        pagination,
        query: validatedQuery,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des user stories:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle user story
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createUserStorySchema.parse(body);

    // Vérification que la feature existe
    const feature = await prisma.feature.findUnique({
      where: { id: validatedData.featureId },
      select: {
        id: true,
        name: true,
        projectId: true,
        Project: {
          select: {
            id: true,
            name: true,
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

    // Déterminer le projectId selon le schéma
    const projectId = feature.projectId || feature.Project?.id;

    if (projectId) {
      const permissions = await checkPermissions(currentUser.id, projectId);
      if (!permissions.hasAccess) {
        return NextResponse.json(
          { error: "Accès non autorisé à ce projet" },
          { status: 403 }
        );
      }

      const canCreate = ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"].includes(
        permissions.role || ""
      );
      if (!canCreate) {
        return NextResponse.json(
          { error: "Permissions insuffisantes pour créer une user story" },
          { status: 403 }
        );
      }
    }

    // Calcul de la position
    let finalPosition = validatedData.position;
    if (finalPosition === 0) {
      const lastUserStory = await prisma.userStory.findFirst({
        where: { featureId: validatedData.featureId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      finalPosition = (lastUserStory?.position || 0) + 1000;
    }

    // Création dans une transaction
    const userStory = await prisma.$transaction(async (tx) => {
      const newUserStory = await tx.userStory.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          acceptanceCriteria: validatedData.acceptanceCriteria,
          priority: validatedData.priority,
          status: validatedData.status,
          storyPoints: validatedData.storyPoints,
          businessValue: validatedData.businessValue,
          technicalRisk: validatedData.technicalRisk,
          effort: validatedData.effort,
          estimatedHours: validatedData.estimatedHours,
          labels: validatedData.labels,
          tags: validatedData.tags,
          position: finalPosition,
          order: finalPosition,
          featureId: validatedData.featureId,
          creatorId: currentUser.id,
        },
      });

      // Assignations via table de liaison UserStoryAssignees
      if (validatedData.assigneeIds.length > 0) {
        await tx.userStoryAssignees.createMany({
          data: validatedData.assigneeIds.map((userId) => ({
            A: userId,
            B: newUserStory.id,
          })),
          skipDuplicates: true,
        });
      }

      // Association aux sprints
      if (validatedData.sprintIds.length > 0) {
        await tx.userStory.update({
          where: { id: newUserStory.id },
          data: {
            sprints: {
              connect: validatedData.sprintIds.map((sprintId) => ({
                id: sprintId,
              })),
            },
          },
        });
      }

      return newUserStory;
    });

    // Récupération complète
    const completeUserStory = await prisma.userStory.findUnique({
      where: { id: userStory.id },
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
            projectId: true,
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
        _count: {
          select: {
            tasks: true,
            comments: true,
            files: true,
            timeEntries: true,
          },
        },
      },
    });

    // Log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: "CREATE_USER_STORY",
          entity: "UserStory",
          entityId: userStory.id,
          newValues: {
            title: validatedData.title,
            featureId: validatedData.featureId,
            status: validatedData.status,
            priority: validatedData.priority,
          },
          userId: currentUser.id,
          metadata: {
            projectId: projectId,
            featureName: feature.name,
          },
        },
      });
    } catch (auditError) {
      console.error("Erreur lors de la création du log d'audit:", auditError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "User story créée avec succès",
        data: completeUserStory,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de la user story:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }

    // Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "Violation de contrainte d'unicité" },
          { status: 409 }
        );
      }

      if (prismaError.code === "P2003") {
        return NextResponse.json(
          { error: "Violation de contrainte de clé étrangère" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// OPTIONS - Support CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
