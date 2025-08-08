import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Task, TaskStatus } from "@/lib/generated/prisma/client";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignees: true,
        userStory: true,
      },
      orderBy: { position: "asc" },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newTask = await prisma.task.create({
      data: {
        ...data,
        status: data.status || TaskStatus.TODO,
        priority: data.priority || "MEDIUM",
      },
      include: { assignees: true },
    });
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
