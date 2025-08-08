// app/api/blog/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  validateUUID,
  type CreatePostInput,
  type ValidationResult,
  VALIDATION_MESSAGES,
} from "@/lib/blog/validations/blog";
import type { Visibility } from "@/lib/generated/prisma/client";

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
  _count?: {
    replies: number;
  };
}

/**
 * GET /api/blog/posts
 * Récupère tous les articles de blog
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<
    | {
        posts: PostResponse[];
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

    // Paramètres de requête
    const status = searchParams.get("status");
    const visibility = searchParams.get("visibility") as Visibility | null;
    const authorId = searchParams.get("authorId");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const tagId = searchParams.get("tagId");
    const isPinned = searchParams.get("isPinned");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10"))
    );

    // Construction de la clause WHERE
    const where: any = {
      // Articles de blog = commentaires sans références externes
      taskId: null,
      userStoryId: null,
      fileId: null,
      itemId: null,
      parentCommentId: null,
      isActive: true,
    };

    // Filtres
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (authorId && validateUUID(authorId)) where.authorId = authorId;
    if (isPinned === "true") where.isPinned = true;
    if (isPinned === "false") where.isPinned = false;

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

    // Filtres par catégorie et tag
    if (categoryId && validateUUID(categoryId)) {
      where.categories = { some: { id: categoryId } };
    }

    if (tagId && validateUUID(tagId)) {
      where.blog_tags = { some: { id: tagId } };
    }

    const offset = (page - 1) * limit;

    // Requête Prisma
    const [posts, totalCount] = await Promise.all([
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
        orderBy: [
          { isPinned: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      posts,
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
    console.error("Erreur lors de la récupération des articles:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des articles",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/posts
 * Crée un nouvel article de blog
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<PostResponse | { error: string; details?: any }>> {
  try {
    const body = await request.json();

    // Validation avec Zod
    const validationResult = validate.post(body);

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

    const data = validationResult.data as CreatePostInput;

    // Vérification que l'auteur existe
    const author = await prisma.user.findUnique({
      where: { id: data.authorId },
      select: { id: true, name: true },
    });

    if (!author) {
      return NextResponse.json({ error: "Auteur non trouvé" }, { status: 404 });
    }

    // Génération du slug unique
    let finalSlug: string | null = null;
    if (data.slug) {
      finalSlug = data.slug;
      let counter = 1;

      while (true) {
        const existingPost = await prisma.comment.findUnique({
          where: { slug: finalSlug },
        });

        if (!existingPost) break;
        finalSlug = `${data.slug}-${counter}`;
        counter++;
      }
    }

    // Calcul automatique du temps de lecture
    const calculateReadingTime = (content: string): number => {
      const wordsPerMinute = 200;
      const words = content.trim().split(/\s+/).length;
      return Math.max(1, Math.ceil(words / wordsPerMinute));
    };

    // Création de l'article de blog
    const post = await prisma.comment.create({
      data: {
        content: data.content,
        title: data.title,
        excerpt: data.excerpt || null,
        slug: finalSlug,
        status: data.status || "DRAFT",
        visibility: data.visibility || "PUBLIC",
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
        // Pas de références externes pour les articles de blog
        taskId: null,
        userStoryId: null,
        fileId: null,
        itemId: null,
        parentCommentId: null,
        // Relations many-to-many
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
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);

    // Gestion des erreurs Prisma
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
        error: "Erreur lors de la création de l'article",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
