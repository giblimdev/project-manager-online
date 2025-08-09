// app/api/files/route.ts

/**
 * RÔLE : Route API pour la gestion des fichiers avec projectId en paramètre de requête
 * RESPONSABILITÉS :
 * - GET /api/files?projectId=xxx : Récupération des fichiers d'un projet avec paramètres d'URL
 * - POST /api/files : Création d'un nouveau fichier avec validation complète
 * - Support des paramètres de requête pour filtrage (parentId, type, isFolder)
 * - Validation des paramètres avec Zod selon schéma Prisma FileType enum
 * - Retour des fichiers avec relations complètes selon schéma Prisma
 * - Gestion du mimeType nullable selon nouveau schéma Prisma
 * - Support des nouveaux types FileType selon enum Prisma
 * - Gestion des erreurs avec messages appropriés et logging
 * - Pagination des résultats pour éviter la surcharge
 * - Sans authentification Better Auth (selon votre demande)
 *
 * COMPOSANTS UTILISÉS :
 * - Aucun (route API pure Next.js 15)
 *
 * LIBS UTILISÉS :
 * - Next.js 15 API routes avec TypeScript strict mode et nouvelles conventions
 * - Prisma client pour accès base de données avec relations selon schéma
 * - Zod pour validation des paramètres de requête et body POST
 * - Date-fns pour formatage des dates si nécessaire
 *
 * PARAMÈTRES GET :
 * - projectId : ID du projet (requis)
 * - parentId? : ID du dossier parent pour navigation hiérarchique (optionnel)
 * - type? : Type de fichier selon enum FileType (optionnel)
 * - isFolder? : true/false pour filtrer dossiers ou fichiers (optionnel)
 * - rootOnly? : true pour récupérer seulement les éléments racine (optionnel)
 * - page? : Numéro de page pour pagination (optionnel, défaut: 1)
 * - limit? : Limite d'éléments par page (optionnel, défaut: 50)
 * - sortBy? : Champ de tri (optionnel, défaut: name)
 * - sortOrder? : Ordre de tri asc/desc (optionnel, défaut: asc)
 *
 * BODY POST :
 * - Toutes les propriétés du modèle File selon schéma Prisma
 * - Relations optionnelles : projectId, featureId, userStoryId, taskId, sprintId
 * - uploaderId : ID utilisateur (à récupérer depuis session si disponible)
 *
 * RÉPONSES :
 * - 200 : Succès avec données et pagination
 * - 201 : Fichier créé avec succès
 * - 400 : Paramètres invalides
 * - 404 : Ressource non trouvée
 * - 409 : Conflit (nom de fichier existant)
 * - 500 : Erreur serveur
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// ✅ Schema de validation pour les paramètres GET selon votre schéma Prisma
const getParamsSchema = z.object({
  projectId: z.string().min(1, "ID du projet requis"),
  parentId: z.string().optional(),
  type: z
    .enum([
      "PAGE",
      "COMPONENT",
      "UTILS",
      "LIB",
      "STORE",
      "HOOK",
      "DOCUMENT",
      "IMAGE",
      "VIDEO",
      "ARCHIVE",
      "CODE",
      "SPECIFICATION",
      "DESIGN",
      "TEST",
      "OTHER",
    ])
    .optional(),
  isFolder: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  rootOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
  sortBy: z
    .enum(["name", "type", "createdAt", "updatedAt", "size"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// ✅ Schema de validation pour le body POST selon votre schéma Prisma mis à jour
const fileCreateSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(255),
  originalName: z.string().max(255).optional().nullable(),
  type: z.enum([
    "PAGE",
    "COMPONENT",
    "UTILS",
    "LIB",
    "STORE",
    "HOOK",
    "DOCUMENT",
    "IMAGE",
    "VIDEO",
    "ARCHIVE",
    "CODE",
    "SPECIFICATION",
    "DESIGN",
    "TEST",
    "OTHER",
  ]),
  mimeType: z.string().max(100).optional().nullable(), // ✅ Nullable selon votre schéma
  size: z.number().min(0).max(1073741824).optional().nullable(), // 1GB max, nullable
  url: z.string().url("L'URL doit être valide"),
  path: z.string().max(1000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  import: z.any().optional(),
  export: z.any().optional(),
  script: z.string().max(50000).optional().nullable(),
  isPublic: z.boolean().default(false),
  isFolder: z.boolean().default(false),
  tags: z.array(z.string()).max(20).default([]),
  metadata: z.record(z.string(), z.any()).default({}),
  // Relations selon votre schéma Prisma
  uploaderId: z.string().min(1, "ID de l'utilisateur requis"), // Obligatoire
  projectId: z.string().min(1, "ID du projet requis"),
  parentId: z.string().optional().nullable(),
  featureId: z.string().optional().nullable(),
  userStoryId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
});

// ✅ Interface pour la réponse API standardisée
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  files?: T; // Pour compatibilité avec votre code existant
  error?: string;
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * GET /api/files
 * Récupère les fichiers avec filtres optionnels via paramètres d'URL
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📡 GET /api/files - Début");

    // ✅ CORRECTION: Récupération des paramètres depuis l'URL (pas de body pour GET)
    const { searchParams } = new URL(request.url);
    const validationResult = getParamsSchema.safeParse({
      projectId: searchParams.get("projectId"),
      parentId: searchParams.get("parentId"),
      type: searchParams.get("type"),
      isFolder: searchParams.get("isFolder"),
      rootOnly: searchParams.get("rootOnly"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres invalides",
          message: validationResult.error.issues
            .map((i) => `${i.path}: ${i.message}`)
            .join(", "),
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 400 }
      );
    }

    const {
      projectId,
      parentId,
      type,
      isFolder,
      rootOnly,
      page,
      limit,
      sortBy,
      sortOrder,
    } = validationResult.data;

    console.log("📋 Paramètres validés:", validationResult.data);

    // ✅ Construction des conditions de filtrage
    const whereConditions: any = {
      projectId,
    };

    // Gestion de la hiérarchie des dossiers
    if (rootOnly) {
      whereConditions.parentId = null;
    } else if (parentId) {
      whereConditions.parentId = parentId;
    }

    // Filtres optionnels
    if (type) whereConditions.type = type;
    if (isFolder !== undefined) whereConditions.isFolder = isFolder;

    // Calcul de la pagination
    const offset = (page - 1) * limit;

    // ✅ Requête avec relations complètes selon votre schéma Prisma
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where: whereConditions,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
              username: true,
              firstName: true,
              lastName: true,
              bio: true,
              timezone: true,
              preferences: true,
              isActive: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              isFolder: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              type: true,
              isFolder: true,
              updatedAt: true,
            },
            take: 10, // Limiter pour éviter les requêtes trop lourdes
          },
          project: {
            select: {
              id: true,
              name: true,
              key: true,
              slug: true,
            },
          },
          feature: {
            select: {
              id: true,
              name: true,
              description: true,
              priority: true,
            },
          },
          userStory: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
            },
          },
          sprint: {
            select: {
              id: true,
              name: true,
              goal: true,
              status: true,
            },
          },
          versions: {
            select: {
              id: true,
              version: true,
              url: true,
              size: true,
              checksum: true,
              changelog: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              version: "desc",
            },
            take: 3, // Les 3 dernières versions
          },
          comments: {
            select: {
              id: true,
              content: true,
              mentions: true,
              createdAt: true,
              updatedAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 5, // Les 5 derniers commentaires
          },
          items: {
            select: {
              id: true,
              type: true,
              name: true,
              status: true,
            },
            take: 5,
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
        orderBy: [
          { isFolder: "desc" }, // Dossiers en premier
          { [sortBy]: sortOrder }, // Puis tri selon paramètres
        ],
        skip: offset,
        take: limit,
      }),
      prisma.file.count({
        where: whereConditions,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    console.log(
      `✅ GET /api/files - ${files.length} fichiers trouvés (page ${page}/${totalPages})`
    );

    // ✅ Réponse avec format compatible avec votre code existant
    return NextResponse.json(
      {
        success: true,
        data: files, // Au lieu de { files, pagination: ... }
        message: `${files.length} fichier(s) récupéré(s) avec succès`,
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      } as ApiResponse<FileWithRelations[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error("💥 Erreur GET /api/files:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la récupération des fichiers",
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
      } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Crée un nouveau fichier ou dossier avec validation complète
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📡 POST /api/files - Début");

    // Validation du body
    const body = await request.json();
    const validationResult = fileCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          message: validationResult.error.issues
            .map((i) => `${i.path}: ${i.message}`)
            .join(", "),
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 400 }
      );
    }

    const fileData = validationResult.data;
    console.log("📋 Données validées:", fileData);

    // ✅ Vérification de l'unicité du nom dans le même dossier/projet
    const existingFile = await prisma.file.findFirst({
      where: {
        name: fileData.name,
        projectId: fileData.projectId,
        parentId: fileData.parentId,
      },
    });

    if (existingFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Un fichier avec ce nom existe déjà dans ce dossier",
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 409 }
      );
    }

    // ✅ Création du fichier avec relations selon votre schéma Prisma
    const createdFile = await prisma.file.create({
      data: {
        name: fileData.name,
        originalName: fileData.originalName || fileData.name,
        type: fileData.type,
        mimeType:
          fileData.mimeType ||
          (fileData.isFolder ? null : "application/octet-stream"), // ✅ Nullable selon schéma
        size: fileData.size,
        url: fileData.url,
        path: fileData.path,
        description: fileData.description,
        import: fileData.import,
        export: fileData.export,
        script: fileData.script,
        isPublic: fileData.isPublic,
        isFolder: fileData.isFolder,
        tags: fileData.tags,
        metadata: fileData.metadata,
        // Relations
        uploaderId: fileData.uploaderId,
        projectId: fileData.projectId,
        parentId: fileData.parentId,
        featureId: fileData.featureId,
        userStoryId: fileData.userStoryId,
        taskId: fileData.taskId,
        sprintId: fileData.sprintId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            username: true,
            firstName: true,
            lastName: true,
            bio: true,
            timezone: true,
            preferences: true,
            isActive: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            isFolder: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            slug: true,
          },
        },
        feature: fileData.featureId
          ? {
              select: {
                id: true,
                name: true,
                description: true,
                priority: true,
              },
            }
          : false,
        userStory: fileData.userStoryId
          ? {
              select: {
                id: true,
                title: true,
                description: true,
                priority: true,
              },
            }
          : false,
        task: fileData.taskId
          ? {
              select: {
                id: true,
                title: true,
                description: true,
                priority: true,
              },
            }
          : false,
        sprint: fileData.sprintId
          ? {
              select: {
                id: true,
                name: true,
                goal: true,
                status: true,
              },
            }
          : false,
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
      `✅ POST /api/files - ${fileData.isFolder ? "Dossier" : "Fichier"} "${
        createdFile.name
      }" créé avec succès`
    );

    return NextResponse.json(
      {
        success: true,
        data: createdFile,
        message: `${fileData.isFolder ? "Dossier" : "Fichier"} "${
          createdFile.name
        }" créé avec succès`,
        timestamp: new Date().toISOString(),
      } as ApiResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("💥 Erreur POST /api/files:", error);

    // Gestion des erreurs Prisma spécifiques
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Relation invalide (projet, feature, userStory, task ou sprint introuvable)",
            message: error.message,
            timestamp: new Date().toISOString(),
          } as ApiResponse,
          { status: 400 }
        );
      }

      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Un fichier avec ce nom existe déjà",
            message: error.message,
            timestamp: new Date().toISOString(),
          } as ApiResponse,
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la création du fichier",
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
      } as ApiResponse,
      { status: 500 }
    );
  }
}
