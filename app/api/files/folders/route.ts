// @/app/api/files/folders/route.ts

/**
 * RÔLE : Route API Next.js 15 pour récupération des dossiers hiérarchiques
 * RESPONSABILITÉS :
 * - GET : Récupération des dossiers disponibles pour sélecteur parent
 * - Construction de l'arbre hiérarchique avec chemins complets
 * - Filtrage par projet et exclusion circulaire pour édition
 * - Support de la hiérarchie parent/enfant selon schéma Prisma
 * - Optimisation des performances avec select minimal
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: API Next.js 15 pour requêtes/réponses
 * - PrismaClient: ORM pour interactions base de données
 *
 * LIBS UTILISÉS :
 * - Next.js 15 App Router avec TypeScript strict mode
 * - Prisma ORM avec PostgreSQL selon schéma fourni
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Interface pour les dossiers hiérarchiques
interface FolderHierarchy {
  id: string;
  name: string;
  parentId: string | null;
  path: string[];
  level: number;
  hasChildren: boolean;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
}

// ✅ Interface pour la réponse API
interface FoldersResponse {
  success: boolean;
  data: FolderHierarchy[];
  meta: {
    totalFolders: number;
    projectId: string;
    excludeId?: string;
  };
  timestamp: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const excludeId = searchParams.get("excludeId");

    console.log("📁 GET /api/files/folders - Paramètres:", {
      projectId,
      excludeId,
    });

    // ✅ Validation du projectId obligatoire
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Le paramètre projectId est obligatoire",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ✅ Validation du format CUID
    const cuidRegex = /^[cC][a-zA-Z0-9]{24,}$/;
    if (!cuidRegex.test(projectId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Le projectId doit être un CUID valide",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ✅ Construction des conditions WHERE
    const whereClause: any = {
      projectId,
      isFolder: true,
    };

    // Exclusion pour éviter les références circulaires
    if (excludeId) {
      if (!cuidRegex.test(excludeId)) {
        return NextResponse.json(
          {
            success: false,
            error: "Le excludeId doit être un CUID valide",
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
      whereClause.id = { not: excludeId };
    }

    // ✅ Requête optimisée avec comptage des enfants
    const folders = await prisma.file.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    });

    console.log(
      `📂 ${folders.length} dossiers trouvés pour le projet ${projectId}`
    );

    // ✅ Construction de l'arbre hiérarchique
    const folderMap = new Map();
    folders.forEach((folder) => {
      folderMap.set(folder.id, folder);
    });

    // ✅ Fonction récursive pour construire les chemins
    const buildFolderPath = (
      folderId: string,
      visited: Set<string> = new Set()
    ): string[] => {
      if (visited.has(folderId)) {
        console.warn(
          `⚠️ Référence circulaire détectée pour le dossier ${folderId}`
        );
        return [];
      }

      visited.add(folderId);
      const folder = folderMap.get(folderId);

      if (!folder || !folder.parentId) {
        return [folder?.name || ""];
      }

      const parentPath = buildFolderPath(folder.parentId, visited);
      return [...parentPath, folder.name];
    };

    // ✅ Construction des données hiérarchiques
    const hierarchicalFolders: FolderHierarchy[] = folders.map((folder) => {
      const path = buildFolderPath(folder.id);
      const level = Math.max(0, path.length - 1);

      return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        path,
        level,
        hasChildren: folder._count.children > 0,
        childrenCount: folder._count.children,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
      };
    });

    // ✅ Tri par niveau puis par nom
    hierarchicalFolders.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name, "fr", { numeric: true });
    });

    // ✅ Réponse structurée
    const response: FoldersResponse = {
      success: true,
      data: hierarchicalFolders,
      meta: {
        totalFolders: folders.length,
        projectId,
        ...(excludeId && { excludeId }),
      },
      timestamp: new Date().toISOString(),
    };

    console.log(
      `✅ ${hierarchicalFolders.length} dossiers hiérarchiques retournés`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Erreur GET /api/files/folders:", error);

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

// ✅ OPTIONS pour CORS et documentation
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      methods: ["GET"],
      description: "API pour récupération des dossiers hiérarchiques",
      parameters: {
        projectId: "ID du projet (CUID, obligatoire)",
        excludeId: "ID du dossier à exclure (CUID, optionnel)",
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        Allow: "GET, OPTIONS",
        "Cache-Control": "no-cache",
      },
    }
  );
}
