// app/api/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  validateUUID,
  type CreateBlogCommentInput,
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
  // Relations selon votre schéma
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
}

/**
 * GET /api/comments
 * Récupère les commentaires avec filtres simples
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<
    | {
        comments: CommentResponse[];
        pagination: {
          totalCount: number;
          totalPages: number;
          currentPage: number;
          limit: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }
    | { error: string; details?: string }
  >
> {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ Paramètres de requête avec validation
    const taskId = searchParams.get("taskId");
    const userStoryId = searchParams.get("userStoryId");
    const fileId = searchParams.get("fileId");
    const itemId = searchParams.get("itemId");
    const status = searchParams.get("status");
    const authorId = searchParams.get("authorId");
    const search = searchParams.get("search");
    const isPinned = searchParams.get("isPinned");
    const isResolved = searchParams.get("isResolved");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );

    // ✅ Validation des UUIDs si fournis
    const uuidFields = [
      { name: "taskId", value: taskId },
      { name: "userStoryId", value: userStoryId },
      { name: "fileId", value: fileId },
      { name: "itemId", value: itemId },
      { name: "authorId", value: authorId },
    ];

    for (const field of uuidFields) {
      if (field.value && !validateUUID(field.value)) {
        return NextResponse.json(
          {
            error: `Format UUID invalide pour ${field.name}`,
            details: VALIDATION_MESSAGES.INVALID_UUID,
          },
          { status: 400 }
        );
      }
    }

    // ✅ Construction de la clause WHERE typée
    interface WhereClause {
      parentCommentId: null;
      isActive: boolean;
      OR?: Array<{
        taskId?: string;
        userStoryId?: string;
        fileId?: string;
        itemId?: string;
      }>;
      status?: string;
      authorId?: string;
      isPinned?: boolean;
      isResolved?: boolean;
      AND?: Array<{
        OR: Array<{
          title?: { contains: string; mode: "insensitive" };
          content?: { contains: string; mode: "insensitive" };
          excerpt?: { contains: string; mode: "insensitive" };
        }>;
      }>;
    }

    const where: WhereClause = {
      parentCommentId: null, // Commentaires racines uniquement
      isActive: true,
    };

    // Filtres par référence
    const referenceFilters: Array<{
      taskId?: string;
      userStoryId?: string;
      fileId?: string;
      itemId?: string;
    }> = [];

    if (taskId) referenceFilters.push({ taskId });
    if (userStoryId) referenceFilters.push({ userStoryId });
    if (fileId) referenceFilters.push({ fileId });
    if (itemId) referenceFilters.push({ itemId });

    if (referenceFilters.length > 0) {
      where.OR = referenceFilters;
    }

    // Autres filtres
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (isPinned === "true") where.isPinned = true;
    if (isPinned === "false") where.isPinned = false;
    if (isResolved === "true") where.isResolved = true;
    if (isResolved === "false") where.isResolved = false;

    // Recherche textuelle
    if (search?.trim()) {
      where.AND = [
        {
          OR: [
            { title: { contains: search.trim(), mode: "insensitive" } },
            { content: { contains: search.trim(), mode: "insensitive" } },
            { excerpt: { contains: search.trim(), mode: "insensitive" } },
          ],
        },
      ];
    }

    const offset = (page - 1) * limit;

    // ✅ Requête Prisma selon votre schéma
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where,
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
            take: 5, // Limiter les réponses pour les performances
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
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip: offset,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // ✅ Formatage des données de réponse
    const formattedComments: CommentResponse[] = comments.map((comment) => ({
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
    }));

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des commentaires",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Crée un nouveau commentaire
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CommentResponse | { error: string; details?: any }>> {
  try {
    const body = await request.json();

    // ✅ Validation avec votre système Zod corrigé
    const validationResult = validate.blogComment(body);

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

    const data = validationResult.data as CreateBlogCommentInput;

    // ✅ Vérification du commentaire parent si spécifié
    if (data.parentCommentId) {
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
    }

    // ✅ Vérification des références existantes
    const referenceChecks = [];

    if (data.taskId) {
      referenceChecks.push(
        prisma.task
          .findUnique({
            where: { id: data.taskId },
            select: { id: true },
          })
          .then((result) => ({ type: "task", exists: !!result }))
      );
    }

    if (data.userStoryId) {
      referenceChecks.push(
        prisma.userStory
          .findUnique({
            where: { id: data.userStoryId },
            select: { id: true },
          })
          .then((result) => ({ type: "userStory", exists: !!result }))
      );
    }

    if (data.fileId) {
      referenceChecks.push(
        prisma.file
          .findUnique({
            where: { id: data.fileId },
            select: { id: true },
          })
          .then((result) => ({ type: "file", exists: !!result }))
      );
    }

    if (data.itemId) {
      referenceChecks.push(
        prisma.item
          .findUnique({
            where: { id: data.itemId },
            select: { id: true },
          })
          .then((result) => ({ type: "item", exists: !!result }))
      );
    }

    // Vérifier l'auteur
    referenceChecks.push(
      prisma.user
        .findUnique({
          where: { id: data.authorId },
          select: { id: true },
        })
        .then((result) => ({ type: "author", exists: !!result }))
    );

    const referenceResults = await Promise.all(referenceChecks);
    const missingReferences = referenceResults.filter(
      (result) => !result.exists
    );

    if (missingReferences.length > 0) {
      return NextResponse.json(
        {
          error: "Références introuvables",
          details: missingReferences.map((ref) => `${ref.type} non trouvé`),
        },
        { status: 404 }
      );
    }

    // ✅ Génération du slug unique si fourni
    let finalSlug: string | null = null;
    if (data.slug) {
      finalSlug = data.slug;
      let counter = 1;

      while (true) {
        const existingComment = await prisma.comment.findUnique({
          where: { slug: finalSlug },
        });

        if (!existingComment) break;
        finalSlug = `${data.slug}-${counter}`;
        counter++;
      }
    }

    // ✅ Calcul automatique du temps de lecture
    const calculateReadingTime = (content: string): number => {
      const wordsPerMinute = 200;
      const words = content.trim().split(/\s+/).length;
      return Math.max(1, Math.ceil(words / wordsPerMinute));
    };

    // ✅ Création du commentaire selon votre schéma Prisma
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        title: data.title || null,
        excerpt: data.excerpt || null,
        slug: finalSlug,
        status: data.status || "DRAFT",
        visibility: data.visibility || "PRIVATE",
        blogImage: data.blogImage || null,
        readingTime: data.readingTime || calculateReadingTime(data.content),
        order: data.order || 0,
        isActive: true,
        isPinned: data.isPinned || false,
        isResolved: data.isResolved || false,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        metadata: data.metadata || {},
        mentions: data.mentions || [],
        authorId: data.authorId,
        parentCommentId: data.parentCommentId || null,
        taskId: data.taskId || null,
        userStoryId: data.userStoryId || null,
        fileId: data.fileId || null,
        itemId: data.itemId || null,
        // ✅ Relations many-to-many selon votre schéma
        ...(data.categoryIds &&
          data.categoryIds.length > 0 && {
            categories: {
              connect: data.categoryIds.map((id: string) => ({ id })),
            },
          }),
        ...(data.tagIds &&
          data.tagIds.length > 0 && {
            blog_tags: {
              connect: data.tagIds.map((id: string) => ({ id })),
            },
          }),
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
      },
    });

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
      categories: comment.categories,
      blog_tags: comment.blog_tags,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);

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
        error: "Erreur lors de la création du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
