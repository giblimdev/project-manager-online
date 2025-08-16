// app/api/files/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FileType } from "@/lib/generated/prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const files = await prisma.file.findMany({
      where: { projectId },
      include: { author: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(files);
  } catch (error) {
    console.error("Files fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  try {
    const newFile = await prisma.file.create({
      data: {
        name: data.name,
        type: data.type as FileType,
        description: data.description,
        import: data.import,
        use: data.use,
        export: data.export,
        script: data.script,
        project: { connect: { id: data.projectId } },
        author: { connect: { id: data.userId } },
      },
      include: { author: true }
    });

    return NextResponse.json(newFile, { status: 201 });
  } catch (error) {
    console.error("File creation error:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}