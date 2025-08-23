// app/api/sprints/[id]/route.ts
/**
 * RÔLE : Route API pour la gestion d'un sprint spécifique (GET, PUT, DELETE par ID)
 * RESPONSABILITÉS :
 *   - GET: Récupérer un sprint par son ID avec ses relations
 *   - PUT: Modifier un sprint existant avec validation complète
 *   - DELETE: Supprimer un sprint avec vérifications de sécurité
 *   - Gestion des erreurs 404, validation et contraintes métier
 *   - Typage strict avec Next.js 15 dynamic routes
 * 
 * COMPOSANTS/LIBS UTILISÉS :
 *   - Next.js 15 App Router avec params dynamiques
 *   - Prisma Client avec transactions pour les modifications complexes
 *   - TypeScript strict mode avec interfaces Prisma
 *   - Validation des contraintes métier (ex: sprint actif)
 */

import { NextRequest, NextResponse } from 'next/server';
import  prisma from '@/lib/prisma';


type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface UpdateSprintRequest {
  name?: string;
  goal?: string | null;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
  capacity?: number | null;
  velocity?: number | null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sprints/[id] - Récupérer un sprint par ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;

    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'ID de sprint invalide',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Récupérer le sprint avec ses relations
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            isActive: true,
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
          orderBy: { order: 'asc' },
        },
        Tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            estimatedHours: true,
          },
          orderBy: { order: 'asc' },
        },
        timeEntries: {
          select: {
            id: true,
            hours: true,
            date: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
        _count: {
          select: {
            userStories: true,
            Tasks: true,
            timeEntries: true,
            users: true,
          },
        },
      },
    });

    if (!sprint) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Not found',
        message: 'Sprint non trouvé',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: sprint,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur GET /api/sprints/[id]:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/sprints/[id] - Modifier un sprint
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const body: UpdateSprintRequest = await request.json();

    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'ID de sprint invalide',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Vérifier que le sprint existe
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, isActive: true },
        },
      },
    });

    if (!existingSprint) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Not found',
        message: 'Sprint non trouvé',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (!existingSprint.project.isActive) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Forbidden',
        message: 'Impossible de modifier un sprint dans un projet inactif',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Validation et mise à jour conditionnelle des champs
    if (body.name !== undefined) {
      if (!body.name || body.name.length > 100) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation error',
          message: 'Le nom est requis et ne peut pas dépasser 100 caractères',
          timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }

      // Vérifier l'unicité du nom dans le projet (sauf pour le sprint actuel)
      const conflictingSprint = await prisma.sprint.findFirst({
        where: {
          projectId: existingSprint.projectId,
          name: body.name,
          id: { not: id },
        },
      });

      if (conflictingSprint) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Conflict',
          message: 'Un sprint avec ce nom existe déjà dans ce projet',
          timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: 409 });
      }

      updateData.name = body.name;
    }

    if (body.goal !== undefined) {
      updateData.goal = body.goal;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.capacity !== undefined) {
      if (body.capacity !== null && body.capacity < 0) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation error',
          message: 'La capacité doit être positive',
          timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
      updateData.capacity = body.capacity;
    }

    if (body.velocity !== undefined) {
      if (body.velocity !== null && body.velocity < 0) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation error',
          message: 'La vélocité doit être positive',
          timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }
      updateData.velocity = body.velocity;
    }

    // Validation des dates
    if (body.startDate !== undefined || body.endDate !== undefined) {
      const startDate = body.startDate ? new Date(body.startDate) : existingSprint.startDate;
      const endDate = body.endDate ? new Date(body.endDate) : existingSprint.endDate;

      if (body.startDate && isNaN(startDate.getTime())) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation error',
          message: 'Date de début invalide',
          timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: 400 });
      }

      if (body.endDate && isNaN(endDate.getTime())) {
        const errorResponse: ApiResponse = {
          success: false,
          error: 'Validation error',
          message: 'Date de fin invalide',
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

      if (body.startDate) updateData.startDate = startDate;
      if (body.endDate) updateData.endDate = endDate;
    }

    // Mise à jour du sprint
    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: updateData,
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
      data: updatedSprint,
      message: 'Sprint mis à jour avec succès',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur PUT /api/sprints/[id]:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/sprints/[id] - Supprimer un sprint
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params;

    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: 'ID de sprint invalide',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Vérifier que le sprint existe et récupérer ses relations
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, isActive: true },
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

    if (!sprint) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Not found',
        message: 'Sprint non trouvé',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Vérifications de sécurité
    if (!sprint.project.isActive) {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Forbidden',
        message: 'Impossible de supprimer un sprint dans un projet inactif',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    if (sprint.status === 'ACTIVE') {
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Conflict',
        message: 'Impossible de supprimer un sprint actif. Changez son statut d\'abord.',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Transaction pour supprimer le sprint et nettoyer les relations
    await prisma.$transaction(async (tx: { userStory: { updateMany: (arg0: { where: { sprints: { some: { id: string; }; }; }; data: {}; }) => any; }; task: { updateMany: (arg0: { where: { sprints: { some: { id: string; }; }; }; data: {}; }) => any; }; timeEntry: { deleteMany: (arg0: { where: { sprintId: string; }; }) => any; }; sprint: { delete: (arg0: { where: { id: string; }; }) => any; }; }) => {
      // Détacher les user stories et tâches du sprint
      await tx.userStory.updateMany({
        where: { sprints: { some: { id } } },
        data: {},
      });

      await tx.task.updateMany({
        where: { sprints: { some: { id } } },
        data: {},
      });

      // Supprimer les entrées de temps liées
      await tx.timeEntry.deleteMany({
        where: { sprintId: id },
      });

      // Supprimer le sprint
      await tx.sprint.delete({
        where: { id },
      });
    });

    const response: ApiResponse = {
      success: true,
      message: 'Sprint supprimé avec succès',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur DELETE /api/sprints/[id]:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
