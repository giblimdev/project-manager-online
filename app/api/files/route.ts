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

  // Gestion robuste des types/JSON pour metadata
  let metadata = {};
  if (data.metadata) {
    if (typeof data.metadata === "object") {
      metadata = data.metadata;
    } else {
      try {
        metadata = JSON.parse(data.metadata);
      } catch {
        metadata = {};
      }
    }
  }

  // Gestion de tags
  let tags: string[] = [];
  if (Array.isArray(data.tags)) {
    tags = data.tags;
  } else if (typeof data.tags === "string" && data.tags.length > 0) {
    tags = data.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
  }

  try {
    const newFile = await prisma.file.create({
      data: {
        name: data.name,
        type: data.type as FileType,
        mimeType: data.mimeType ?? null,
        path: data.path ?? null,
        description: data.description ?? null,
        import: data.import ?? null,
        use: data.use ?? null,
        export: data.export ?? null,
        script: data.script ?? null,
        version: data.version ?? 1,
        isFolder: !!data.isFolder,                // booléen obligatoire dans ton schéma
        metadata,
        tags,
        parentId: data.parentId || null,
        projectId: data.projectId,
        featureId: data.featureId || undefined,       // optionnel
        userStoryId: data.userStoryId || undefined,   // optionnel
        sprintId: data.sprintId || undefined,         // optionnel
        author: { connect: { id: data.userId } }
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
