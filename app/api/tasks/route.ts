// app/api/tasks/route.ts

/**
 * RÔLE : API Next.js 15 GET/POST tasks d'un projet (creatorId obligatoire !)
 * - GET : toutes les tâches du projet par projectId (query param)
 * - POST : création d'une tâche dans un projet (creatorId obligatoire, PAS de user story)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { TaskStatus, Priority } from "@/lib/generated/prisma/client";

// -- Typages stricts
interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: string;
  creatorId: string; // <--- champ obligatoire !
  status?: TaskStatus;
  priority?: Priority;
}

interface TaskGetResponse {
  id: string;
  title: string;
  description: string | null;
  position: number;
  status: TaskStatus;
  priority: Priority;
  project: { id: string; name: string } | null;
  creator: { id: string; name: string | null } | null;
}

// GET /api/tasks?projectId=...
export async function GET(request: NextRequest): Promise<NextResponse<{ success: boolean; data: TaskGetResponse[]; error?: string }>> {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ success: false, data: [], error: "Paramètre projectId requis" }, { status: 400 });
  }
  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        status: true,
        priority: true,
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      }
    });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json({ success: false, data: [], error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; data?: TaskGetResponse; error?: string }>> {
  try {
    const body: CreateTaskRequest = await request.json();

    if (!body.title || !body.projectId || !body.creatorId) {
      return NextResponse.json({ success: false, error: "title, projectId et creatorId sont requis" }, { status: 400 });
    }

    // Vérifie que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { id: true, name: true }
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "projectId inexistant" }, { status: 400 });
    }

    // Vérifie que le créateur existe (optionnel en prod, recommandé en dev)
    const user = await prisma.user.findUnique({
      where: { id: body.creatorId },
      select: { id: true, name: true }
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "creatorId inexistant" }, { status: 400 });
    }

    // Position à la fin du backlog du projet
    const position = await prisma.task.count({ where: { projectId: body.projectId } });

    const created = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        projectId: body.projectId,
        creatorId: body.creatorId, // OBLIGATOIRE
        position,
        status: body.status ?? "TODO",
        priority: body.priority ?? "MEDIUM",
      },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        status: true,
        priority: true,
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: created
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
