// 📄 /app/api/sprints/route.ts
/**
 * RÔLE : API route principale pour la gestion des sprints - GET et POST uniquement
 * RESPONSABILITÉS : 
 * - GET : Récupérer les sprints avec filtres et pagination
 * - POST : Créer un nouveau sprint
 * COMPOSANTS : NextRequest, NextResponse, Prisma Client
 * DATABASE : PostgreSQL via Prisma selon schema-projec-manager
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import {
  SprintStatus,
  Priority,
  TaskStatus,
  ItemStatus,
} from "@/lib/generated/prisma"; // adapter le chemin si besoin

// Schéma Zod de création "parfaitement" conforme à ton modèle Sprint et relations
const createSprintSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est obligatoire")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  goal: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().datetime("Format de date invalide"), // DateTime
  endDate: z.string().datetime("Format de date invalide"),   // DateTime
  capacity: z.number().int().min(0, "La capacité ne peut pas être négative").nullable().optional(),
  velocity: z.number().min(0, "La vélocité ne peut pas être négative").nullable().optional(),
  projectId: z.string().min(1, "L'ID du projet est obligatoire"),
  userIds: z.array(z.string()).default([]),        // relation users SprintToUser
  userStoryIds: z.array(z.string()).default([]),   // relation SprintUserStories
  itemIds: z.array(z.string()).default([]),        // relation items Sprint
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
  sortBy: z.enum(["name", "startDate", "endDate", "status", "createdAt"]).default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

interface PaginationResponse {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

function isError(err: unknown): err is Error {
  return err instanceof Error;
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (typeof error === "string") return error;
  return "Erreur inconnue";
}

// GET - Liste paginée et filtrée des sprints
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
      sortBy: searchParams.get("sortBy") || "startDate",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });

    if (!params.success) {
      return NextResponse.json(
        { success: false, error: "Paramètres de requête invalides", details: params.error.issues },
        { status: 400 }
      );
    }

    const { projectId, status, userId, startDate, endDate, search, page, limit, sortBy, sortOrder } = params.data;
    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (userId) where.users = { some: { id: userId } };
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
        { goal: { contains: search.trim(), mode: "insensitive" } },
      ];
    }
    const skip = (page - 1) * limit;

    const [sprints, totalCount] = await Promise.all([
      prisma.sprint.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, slug:true, key:true, description:true } },
          users: { select: { id: true, name: true, email: true, image: true }, orderBy: { name: "asc" } },
          userStories: { select: { id: true, title: true, status: true, storyPoints:true, priority: true, estimatedHours:true, actualHours:true, position:true }, orderBy: { position: "asc" } },
          items: { select: { id: true, name: true, type: true, status: true, priority: true, estimatedHours: true, actualHours: true, backlogPosition: true }, orderBy: { backlogPosition: "asc" } },
          timeEntries: { select: { id: true, hours: true, date: true, user: { select: { id: true, name: true } } }, orderBy: { date: "desc" } },
          files: { select: { id: true, name: true, type: true, path: true }, orderBy: { name: "asc" } },
          _count: { select: { users:true, userStories:true, items:true, timeEntries:true, files:true } },
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

    return NextResponse.json({ success: true, data: { sprints, pagination } }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des sprints", details: getErrorMessage(error) },
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
        { success: false, error: "Données de création invalides", details: validation.error.issues },
        { status: 400 }
      );
    }
    const data = validation.data;

    const parsedStartDate = new Date(data.startDate);
    const parsedEndDate = new Date(data.endDate);
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json({ success: false, error: "Format de date invalide" }, { status: 400 });
    }
    if (parsedEndDate <= parsedStartDate) {
      return NextResponse.json({ success: false, error: "La date de fin doit être postérieure à la date de début" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "Projet non trouvé" }, { status: 404 });
    }

    // Relations (validation d'existence)
    if (data.userIds.length > 0) {
      const users = await prisma.user.findMany({ where: { id: { in: data.userIds } }, select: { id: true } });
      if (users.length !== data.userIds.length) {
        return NextResponse.json({ success: false, error: "Un ou plusieurs utilisateurs n'existent pas" }, { status: 404 });
      }
    }
    if (data.userStoryIds.length > 0) {
      const userStories = await prisma.userStory.findMany({ where: { id: { in: data.userStoryIds } }, select: { id: true } });
      if (userStories.length !== data.userStoryIds.length) {
        return NextResponse.json({ success: false, error: "Une ou plusieurs user stories n'existent pas" }, { status: 404 });
      }
    }
    if (data.itemIds.length > 0) {
      const items = await prisma.item.findMany({ where: { id: { in: data.itemIds } }, select: { id: true } });
      if (items.length !== data.itemIds.length) {
        return NextResponse.json({ success: false, error: "Un ou plusieurs items n'existent pas" }, { status: 404 });
      }
    }

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
        project: { select: { id: true, name: true, slug: true, key: true, description: true } },
        users: { select: { id: true, name: true, email: true, image: true } },
        userStories: { select: { id: true, title: true, status: true, storyPoints: true, priority: true, estimatedHours: true, actualHours: true, position: true } },
        items: { select: { id: true, name: true, type: true, status: true, priority: true, estimatedHours: true, actualHours: true, backlogPosition: true } },
        _count: { select: { users: true, userStories: true, items: true, timeEntries: true, files: true } },
      },
    });

    return NextResponse.json(
      { success: true, data: sprint, message: "Sprint créé avec succès" },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la création du sprint", details: getErrorMessage(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
