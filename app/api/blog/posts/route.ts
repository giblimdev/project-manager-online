// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/posts
 * Récupère tous les articles avec filtres et pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Récupération des paramètres de pagination et de filtre
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const tagId = searchParams.get("tagId");
    const authorId = searchParams.get("authorId");

    const offset = (page - 1) * limit;

    // 2. Construction de la clause de filtre (WHERE)
    const where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }
    if (categoryId) {
      where.categories = { some: { id: categoryId } };
    }
    if (tagId) {
      // Correction : le nom de la relation est 'tags' dans le schéma Post
      where.tags = { some: { id: tagId } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // 3. Exécution des requêtes en parallèle pour la performance
    const [posts, totalCount] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          categories: true,
          tags: true,
          _count: {
            select: { comments: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    // 4. Calcul des informations de pagination
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
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

/**
 * POST /api/posts
 * Crée un nouvel article.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Sépare les données du post des IDs des relations
    const { categoryIds, tagIds, ...postData } = body;

    // 2. Création de l'article avec ses relations
    const newPost = await prisma.post.create({
      data: {
        ...postData, // title, slug, content, authorId, etc.
        // Connexion des catégories et tags via leurs IDs
        ...(categoryIds && {
          categories: {
            connect: categoryIds.map((id: string) => ({ id })),
          },
        }),
        ...(tagIds && {
          tags: {
            connect: tagIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        author: true,
        categories: true,
        tags: true,
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'article:", error);
    // Erreur si le slug est déjà utilisé (contrainte @unique dans le schéma)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: "Ce slug existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}