// 📄 /app/api/tasks/[id]/route.ts
// 🎯 Rôle : API route pour la gestion d'une Task spécifique
// 📦 Responsabilités : CRUD d'une Task individuelle (GET, PUT, DELETE)
// 🔧 Composants utilisés : NextRequest, NextResponse, Prisma Client
// 🌐 Base de données : PostgreSQL via Prisma avec le modèle Task

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { TaskStatus, Priority } from "@/lib/generated/prisma/client";

// 📋 GET - Récupérer une Task spécifique
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
          error: "ID de la Task requis",
        },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
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
            dependsOnTask: {
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

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task non trouvée",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: task,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la Task",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// ✏️ PUT - Mettre à jour une Task
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
          error: "ID de la Task requis",
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

    // Vérifier que la Task existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task non trouvée",
        },
        { status: 404 }
      );
    }

    // 🔄 Préparer les données à mettre à jour
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined)
      updateData.description = body.description?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.estimatedHours !== undefined)
      updateData.estimatedHours = body.estimatedHours;
    if (body.actualHours !== undefined)
      updateData.actualHours = body.actualHours;
    if (body.dueDate !== undefined) 
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.startDate !== undefined)
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.completedAt !== undefined)
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null;

    // Ajouter la date de mise à jour
    updateData.updatedAt = new Date();

    const updatedTask = await prisma.task.update({
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
        project: {
          select: {
            id: true,
            name: true,
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
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedTask,
        message: "Task mise à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la Task",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE - Supprimer une Task
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
          error: "ID de la Task requis",
        },
        { status: 400 }
      );
    }

    // Vérifier que la Task existe et récupérer les dépendances
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            dependencies: true,
                   comments: true,
            timeEntries: true,
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Task non trouvée",
        },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des dépendances qui empêchent la suppression
    if (existingTask._count.dependencies > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de supprimer cette Task car elle a des dépendances",
          details: `${existingTask._count.dependencies} dépendance(s) trouvée(s)`,
        },
        { status: 409 }
      );
    }

    

    // Supprimer la Task (Prisma se charge des relations en cascade)
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          deletedId: id,
          title: existingTask.title,
        },
        message: "Task supprimée avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de la Task",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
