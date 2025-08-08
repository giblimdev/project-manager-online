// app/api/tasks/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { TaskStatus, Priority } from "@/lib/generated/prisma/client";

interface TaskStats {
  readonly total: number;
  readonly byStatus: Record<TaskStatus, number>;
  readonly byPriority: Record<Priority, number>;
  readonly overdue: number;
  readonly completed: number;
  readonly inProgress: number;
  readonly estimatedHours: number;
  readonly actualHours: number;
  readonly completionRate: number;
}

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<TaskStats>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Non autorisé",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userStoryId = searchParams.get("userStoryId");
    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");

    const whereClause: any = {
      OR: [
        { creatorId: session.user.id },
        { assignees: { some: { id: session.user.id } } },
      ],
    };

    if (userStoryId) {
      whereClause.userStoryId = userStoryId;
    }

    if (projectId) {
      whereClause.userStory = {
        feature: {
          Project: {
            some: { id: projectId },
          },
        },
      };
    }

    if (assigneeId) {
      whereClause.assignees = { some: { id: assigneeId } };
    }

    const [
      tasks,
      statusCounts,
      priorityCounts,
      overdueCount,
      estimatedHoursSum,
      actualHoursSum,
    ] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        select: {
          id: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          actualHours: true,
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: whereClause,
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: whereClause,
        _count: { id: true },
      }),
      prisma.task.count({
        where: {
          ...whereClause,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.task.aggregate({
        where: whereClause,
        _sum: { estimatedHours: true },
      }),
      prisma.task.aggregate({
        where: whereClause,
        _sum: { actualHours: true },
      }),
    ]);

    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === TaskStatus.DONE
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS
    ).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    // Initialiser les compteurs par statut
    const byStatus: Record<TaskStatus, number> = Object.values(
      TaskStatus
    ).reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<TaskStatus, number>
    );

    statusCounts.forEach(({ status, _count }) => {
      byStatus[status as TaskStatus] = _count.id;
    });

    // Initialiser les compteurs par priorité
    const byPriority: Record<Priority, number> = Object.values(Priority).reduce(
      (acc, priority) => ({ ...acc, [priority]: 0 }),
      {} as Record<Priority, number>
    );

    priorityCounts.forEach(({ priority, _count }) => {
      byPriority[priority as Priority] = _count.id;
    });

    const stats: TaskStats = {
      total,
      byStatus,
      byPriority,
      overdue: overdueCount,
      completed,
      inProgress,
      estimatedHours: estimatedHoursSum._sum.estimatedHours || 0,
      actualHours: actualHoursSum._sum.actualHours || 0,
      completionRate: Math.round(completionRate * 100) / 100,
    };

    return NextResponse.json<ApiResponse<TaskStats>>({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.error("Error fetching task stats:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
