// @/app/api/files/[id]/move/route.ts

/**
 * RÔLE : API route Next.js 15 pour réorganisation des fichiers avec champ order
 * RESPONSABILITÉS :
 * - PATCH : Déplacement up/down des fichiers selon votre schéma Prisma EXACT
 * - Échange des valeurs du champ order entre fichiers adjacents
 * - Validation des limites (premier/dernier élément)
 * - Transactions Prisma pour cohérence des données
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: API Next.js 15 avec paramètres Promise-based
 * - PrismaClient: ORM selon votre schéma avec champ order Int @default(1000)
 *
 * LIBS UTILISÉS :
 * - Next.js 15 API routes avec TypeScript strict mode
 * - Prisma ORM avec transactions PostgreSQL selon schema-projec-manager.txt
 */

import { NextRequest, NextResponse } from "next/server";
import { JSX } from "react";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface MoveFileData {
  direction: "up" | "down";
  currentFolder?: string | null;
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Validation CUID selon votre schéma
    if (!id || !/^[cC][a-zA-Z0-9]{24,}$/.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de fichier invalide - doit être un CUID",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body: MoveFileData = await request.json();
    const { direction, currentFolder } = body;

    if (!direction || !["up", "down"].includes(direction)) {
      return NextResponse.json(
        {
          success: false,
          error: "Direction invalide. Utilisez 'up' ou 'down'",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Récupération du fichier selon votre schéma EXACT
    const currentFile = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        order: true, // ✅ Champ order selon votre schéma
        parentId: true,
        projectId: true,
        isFolder: true,
      },
    });

    if (!currentFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Fichier non trouvé",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Récupération des fichiers du même niveau selon votre hiérarchie
    const siblings = await prisma.file.findMany({
      where: {
        projectId: currentFile.projectId,
        parentId: currentFile.parentId,
        NOT: { id },
      },
      select: {
        id: true,
        name: true,
        order: true,
        isFolder: true,
      },
      orderBy: { order: "asc" },
    });

    if (siblings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun élément à réorganiser dans ce contexte",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Construction de la liste complète triée par ordre
    const allFiles = [...siblings, currentFile].sort(
      (a, b) => a.order - b.order
    );
    const currentIndex = allFiles.findIndex((f) => f.id === id);

    // Validation des limites
    if (direction === "up" && currentIndex === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de déplacer vers le haut : déjà en première position",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (direction === "down" && currentIndex === allFiles.length - 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de déplacer vers le bas : déjà en dernière position",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Transaction Prisma pour échanger les positions
    const result = await prisma.$transaction(async (tx) => {
      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const targetFile = allFiles[targetIndex];

      // Échanger les valeurs du champ order
      await tx.file.update({
        where: { id },
        data: { order: targetFile.order },
      });

      await tx.file.update({
        where: { id: targetFile.id },
        data: { order: currentFile.order },
      });

      return {
        moved: currentFile,
        swappedWith: targetFile,
        direction,
      };
    });

    console.log(
      `✅ Fichier "${currentFile.name}" déplacé ${direction} avec "${result.swappedWith.name}"`
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `"${currentFile.name}" déplacé vers le ${
        direction === "up" ? "haut" : "bas"
      }`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("💥 Erreur lors du déplacement:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
