// app/api/tasks/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import  prisma from "@/lib/prisma";


export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, direction, projectId } = body;

    // Validation des paramètres
    if (!taskId || !direction || !projectId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { success: false, error: "Invalid direction" },
        { status: 400 }
      );
    }

    // Récupérer la tâche actuelle
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, order: true, projectId: true }
    });

    if (!currentTask) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Vérifier que la tâche appartient au projet
    if (currentTask.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: "Task does not belong to the specified project" },
        { status: 403 }
      );
    }

    // Récupérer toutes les tâches du projet triées par ordre
    const allTasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      select: { id: true, order: true }
    });

    // Trouver l'index de la tâche actuelle
    const currentIndex = allTasks.findIndex(task => task.id === taskId);
    
    if (currentIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Task not found in project" },
        { status: 404 }
      );
    }

    // Déterminer l'index de destination
    let targetIndex: number;
    if (direction === 'up') {
      if (currentIndex === 0) {
        return NextResponse.json(
          { success: false, error: "Task is already at the top" },
          { status: 400 }
        );
      }
      targetIndex = currentIndex - 1;
    } else {
      if (currentIndex === allTasks.length - 1) {
        return NextResponse.json(
          { success: false, error: "Task is already at the bottom" },
          { status: 400 }
        );
      }
      targetIndex = currentIndex + 1;
    }

    // Échanger les ordres des deux tâches
    const targetTask = allTasks[targetIndex];
    const currentOrder = currentTask.order;
    const targetOrder = targetTask.order;

    await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { order: targetOrder }
      }),
      prisma.task.update({
        where: { id: targetTask.id },
        data: { order: currentOrder }
      })
    ]);

    // Récupérer les tâches mises à jour
    const updatedTasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTasks,
      message: "Task order updated successfully"
    });

  } catch (error) {
    console.error("Error reordering tasks:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
