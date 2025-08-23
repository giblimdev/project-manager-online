// app/api/sprints/route.ts
/**
 * RÔLE : Route API pour la gestion CRUD des sprints (GET collection, POST création)
 * RESPONSABILITÉS :
 *   - GET: Récupérer la liste des sprints d'un projet avec pagination et filtres
 *   - POST: Créer un nouveau sprint avec validation complète
 *   - Gestion des erreurs robuste avec status codes appropriés
 *   - Validation stricte des données entrantes (Zod ou validation manuelle)
 *   - Typage strict TypeScript pour Next.js 15
 * 
 * COMPOSANTS/LIBS UTILISÉS :
 *   - Next.js 15 App Router (NextRequest, NextResponse)
 *   - Prisma Client pour l'accès base de données
 *   - TypeScript strict mode avec interfaces du schéma Prisma
 *   - Gestion d'erreurs avec try/catch et status HTTP appropriés
 */

import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

// Types basés sur le schéma Prisma
type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateSprintRequest {
  name: string;
  goal?: string | null;
  description?: string | null;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  status?: SprintStatus;
  capacity?: number | null;
  velocity?: number | null;
  projectId: string;
  order?: number;
}

// GET /api/sprints - Récupérer les sprints d'un projet
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as SprintStatus | null;
    const sortBy = searchParams.get('sortBy') || 'order';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Validation des paramètres requis
    if (!projectId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'Le paramètre projectId est requis',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Vérifier que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, isActive: true },
    });

    if (!project || !project.isActive) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Not found',
        message: 'Projet non trouvé ou inactif',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Construction des filtres
    const where: any = {
      projectId,
    };

    if (status) {
      where.status = status;
    }

    // Construction de l'ordre de tri
    const orderBy: any = {};
    if (sortBy === 'order') {
      orderBy.order = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'startDate') {
      orderBy.startDate = sortOrder;
    } else if (sortBy === 'endDate') {
      orderBy.endDate = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.order = 'asc';
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Requêtes en parallèle
    const [sprints, totalCount] = await Promise.all([
      prisma.sprint.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          userStories: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          Tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: {
              userStories: true,
              Tasks: true,
              timeEntries: true,
            },
          },
        },
      }),
      prisma.sprint.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response: ApiResponse<any> = {
      success: true,
      data: sprints,
      message: 'Sprints récupérés avec succès',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur GET /api/sprints:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des sprints',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/sprints - Créer un nouveau sprint
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body: CreateSprintRequest = await request.json();

    // Validation des champs requis
    if (!body.name || !body.startDate || !body.endDate || !body.projectId) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'Les champs name, startDate, endDate et projectId sont requis',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validation des dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'Dates invalides. Utilisez le format ISO 8601',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (endDate <= startDate) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'La date de fin doit être après la date de début',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validation du nom (longueur)
    if (body.name.length > 100) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'Le nom du sprint ne peut pas dépasser 100 caractères',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Vérifier que le projet existe et est actif
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { id: true, isActive: true },
    });

    if (!project || !project.isActive) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Not found',
        message: 'Projet non trouvé ou inactif',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Déterminer l'ordre si non fourni
    let order = body.order;
    if (!order) {
      const lastSprint = await prisma.sprint.findFirst({
        where: { projectId: body.projectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = lastSprint ? lastSprint.order + 1 : 1000;
    }

    // Vérifier l'unicité du nom dans le projet
    const existingSprint = await prisma.sprint.findFirst({
      where: {
        projectId: body.projectId,
        name: body.name,
      },
    });

    if (existingSprint) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Conflict',
        message: 'Un sprint avec ce nom existe déjà dans ce projet',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Créer le sprint
    const newSprint = await prisma.sprint.create({
      data: {
        name: body.name,
        goal: body.goal || null,
        description: body.description || null,
        startDate,
        endDate,
        status: body.status || 'PLANNED',
        capacity: body.capacity || null,
        velocity: body.velocity || null,
        order,
        projectId: body.projectId,
        burndownData: {},
        retrospective: {},
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            userStories: true,
            Tasks: true,
            timeEntries: true,
          },
        },
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: newSprint,
      message: 'Sprint créé avec succès',
      timestamp: new Date().toISOString(),
    }; 

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/sprints:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue lors de la création du sprint',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}