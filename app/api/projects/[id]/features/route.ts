// app/api/projects/[id]/features/route.ts
// Route API pour la récupération des features d'un projet spécifique
// Rôle : Gestion GET des features avec relations et filtrage avancé selon le schéma Prisma
// Composants : Prisma Client pour l'accès aux données, Zod pour la validation des paramètres
// Dépendances : @prisma/client, zod pour la validation des paramètres
// Types : Feature avec relations selon le schéma Prisma (Epic, User, FeatureDependency, UserStory, File)
// Sécurité : Route publique sans authentification (accès libre aux données projet)
// Performance : Inclusion conditionnelle des relations et pagination optimisée
// Error Handling : Gestion complète des erreurs avec codes HTTP appropriés et messages utilisateur
// Next.js 15 : Gestion des paramètres async avec await params

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// ✅ Types selon le schéma Prisma avec interface d'erreur étendue
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  details?: {
    field: string;
    message: string;
    code: string;
  }[];
  metadata?: {
    total: number;
    projectId: string;
    filters?: Record<string, any>;
    pagination?: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary?: {
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
      totalStoryPoints: number;
      averageProgress: number;
    };
  };
}

// ✅ Schema de validation des query parameters selon le schéma Prisma
const QuerySchema = z.object({
  includeFiles: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeDependencies: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeRelations: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeUserStories: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeEpic: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeUsers: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  status: z.string().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  epicId: z.string().optional(),
  parentId: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val))) : 50)),
  search: z.string().optional(),
  sortBy: z
    .enum(["name", "priority", "status", "progress", "createdAt", "position"])
    .optional()
    .default("position"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

// ✅ GET - Récupération des features d'un projet avec filtrage et pagination (SANS AUTHENTIFICATION)
export async function GET(
  request: NextRequest,
  { params }: PageProps
): Promise<NextResponse> {
  try {
    // ✅ Résolution des paramètres Next.js 15
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    console.log("🔄 GET /api/projects/[id]/features - ProjectId:", projectId);

    // ✅ Validation du projectId
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID",
          message: "Project ID is required and must be a valid string",
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // ✅ Validation et parsing des query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryResult.success) {
      console.log("❌ Paramètres invalides:", queryResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          message: queryResult.error.issues[0]?.message || "Invalid parameters",
          details: queryResult.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    const {
      includeFiles = false,
      includeDependencies = false,
      includeRelations = false,
      includeUserStories = false,
      includeEpic = true,
      includeUsers = false,
      status,
      priority,
      epicId,
      parentId,
      page = 1,
      limit = 50,
      search,
      sortBy = "position",
      sortOrder = "asc",
    } = queryResult.data;

    console.log("🔍 Paramètres validés:", {
      projectId,
      page,
      limit,
      filters: { status, priority, epicId, parentId, search },
      includes: { includeFiles, includeDependencies, includeRelations },
    });

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        status: true,
        description: true,
        visibility: true,
        key: true,
        slug: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!project) {
      console.log("❌ Projet non trouvé:", projectId);
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          message: "The specified project does not exist or is inactive",
          timestamp: new Date().toISOString(),
        } satisfies ApiResponse,
        { status: 404 }
      );
    }

    console.log("✅ Projet trouvé:", {
      id: project.id,
      name: project.name,
      status: project.status,
      visibility: project.visibility,
      key: project.key,
    });

    // ✅ Construction des filtres de recherche selon le schéma Feature
    const where: any = {
      projectId,
    };

    // Filtres optionnels selon les champs du modèle Feature
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (epicId) where.epicId = epicId;
    if (parentId) where.parentId = parentId;

    // Recherche textuelle dans les champs textuels du modèle Feature
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { acceptanceCriteria: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ Construction des inclusions conditionnelles selon le schéma Prisma
    const include: any = {
      // Epic relation selon le schéma
      epic: includeEpic
        ? {
            select: {
              id: true,
              name: true,
              description: true,
              priority: true,
              status: true,
              progress: true,
              startDate: true,
              endDate: true,
              order: true,
              createdAt: true,
              updatedAt: true,
              initiativeId: true,
            },
          }
        : {
            select: {
              id: true,
              name: true,
              status: true,
              progress: true,
            },
          },

      // Relations hiérarchiques Feature parent/children selon le schéma
      parent: includeRelations
        ? {
            select: {
              id: true,
              name: true,
              order: true,
              description: true,
              acceptanceCriteria: true,
              priority: true,
              status: true,
              storyPoints: true,
              businessValue: true,
              technicalRisk: true,
              effort: true,
              startDate: true,
              endDate: true,
              progress: true,
              position: true,
              epicId: true,
              parentId: true,
              projectId: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            },
          }
        : false,

      children: includeRelations
        ? {
            select: {
              id: true,
              name: true,
              order: true,
              priority: true,
              status: true,
              storyPoints: true,
              progress: true,
              position: true,
            },
            orderBy: { position: "asc" },
          }
        : false,

      // User relation selon le schéma (Feature.users -> User) - relation optionnelle
      users: includeUsers
        ? {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              firstName: true,
              lastName: true,
              username: true,
              bio: true,
              timezone: true,
            },
          }
        : false,

      // ✅ CORRECTION : Relation Project selon le schéma
      Project: includeRelations
        ? {
            select: {
              id: true,
              name: true,
              key: true,
              slug: true,
              status: true,
              visibility: true,
            },
          }
        : false,

      // File relation selon le schéma (File.featureId -> Feature)
      files: includeFiles
        ? {
            select: {
              id: true,
              name: true,
              order: true,
              type: true,
              mimeType: true,
              path: true,
              description: true,
              import: true,
              use: true,
              export: true,
              script: true,
              version: true,
              isFolder: true,
              metadata: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { order: "asc" },
          }
        : false,

      // FeatureDependency relations selon le schéma
      dependencies: includeDependencies
        ? {
            select: {
              id: true,
              type: true,
              order: true,
              description: true,
              createdAt: true,
              dependsOnFeatureId: true,
              dependsOnFeature: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  progress: true,
                  priority: true,
                  epicId: true,
                  position: true,
                },
              },
            },
            orderBy: { order: "asc" },
          }
        : false,

      dependents: includeDependencies
        ? {
            select: {
              id: true,
              type: true,
              order: true,
              description: true,
              createdAt: true,
              dependentFeatureId: true,
              dependentFeature: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  progress: true,
                  priority: true,
                  epicId: true,
                  position: true,
                },
              },
            },
            orderBy: { order: "asc" },
          }
        : false,

      // UserStory relation selon le schéma (UserStory.featureId -> Feature)
      userStories: includeUserStories
        ? {
            select: {
              id: true,
              title: true,
              order: true,
              description: true,
              acceptanceCriteria: true,
              priority: true,
              status: true,
              storyPoints: true,
              businessValue: true,
              technicalRisk: true,
              effort: true,
              position: true,
              labels: true,
              tags: true,
              estimatedHours: true,
              actualHours: true,
              createdAt: true,
              updatedAt: true,
              creatorId: true,
            },
            orderBy: { position: "asc" },
          }
        : false,
    };

    // ✅ Construction de l'ordre de tri selon les champs du modèle Feature
    const orderBy: any = [];

    if (sortBy === "position") {
      orderBy.push({ position: sortOrder });
      orderBy.push({ order: sortOrder });
    } else if (sortBy === "priority") {
      // Ordre personnalisé pour Priority enum selon le schéma
      orderBy.push({
        priority: sortOrder === "asc" ? "desc" : "asc", // CRITICAL > HIGH > MEDIUM > LOW
      });
    } else {
      orderBy.push({ [sortBy]: sortOrder });
    }

    // Tri secondaire par date de création
    orderBy.push({ createdAt: "desc" });

    // ✅ Récupération des features avec pagination selon le schéma Prisma
    const [features, totalCount] = await Promise.all([
      prisma.feature.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feature.count({ where }),
    ]);

    console.log(
      `✅ ${features.length} features récupérées sur ${totalCount} total`
    );

    // ✅ Calcul des statistiques de synthèse avec typage strict selon le schéma
    const [statusStats, priorityStats, aggregates] = await Promise.all([
      // Répartition par statut selon Feature.status
      prisma.feature.groupBy({
        by: ["status"],
        where: { projectId },
        _count: true,
      }),
      // Répartition par priorité selon Feature.priority (enum Priority)
      prisma.feature.groupBy({
        by: ["priority"],
        where: { projectId },
        _count: true,
      }),
      // Agrégats pour story points et progression selon Feature.storyPoints et Feature.progress
      prisma.feature.aggregate({
        where: { projectId },
        _sum: {
          storyPoints: true,
        },
        _avg: {
          progress: true,
        },
      }),
    ]);

    // ✅ Transformation des statistiques avec typage strict
    const byStatus = statusStats.reduce(
      (
        acc: Record<string, number>,
        item: { status: string; _count: number }
      ) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const byPriority = priorityStats.reduce(
      (
        acc: Record<string, number>,
        item: { priority: string; _count: number }
      ) => {
        acc[item.priority] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalStoryPoints = aggregates._sum.storyPoints || 0;
    const averageProgress = aggregates._avg.progress || 0;

    // ✅ Construction de la réponse structurée
    const response: ApiResponse = {
      success: true,
      data: features,
      timestamp: new Date().toISOString(),
      metadata: {
        total: totalCount,
        projectId,
        filters: {
          status,
          priority,
          epicId,
          parentId,
          search,
          includeFiles,
          includeDependencies,
          includeRelations,
          includeUserStories,
          includeEpic,
          includeUsers,
          sortBy,
          sortOrder,
        },
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
        summary: {
          byStatus,
          byPriority,
          totalStoryPoints,
          averageProgress: Math.round(averageProgress * 100) / 100,
        },
      },
    };

    console.log("✅ Réponse construite avec succès");
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des features:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

// ✅ Gestion explicite des autres méthodes HTTP (renvoi 405 Method Not Allowed)
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      message: "POST method is not supported on this endpoint",
      timestamp: new Date().toISOString(),
    } satisfies ApiResponse,
    { status: 405, headers: { Allow: "GET" } }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      message: "PUT method is not supported on this endpoint",
      timestamp: new Date().toISOString(),
    } satisfies ApiResponse,
    { status: 405, headers: { Allow: "GET" } }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      message: "DELETE method is not supported on this endpoint",
      timestamp: new Date().toISOString(),
    } satisfies ApiResponse,
    { status: 405, headers: { Allow: "GET" } }
  );
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed",
      message: "PATCH method is not supported on this endpoint",
      timestamp: new Date().toISOString(),
    } satisfies ApiResponse,
    { status: 405, headers: { Allow: "GET" } }
  );
}
