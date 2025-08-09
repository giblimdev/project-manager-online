// app/api/files/route.ts

/**
 * RÔLE : Route API pour la gestion des métadonnées de fichiers avec projectId en paramètre
 * RESPONSABILITÉS :
 * - GET /api/files?projectId=xxx : Récupération des métadonnées de fichiers d'un projet
 * - POST /api/files : Création d'une nouvelle entrée de métadonnées de fichier
 * - Support des paramètres de requête pour filtrage (parentId, type, isFolder)
 * - Validation des paramètres avec Zod selon schéma Prisma FileType enum
 * - Retour des fichiers avec relations essentielles selon schéma Prisma
 * - Gestion des erreurs avec messages appropriés et logging
 * - Types simplifiés pour performance optimale
 *
 * COMPOSANTS UTILISÉS :
 * - Aucun (route API pure Next.js 15)
 *
 * LIBS UTILISÉS :
 * - Next.js 15 API routes avec TypeScript strict mode et nouvelles conventions
 * - Prisma client depuis lib/generated/prisma pour accès base de données
 * - Zod pour validation des paramètres de requête et body POST stricte
 * - Types centralisés depuis @/types/files pour cohérence
 *
 * PARAMÈTRES GET :
 * - projectId : ID du projet (requis) selon relation File.projectId
 * - parentId? : ID du dossier parent pour navigation hiérarchique (optionnel)
 * - type? : Type de fichier selon enum FileType (optionnel)
 * - isFolder? : true/false pour filtrer dossiers ou fichiers (optionnel)
 *
 * BODY POST :
 * - Propriétés essentielles du modèle File selon schéma Prisma
 * - Relations requises : uploaderId, projectId
 * - Relations optionnelles : parentId, featureId, userStoryId, taskId, sprintId
 *
 * RÉPONSES :
 * - 200 : Succès avec données
 * - 201 : Fichier créé avec succès
 * - 400 : Paramètres invalides
 * - 409 : Conflit (nom de fichier existant)
 * - 500 : Erreur serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "../../../lib/generated/prisma";
import { z } from "zod";
import type { ApiResponse, FileMetadata } from "@/types/files";

const prisma = new PrismaClient();

// ✅ Schema de validation GET simplifié
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
});

// ✅ Schema de validation POST simplifié
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
  mimeType: z.string().max(100).optional().nullable(),
  size: z.number().min(0).optional().nullable(),
  url: z.string().url("L'URL doit être valide"),
  path: z.string().max(1000).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  script: z.string().max(10000).optional().nullable(),
  isPublic: z.boolean().default(false),
  isFolder: z.boolean().default(false),
  tags: z.array(z.string()).max(10).default([]),
  // Relations requises
  uploaderId: z.string().min(1, "ID de l'utilisateur requis"),
  projectId: z.string().min(1, "ID du projet requis"),
  // Relations optionnelles
  parentId: z.string().optional().nullable(),
  featureId: z.string().optional().nullable(),
  userStoryId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
});

/**
 * GET /api/files
 * Récupère les métadonnées de fichiers avec filtres optionnels
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📡 GET /api/files - Début");

    const { searchParams } = new URL(request.url);
    const validationResult = getParamsSchema.safeParse({
      projectId: searchParams.get("projectId"),
      parentId: searchParams.get("parentId"),
      type: searchParams.get("type"),
      isFolder: searchParams.get("isFolder"),
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

    const { projectId, parentId, type, isFolder } = validationResult.data;

    // ✅ Construction des conditions de filtrage
    const whereConditions: any = { projectId };
    if (parentId) whereConditions.parentId = parentId;
    if (type) whereConditions.type = type;
    if (isFolder !== undefined) whereConditions.isFolder = isFolder;

    // ✅ Requête avec relations essentielles
    const files = await prisma.file.findMany({
      where: whereConditions,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
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
          take: 50,
        },
      },
      orderBy: [{ isFolder: "desc" }, { name: "asc" }],
      take: 1000,
    });

    console.log(`✅ GET /api/files - ${files.length} fichiers trouvés`);

    return NextResponse.json(
      {
        success: true,
        data: files,
        message: `${files.length} fichier(s) récupéré(s) avec succès`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<FileMetadata[]>,
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
 * Crée une nouvelle entrée de métadonnées de fichier
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📡 POST /api/files - Début");

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

    // ✅ Vérification de l'unicité du nom
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

    // ✅ Création du fichier
    const createdFile = await prisma.file.create({
      data: {
        name: fileData.name,
        originalName: fileData.originalName || fileData.name,
        type: fileData.type,
        mimeType: fileData.mimeType,
        size: fileData.size,
        url: fileData.url,
        path: fileData.path,
        description: fileData.description,
        script: fileData.script,
        isPublic: fileData.isPublic,
        isFolder: fileData.isFolder,
        tags: fileData.tags,
        metadata: {},
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
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
      },
    });

    console.log(
      `✅ POST /api/files - Fichier "${createdFile.name}" créé avec succès`
    );

    return NextResponse.json(
      {
        success: true,
        data: createdFile,
        message: `Fichier "${createdFile.name}" créé avec succès`,
        timestamp: new Date().toISOString(),
      } as ApiResponse<FileMetadata>,
      { status: 201 }
    );
  } catch (error) {
    console.error("💥 Erreur POST /api/files:", error);
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
