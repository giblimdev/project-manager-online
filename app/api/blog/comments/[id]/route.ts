// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Interface conforme à votre schéma Prisma exact
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
}

// ✅ Validation UUID simple
function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * GET /api/comments/[id]
 * Récupère un commentaire spécifique avec ses relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CommentResponse | { error: string; details?: string }>> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          details: "L'ID fourni n'est pas un UUID valide",
        },
        { status: 400 }
      );
    }

    // ✅ Requête Prisma conforme au vrai schéma
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
          take: 50, // Limite raisonnable
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
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

    // ✅ Formatage de la réponse conforme au schéma
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
      replies: comment.replies,
      images: comment.images,
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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CommentResponse | { error: string; details?: any }>> {
  try {
    const { id } = await params;
    const body = await request.json();

    // ✅ Validation de l'UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          details: "L'ID fourni n'est pas un UUID valide",
        },
        { status: 400 }
      );
    }

    // ✅ Validation des données entrantes
    const { content, order, parentId } = body;

    // Validation du contenu
    if (content !== undefined) {
      if (typeof content !== 'string') {
        return NextResponse.json(
          { error: "Le contenu doit être une chaîne de caractères" },
          { status: 400 }
        );
      }
      if (content.trim().length === 0) {
        return NextResponse.json(
          { error: "Le contenu ne peut pas être vide" },
          { status: 400 }
        );
      }
      if (content.length > 10000) {
        return NextResponse.json(
          { error: "Le contenu ne peut pas dépasser 10 000 caractères" },
          { status: 400 }
        );
      }
    }

    // Validation de l'ordre
    if (order !== undefined) {
      if (typeof order !== 'number' || !Number.isInteger(order) || order < 0) {
        return NextResponse.json(
          { error: "L'ordre doit être un nombre entier positif" },
          { status: 400 }
        );
      }
    }

    // Validation du parentId
    if (parentId !== undefined && parentId !== null && !validateUUID(parentId)) {
      return NextResponse.json(
        { error: "L'ID du commentaire parent n'est pas valide" },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le commentaire existe
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        parentId: true,
        postId: true,
        content: true,
        order: true,
      },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    // ✅ Vérification du commentaire parent si modifié
    if (parentId && parentId !== existingComment.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: {
          id: parentId,
          postId: existingComment.postId, // Doit être dans le même post
        },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "Commentaire parent non trouvé ou pas dans le même post" },
          { status: 404 }
        );
      }

      // Éviter les boucles infinies
      if (parentId === id) {
        return NextResponse.json(
          { error: "Un commentaire ne peut pas être son propre parent" },
          { status: 400 }
        );
      }

      // ✅ CORRECTION : Gestion correcte du type nullable
      let currentParentId: string | null = parentComment.parentId ?? null;
      let depth = 0;
      const maxDepth = 10; // Limite de sécurité

      while (currentParentId && depth < maxDepth) {
        if (currentParentId === id) {
          return NextResponse.json(
            { error: "Cette modification créerait une boucle dans la hiérarchie des commentaires" },
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

    // ✅ Construction de l'objet de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (content !== undefined) updateData.content = content.trim();
    if (order !== undefined) updateData.order = order;
    if (parentId !== undefined) updateData.parentId = parentId;

    // ✅ Mise à jour du commentaire
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: updateData,
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
          take: 50,
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
          },
        },
      },
    });

    // ✅ Formatage de la réponse
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
      replies: updatedComment.replies,
      images: updatedComment.images,
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
            { error: "Contrainte d'unicité violée" },
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
 * Supprime un commentaire
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ message: string } | { error: string; details?: string }>> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!validateUUID(id)) {
      return NextResponse.json(
        {
          error: "ID invalide",
          details: "L'ID fourni n'est pas un UUID valide",
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le commentaire existe et récupérer ses relations
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        replies: {
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

    // ✅ Vérifier s'il y a des réponses
    if (comment.replies.length > 0) {
      return NextResponse.json(
        {
          error: "Impossible de supprimer un commentaire qui a des réponses",
          details: `Ce commentaire a ${comment.replies.length} réponse(s). Supprimez d'abord les réponses.`,
        },
        { status: 400 }
      );
    }

    // ✅ Suppression du commentaire
    // Les images seront supprimées automatiquement grâce à la cascade
    await prisma.comment.delete({
      where: { id },
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
        case "P2003":
          return NextResponse.json(
            { error: "Impossible de supprimer : des références existent encore" },
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
        error: "Erreur lors de la suppression du commentaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
