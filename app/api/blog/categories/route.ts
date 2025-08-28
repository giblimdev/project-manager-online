// app/api/blog/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Interface simplifiée pour les réponses
interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  order: number;
  postsCount?: number;
  tagsCount?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const withCounts = searchParams.get("withCounts") === "true";

    // ✅ Requête Prisma corrigée selon le schéma
    const categories = await prisma.category.findMany({
      include: {
        posts: withCounts ? { select: { id: true } } : false,
        tags: withCounts ? { select: { id: true } } : false,
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    // ✅ Formatage des données selon le schéma
    const formattedCategories: CategoryResponse[] = categories.map(
      (category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        order: category.order,
        ...(withCounts && {
          postsCount: Array.isArray(category.posts) ? category.posts.length : 0,
          tagsCount: Array.isArray(category.tags) ? category.tags.length : 0,
        }),
      })
    );

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Erreur lors de la récupération des catégories:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des catégories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // ✅ Validation basique
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Le nom de la catégorie est requis" },
        { status: 400 }
      );
    }

    // ✅ Génération d'un slug unique
    const baseSlug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let finalSlug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingCategory = await prisma.category.findUnique({
        where: { slug: finalSlug },
      });

      if (!existingCategory) break;
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // ✅ Création de la catégorie selon le schéma
    const category = await prisma.category.create({
      data: {
        name: body.name.trim(),
        slug: finalSlug,
        order: body.order || 10,
      },
    });

    // ✅ Réponse formatée
    const response: CategoryResponse = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      order: category.order,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);

    // ✅ Gestion des erreurs Prisma
    if (error instanceof Error && "code" in error) {
      const prismaError = error as { code: string };
      
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "Une catégorie avec ce nom ou slug existe déjà" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}