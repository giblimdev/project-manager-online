// app/api/file/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FileType } from "@/lib/generated/prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Attendre params avant de déstructurer
  const id = (await params).id;

  try {
    const file = await prisma.file.findUnique({
      where: { id },
      include: { author: true }
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error("File fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Attendre params avant de déstructurer
  const id = (await params).id;
  const data = await request.json();

  try {
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type as FileType,
        description: data.description,
        import: data.import,
        use: data.use,
        export: data.export,
        script: data.script,
      },
      include: { author: true }
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("File update error:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Attendre params avant de déstructurer
  const id = (await params).id;

  try {
    await prisma.file.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}