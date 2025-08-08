// app/api/files/folders/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// IMPORTANT: Exportez directement la fonction GET (pas de default export)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const excludeId = searchParams.get("excludeId");

    const whereClause: any = {
      isFolder: true,
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const folders = await prisma.file.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        parentId: true,
        path: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Erreur lors de la récupération des dossiers:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
