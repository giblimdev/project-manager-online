// 📄 /app/api/blog/comments/route.ts
// 🎯 Rôle : API route pour la gestion des commentaires de blog/projet
// 📦 Responsabilités : CRUD des commentaires, gestion des réponses, validation des données
// 🔧 Composants utilisés : NextRequest, NextResponse, Prisma Client, Zod pour validation
// 🌐 Base de données : PostgreSQL via Prisma avec modèle Comment

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 🔧 Schémas de validation Zod conformes au schéma Prisma RÉEL
const createCommentSchema = z.object({
  content: z.string().min(1, "Le contenu est obligatoire"),
  order: z.number().int().min(0).default(10),
  authorId: z.string().min(1, "L'auteur est obligatoire"),
  postId: z.string().min(1, "Le post est obligatoire"),
  parentId: z.string().optional().nullable(),
});

const updateCommentSchema = createCommentSchema.partial().extend({
  id: z.string().min(1, "L'ID est obligatoire"),
});

const querySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  authorId: z.string().optional(),
  postId: z.string().optional(),
  parentId: z.string().optional().nullable(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "order"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// 🔧 Interface pour les réponses de commentaires strictement typée selon le VRAI schéma
interface CommentResponse {
  id: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  postId: string;
  authorId: string;
  parentId: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  post: {
    id: string;
    title: string;
    slug: string;
    published: boolean;
  };
  parent?: {
    id: string;
    content: string;
    authorId: string;
  } | null;
  replies?: {
    id: string;
    content: string;
    order: number;
    createdAt: Date;
    authorId: string;
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  images?: {
    id: string;
    url: string;
    alt: string | null;
  }[];
  repliesCount?: number;
}

interface PaginationResponse {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 🎯 Fonction utilitaire pour validation UUID
function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// 📋 GET - Récupérer les commentaires avec pagination et filtres
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

    const params = querySchema.safeParse({
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
      authorId: searchParams.get("authorId") || undefined,
      postId: searchParams.get("postId") || undefined,
      parentId: searchParams.get("parentId") || undefined,
      search: searchParams.get("search") || undefined,
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
      authorId,
      postId,
      parentId,
      search,
      sortBy,
      sortOrder,
    } = params.data;

    // 🔍 Construction dynamique du filtre WHERE conforme au schéma
    const where: any = {};

    // Filtres de base conformes au schéma
    if (authorId) where.authorId = authorId;
    if (postId) where.postId = postId;
    if (parentId !== undefined) where.parentId = parentId;

    // Recherche textuelle dans le contenu
    if (search?.trim()) {
      where.content = { contains: search.trim(), mode: "insensitive" };
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
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              authorId: true,
            },
          },
          replies: {
            select: {
              id: true,
              content: true,
              order: true,
              createdAt: true,
              authorId: true,
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
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // 🎯 Formatage des données de réponse avec typage strict
    const formattedComments: CommentResponse[] = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      order: comment.order,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      authorId: comment.authorId,
      parentId: comment.parentId,
      author: comment.author,
      post: comment.post,
      parent: comment.parent,
      replies: comment.replies,
      images: comment.images,
      repliesCount: comment._count.replies,
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
      select: { id: true },
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

    // 🔍 Vérification de l'existence du post
    const postExists = await prisma.post.findUnique({
      where: { id: data.postId },
      select: { id: true, published: true },
    });

    if (!postExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Post non trouvé",
          details: "Le post spécifié n'existe pas",
        },
        { status: 404 }
      );
    }

    // 🔍 Vérification du commentaire parent si spécifié
    if (data.parentId) {
      if (!validateUUID(data.parentId)) {
        return NextResponse.json(
          {
            success: false,
            error: "ID parent invalide",
            details: "L'ID du commentaire parent n'est pas un UUID valide",
          },
          { status: 400 }
        );
      }

      const parentExists = await prisma.comment.findUnique({
        where: { 
          id: data.parentId,
          postId: data.postId, // Doit être dans le même post
        },
        select: { id: true },
      });

      if (!parentExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Commentaire parent non trouvé",
            details: "Le commentaire parent spécifié n'existe pas ou n'est pas dans le même post",
          },
          { status: 404 }
        );
      }
    }

    // ✅ Création du commentaire conforme au schéma
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        order: data.order,
        authorId: data.authorId,
        postId: data.postId,
        parentId: data.parentId || null,
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
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
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
      content: comment.content,
      order: comment.order,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      postId: comment.postId,
      authorId: comment.authorId,
      parentId: comment.parentId,
      author: comment.author,
      post: comment.post,
      parent: comment.parent,
      images: comment.images,
      repliesCount: comment._count.replies,
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

    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide",
          details: "L'ID fourni n'est pas un UUID valide",
        },
        { status: 400 }
      );
    }

    // 🔍 Vérifier que le commentaire existe
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        order: true,
        postId: true,
        parentId: true,
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

    // 🔍 Vérification du commentaire parent si modifié
    if (updateData.parentId && updateData.parentId !== existingComment.parentId) {
      if (!validateUUID(updateData.parentId)) {
        return NextResponse.json(
          {
            success: false,
            error: "ID parent invalide",
            details: "L'ID du commentaire parent n'est pas un UUID valide",
          },
          { status: 400 }
        );
      }

      const parentComment = await prisma.comment.findUnique({
        where: {
          id: updateData.parentId,
          postId: existingComment.postId, // Doit être dans le même post
        },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          {
            success: false,
            error: "Commentaire parent non trouvé ou pas dans le même post",
          },
          { status: 404 }
        );
      }

      // Éviter les boucles infinies
      if (updateData.parentId === id) {
        return NextResponse.json(
          {
            success: false,
            error: "Un commentaire ne peut pas être son propre parent",
          },
          { status: 400 }
        );
      }

      // Vérifier qu'on ne crée pas une boucle plus complexe
      let currentParentId: string | null = parentComment.parentId ?? null;
      let depth = 0;
      const maxDepth = 10; // Limite de sécurité

      while (currentParentId && depth < maxDepth) {
        if (currentParentId === id) {
          return NextResponse.json(
            {
              success: false,
              error: "Cette modification créerait une boucle dans la hiérarchie des commentaires",
            },
            { status: 400 }
          );
        }

        const nextParent = await prisma.comment.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        currentParentId = nextParent?.parentId ?? null;
        depth++;
      }
    }

    // ✅ Construction de l'objet de mise à jour conforme au schéma
    const prismaUpdateData: any = {
      updatedAt: new Date(),
    };

    if (updateData.content !== undefined) prismaUpdateData.content = updateData.content;
    if (updateData.order !== undefined) prismaUpdateData.order = updateData.order;
    if (updateData.parentId !== undefined) prismaUpdateData.parentId = updateData.parentId;

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
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            authorId: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
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
      content: updatedComment.content,
      order: updatedComment.order,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      postId: updatedComment.postId,
      authorId: updatedComment.authorId,
      parentId: updatedComment.parentId,
      author: updatedComment.author,
      post: updatedComment.post,
      parent: updatedComment.parent,
      images: updatedComment.images,
      repliesCount: updatedComment._count.replies,
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

    // 🔍 Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2003":
          return NextResponse.json(
            {
              success: false,
              error: "Référence invalide (contrainte de clé étrangère)",
            },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Enregistrement non trouvé",
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
        error: "Erreur lors de la mise à jour du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE - Supprimer un commentaire
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

    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide",
          details: "L'ID fourni n'est pas un UUID valide",
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

    // 🔍 Vérifier s'il y a des réponses
    if (existingComment._count.replies > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer un commentaire qui a des réponses",
          details: `Ce commentaire a ${existingComment._count.replies} réponse(s). Supprimez d'abord les réponses.`,
        },
        { status: 400 }
      );
    }

    // 🗑️ Suppression physique du commentaire
    await prisma.comment.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: existingComment.id,
          content: existingComment.content,
          repliesCount: existingComment._count.replies,
        },
        message: "Commentaire supprimé avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/blog/comments error:", error);

    // 🔍 Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Commentaire non trouvé",
            },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json(
            {
              success: false,
              error: "Impossible de supprimer : des références existent encore",
            },
            { status: 400 }
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
        error: "Erreur lors de la suppression du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
