// app/api/files/route.ts

/**
 * FICHIER : app/api/files/route.ts
 * RÔLE : Route API Next.js 15 pour la gestion des métadonnées de fichiers selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Route GET pour récupérer les métadonnées de fichiers avec filtrage et relations complètes
 * - Route POST pour créer de nouvelles références avec gestion CORRECTE des types Prisma
 * - CORRECTION : Gestion des relations optionnelles avec syntaxe Prisma stricte
 * - CORRECTION MAJEURE : Schémas Zod avec z.record() correct pour Next.js 15 et Zod v3+
 * - Support des connectOrCreate et disconnect selon schéma Prisma
 * - Validation des données avec Zod selon types FileType EXACTS du schéma
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: API Next.js 15 pour requêtes/réponses HTTP
 * - PrismaClient: Client Prisma généré selon schéma fourni EXACT
 * - Zod v3+: Validation des données POST avec FileType enum EXACT et record() corrigé
 *
 * LIBS UTILISÉS :
 * - Next.js 15 App Router avec TypeScript strict mode
 * - Prisma ORM avec PostgreSQL selon schéma fourni avec types CORRECTS
 * - Zod v3+ pour validation des données stricte avec nouvelles signatures
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@/lib/generated/prisma";
import type { FileWithRelations, ApiResponse, FilterType } from "@/types/files";

// ✅ Instance Prisma singleton
const prisma = new PrismaClient();

// ✅ CORRECTION MAJEURE : Schema Zod avec z.record() correct pour Zod v3+
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
  // ✅ CORRECTION : z.record() avec keyType et valueType explicites pour Zod v3+
  metadata: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).default([]),
  // Relations OBLIGATOIRES selon schéma
  projectId: z.string().cuid(),
  // Relations OPTIONNELLES selon schéma - CORRIGÉES pour Prisma
  parentId: z.string().cuid().nullable().optional(),
  featureId: z.string().cuid().nullable().optional(),
  userStoryId: z.string().cuid().nullable().optional(),
  taskId: z.string().cuid().nullable().optional(),
  sprintId: z.string().cuid().nullable().optional(),
});

// ✅ GET - Récupération des métadonnées de fichiers avec filtres (reste identique)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ Extraction des paramètres avec Next.js 15
    const projectId = searchParams.get("projectId");
    const parentId = searchParams.get("parentId");
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
      parentId,
      search,
      type,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    // ✅ Validation des paramètres
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

    // ✅ Construction des filtres WHERE selon schéma Prisma
    const whereClause: any = {
      projectId,
    };

    // ✅ Gestion correcte du parentId nullable
    if (parentId === "null" || parentId === null) {
      whereClause.parentId = null;
    } else if (parentId) {
      whereClause.parentId = parentId;
    } else {
      whereClause.parentId = null; // Par défaut, racine
    }

    // Filtres optionnels selon relations
    if (featureId) whereClause.featureId = featureId;
    if (userStoryId) whereClause.userStoryId = userStoryId;
    if (taskId) whereClause.taskId = taskId;
    if (sprintId) whereClause.sprintId = sprintId;

    // Filtrage par type FileType EXACT
    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    // Recherche textuelle dans plusieurs champs
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

    // ✅ Configuration du tri
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

    // ✅ Requête Prisma avec relations complètes selon schéma
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

    // ✅ Calcul de la pagination
    const totalPages = Math.ceil(totalCount / limit);

    console.log(
      `📤 GET /api/files - ${files.length} fichiers trouvés sur ${totalCount} total`
    );

    // ✅ Réponse structurée avec pagination
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

// ✅ POST - Création de nouvelles métadonnées de fichiers - CORRIGÉ
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    console.log("📥 POST /api/files - Données reçues:", body);

    // ✅ Validation avec Zod CORRIGÉ selon schéma Prisma EXACT
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
