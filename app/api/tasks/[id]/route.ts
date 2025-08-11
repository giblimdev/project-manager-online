// 📄 /app/api/Tasks/[id]/route.ts
// 🎯 Rôle : API route pour la gestion d'une User Story spécifique
// 📦 Responsabilités : CRUD d'une User Story individuelle (GET, PUT, DELETE)
// 🔧 Composants utilisés : NextRequest, NextResponse, Prisma Client
// 🌐 Base de données : PostgreSQL via Prisma avec schéma UserStory

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// 📋 GET - Récupérer une User Story spécifique avec ses tâches
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ⚡ Await des paramètres - obligatoire en Next.js 15
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la User Story requis",
        },
        { status: 400 }
      );
    }

    const story = await prisma.userStory.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { position: "asc" },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
            projectId: true,
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
        comments: {
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
        },
        files: {
          orderBy: { createdAt: "desc" },
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
      },
    });

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error: "User Story non trouvée",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: story,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/Tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la User Story",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✏️ PUT - Mettre à jour une User Story
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ⚡ Await des paramètres - obligatoire en Next.js 15
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la User Story requis",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // 🔍 Validation des énums si fournis
    const validPriorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const validStatuses = [
      "TODO",
      "IN_PROGRESS",
      "CODE_REVIEW",
      "TESTING",
      "DONE",
      "BLOCKED",
      "CANCELLED",
    ];

    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: "Priorité invalide",
          details: `Valeurs acceptées: ${validPriorities.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Statut invalide",
          details: `Valeurs acceptées: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Vérifier que la User Story existe
    const existingStory = await prisma.userStory.findUnique({
      where: { id },
    });

    if (!existingStory) {
      return NextResponse.json(
        {
          success: false,
          error: "User Story non trouvée",
        },
        { status: 404 }
      );
    }

    // 🔄 Préparer les données à mettre à jour
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.acceptanceCriteria !== undefined)
      updateData.acceptanceCriteria = body.acceptanceCriteria?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.storyPoints !== undefined)
      updateData.storyPoints = body.storyPoints;
    if (body.businessValue !== undefined)
      updateData.businessValue = body.businessValue;
    if (body.technicalRisk !== undefined)
      updateData.technicalRisk = body.technicalRisk;
    if (body.effort !== undefined) updateData.effort = body.effort;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.estimatedHours !== undefined)
      updateData.estimatedHours = body.estimatedHours;
    if (body.actualHours !== undefined)
      updateData.actualHours = body.actualHours;

    // Ajouter la date de mise à jour
    updateData.updatedAt = new Date();

    const updatedStory = await prisma.userStory.update({
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
        feature: {
          select: {
            id: true,
            name: true,
            projectId: true,
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
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedStory,
        message: "User Story mise à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/Tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la User Story",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 🗑️ DELETE - Supprimer une User Story
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ⚡ Await des paramètres - obligatoire en Next.js 15
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la User Story requis",
        },
        { status: 400 }
      );
    }

    // Vérifier que la User Story existe et récupérer les dépendances
    const existingStory = await prisma.userStory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tasks: true,
            dependencies: true,
            dependents: true,
          },
        },
      },
    });

    if (!existingStory) {
      return NextResponse.json(
        {
          success: false,
          error: "User Story non trouvée",
        },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des dépendances qui empêchent la suppression
    if (existingStory._count.dependencies > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de supprimer cette User Story car elle a des dépendances",
          details: `${existingStory._count.dependencies} dépendance(s) trouvée(s)`,
        },
        { status: 409 }
      );
    }

    if (existingStory._count.dependents > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de supprimer cette User Story car d'autres User Stories en dépendent",
          details: `${existingStory._count.dependents} User Story(s) dépendante(s) trouvée(s)`,
        },
        { status: 409 }
      );
    }

    // Supprimer en cascade (Prisma se charge des relations)
    await prisma.userStory.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          deletedId: id,
          title: existingStory.title,
        },
        message: "User Story supprimée avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/Tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de la User Story",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
