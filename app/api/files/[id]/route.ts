// app/api/file/[id]/route.ts
/**
 * Rôle : Gestionnaire de route API pour les opérations CRUD sur l'entité File
 * Responsabilités :
 * - Utilise Prisma client pour l'interaction avec la base de données
 * - Utilise NextResponse pour les réponses HTTP
 * - Gère les paramètres dynamiques comme Promise selon Next.js 15
 * - Inclut la gestion d'erreurs complète
 * - Supporte les opérations GET, PUT, DELETE avec typage strict
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { FileType } from "@/lib/generated/prisma/client";

// GET handler - Récupérer un fichier par son ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await des paramètres requis par Next.js 15
    const { id } = await params;
    
    const file = await prisma.file.findUnique({
      where: { id },
      include: { author: true },
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

// PUT handler - Mettre à jour un fichier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await des paramètres requis par Next.js 15
    const { id } = await params;
    const data = await request.json();

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
      include: { author: true },
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

// DELETE handler - Supprimer un fichier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await des paramètres requis par Next.js 15
    const { id } = await params;
    
    await prisma.file.delete({
      where: { id },
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
