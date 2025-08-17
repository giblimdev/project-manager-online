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
  order: number;
  status: TaskStatus;
  priority: Priority;
  project: { id: string; name: string } | null;
  creator: { id: string; name: string | null } | null;
}

// GET /api/tasks?projectId=...
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("🔍 GET /api/tasks called");

  const projectId = request.nextUrl.searchParams.get("projectId");
  console.log("📋 projectId from query:", projectId);

  if (!projectId) {
    console.log("❌ Missing projectId parameter");
    return NextResponse.json(
      { success: false, data: [], error: "Paramètre projectId requis" },
      { status: 400 }
    );
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { order: "asc" },      // <-- Utilise 'order' pour le tri
      select: {
        id: true,
        title: true,
        description: true,
        order: true,                  // <-- Utilise 'order' pour l'ordre
        status: true,
        priority: true,
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    console.log("✅ Tasks found:", tasks.length);
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("❌ Error in GET /api/tasks:", error);
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("🚀 POST /api/tasks called");

  try {
    const body: CreateTaskRequest = await request.json();
    console.log("📝 Request body received:", JSON.stringify(body, null, 2));

    // Vérification des champs requis
    const missingFields = [];
    if (!body.title) missingFields.push("title");
    if (!body.projectId) missingFields.push("projectId");
    if (!body.creatorId) missingFields.push("creatorId");

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      console.log("📊 Field values:", {
        title: body.title,
        projectId: body.projectId,
        creatorId: body.creatorId,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Champs requis manquants: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log("✅ All required fields present");

    // Vérifie que le projet existe
    console.log("🔍 Checking if project exists:", body.projectId);
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { id: true, name: true },
    });
    console.log("📋 Project found:", project);

    if (!project) {
      console.log("❌ Project not found");
      return NextResponse.json(
        { success: false, error: "projectId inexistant" },
        { status: 400 }
      );
    }

    // Vérifie que le créateur existe
    console.log("🔍 Checking if user exists:", body.creatorId);
    const user = await prisma.user.findUnique({
      where: { id: body.creatorId },
      select: { id: true, name: true },
    });
    console.log("👤 User found:", user);

    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json(
        { success: false, error: "creatorId inexistant" },
        { status: 400 }
      );
    }

    // Order à la fin du backlog du projet
    const order = await prisma.task.count({ where: { projectId: body.projectId } });
    console.log("📍 New task order:", order);

    console.log("🔨 Creating task with data:", {
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      creatorId: body.creatorId,
      order,
      status: body.status ?? "TODO",
      priority: body.priority ?? "MEDIUM",
    });

    const created = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        projectId: body.projectId,
        creatorId: body.creatorId,
        order, // <-- Enregistre la tâche à la fin
        status: body.status ?? "TODO",
        priority: body.priority ?? "MEDIUM",
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        status: true,
        priority: true,
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    console.log("✅ Task created successfully:", created);
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("❌ Error in POST /api/tasks:", error);
    console.error("Stack trace:", (error as Error).stack);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
