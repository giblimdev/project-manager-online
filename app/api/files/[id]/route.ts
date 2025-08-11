// app/api/files/[id]/route.ts

/**
 * RÔLE : API route pour gestion CRUD individuelle des métadonnées de fichiers selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - GET /api/files/[id] : Récupération d'un fichier spécifique avec relations complètes
 * - PUT /api/files/[id] : Mise à jour des métadonnées d'un fichier avec validation
 * - DELETE /api/files/[id] : Suppression d'une référence de fichier avec cascade
 * - Validation des IDs avec format CUID selon Prisma
 * - Gestion des relations author[] multiples et cascade selon schéma
 * - Support des types FileType EXACTS selon schéma Prisma (DOSSIER, PAGE, COMPONENT, etc.)
 * - Support spécifique à l'aide au développement : import, export, use, script
 * - CORRECTION FINALE : Types Prisma JSON corrects et Next.js 15 params compatible
 *
 * COMPOSANTS UTILISÉS :
 * - PrismaClient: ORM pour base de données PostgreSQL avec relations
 * - NextRequest, NextResponse: APIs Next.js 15 pour gestion HTTP
 * - zod: Validation des données entrantes avec schémas stricts
 * - Prisma.InputJsonValue: Types JSON corrects pour metadata
 *
 * LIBS UTILISÉS :
 * - Next.js 15 API routes avec TypeScript strict mode et paramètres Promise-based
 * - Prisma ORM depuis @/lib/generated/prisma avec types générés
 * - zod: Validation et sérialisation des données avec types stricts
 * - TypeScript: Types stricts pour sécurité et performance optimale
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// ✅ Types corrigés pour les métadonnées JSON selon Prisma
type MetadataValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: MetadataValue }
  | MetadataValue[];

// ✅ Interface pour les paramètres de route Next.js 15 (Promise-based)
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Schema de validation pour l'ID de fichier avec CUID
const fileIdSchema = z.string().cuid("ID fichier doit être un CUID valide");

// ✅ Schema de validation pour mise à jour selon votre schéma Prisma EXACT
const updateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z
    .enum([
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
    ])
    .optional(),
  path: z.string().optional(),
  description: z.string().optional(),
  import: z.string().optional(),
  use: z.string().optional(),
  export: z.string().optional(),
  script: z.string().optional(),
  isFolder: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  mimeType: z.string().optional(),
  // ✅ CORRECTION : Schéma Zod pour metadata compatible avec Prisma
  metadata: z.record(z.string(), z.any()).optional(),
  parentId: z.string().cuid().optional(),
});

// ✅ Fonction utilitaire pour gérer les erreurs
function handleError(error: unknown, context: string) {
  console.error(`💥 Erreur ${context}:`, error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Données invalides",
        details: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Erreur interne du serveur",
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * GET /api/files/[id]
 * Récupère un fichier spécifique avec toutes ses relations selon schéma Prisma
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📡 GET /api/files/[id] - Début");

    // ✅ Résolution des paramètres Promise-based Next.js 15
    const { id } = await context.params;
    const fileId = fileIdSchema.parse(id);

    console.log("🔍 Recherche fichier ID:", fileId);

    // ✅ Récupération avec relations complètes selon votre schéma Prisma EXACT
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        // Relations selon votre schéma Prisma[1] EXACT
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            slug: true,
            description: true,
            status: true,
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
            storyPoints: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            estimatedHours: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            goal: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        // Relation author[] multiple selon schéma[1]
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        // Hiérarchie des fichiers selon schéma[1]
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
            isFolder: true,
            path: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            isFolder: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ isFolder: "desc" }, { name: "asc" }],
        },
        // Versions et commentaires selon schéma[1]
        versions: {
          select: {
            id: true,
            version: true,
            url: true,
            size: true,
            changelog: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { version: "desc" },
        },
        comments: {
          select: {
            id: true,
            content: true,
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
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Fichier non trouvé",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    console.log("✅ Fichier trouvé:", file.name);

    // ✅ Transformation des dates pour JSON avec protection contre undefined
    const serializedFile = {
      ...file,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      versions:
        file.versions?.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })) || [],
      comments:
        file.comments?.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })) || [],
      children:
        file.children?.map((child) => ({
          ...child,
          createdAt: child.createdAt.toISOString(),
          updatedAt: child.updatedAt.toISOString(),
        })) || [],
      sprint: file.sprint
        ? {
            ...file.sprint,
            startDate: file.sprint.startDate.toISOString(),
            endDate: file.sprint.endDate.toISOString(),
          }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: serializedFile,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "GET /api/files/[id]");
  }
}

/**
 * PUT /api/files/[id]
 * Met à jour un fichier avec validation selon schéma Prisma
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📡 PUT /api/files/[id] - Début");

    // ✅ Résolution des paramètres Next.js 15
    const { id } = await context.params;
    const fileId = fileIdSchema.parse(id);

    // ✅ Lecture et validation du body
    const body = await request.json();
    const validatedData = updateFileSchema.parse(body);

    console.log("🔄 Mise à jour fichier ID:", fileId);
    console.log("📥 Données à mettre à jour:", validatedData);

    // ✅ Vérification de l'existence du fichier
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        projectId: true,
        parentId: true,
        version: true,
        type: true,
        isFolder: true,
      },
    });

    if (!existingFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Fichier non trouvé",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // ✅ Vérification de l'unicité du nom si modifié
    if (validatedData.name && validatedData.name !== existingFile.name) {
      const nameExists = await prisma.file.findFirst({
        where: {
          name: validatedData.name,
          projectId: existingFile.projectId,
          parentId: existingFile.parentId,
          NOT: { id: fileId },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Un fichier avec ce nom existe déjà dans ce dossier",
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // ✅ Vérification du parent si modifié
    if (
      validatedData.parentId !== undefined &&
      validatedData.parentId !== existingFile.parentId
    ) {
      if (validatedData.parentId) {
        const parent = await prisma.file.findUnique({
          where: { id: validatedData.parentId },
          select: { id: true, isFolder: true, projectId: true },
        });

        if (!parent) {
          return NextResponse.json(
            {
              success: false,
              error: "Dossier parent non trouvé",
              timestamp: new Date().toISOString(),
            },
            { status: 404 }
          );
        }

        if (!parent.isFolder) {
          return NextResponse.json(
            {
              success: false,
              error: "Le parent doit être un dossier",
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }

        if (parent.projectId !== existingFile.projectId) {
          return NextResponse.json(
            {
              success: false,
              error: "Le parent doit être dans le même projet",
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
      }
    }

    // ✅ CORRECTION FINALE : Construction des données de mise à jour avec types compatibles
    const updateData: Record<string, any> = {};

    // Ajout conditionnel des champs avec types corrects
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.path !== undefined) updateData.path = validatedData.path;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.import !== undefined)
      updateData.import = validatedData.import;
    if (validatedData.use !== undefined) updateData.use = validatedData.use;
    if (validatedData.export !== undefined)
      updateData.export = validatedData.export;
    if (validatedData.script !== undefined)
      updateData.script = validatedData.script;
    if (validatedData.isFolder !== undefined)
      updateData.isFolder = validatedData.isFolder;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.mimeType !== undefined)
      updateData.mimeType = validatedData.mimeType;
    if (validatedData.parentId !== undefined)
      updateData.parentId = validatedData.parentId;

    // ✅ CORRECTION : Gestion correcte des métadonnées JSON avec type compatible
    if (validatedData.metadata !== undefined) {
      // Conversion explicite en type compatible avec Prisma
      updateData.metadata =
        validatedData.metadata === null ? null : validatedData.metadata;
    }

    // Incrémentation de version
    updateData.version = existingFile.version + 1;

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
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
            isFolder: true,
          },
        },
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
          },
        },
      },
    });

    console.log("✅ Fichier mis à jour:", updatedFile.name);

    // ✅ Transformation des dates pour JSON
    const serializedFile = {
      ...updatedFile,
      createdAt: updatedFile.createdAt.toISOString(),
      updatedAt: updatedFile.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: serializedFile,
        message: `Référence "${updatedFile.name}" mise à jour avec succès (v${updatedFile.version})`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "PUT /api/files/[id]");
  }
}

/**
 * DELETE /api/files/[id]
 * Supprime un fichier avec vérification des dépendances
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("📡 DELETE /api/files/[id] - Début");

    // ✅ Résolution des paramètres Next.js 15
    const { id } = await context.params;
    const fileId = fileIdSchema.parse(id);

    console.log("🗑️ Suppression fichier ID:", fileId);

    // ✅ Vérification de l'existence du fichier avec comptages
    const existingFile = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        type: true,
        isFolder: true,
        projectId: true,
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
          },
        },
      },
    });

    if (!existingFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Fichier non trouvé",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // ✅ Vérification que le dossier est vide si c'est un dossier
    if (existingFile.isFolder && existingFile._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer un dossier non vide",
          details: `Le dossier contient ${existingFile._count.children} élément(s)`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // ✅ Suppression avec cascade automatique selon schéma Prisma
    await prisma.file.delete({
      where: { id: fileId },
    });

    console.log("✅ Fichier supprimé:", existingFile.name);

    return NextResponse.json(
      {
        success: true,
        message: `Référence "${existingFile.name}" supprimée avec succès`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error, "DELETE /api/files/[id]");
  }
}

// ✅ OPTIONS pour CORS et documentation des méthodes
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {
      success: true,
      methods: ["GET", "PUT", "DELETE"],
      description: "API pour gestion individuelle des métadonnées de fichiers",
      endpoints: {
        GET: "Récupération d'un fichier avec toutes ses relations",
        PUT: "Mise à jour des métadonnées d'un fichier",
        DELETE: "Suppression d'une référence de fichier",
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        Allow: "GET, PUT, DELETE, OPTIONS",
        "Cache-Control": "no-cache",
      },
    }
  );
}
