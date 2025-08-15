// app/api/initiatives/[id]/route.ts

/**
 * RÔLE : API route pour la gestion CRUD d'une initiative spécifique
 * RESPONSABILITÉS :
 * - GET : Récupération des détails complets d'une initiative avec relations
 * - PUT : Mise à jour partielle ou complète d'une initiative
 * - DELETE : Suppression d'une initiative avec gestion des éléments liés
 * - Validation des données et gestion d'erreurs complète
 * - Types stricts TypeScript avec interfaces Prisma
 * - Gestion des relations complexes (Project, User, Epics, Features, UserStories, Tasks)
 * - Protection contre les suppressions accidentelles avec options de cascade
 * - Réponses JSON standardisées avec codes HTTP appropriés
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: Next.js 15 API routes
 * - Prisma Client: ORM pour base de données avec relations complexes
 * - Interface UpdateInitiativeRequest: Types pour mise à jour
 * - Include strategies: Relations optimisées pour performance
 * - Transaction Prisma: Pour suppressions en cascade sécurisées
 * - Error handling: Gestion complète des erreurs avec logs
 *
 * LIBS UTILISÉS :
 * - Next.js 15 App Router: API routes avec params Promise
 * - Prisma ORM: Base de données avec relations TypeScript
 * - TypeScript strict mode: Types complets et validation
 * - Console logging: Debug et monitoring des erreurs
 *
 * API ENDPOINTS :
 * - GET /api/initiatives/[id] : Détails initiative avec relations
 * - PUT /api/initiatives/[id] : Mise à jour initiative
 * - DELETE /api/initiatives/[id] : Suppression initiative (avec cascade optionnel)
 * - Status codes: 200, 400, 404, 500 avec messages explicites
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Interface pour les requêtes de mise à jour
interface UpdateInitiativeRequest {
  name?: string;
  description?: string;
  objective?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  progress?: number;
  budget?: number | null;
  roi?: number | null;
  userId?: string | null;
}

// Interface pour les paramètres de suppression
interface DeleteOptions {
  force?: boolean; // Forcer la suppression même avec éléments liés
  cascade?: boolean; // Suppression en cascade des éléments liés
}

/**
 * GET - Récupération d'une initiative par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    console.log(`🔍 GET Initiative - ID: ${id}`);

    const initiative = await prisma.initiative.findUnique({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        epics: {
          include: {
            features: {
              select: {
                id: true,
                name: true,
                status: true,
                progress: true,
                storyPoints: true,
              },
            },
            _count: {
              select: {
                features: true,
              },
            },
          },
        },
        _count: {
          select: {
            epics: true,
          },
        },
      },
    });

    if (!initiative) {
      console.log(`❌ Initiative not found - ID: ${id}`);
      return NextResponse.json(
        {
          success: false,
          error: "Initiative non trouvée",
          code: "INITIATIVE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    console.log(`✅ Initiative found - Name: ${initiative.name}`);
    return NextResponse.json({
      success: true,
      data: initiative,
    });
  } catch (error) {
    console.error("💥 Erreur lors de la récupération de l'initiative:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de l'initiative",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Mise à jour d'une initiative
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: UpdateInitiativeRequest = await request.json();

    console.log(`🔧 PUT Initiative - ID: ${id}`, body);

    // Vérifier que l'initiative existe
    const existingInitiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingInitiative) {
      console.log(`❌ Initiative not found for update - ID: ${id}`);
      return NextResponse.json(
        {
          success: false,
          error: "Initiative non trouvée",
          code: "INITIATIVE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Construire les données de mise à jour avec validation
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Le nom de l'initiative ne peut pas être vide",
            code: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;

    // Gestion des dates avec validation
    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }

    // Validation des dates
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate > updateData.endDate) {
        return NextResponse.json(
          {
            success: false,
            error:
              "La date de début ne peut pas être postérieure à la date de fin",
            code: "INVALID_DATE_RANGE",
          },
          { status: 400 }
        );
      }
    }

    // Validation du progrès
    if (body.progress !== undefined) {
      if (body.progress < 0 || body.progress > 100) {
        return NextResponse.json(
          {
            success: false,
            error: "Le progrès doit être entre 0 et 100",
            code: "INVALID_PROGRESS",
          },
          { status: 400 }
        );
      }
      updateData.progress = body.progress;
    }

    if (body.budget !== undefined) updateData.budget = body.budget;
    if (body.roi !== undefined) updateData.roi = body.roi;
    if (body.userId !== undefined) updateData.userId = body.userId;

    const initiative = await prisma.initiative.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        epics: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
        _count: {
          select: {
            epics: true,
          },
        },
      },
    });

    console.log(
      `✅ Initiative updated successfully - Name: ${initiative.name}`
    );
    return NextResponse.json({
      success: true,
      data: initiative,
      message: "Initiative mise à jour avec succès",
    });
  } catch (error) {
    console.error("💥 Erreur lors de la mise à jour de l'initiative:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de l'initiative",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Suppression d'une initiative avec options avancées
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Récupérer les options de suppression depuis les query params
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";
    const cascade = searchParams.get("cascade") === "true";

    console.log(
      `🗑️ DELETE Initiative - ID: ${id}, Force: ${force}, Cascade: ${cascade}`
    );

    // Vérifier que l'initiative existe avec toutes les relations
    const existingInitiative = await prisma.initiative.findUnique({
      where: { id },
      include: {
        epics: {
          include: {
            features: {
              include: {
                userStories: {
                  include: {
                    tasks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingInitiative) {
      console.log(`❌ Initiative not found for deletion - ID: ${id}`);
      return NextResponse.json(
        {
          success: false,
          error: "Initiative non trouvée",
          code: "INITIATIVE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Compter les éléments liés
    const relatedCounts = {
      epics: existingInitiative.epics.length,
      features: existingInitiative.epics.reduce(
        (acc, epic) => acc + epic.features.length,
        0
      ),
      userStories: existingInitiative.epics.reduce(
        (acc, epic) =>
          acc +
          epic.features.reduce(
            (featureAcc, feature) => featureAcc + feature.userStories.length,
            0
          ),
        0
      ),
      tasks: existingInitiative.epics.reduce(
        (acc, epic) =>
          acc +
          epic.features.reduce(
            (featureAcc, feature) =>
              featureAcc +
              feature.userStories.reduce(
                (storyAcc, story) => storyAcc + story.tasks.length,
                0
              ),
            0
          ),
        0
      ),
    };

    const hasRelatedElements = Object.values(relatedCounts).some(
      (count) => count > 0
    );

    console.log(`📊 Related elements count:`, relatedCounts);

    // Si il y a des éléments liés et pas de force/cascade
    if (hasRelatedElements && !force && !cascade) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de supprimer l'initiative car elle contient des éléments liés",
          code: "HAS_RELATED_ELEMENTS",
          data: {
            relatedCounts,
            suggestions: {
              force:
                "Utilisez ?force=true pour forcer la suppression (les éléments liés resteront orphelins)",
              cascade:
                "Utilisez ?cascade=true pour supprimer également tous les éléments liés",
            },
          },
        },
        { status: 400 }
      );
    }

    // Suppression en cascade si demandée
    if (cascade && hasRelatedElements) {
      console.log(
        `🔥 Cascade deletion started for initiative: ${existingInitiative.name}`
      );

      await prisma.$transaction(async (tx) => {
        // Supprimer toutes les tasks
        for (const epic of existingInitiative.epics) {
          for (const feature of epic.features) {
            for (const story of feature.userStories) {
              if (story.tasks.length > 0) {
                await tx.task.deleteMany({
                  where: { userstoryId: story.id }, // CORRECTION ICI : userstoryId au lieu de userStoryId
                });
              }
            }
          }
        }

        // Supprimer toutes les user stories
        for (const epic of existingInitiative.epics) {
          for (const feature of epic.features) {
            if (feature.userStories.length > 0) {
              await tx.userStory.deleteMany({
                where: { featureId: feature.id },
              });
              console.log(
                `  🗑️ Deleted ${feature.userStories.length} user stories from feature: ${feature.name}`
              );
            }
          }
        }

        // Supprimer toutes les features
        for (const epic of existingInitiative.epics) {
          if (epic.features.length > 0) {
            await tx.feature.deleteMany({
              where: { epicId: epic.id },
            });
            console.log(
              `  🗑️ Deleted ${epic.features.length} features from epic: ${epic.name}`
            );
          }
        }

        // Supprimer tous les epics
        if (existingInitiative.epics.length > 0) {
          await tx.epic.deleteMany({
            where: { initiativeId: id },
          });
          console.log(
            `  🗑️ Deleted ${existingInitiative.epics.length} epics from initiative: ${existingInitiative.name}`
          );
        }

        // Supprimer l'initiative
        await tx.initiative.delete({
          where: { id },
        });
        console.log(`  🗑️ Deleted initiative: ${existingInitiative.name}`);
      });

      console.log(
        `✅ Cascade deletion completed for initiative: ${existingInitiative.name}`
      );

      return NextResponse.json({
        success: true,
        message: "Initiative et tous ses éléments liés supprimés avec succès",
        data: {
          deletedCounts: relatedCounts,
        },
      });
    }

    // Suppression simple (force ou pas d'éléments liés)
    await prisma.initiative.delete({
      where: { id },
    });

    console.log(
      `✅ Initiative deleted successfully: ${existingInitiative.name}`
    );

    return NextResponse.json({
      success: true,
      message: hasRelatedElements
        ? "Initiative supprimée avec succès (éléments liés conservés)"
        : "Initiative supprimée avec succès",
      data: {
        hadRelatedElements: hasRelatedElements,
        relatedCounts: hasRelatedElements ? relatedCounts : undefined,
      },
    });
  } catch (error) {
    console.error("💥 Erreur lors de la suppression de l'initiative:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de l'initiative",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
