// 📄 /app/api/sprints/route.ts
// 🎯 Rôle : API route pour la gestion des sprints Agile
// 📦 Responsabilités : CRUD des sprints, gestion des équipes, assignation d'user stories et items
// 🔧 Composants utilisés : NextRequest, NextResponse, Prisma Client avec modèles Sprint, Project, User, UserStory, Item
// 🌐 Base de données : PostgreSQL via Prisma avec relations complexes

import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  SprintStatus,
  Priority,
  TaskStatus,
  ItemStatus,
} from "@/lib/generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

// 🔧 Schémas de validation Zod conformes au schéma Prisma
const createSprintSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  goal: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().datetime("Format de date invalide"),
  endDate: z.string().datetime("Format de date invalide"),
  capacity: z
    .number()
    .int()
    .min(0, "La capacité ne peut pas être négative")
    .optional()
    .nullable(),
  velocity: z
    .number()
    .min(0, "La vélocité ne peut pas être négative")
    .optional()
    .nullable(),
  projectId: z.string().min(1, "L'ID du projet est obligatoire"),
  userIds: z.array(z.string()).default([]),
  userStoryIds: z.array(z.string()).default([]),
  itemIds: z.array(z.string()).default([]),
});

const updateSprintSchema = createSprintSchema.partial().extend({
  id: z.string().min(1, "L'ID est obligatoire"),
  status: z.nativeEnum(SprintStatus).optional(),
});

const querySchema = z.object({
  projectId: z.string().optional(),
  status: z.nativeEnum(SprintStatus).optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["name", "startDate", "endDate", "status", "createdAt"])
    .default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// 🔧 Interfaces TypeScript strictement typées
interface SprintResponse {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  order: number;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity: number | null;
  velocity: number | null;
  burndownData: any;
  retrospective: any;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project?: {
    id: string;
    name: string;
    key: string;
    description: string | null;
  };
  users?: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
  userStories?: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    storyPoints: number | null;
    priority: Priority;
    estimatedHours: number | null;
    actualHours: number | null;
    position: number;
  }>;
  items?: Array<{
    id: string;
    name: string;
    type: string;
    status: ItemStatus;
    priority: Priority | null;
    estimatedHours: number | null;
    actualHours: number | null;
    backlogPosition: number | null;
  }>;
  timeEntries?: Array<{
    id: string;
    hours: number;
    date: Date;
    user: {
      id: string;
      name: string | null;
    };
  }>;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    path: string | null; // ✅ CORRECTION : path au lieu de url
  }>;
  _count?: {
    users: number;
    userStories: number;
    items: number;
    timeEntries: number;
    files: number;
  };
}

interface PaginationResponse {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 🎯 Fonction utilitaire pour la validation des erreurs
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

// 📋 GET - Récupérer les sprints avec filtres avancés et pagination
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const params = querySchema.safeParse({
      projectId: searchParams.get("projectId") || undefined,
      status: searchParams.get("status") || undefined,
      userId: searchParams.get("userId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
      sortBy: (searchParams.get("sortBy") as any) || "startDate",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    });

    if (!params.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres de requête invalides",
          details: params.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      projectId,
      status,
      userId,
      startDate,
      endDate,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params.data;

    // 🔍 Construction dynamique du filtre WHERE
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.users = {
        some: {
          id: userId,
        },
      };
    }

    // Filtrage par dates avec validation
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        where.startDate = {
          gte: parsedStartDate,
        };
      }
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        where.endDate = {
          lte: parsedEndDate,
        };
      }
    }

    // Recherche textuelle
    if (search?.trim()) {
      where.OR = [
        {
          name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          goal: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    // 📊 Exécution parallèle des requêtes
    const [sprints, totalCount] = await Promise.all([
      prisma.sprint.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              key: true,
              description: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
            orderBy: {
              name: "asc",
            },
          },
          userStories: {
            select: {
              id: true,
              title: true,
              status: true,
              storyPoints: true,
              priority: true,
              estimatedHours: true,
              actualHours: true,
              position: true,
            },
            orderBy: {
              position: "asc",
            },
          },
          items: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              priority: true,
              estimatedHours: true,
              actualHours: true,
              backlogPosition: true,
            },
            orderBy: {
              backlogPosition: "asc",
            },
          },
          timeEntries: {
            select: {
              id: true,
              hours: true,
              date: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              date: "desc",
            },
          },
          files: {
            select: {
              id: true,
              name: true,
              type: true,
              path: true, // ✅ CORRECTION : path au lieu de url
            },
            orderBy: {
              name: "asc",
            },
          },
          _count: {
            select: {
              users: true,
              userStories: true,
              items: true,
              timeEntries: true,
              files: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { [sortBy]: sortOrder }],
        skip,
        take: limit,
      }),
      prisma.sprint.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const pagination: PaginationResponse = {
      totalCount,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          sprints,
          pagination,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET /api/sprints error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des sprints",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ➕ POST - Créer un nouveau sprint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = createSprintSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de création invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validation des dates
    const parsedStartDate = new Date(data.startDate);
    const parsedEndDate = new Date(data.endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de date invalide",
        },
        { status: 400 }
      );
    }

    // Vérification que la date de fin est postérieure à la date de début
    if (parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        {
          success: false,
          error: "La date de fin doit être postérieure à la date de début",
        },
        { status: 400 }
      );
    }

    // 🔍 Vérifier que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Projet non trouvé",
        },
        { status: 404 }
      );
    }

    // 🔍 Vérifier que tous les utilisateurs existent
    if (data.userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: data.userIds,
          },
        },
        select: { id: true },
      });

      if (users.length !== data.userIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Un ou plusieurs utilisateurs n'existent pas",
          },
          { status: 404 }
        );
      }
    }

    // 🔍 Vérifier que toutes les user stories existent
    if (data.userStoryIds.length > 0) {
      const userStories = await prisma.userStory.findMany({
        where: {
          id: {
            in: data.userStoryIds,
          },
        },
        select: { id: true },
      });

      if (userStories.length !== data.userStoryIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Une ou plusieurs user stories n'existent pas",
          },
          { status: 404 }
        );
      }
    }

    // 🔍 Vérifier que tous les items existent
    if (data.itemIds.length > 0) {
      const items = await prisma.item.findMany({
        where: {
          id: {
            in: data.itemIds,
          },
        },
        select: { id: true },
      });

      if (items.length !== data.itemIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Un ou plusieurs items n'existent pas",
          },
          { status: 404 }
        );
      }
    }

    // 🔍 Vérifier qu'il n'y a pas de sprint actif qui chevauche
    const overlappingSprint = await prisma.sprint.findFirst({
      where: {
        projectId: data.projectId,
        status: SprintStatus.ACTIVE,
        OR: [
          {
            AND: [
              { startDate: { lte: parsedEndDate } },
              { endDate: { gte: parsedStartDate } },
            ],
          },
        ],
      },
      select: { id: true, name: true },
    });

    if (overlappingSprint) {
      return NextResponse.json(
        {
          success: false,
          error: "Sprint en conflit",
          details: `Un sprint actif (${overlappingSprint.name}) chevauche déjà avec ces dates`,
        },
        { status: 409 }
      );
    }

    // ✅ Création du sprint avec relations
    const createData: any = {
      name: data.name.trim(),
      goal: data.goal?.trim() || null,
      description: data.description?.trim() || null,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      capacity: data.capacity,
      velocity: data.velocity,
      status: SprintStatus.PLANNED,
      projectId: data.projectId,
      burndownData: {},
      retrospective: {},
    };

    // Relations many-to-many
    if (data.userIds.length > 0) {
      createData.users = {
        connect: data.userIds.map((id) => ({ id })),
      };
    }

    if (data.userStoryIds.length > 0) {
      createData.userStories = {
        connect: data.userStoryIds.map((id) => ({ id })),
      };
    }

    if (data.itemIds.length > 0) {
      createData.items = {
        connect: data.itemIds.map((id) => ({ id })),
      };
    }

    const sprint = await prisma.sprint.create({
      data: createData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        userStories: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            position: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
            backlogPosition: true,
          },
        },
        _count: {
          select: {
            users: true,
            userStories: true,
            items: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: sprint,
        message: "Sprint créé avec succès",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/sprints error:", error);

    // 🔍 Gestion des erreurs Prisma spécifiques
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2002":
          return NextResponse.json(
            {
              success: false,
              error: "Conflit de données",
              details: "Un sprint avec ce nom existe déjà dans ce projet",
            },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            {
              success: false,
              error: "Référence invalide",
              details: "Contrainte de clé étrangère violée",
            },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Enregistrement non trouvé",
              details: "L'enregistrement référencé n'existe pas",
            },
            { status: 404 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du sprint",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✏️ PUT - Mettre à jour un sprint
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = updateSprintSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de mise à jour invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validation.data;

    // 🔍 Vérifier que le sprint existe
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        users: { select: { id: true } },
        userStories: { select: { id: true } },
        items: { select: { id: true } },
      },
    });

    if (!existingSprint) {
      return NextResponse.json(
        {
          success: false,
          error: "Sprint non trouvé",
        },
        { status: 404 }
      );
    }

    // Validation des dates si modifiées
    let parsedStartDate = existingSprint.startDate;
    let parsedEndDate = existingSprint.endDate;

    if (updateData.startDate) {
      parsedStartDate = new Date(updateData.startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Format de date de début invalide",
          },
          { status: 400 }
        );
      }
    }

    if (updateData.endDate) {
      parsedEndDate = new Date(updateData.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Format de date de fin invalide",
          },
          { status: 400 }
        );
      }
    }

    if (parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        {
          success: false,
          error: "La date de fin doit être postérieure à la date de début",
        },
        { status: 400 }
      );
    }

    // ✅ Structure Prisma correcte pour l'update
    const prismaUpdateData: any = {
      ...updateData,
      startDate: updateData.startDate ? parsedStartDate : undefined,
      endDate: updateData.endDate ? parsedEndDate : undefined,
      updatedAt: new Date(),
    };

    // Nettoyage des champs relationnels
    delete prismaUpdateData.userIds;
    delete prismaUpdateData.userStoryIds;
    delete prismaUpdateData.itemIds;
    delete prismaUpdateData.id;

    // Gestion des relations many-to-many si spécifiées
    if (updateData.userIds !== undefined) {
      if (updateData.userIds.length > 0) {
        prismaUpdateData.users = {
          set: [],
          connect: updateData.userIds.map((id) => ({ id })),
        };
      } else {
        prismaUpdateData.users = {
          set: [],
        };
      }
    }

    if (updateData.userStoryIds !== undefined) {
      if (updateData.userStoryIds.length > 0) {
        prismaUpdateData.userStories = {
          set: [],
          connect: updateData.userStoryIds.map((id) => ({ id })),
        };
      } else {
        prismaUpdateData.userStories = {
          set: [],
        };
      }
    }

    if (updateData.itemIds !== undefined) {
      if (updateData.itemIds.length > 0) {
        prismaUpdateData.items = {
          set: [],
          connect: updateData.itemIds.map((id) => ({ id })),
        };
      } else {
        prismaUpdateData.items = {
          set: [],
        };
      }
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        userStories: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            priority: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            priority: true,
          },
        },
        _count: {
          select: {
            users: true,
            userStories: true,
            items: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedSprint,
        message: "Sprint mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PUT /api/sprints error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour du sprint",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 🗑️ DELETE - Supprimer un sprint (avec vérifications)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID du sprint requis",
        },
        { status: 400 }
      );
    }

    // 🔍 Vérifier que le sprint existe
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            userStories: true,
            items: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    if (!existingSprint) {
      return NextResponse.json(
        {
          success: false,
          error: "Sprint non trouvé",
        },
        { status: 404 }
      );
    }

    // Vérification : ne pas supprimer un sprint actif
    if (existingSprint.status === SprintStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer un sprint actif",
          details: "Veuillez d'abord terminer ou annuler le sprint",
        },
        { status: 409 }
      );
    }

    // Suppression physique du sprint (Prisma se charge des relations)
    await prisma.sprint.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: existingSprint.id,
          name: existingSprint.name,
          deletedCounts: existingSprint._count,
        },
        message: "Sprint supprimé avec succès",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("DELETE /api/sprints error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression du sprint",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
