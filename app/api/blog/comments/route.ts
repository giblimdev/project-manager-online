// 📄 /app/api/blog/comments/route.ts
// 🎯 Rôle : API route pour la gestion des commentaires de blog/projet
// 📦 Responsabilités : CRUD des commentaires, gestion des réponses, validation des données
// 🔧 Composants utilisés : NextRequest, NextResponse, Prisma Client, Zod pour validation
// 🌐 Base de données : PostgreSQL via Prisma avec modèle Comment

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Visibility } from "@/lib/generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

// 🔧 Schémas de validation Zod conformes au schéma Prisma - CORRIGES
const createCommentSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est obligatoire")
    .max(255, "Le titre ne peut pas dépasser 255 caractères"),
  content: z.string().min(1, "Le contenu est obligatoire"),
  excerpt: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  visibility: z.nativeEnum(Visibility).default(Visibility.PRIVATE),
  blogImage: z.string().url("URL d'image invalide").optional().nullable(),
  readingTime: z.number().int().min(1).optional(),
  order: z.number().int().min(0).default(1000),
  isPinned: z.boolean().default(false),
  isResolved: z.boolean().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
  // ✅ CORRECTION : Spécifier explicitement le type de valeur pour record
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  mentions: z.array(z.string()).default([]),
  authorId: z.string().min(1, "L'auteur est obligatoire"),
  parentCommentId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  userStoryId: z.string().optional().nullable(),
  fileId: z.string().optional().nullable(),
  itemId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

const updateCommentSchema = createCommentSchema.partial().extend({
  id: z.string().min(1, "L'ID est obligatoire"),
});

const querySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  authorId: z.string().optional(),
  taskId: z.string().optional(),
  userStoryId: z.string().optional(),
  fileId: z.string().optional(),
  itemId: z.string().optional(),
  parentCommentId: z.string().optional(),
  search: z.string().optional(),
  isPinned: z.boolean().optional(),
  isResolved: z.boolean().optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "order"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// 🔧 Interface pour les réponses de commentaires strictement typée
interface CommentResponse {
  id: string;
  title: string;
  content: string;
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
  categories?: Array<{
    id: string;
    name: string;
    slug: string | null;
  }>;
  blog_tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
}

interface PaginationResponse {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 🎯 Fonction utilitaire pour générer un slug unique
const generateSlug = async (title: string): Promise<string> => {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  let finalSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existingComment = await prisma.comment.findUnique({
      where: { slug: finalSlug },
    });

    if (!existingComment) {
      break;
    }

    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return finalSlug;
};

// 🎯 Fonction utilitaire pour calculer le temps de lecture
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// 📋 GET - Récupérer les commentaires avec pagination et filtres avancés
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const params = querySchema.safeParse({
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
      status: searchParams.get("status") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      authorId: searchParams.get("authorId") || undefined,
      taskId: searchParams.get("taskId") || undefined,
      userStoryId: searchParams.get("userStoryId") || undefined,
      fileId: searchParams.get("fileId") || undefined,
      itemId: searchParams.get("itemId") || undefined,
      parentCommentId: searchParams.get("parentCommentId") || undefined,
      search: searchParams.get("search") || undefined,
      isPinned: searchParams.get("isPinned")
        ? searchParams.get("isPinned") === "true"
        : undefined,
      isResolved: searchParams.get("isResolved")
        ? searchParams.get("isResolved") === "true"
        : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    });

    if (!params.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres de requête invalides",
          details: params.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      page,
      limit,
      status,
      visibility,
      authorId,
      taskId,
      userStoryId,
      fileId,
      itemId,
      parentCommentId,
      search,
      isPinned,
      isResolved,
      sortBy,
      sortOrder,
    } = params.data;

    // 🔍 Construction dynamique du filtre WHERE
    const where: any = {
      isActive: true,
    };

    // Filtres de base
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (authorId) where.authorId = authorId;
    if (taskId) where.taskId = taskId;
    if (userStoryId) where.userStoryId = userStoryId;
    if (fileId) where.fileId = fileId;
    if (itemId) where.itemId = itemId;
    if (parentCommentId !== undefined) where.parentCommentId = parentCommentId;
    if (isPinned !== undefined) where.isPinned = isPinned;
    if (isResolved !== undefined) where.isResolved = isResolved;

    // Recherche textuelle
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { content: { contains: search.trim(), mode: "insensitive" } },
        { excerpt: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    // 📊 Exécution parallèle des requêtes
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
          parentComment: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
            take: 10, // Limiter les réponses pour les performances
          },
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
            where: { isActive: true },
          },
          blog_tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
            where: { isActive: true },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          userStory: {
            select: {
              id: true,
              title: true,
            },
          },
          file: {
            select: {
              id: true,
              name: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { [sortBy]: sortOrder }],
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // 🎯 Formatage des données de réponse avec typage strict
    const formattedComments: CommentResponse[] = comments.map((comment) => ({
      id: comment.id,
      title: comment.title,
      content: comment.content,
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
        title: reply.title,
        content: reply.content,
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

    const pagination: PaginationResponse = {
      totalCount,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          comments: formattedComments,
          pagination,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/blog/comments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des commentaires",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ➕ POST - Créer un nouveau commentaire
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de création invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // 🔍 Vérification de l'existence de l'auteur
    const authorExists = await prisma.user.findUnique({
      where: { id: data.authorId },
    });

    if (!authorExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Auteur non trouvé",
          details: "L'utilisateur spécifié n'existe pas",
        },
        { status: 404 }
      );
    }

    // 🔍 Vérification du commentaire parent si spécifié
    if (data.parentCommentId) {
      const parentExists = await prisma.comment.findUnique({
        where: { id: data.parentCommentId, isActive: true },
      });

      if (!parentExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Commentaire parent non trouvé",
            details: "Le commentaire parent spécifié n'existe pas",
          },
          { status: 404 }
        );
      }
    }

    // 🔍 Vérification des références existantes (optionnelles)
    const referenceValidations = [];

    if (data.taskId) {
      referenceValidations.push(
        prisma.task.findUnique({
          where: { id: data.taskId },
          select: { id: true },
        })
      );
    }

    if (data.userStoryId) {
      referenceValidations.push(
        prisma.userStory.findUnique({
          where: { id: data.userStoryId },
          select: { id: true },
        })
      );
    }

    if (data.fileId) {
      referenceValidations.push(
        prisma.file.findUnique({
          where: { id: data.fileId },
          select: { id: true },
        })
      );
    }

    if (data.itemId) {
      referenceValidations.push(
        prisma.item.findUnique({
          where: { id: data.itemId },
          select: { id: true },
        })
      );
    }

    // Vérifier les catégories si spécifiées
    if (data.categoryIds && data.categoryIds.length > 0) {
      const categoriesExist = await prisma.categories.findMany({
        where: {
          id: { in: data.categoryIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (categoriesExist.length !== data.categoryIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Catégories invalides",
            details: "Une ou plusieurs catégories spécifiées n'existent pas",
          },
          { status: 404 }
        );
      }
    }

    // Vérifier les tags si spécifiés
    if (data.tagIds && data.tagIds.length > 0) {
      const tagsExist = await prisma.blog_tags.findMany({
        where: {
          id: { in: data.tagIds },
          isActive: true,
        },
        select: { id: true },
      });

      if (tagsExist.length !== data.tagIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: "Tags invalides",
            details: "Un ou plusieurs tags spécifiés n'existent pas",
          },
          { status: 404 }
        );
      }
    }

    if (referenceValidations.length > 0) {
      const results = await Promise.all(referenceValidations);
      const validReferences = results.every((result) => result !== null);

      if (!validReferences) {
        return NextResponse.json(
          {
            success: false,
            error: "Références introuvables",
            details: "Une ou plusieurs références spécifiées n'existent pas",
          },
          { status: 404 }
        );
      }
    }

    // 🎯 Génération du slug unique
    const finalSlug = data.slug || (await generateSlug(data.title));

    // 📊 Calcul du temps de lecture si non fourni
    const readingTime = data.readingTime || calculateReadingTime(data.content);

    // ✅ CORRECTION MAJEURE : Structure Prisma correcte avec relations
    const createData: any = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || null,
      slug: finalSlug,
      status: data.status,
      visibility: data.visibility,
      blogImage: data.blogImage || null,
      readingTime,
      order: data.order,
      isActive: true,
      isPinned: data.isPinned,
      isResolved: data.isResolved,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      // ✅ CORRECTION : metadata correctement typé comme Json
      metadata: data.metadata || {},
      mentions: data.mentions,
      authorId: data.authorId,
      parentCommentId: data.parentCommentId || null,
      taskId: data.taskId || null,
      userStoryId: data.userStoryId || null,
      fileId: data.fileId || null,
      itemId: data.itemId || null,
    };

    // ✅ CORRECTION : Relations many-to-many correctement structurées
    if (data.categoryIds && data.categoryIds.length > 0) {
      createData.categories = {
        connect: data.categoryIds.map((id) => ({ id })),
      };
    }

    if (data.tagIds && data.tagIds.length > 0) {
      createData.blog_tags = {
        connect: data.tagIds.map((id) => ({ id })),
      };
    }

    const comment = await prisma.comment.create({
      data: createData,
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
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        userStory: {
          select: {
            id: true,
            title: true,
          },
        },
        file: {
          select: {
            id: true,
            name: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // 🎯 Formatage de la réponse strictement typée
    const response: CommentResponse = {
      id: comment.id,
      title: comment.title,
      content: comment.content,
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

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: "Commentaire créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/blog/comments error:", error);

    // 🔍 Gestion spécifique des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            {
              success: false,
              error: "Conflit de données",
              details: "Un commentaire avec ce slug existe déjà",
            },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            {
              success: false,
              error: "Référence invalide",
              details: "Contrainte de clé étrangère violée",
            },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Enregistrement non trouvé",
              details: "L'enregistrement référencé n'existe pas",
            },
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
        success: false,
        error: "Erreur lors de la création du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✏️ PUT - Mettre à jour un commentaire
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = updateCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de mise à jour invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = validation.data;

    // 🔍 Vérifier que le commentaire existe
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true } },
        blog_tags: { select: { id: true } },
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        {
          success: false,
          error: "Commentaire non trouvé",
        },
        { status: 404 }
      );
    }

    // 🎯 Gestion du slug si le titre change
    let finalSlug = existingComment.slug;
    if (updateData.title && updateData.title !== existingComment.title) {
      finalSlug = await generateSlug(updateData.title);
    }

    // 📊 Recalcul du temps de lecture si le contenu change
    let readingTime = existingComment.readingTime;
    if (updateData.content && updateData.content !== existingComment.content) {
      readingTime = calculateReadingTime(updateData.content);
    }

    // 📅 Gestion de la date de publication
    let publishedAt = existingComment.publishedAt;
    if (
      updateData.status === "PUBLISHED" &&
      existingComment.status !== "PUBLISHED"
    ) {
      publishedAt = new Date();
    } else if (updateData.status && updateData.status !== "PUBLISHED") {
      publishedAt = null;
    }

    // ✅ CORRECTION : Structure Prisma correcte pour l'update
    const prismaUpdateData: any = {
      ...updateData,
      slug: finalSlug,
      readingTime,
      publishedAt,
      metadata: updateData.metadata || existingComment.metadata,
      updatedAt: new Date(),
    };

    // Nettoyage des champs relationnels
    delete prismaUpdateData.categoryIds;
    delete prismaUpdateData.tagIds;
    delete prismaUpdateData.id;

    // ✅ CORRECTION : Gestion des relations many-to-many pour l'update
    if (updateData.categoryIds !== undefined) {
      if (updateData.categoryIds && updateData.categoryIds.length > 0) {
        // Vérifier que toutes les catégories existent
        const categoriesExist = await prisma.categories.findMany({
          where: {
            id: { in: updateData.categoryIds },
            isActive: true,
          },
          select: { id: true },
        });

        if (categoriesExist.length !== updateData.categoryIds.length) {
          return NextResponse.json(
            {
              success: false,
              error: "Catégories invalides",
              details: "Une ou plusieurs catégories spécifiées n'existent pas",
            },
            { status: 404 }
          );
        }

        prismaUpdateData.categories = {
          set: [], // Vider d'abord
          connect: updateData.categoryIds.map((id) => ({ id })),
        };
      } else {
        prismaUpdateData.categories = {
          set: [], // Vider toutes les catégories
        };
      }
    }

    if (updateData.tagIds !== undefined) {
      if (updateData.tagIds && updateData.tagIds.length > 0) {
        // Vérifier que tous les tags existent
        const tagsExist = await prisma.blog_tags.findMany({
          where: {
            id: { in: updateData.tagIds },
            isActive: true,
          },
          select: { id: true },
        });

        if (tagsExist.length !== updateData.tagIds.length) {
          return NextResponse.json(
            {
              success: false,
              error: "Tags invalides",
              details: "Un ou plusieurs tags spécifiés n'existent pas",
            },
            { status: 404 }
          );
        }

        prismaUpdateData.blog_tags = {
          set: [], // Vider d'abord
          connect: updateData.tagIds.map((id) => ({ id })),
        };
      } else {
        prismaUpdateData.blog_tags = {
          set: [], // Vider tous les tags
        };
      }
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: prismaUpdateData,
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
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // 🎯 Formatage de la réponse
    const response: CommentResponse = {
      id: updatedComment.id,
      title: updatedComment.title,
      content: updatedComment.content,
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
    };

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: "Commentaire mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/blog/comments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 🗑️ DELETE - Supprimer un commentaire (suppression logique)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID du commentaire requis",
        },
        { status: 400 }
      );
    }

    // 🔍 Vérifier que le commentaire existe
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        {
          success: false,
          error: "Commentaire non trouvé",
        },
        { status: 404 }
      );
    }

    // 🔄 Suppression logique (désactivation)
    const deletedComment = await prisma.comment.update({
      where: { id },
      data: {
        isActive: false,
        status: "ARCHIVED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: deletedComment.id,
          title: deletedComment.title,
          repliesCount: existingComment._count.replies,
        },
        message: "Commentaire supprimé avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/blog/comments error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
