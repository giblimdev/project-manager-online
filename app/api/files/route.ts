// @/app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@/lib/generated/prisma";
import type { FileWithRelations, ApiResponse, FilterType } from "@/types/files";

const prisma = new PrismaClient();

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
  projectId: z.string().cuid(),
  parentId: z.string().cuid().nullable().optional(),
  featureId: z.string().cuid().nullable().optional(),
  userStoryId: z.string().cuid().nullable().optional(),
  taskId: z.string().cuid().nullable().optional(),
  sprintId: z.string().cuid().nullable().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

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
      parentId: parentId || "TOUS LES FICHIERS DU PROJET",
      search,
      type,
      sortBy,
      sortOrder,
      page,
      limit,
    });

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

    const whereClause: any = {
      projectId,
    };

    if (parentId !== null && parentId !== undefined) {
      if (parentId === "null" || parentId === "") {
        whereClause.parentId = null;
        console.log("🔍 Filtrage par dossier racine");
      } else {
        whereClause.parentId = parentId;
        console.log("🔍 Filtrage par dossier parent:", parentId);
      }
    } else {
      console.log("🌐 Récupération de TOUS les fichiers du projet:", projectId);
    }

    if (featureId) whereClause.featureId = featureId;
    if (userStoryId) whereClause.userStoryId = userStoryId;
    if (taskId) whereClause.taskId = taskId;
    if (sprintId) whereClause.sprintId = sprintId;

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

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

    // ✅ Correction : Ajout de username dans la sélection author
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
              username: true, // AJOUT CRITIQUE
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

    const totalPages = Math.ceil(totalCount / limit);

    console.log(
      `📤 GET /api/files - ${files.length} fichiers trouvés sur ${totalCount} total`
    );

    // ✅ Correction : Utilisation de 'as any' pour contourner temporairement l'erreur de typage
    const response: ApiResponse<FileWithRelations[]> = {
      success: true,
      data: files as any,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    console.log("📥 POST /api/files - Données reçues:", body);

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

    const maxOrder = await prisma.file.findFirst({
      where: {
        projectId: validatedData.projectId,
        parentId: validatedData.parentId || null,
      },
      select: { order: true },
      orderBy: { order: "desc" },
    });

    const newOrder = (maxOrder?.order || 0) + 1000;

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
      project: { connect: { id: validatedData.projectId } },
    };

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

    // ✅ Correction : Ajout de username dans la sélection author
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
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            firstName: true,
            lastName: true,
            username: true, // AJOUT CRITIQUE
          },
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

    // ✅ Correction : Utilisation de 'as any' pour contourner temporairement l'erreur de typage
    const response: ApiResponse<FileWithRelations> = {
      success: true,
      data: newFile as any,
      message: `Référence "${newFile.name}" créée avec succès`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("💥 Erreur POST /api/files:", error);

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

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});