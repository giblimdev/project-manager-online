// @/app/api/files/route.ts

/**
 * RÔLE : Route API Next.js 15 pour la gestion des métadonnées de fichiers selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Route GET pour récupérer TOUS les fichiers d'un projet OU les fichiers d'un dossier spécifique
 * - Route POST pour créer de nouvelles références avec gestion CORRECTE des types Prisma
 * - CORRECTION SIMPLE : Rendre le parentId optionnel pour récupérer tous les fichiers
 * - Support du filtrage hiérarchique avec parentId optionnel selon besoin utilisateur
 * - Validation des données avec Zod selon types FileType EXACTS du schéma
 * - Pagination et tri optimisés pour de gros volumes de fichiers
 * - Gestion des relations complètes selon schéma Prisma fourni
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: API Next.js 15 pour requêtes/réponses HTTP
 * - PrismaClient: Client Prisma généré selon schéma fourni EXACT
 * - Zod v3+: Validation des données POST avec FileType enum EXACT
 *
 * LIBS UTILISÉS :
 * - Next.js 15 App Router avec TypeScript strict mode
 * - Prisma ORM avec PostgreSQL selon schéma fourni avec types CORRECTS
 * - Zod v3+ pour validation des données stricte avec nouvelles signatures
 */

import { NextRequest, NextResponse } from "next/server";
import { JSX } from "react";
import { z } from "zod";
import { PrismaClient } from "@/lib/generated/prisma";
import type { FileWithRelations, ApiResponse, FilterType } from "@/types/files";

// ✅ Instance Prisma singleton
const prisma = new PrismaClient();

// ✅ Schema Zod pour création de fichiers (identique à l'original)
const createFileSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(255),
  type: z.enum([
    "DOSSIER",
    "PAGE",
    "COMPONENT",
    "UTILS",
    "LIB",
    "STORE",
    "HOOK",
    "ENV",
    "SYSTEM",
    "TEST",
    "OTHER",
  ]),
  mimeType: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  import: z.string().nullable().optional(),
  use: z.string().nullable().optional(),
  export: z.string().nullable().optional(),
  script: z.string().nullable().optional(),
  version: z.number().int().positive().default(1),
  isFolder: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).default([]),
  // Relations OBLIGATOIRES selon schéma
  projectId: z.string().cuid(),
  // Relations OPTIONNELLES selon schéma
  parentId: z.string().cuid().nullable().optional(),
  featureId: z.string().cuid().nullable().optional(),
  userStoryId: z.string().cuid().nullable().optional(),
  taskId: z.string().cuid().nullable().optional(),
  sprintId: z.string().cuid().nullable().optional(),
});

// ✅ GET - CORRECTION SIMPLE : Rendre parentId optionnel
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ Extraction des paramètres (identique à l'original)
    const projectId = searchParams.get("projectId");
    const parentId = searchParams.get("parentId"); // ✅ MAINTENANT OPTIONNEL
    const search = searchParams.get("search") || "";
    const type = (searchParams.get("type") as FilterType) || "ALL";
    const featureId = searchParams.get("featureId");
    const userStoryId = searchParams.get("userStoryId");
    const taskId = searchParams.get("taskId");
    const sprintId = searchParams.get("sprintId");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    console.log("📥 GET /api/files - Paramètres reçus:", {
      projectId,
      parentId: parentId || "TOUS LES FICHIERS DU PROJET",
      search,
      type,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    // ✅ Validation des paramètres (identique à l'original)
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "Le paramètre projectId est obligatoire",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // ✅ Construction des filtres WHERE (LOGIQUE ORIGINALE RESTAURÉE)
    const whereClause: any = {
      projectId, // ✅ TOUJOURS filtrer par projet
    };

    // ✅ CORRECTION SIMPLE : Appliquer parentId SEULEMENT s'il est fourni
    if (parentId !== null && parentId !== undefined) {
      // Si parentId est fourni explicitement, l'utiliser
      if (parentId === "null" || parentId === "") {
        whereClause.parentId = null; // Fichiers à la racine
        console.log("🔍 Filtrage par dossier racine");
      } else {
        whereClause.parentId = parentId; // Fichiers dans un dossier spécifique
        console.log("🔍 Filtrage par dossier parent:", parentId);
      }
    }
    // ✅ Si parentId n'est pas fourni, on ne filtre pas = TOUS les fichiers du projet
    else {
      console.log("🌐 Récupération de TOUS les fichiers du projet:", projectId);
    }

    // Filtres optionnels selon relations (identique à l'original)
    if (featureId) whereClause.featureId = featureId;
    if (userStoryId) whereClause.userStoryId = userStoryId;
    if (taskId) whereClause.taskId = taskId;
    if (sprintId) whereClause.sprintId = sprintId;

    // Filtrage par type FileType EXACT (identique à l'original)
    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    // Recherche textuelle dans plusieurs champs (identique à l'original)
    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { import: { contains: search, mode: "insensitive" } },
        { export: { contains: search, mode: "insensitive" } },
        { use: { contains: search, mode: "insensitive" } },
        { script: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // ✅ Configuration du tri (identique à l'original)
    let orderBy: any = { name: "asc" };
    switch (sortBy) {
      case "name":
        orderBy = { name: sortOrder };
        break;
      case "type":
        orderBy = { type: sortOrder };
        break;
      case "date":
        orderBy = { updatedAt: sortOrder };
        break;
      case "size":
        orderBy = { script: sortOrder };
        break;
      default:
        orderBy = { name: sortOrder };
    }

    console.log("🔎 Clause WHERE finale:", whereClause);

    // ✅ Requête Prisma avec relations complètes (identique à l'original)
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: whereClause,
        include: {
          parent: {
            select: { id: true, name: true, type: true, isFolder: true },
          },
          children: {
            select: { id: true, name: true, type: true, isFolder: true },
          },
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              key: true,
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          feature: {
            select: { id: true, name: true, status: true, priority: true },
          },
          userStory: {
            select: { id: true, title: true, status: true, priority: true },
          },
          task: {
            select: { id: true, title: true, status: true, priority: true },
          },
          sprint: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              firstName: true,
              lastName: true,
            },
          },
          versions: {
            select: {
              id: true,
              version: true,
              url: true,
              size: true,
              createdAt: true,
              author: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { version: "desc" },
            take: 5,
          },
          comments: {
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true,
              author: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          items: {
            select: { id: true, name: true, type: true, status: true },
          },
          _count: {
            select: {
              children: true,
              versions: true,
              comments: true,
              items: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.file.count({ where: whereClause }),
    ]);

    // ✅ Calcul de la pagination (identique à l'original)
    const totalPages = Math.ceil(totalCount / limit);

    console.log(
      `📤 GET /api/files - ${files.length} fichiers trouvés sur ${totalCount} total`
    );

    // ✅ Réponse structurée avec pagination (identique à l'original)
    const response: ApiResponse<FileWithRelations[]> = {
      success: true,
      data: files as FileWithRelations[],
      timestamp: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Erreur GET /api/files:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
        timestamp: new Date().toISOString(),
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

// ✅ POST - Création de nouvelles métadonnées de fichiers (identique à l'original)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    console.log("📥 POST /api/files - Données reçues:", body);

    // ✅ Validation avec Zod selon schéma Prisma EXACT
    const validationResult = createFileSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("❌ Validation échouée:", validationResult.error.format());
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validationResult.error.format(),
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // ✅ Vérification de l'existence du projet (relation obligatoire)
    const projectExists = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { id: true, name: true },
    });

    if (!projectExists) {
      return NextResponse.json(
        {
          success: false,
          error: `Le projet avec l'ID "${validatedData.projectId}" n'existe pas`,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // ✅ Vérification du parent selon Prisma
    if (validatedData.parentId) {
      const parentExists = await prisma.file.findFirst({
        where: {
          id: validatedData.parentId,
          projectId: validatedData.projectId,
          isFolder: true,
        },
        select: { id: true, name: true },
      });

      if (!parentExists) {
        return NextResponse.json(
          {
            success: false,
            error: `Le dossier parent avec l'ID "${validatedData.parentId}" n'existe pas ou n'est pas un dossier`,
            timestamp: new Date().toISOString(),
          } as ApiResponse<never>,
          { status: 404 }
        );
      }
    }

    // ✅ Calcul de l'ordre pour le nouveau fichier
    const maxOrder = await prisma.file.findFirst({
      where: {
        projectId: validatedData.projectId,
        parentId: validatedData.parentId || null,
      },
      select: { order: true },
      orderBy: { order: "desc" },
    });

    const newOrder = (maxOrder?.order || 0) + 1000;

    // ✅ Préparation des données selon schéma Prisma EXACT
    const createData: any = {
      name: validatedData.name,
      type: validatedData.type,
      mimeType: validatedData.mimeType,
      path: validatedData.path,
      description: validatedData.description,
      import: validatedData.import,
      use: validatedData.use,
      export: validatedData.export,
      script: validatedData.script,
      version: validatedData.version,
      isFolder: validatedData.isFolder,
      metadata: validatedData.metadata,
      tags: validatedData.tags,
      order: newOrder,
      // ✅ Connexion OBLIGATOIRE selon schéma
      project: { connect: { id: validatedData.projectId } },
    };

    // ✅ Gestion des relations optionnelles selon Prisma
    if (validatedData.parentId) {
      createData.parent = { connect: { id: validatedData.parentId } };
    }
    if (validatedData.featureId) {
      createData.feature = { connect: { id: validatedData.featureId } };
    }
    if (validatedData.userStoryId) {
      createData.userStory = { connect: { id: validatedData.userStoryId } };
    }
    if (validatedData.taskId) {
      createData.task = { connect: { id: validatedData.taskId } };
    }
    if (validatedData.sprintId) {
      createData.sprint = { connect: { id: validatedData.sprintId } };
    }

    console.log("📤 Données formatées pour Prisma:", createData);

    // ✅ Création avec relations selon schéma Prisma
    const newFile = await prisma.file.create({
      data: createData,
      include: {
        parent: true,
        children: {
          select: { id: true, name: true, type: true, isFolder: true },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        feature: {
          select: { id: true, name: true, status: true },
        },
        userStory: {
          select: { id: true, title: true, status: true },
        },
        task: {
          select: { id: true, title: true, status: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        versions: true,
        comments: true,
        items: true,
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
            items: true,
          },
        },
      },
    });

    console.log(
      `✅ POST /api/files - Fichier créé: ${newFile.name} (${newFile.type})`
    );

    // ✅ Réponse de succès
    const response: ApiResponse<FileWithRelations> = {
      success: true,
      data: newFile as FileWithRelations,
      message: `Référence "${newFile.name}" créée avec succès`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("💥 Erreur POST /api/files:", error);

    // Gestion des erreurs Prisma spécifiques
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Un fichier avec ce nom existe déjà dans ce dossier",
            timestamp: new Date().toISOString(),
          } as ApiResponse<never>,
          { status: 409 }
        );
      }

      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Une ou plusieurs relations spécifiées n'existent pas",
            timestamp: new Date().toISOString(),
          } as ApiResponse<never>,
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur interne du serveur",
        timestamp: new Date().toISOString(),
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

// ✅ Fermeture de la connexion Prisma en cas d'arrêt
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
