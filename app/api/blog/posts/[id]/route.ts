

// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Updated params type to handle Promise wrapper
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/posts/[id]
 * Récupère un article spécifique par son ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await the params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        categories: true,
        tags: true,
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

/**
 * PUT /api/posts/[id]
 * Met à jour un article existant.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await the params
    const body = await request.json();

    // Sépare les données du post des IDs de relations
    const { categoryIds, tagIds, ...postData } = body;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(categoryIds && {
          categories: {
            set: categoryIds.map((catId: string) => ({ id: catId })),
          },
        }),
        ...(tagIds && {
          tags: {
            set: tagIds.map((tagId: string) => ({ id: tagId })),
          },
        }),
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${updatedPost.slug}`);
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/posts/[id]
 * Supprime un article.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await the params

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Article non trouvé" }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id },
    });

    revalidatePath("/blog");

    return NextResponse.json({ message: "Article supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}