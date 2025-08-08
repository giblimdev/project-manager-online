// app/api/blog/tags/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  validateUUID,
  type UpdateBlogTagInput,
  type ValidationResult,
  VALIDATION_MESSAGES,
} from "@/lib/blog/validations/blog";

// ✅ Interface pour les paramètres de route Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Interface pour les réponses de tags
interface BlogTagResponse {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoriesId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    color: string | null;
    isActive: boolean;
  } | null;
  comments?: {
    id: string;
    title: string | null;
    content: string;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  _count?: {
    comments: number;
  };
}

/**
 * GET /api/blog/tags/[id]
 * Récupère un tag spécifique par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<BlogTagResponse | { error: string; details?: string }>
> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          details: VALIDATION_MESSAGES.INVALID_UUID,
        },
        { status: 400 }
      );
    }

    // ✅ Requête Prisma conforme à votre schéma
    const tag = await prisma.blog_tags.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            isActive: true,
          },
        },
        comments: {
          where: { isActive: true },
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
          take: 10, // Limiter pour les performances
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    // ✅ Formatage de la réponse
    const response: BlogTagResponse = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      categoriesId: tag.categoriesId,
      category: tag.categories || null,
      comments: tag.comments?.map((comment) => ({
        id: comment.id,
        title: comment.title,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
      })),
      _count: tag._count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération du tag:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du tag",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blog/tags/[id]
 * Met à jour un tag existant
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<BlogTagResponse | { error: string; details?: any }>> {
  try {
    const { id } = await params;
    const body = await request.json();

    // ✅ Validation de l'UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          details: VALIDATION_MESSAGES.INVALID_UUID,
        },
        { status: 400 }
      );
    }

    // ✅ Validation avec votre système Zod
    const validationResult = validate.blogTagUpdate(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details:
            validationResult.errors?.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })) || [],
        },
        { status: 400 }
      );
    }

    const data = validationResult.data as UpdateBlogTagInput;

    // ✅ Vérifier que le tag existe
    const existingTag = await prisma.blog_tags.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    if (!existingTag.isActive) {
      return NextResponse.json(
        { error: "Tag désactivé, modification impossible" },
        { status: 410 }
      );
    }

    // ✅ Vérification de l'unicité du nom si modifié
    if (data.name && data.name !== existingTag.name) {
      const existingNameTag = await prisma.blog_tags.findFirst({
        where: {
          name: {
            equals: data.name.trim(),
            mode: "insensitive",
          },
          id: { not: id },
        },
      });

      if (existingNameTag) {
        return NextResponse.json(
          { error: "Un tag avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    // ✅ Vérification de la catégorie si modifiée
    if (data.categoriesId) {
      if (!validateUUID(data.categoriesId)) {
        return NextResponse.json(
          { error: VALIDATION_MESSAGES.INVALID_UUID },
          { status: 400 }
        );
      }

      const category = await prisma.categories.findUnique({
        where: {
          id: data.categoriesId,
          isActive: true,
        },
        select: { id: true },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Catégorie non trouvée ou inactive" },
          { status: 404 }
        );
      }
    }

    // ✅ Construction de l'objet de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Mise à jour conditionnelle des champs
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.color !== undefined) updateData.color = data.color;
    if (data.categoriesId !== undefined)
      updateData.categoriesId = data.categoriesId;

    // ✅ Mise à jour du tag
    const updatedTag = await prisma.blog_tags.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // ✅ Formatage de la réponse
    const response: BlogTagResponse = {
      id: updatedTag.id,
      name: updatedTag.name,
      color: updatedTag.color,
      isActive: updatedTag.isActive,
      createdAt: updatedTag.createdAt,
      updatedAt: updatedTag.updatedAt,
      categoriesId: updatedTag.categoriesId,
      category: updatedTag.categories || null,
      _count: updatedTag._count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);

    // ✅ Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Un tag avec ce nom existe déjà" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Référence invalide (catégorie inexistante)" },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            { error: "Enregistrement non trouvé" },
            { status: 404 }
          );
        default:
          console.error(
            "Erreur Prisma non gérée:",
            prismaError.code,
            prismaError.message
          );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du tag",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/tags/[id]
 * Supprime (désactive) un tag
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<
  NextResponse<{ message: string } | { error: string; details?: string }>
> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          details: VALIDATION_MESSAGES.INVALID_UUID,
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le tag existe et récupérer ses relations
    const tag = await prisma.blog_tags.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isActive: true,
        comments: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    if (!tag.isActive) {
      return NextResponse.json({ error: "Tag déjà supprimé" }, { status: 410 });
    }

    // ✅ Vérifier s'il y a des commentaires liés
    if (tag.comments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer un tag qui est utilisé dans des commentaires",
          details: `Ce tag est utilisé dans ${tag.comments.length} commentaire(s)`,
        },
        { status: 400 }
      );
    }

    // ✅ Désactivation au lieu de suppression physique (soft delete)
    await prisma.blog_tags.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Tag supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du tag:", error);

    // ✅ Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Tag non trouvé" },
            { status: 404 }
          );
        default:
          console.error(
            "Erreur Prisma non gérée:",
            prismaError.code,
            prismaError.message
          );
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du tag",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
