// app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Schéma de validation pour la mise à jour
const updateFileSchema = z.object({
  name: z.string().min(1).optional(),
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
    .optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  parentId: z.string().cuid().optional(),
});

/**
 * GET /api/files/[id]
 * Récupère un fichier spécifique
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ✅ Await params pour Next.js 15

    if (!id) {
      return NextResponse.json(
        { error: "ID du fichier requis" },
        { status: 400 }
      );
    }

    const file = await prisma.file.findUnique({
      where: { id },
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
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                children: true,
              },
            },
          },
          orderBy: [{ isFolder: "desc" }, { name: "asc" }],
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
        },
        comments: {
          include: {
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
          },
        },
        userStory: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
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

    if (!file) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files/[id]
 * Met à jour un fichier
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ✅ Await params pour Next.js 15

    if (!id) {
      return NextResponse.json(
        { error: "ID du fichier requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateFileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Vérifier que le fichier existe
    const existingFile = await prisma.file.findUnique({
      where: { id },
      select: { id: true, uploaderId: true },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Mise à jour du fichier
    const updatedFile = await prisma.file.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type as any,
        isPublic: data.isPublic,
        tags: data.tags,
        parentId: data.parentId,
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

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du fichier:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Supprime un fichier (métadonnées uniquement)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ✅ Await params pour Next.js 15

    if (!id) {
      return NextResponse.json(
        { error: "ID du fichier requis" },
        { status: 400 }
      );
    }

    // Récupérer le fichier avec ses enfants pour vérification
    const existingFile = await prisma.file.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des fichiers enfants (pour les dossiers)
    if (existingFile.isFolder && existingFile._count.children > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer un dossier non vide",
          childrenCount: existingFile._count.children,
        },
        { status: 409 }
      );
    }

    // Suppression en base avec cascade (pas de suppression physique)
    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Fichier supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
