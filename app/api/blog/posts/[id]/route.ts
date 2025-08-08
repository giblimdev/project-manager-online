// app/api/blog/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  validateUUID,
  type UpdatePostInput,
  type ValidationResult,
  VALIDATION_MESSAGES,
} from "@/lib/blog/validations/blog";
import { revalidatePath } from "next/cache";
import type { Visibility } from "@/lib/generated/prisma/client";

// ✅ Interface pour les paramètres de route Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Interface pour les réponses de posts
interface PostResponse {
  id: string;
  content: string;
  title: string | null;
  excerpt: string | null;
  slug: string | null;
  status: string;
  visibility: Visibility;
  blogImage: string | null;
  readingTime: number | null;
  order: number;
  isActive: boolean;
  isPinned: boolean;
  isResolved: boolean;
  publishedAt: Date | null;
  metadata: any;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  categories?: {
    id: string;
    name: string;
    slug: string | null;
  }[];
  blog_tags?: {
    id: string;
    name: string;
    color: string | null;
  }[];
  replies?: {
    id: string;
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
    replies: number;
  };
}

/**
 * GET /api/blog/posts/[id]
 * Récupère un article spécifique par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<PostResponse | { error: string; details?: string }>> {
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

    // ✅ Requête Prisma conforme à votre schéma pour récupérer un article de blog
    const post = await prisma.comment.findUnique({
      where: {
        id,
        // ✅ Filtrer pour récupérer uniquement les articles de blog
        // Un article de blog est un commentaire sans références externes
        taskId: null,
        userStoryId: null,
        fileId: null,
        itemId: null,
        parentCommentId: null,
        isActive: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blog_tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        replies: {
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
            replies: {
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
              orderBy: {
                createdAt: "asc",
              },
              take: 10, // Limiter pour les performances
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 20, // Limiter pour les performances
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    // ✅ Formatage de la réponse
    const response: PostResponse = {
      id: post.id,
      content: post.content,
      title: post.title,
      excerpt: post.excerpt,
      slug: post.slug,
      status: post.status,
      visibility: post.visibility,
      blogImage: post.blogImage,
      readingTime: post.readingTime,
      order: post.order,
      isActive: post.isActive,
      isPinned: post.isPinned,
      isResolved: post.isResolved,
      publishedAt: post.publishedAt,
      metadata: post.metadata,
      mentions: post.mentions,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorId: post.authorId,
      author: post.author,
      categories: post.categories,
      blog_tags: post.blog_tags,
      replies: post.replies?.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        author: reply.author,
      })),
      _count: post._count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'article",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/blog/posts/[id]
 * Met à jour complètement un article
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<PostResponse | { error: string; details?: any }>> {
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

    // ✅ Vérifier que l'article existe et est bien un article de blog
    const existingPost = await prisma.comment.findUnique({
      where: {
        id,
        // Vérifier que c'est bien un article de blog
        taskId: null,
        userStoryId: null,
        fileId: null,
        itemId: null,
        parentCommentId: null,
        isActive: true,
      },
      select: {
        id: true,
        authorId: true,
        slug: true,
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // ✅ Validation avec votre système Zod
    const validationResult = validate.postUpdate(body);

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

    const data = validationResult.data as UpdatePostInput;

    // ✅ Gestion du slug si modifié
    let finalSlug = data.slug || existingPost.slug;

    if (data.slug && data.slug !== existingPost.slug) {
      let counter = 1;
      finalSlug = data.slug;

      while (true) {
        const existing = await prisma.comment.findFirst({
          where: {
            slug: finalSlug,
            id: { not: id },
          },
        });

        if (!existing) break;
        finalSlug = `${data.slug}-${counter}`;
        counter++;
      }
    }

    // ✅ Calcul automatique du temps de lecture si le contenu change
    const calculateReadingTime = (content: string): number => {
      const wordsPerMinute = 200;
      const words = content.trim().split(/\s+/).length;
      return Math.max(1, Math.ceil(words / wordsPerMinute));
    };

    // ✅ Mise à jour avec transaction pour gérer les relations many-to-many
    const updatedPost = await prisma.$transaction(async (tx) => {
      // Gérer les relations many-to-many si spécifiées
      if (data.categoryIds !== undefined || data.tagIds !== undefined) {
        await tx.comment.update({
          where: { id },
          data: {
            ...(data.categoryIds !== undefined && {
              categories: { set: [] }, // Supprimer toutes les relations existantes
            }),
            ...(data.tagIds !== undefined && {
              blog_tags: { set: [] }, // Supprimer toutes les relations existantes
            }),
          },
        });
      }

      // Construire l'objet de mise à jour
      const updateData: any = {
        updatedAt: new Date(),
        slug: finalSlug,
      };

      // Mise à jour conditionnelle des champs
      if (data.content !== undefined) {
        updateData.content = data.content;
        updateData.readingTime = calculateReadingTime(data.content);
      }
      if (data.title !== undefined) updateData.title = data.title;
      if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.visibility !== undefined)
        updateData.visibility = data.visibility;
      if (data.blogImage !== undefined) updateData.blogImage = data.blogImage;
      if (data.readingTime !== undefined)
        updateData.readingTime = data.readingTime;
      if (data.order !== undefined) updateData.order = data.order;
      if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
      if (data.isResolved !== undefined)
        updateData.isResolved = data.isResolved;
      if (data.publishedAt !== undefined) {
        updateData.publishedAt = data.publishedAt
          ? new Date(data.publishedAt)
          : null;
      }
      if (data.metadata !== undefined) updateData.metadata = data.metadata;
      if (data.mentions !== undefined) updateData.mentions = data.mentions;

      // Gestion des relations many-to-many
      const relationUpdates: any = {};

      if (data.categoryIds !== undefined && data.categoryIds.length > 0) {
        relationUpdates.categories = {
          connect: data.categoryIds.map((categoryId: string) => ({
            id: categoryId,
          })),
        };
      }

      if (data.tagIds !== undefined && data.tagIds.length > 0) {
        relationUpdates.blog_tags = {
          connect: data.tagIds.map((tagId: string) => ({ id: tagId })),
        };
      }

      return tx.comment.update({
        where: { id },
        data: {
          ...updateData,
          ...relationUpdates,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          blog_tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });
    });

    // ✅ Revalidation des chemins
    revalidatePath("/blog");
    revalidatePath(`/blog/${id}`);
    revalidatePath("/api/blog/posts");

    // ✅ Formatage de la réponse
    const response: PostResponse = {
      id: updatedPost.id,
      content: updatedPost.content,
      title: updatedPost.title,
      excerpt: updatedPost.excerpt,
      slug: updatedPost.slug,
      status: updatedPost.status,
      visibility: updatedPost.visibility,
      blogImage: updatedPost.blogImage,
      readingTime: updatedPost.readingTime,
      order: updatedPost.order,
      isActive: updatedPost.isActive,
      isPinned: updatedPost.isPinned,
      isResolved: updatedPost.isResolved,
      publishedAt: updatedPost.publishedAt,
      metadata: updatedPost.metadata,
      mentions: updatedPost.mentions,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      authorId: updatedPost.authorId,
      author: updatedPost.author,
      categories: updatedPost.categories,
      blog_tags: updatedPost.blog_tags,
      _count: updatedPost._count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);

    // ✅ Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Un article avec ce slug existe déjà" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Référence invalide (contrainte de clé étrangère)" },
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
        error: "Erreur lors de la mise à jour de l'article",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blog/posts/[id]
 * Supprime un article
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

    // ✅ Vérifier que l'article existe et récupérer ses relations
    const existingPost = await prisma.comment.findUnique({
      where: {
        id,
        // Vérifier que c'est bien un article de blog
        taskId: null,
        userStoryId: null,
        fileId: null,
        itemId: null,
        parentCommentId: null,
        isActive: true,
      },
      select: {
        id: true,
        authorId: true,
        replies: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: "Article non trouvé" },
        { status: 404 }
      );
    }

    // ✅ Vérifier s'il y a des commentaires/réponses
    if (existingPost.replies.length > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer un article qui a des commentaires",
          details: `Cet article a ${existingPost.replies.length} commentaire(s)`,
        },
        { status: 400 }
      );
    }

    // ✅ Suppression physique de l'article
    await prisma.comment.delete({
      where: { id },
    });

    // ✅ Revalidation des chemins
    revalidatePath("/blog");
    revalidatePath("/api/blog/posts");

    return NextResponse.json(
      { message: "Article supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);

    // ✅ Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Article non trouvé" },
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
        error: "Erreur lors de la suppression de l'article",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
