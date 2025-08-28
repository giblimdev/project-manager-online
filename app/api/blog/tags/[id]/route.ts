// app/api/tags/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Interface pour les paramètres de la route
interface RouteParams {
  params: Promise<{ id: string }>; // Change to Promise
}

/**
 * GET /api/tags/[id]
 * Récupère un tag par son ID.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await the params to resolve the Promise

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        category: true,
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Erreur lors de la récupération du tag:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

/**
 * PUT /api/tags/[id]
 * Met à jour un tag existant.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await the params
    const body = await request.json();

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json(
        { error: "Un tag avec ce nom ou ce slug existe déjà." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/[id]
 * Supprime un tag.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Await the params

    // Vérifier si le tag est utilisé par des articles
    const tagWithPosts = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tagWithPosts) {
      return NextResponse.json({ error: "Tag non trouvé" }, { status: 404 });
    }

    if (tagWithPosts._count.posts > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer, ce tag est utilisé par ${tagWithPosts._count.posts} article(s).`,
        },
        { status: 400 }
      );
    }

    // Supprimer le tag
    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Tag supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du tag:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}