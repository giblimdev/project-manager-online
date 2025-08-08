// app/api/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schéma de validation pour créer/modifier un fichier
const fileSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  type: z
    .enum([
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
    .default("OTHER"),
  isPublic: z.boolean().default(false),
  isFolder: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  parentId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  featureId: z.string().cuid().optional(),
  userStoryId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
  sprintId: z.string().cuid().optional(),
});

/**
 * GET /api/files
 * Récupère les fichiers avec filtres optionnels
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Paramètres de filtrage
    const parentId = searchParams.get("parentId");
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type");
    const isFolder = searchParams.get("isFolder");
    const rootOnly = searchParams.get("rootOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Construction du where
    const where: any = {};

    if (rootOnly) {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    if (projectId) where.projectId = projectId;
    if (type) where.type = type;
    if (isFolder !== null) where.isFolder = isFolder === "true";

    const offset = (page - 1) * limit;

    // Requête avec relations
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              isFolder: true,
            },
          },
          versions: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { version: "desc" },
            take: 1,
          },
          _count: {
            select: {
              children: true,
              versions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: offset,
        take: limit,
      }),
      prisma.file.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Crée un nouveau fichier ou dossier (métadonnées uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des métadonnées
    const validationResult = fileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Métadonnées invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Générer une URL factice ou laisser vide pour les dossiers
    const fileUrl = data.isFolder ? "" : `#file-${Date.now()}`;

    // Créer l'entrée en base de données
    const createdFile = await prisma.file.create({
      data: {
        name: data.name,
        originalName: data.name,
        type: data.type as any,
        mimeType: data.isFolder ? "folder" : "application/octet-stream",
        size: 0,
        url: fileUrl,
        path: "",
        description: data.description,
        isPublic: data.isPublic,
        isFolder: data.isFolder,
        tags: data.tags,
        uploaderId: "current-user-id", // À remplacer par l'ID de l'utilisateur connecté
        parentId: data.parentId,
        projectId: data.projectId,
        featureId: data.featureId,
        userStoryId: data.userStoryId,
        taskId: data.taskId,
        sprintId: data.sprintId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            children: true,
            versions: true,
          },
        },
      },
    });

    return NextResponse.json(createdFile, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du fichier:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
