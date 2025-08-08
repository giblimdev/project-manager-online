// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  validateUUID,
  type UpdateBlogCommentInput,
  type ValidationResult,
  VALIDATION_MESSAGES,
} from "@/lib/blog/validations/blog";
import type { Visibility } from "@/lib/generated/prisma/client";

// ✅ Interface pour les réponses de commentaires conforme à votre schéma
interface CommentResponse {
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
  taskId: string | null;
  userStoryId: string | null;
  fileId: string | null;
  itemId: string | null;
  parentCommentId: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  replies?: CommentResponse[];
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
  parentComment?: {
    id: string;
    title: string | null;
    content: string;
  } | null;
}

/**
 * GET /api/comments/[id]
 * Récupère un commentaire spécifique avec ses relations
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<CommentResponse | { error: string; details?: string }>
> {
  try {
    const { id } = await context.params;

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
    const comment = await prisma.comment.findUnique({
      where: { id },
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
          orderBy: { createdAt: "asc" },
          take: 20, // Limiter pour les performances
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
        parentComment: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    // ✅ Formatage de la réponse
    const response: CommentResponse = {
      id: comment.id,
      content: comment.content,
      title: comment.title,
      excerpt: comment.excerpt,
      slug: comment.slug,
      status: comment.status,
      visibility: comment.visibility,
      blogImage: comment.blogImage,
      readingTime: comment.readingTime,
      order: comment.order,
      isActive: comment.isActive,
      isPinned: comment.isPinned,
      isResolved: comment.isResolved,
      publishedAt: comment.publishedAt,
      metadata: comment.metadata,
      mentions: comment.mentions,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      authorId: comment.authorId,
      taskId: comment.taskId,
      userStoryId: comment.userStoryId,
      fileId: comment.fileId,
      itemId: comment.itemId,
      parentCommentId: comment.parentCommentId,
      author: comment.author,
      replies: comment.replies?.map((reply) => ({
        id: reply.id,
        content: reply.content,
        title: reply.title,
        excerpt: reply.excerpt,
        slug: reply.slug,
        status: reply.status,
        visibility: reply.visibility,
        blogImage: reply.blogImage,
        readingTime: reply.readingTime,
        order: reply.order,
        isActive: reply.isActive,
        isPinned: reply.isPinned,
        isResolved: reply.isResolved,
        publishedAt: reply.publishedAt,
        metadata: reply.metadata,
        mentions: reply.mentions,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        authorId: reply.authorId,
        taskId: reply.taskId,
        userStoryId: reply.userStoryId,
        fileId: reply.fileId,
        itemId: reply.itemId,
        parentCommentId: reply.parentCommentId,
        author: reply.author,
      })),
      categories: comment.categories,
      blog_tags: comment.blog_tags,
      parentComment: comment.parentComment,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la récupération du commentaire:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/comments/[id]
 * Met à jour un commentaire existant
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<CommentResponse | { error: string; details?: any }>> {
  try {
    const { id } = await context.params;
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

    // ✅ Validation avec votre système Zod corrigé
    const validationResult = validate.blogCommentUpdate(body);

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

    const data = validationResult.data as UpdateBlogCommentInput;

    // ✅ Vérifier que le commentaire existe
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        authorId: true,
        isActive: true,
        parentCommentId: true,
        taskId: true,
        userStoryId: true,
        fileId: true,
        itemId: true,
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    if (!existingComment.isActive) {
      return NextResponse.json(
        { error: "Commentaire désactivé, modification impossible" },
        { status: 410 }
      );
    }

    // ✅ Vérification du commentaire parent si modifié
    if (
      data.parentCommentId &&
      data.parentCommentId !== existingComment.parentCommentId
    ) {
      if (!validateUUID(data.parentCommentId)) {
        return NextResponse.json(
          { error: VALIDATION_MESSAGES.INVALID_UUID },
          { status: 400 }
        );
      }

      const parentComment = await prisma.comment.findUnique({
        where: {
          id: data.parentCommentId,
          isActive: true,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Commentaire parent non trouvé" },
          { status: 404 }
        );
      }

      // Éviter les boucles infinies
      if (data.parentCommentId === id) {
        return NextResponse.json(
          { error: "Un commentaire ne peut pas être son propre parent" },
          { status: 400 }
        );
      }
    }

    // ✅ Gestion du slug si modifié
    let finalSlug = data.slug || existingComment.slug;

    if (data.slug && data.slug !== existingComment.slug) {
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

    // ✅ Construction de l'objet de mise à jour
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
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.blogImage !== undefined) updateData.blogImage = data.blogImage;
    if (data.readingTime !== undefined)
      updateData.readingTime = data.readingTime;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
    if (data.isResolved !== undefined) updateData.isResolved = data.isResolved;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt
        ? new Date(data.publishedAt)
        : null;
    }
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.mentions !== undefined) updateData.mentions = data.mentions;
    if (data.parentCommentId !== undefined)
      updateData.parentCommentId = data.parentCommentId;

    // Gestion des relations many-to-many
    const relationUpdates: any = {};

    if (data.categoryIds !== undefined) {
      relationUpdates.categories = {
        set: [], // Supprimer toutes les relations existantes
        connect: data.categoryIds.map((categoryId: string) => ({
          id: categoryId,
        })),
      };
    }

    if (data.tagIds !== undefined) {
      relationUpdates.blog_tags = {
        set: [], // Supprimer toutes les relations existantes
        connect: data.tagIds.map((tagId: string) => ({ id: tagId })),
      };
    }

    // ✅ Mise à jour du commentaire
    const updatedComment = await prisma.comment.update({
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
        parentComment: {
          select: {
            id: true,
            title: true,
            content: true,
          },
        },
      },
    });

    // ✅ Formatage de la réponse
    const response: CommentResponse = {
      id: updatedComment.id,
      content: updatedComment.content,
      title: updatedComment.title,
      excerpt: updatedComment.excerpt,
      slug: updatedComment.slug,
      status: updatedComment.status,
      visibility: updatedComment.visibility,
      blogImage: updatedComment.blogImage,
      readingTime: updatedComment.readingTime,
      order: updatedComment.order,
      isActive: updatedComment.isActive,
      isPinned: updatedComment.isPinned,
      isResolved: updatedComment.isResolved,
      publishedAt: updatedComment.publishedAt,
      metadata: updatedComment.metadata,
      mentions: updatedComment.mentions,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      authorId: updatedComment.authorId,
      taskId: updatedComment.taskId,
      userStoryId: updatedComment.userStoryId,
      fileId: updatedComment.fileId,
      itemId: updatedComment.itemId,
      parentCommentId: updatedComment.parentCommentId,
      author: updatedComment.author,
      categories: updatedComment.categories,
      blog_tags: updatedComment.blog_tags,
      parentComment: updatedComment.parentComment,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du commentaire:", error);

    // ✅ Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Un commentaire avec ce slug existe déjà" },
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
        error: "Erreur lors de la mise à jour du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * Supprime (désactive) un commentaire
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<{ message: string } | { error: string; details?: string }>
> {
  try {
    const { id } = await context.params;

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

    // ✅ Vérifier que le commentaire existe et récupérer ses relations
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        isActive: true,
        replies: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    if (!comment.isActive) {
      return NextResponse.json(
        { error: "Commentaire déjà supprimé" },
        { status: 410 }
      );
    }

    // ✅ Vérifier s'il y a des réponses actives
    if (comment.replies.length > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer un commentaire qui a des réponses",
          details: `Ce commentaire a ${comment.replies.length} réponse(s) active(s)`,
        },
        { status: 400 }
      );
    }

    // ✅ Désactivation au lieu de suppression physique (soft delete)
    await prisma.comment.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Commentaire supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire:", error);

    // ✅ Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Commentaire non trouvé" },
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
        error: "Erreur lors de la suppression du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
