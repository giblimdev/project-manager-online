// app/api/blog/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  type CreateCategoryInput,
} from "@/lib/blog/validations/blog";

// ✅ Interface simplifiée pour les réponses
interface CategoryResponse {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
  children?: CategoryResponse[];
  blogTagsCount?: number;
  commentsCount?: number;
}

// ✅ Fonction utilitaire pour construire la hiérarchie
const buildCategoryHierarchy = (
  categories: CategoryResponse[]
): CategoryResponse[] => {
  const categoryMap = new Map<string, CategoryResponse>();
  const rootCategories: CategoryResponse[] = [];

  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const hierarchical = searchParams.get("hierarchical") === "true";
    const includeInactive = searchParams.get("includeInactive") === "true";
    const withCounts = searchParams.get("withCounts") === "true";

    // ✅ Requête Prisma simplifiée selon votre schéma
    const categories = await prisma.categories.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        blog_tags: withCounts ? { select: { id: true } } : false,
        comments: withCounts ? { select: { id: true } } : false,
        categories: {
          // Parent
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
    });

    // ✅ Formatage des données
    const formattedCategories: CategoryResponse[] = categories.map(
      (category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        parentId: category.parentId,
        parent: category.categories || null,
        ...(withCounts && {
          blogTagsCount: Array.isArray(category.blog_tags)
            ? category.blog_tags.length
            : 0,
          commentsCount: Array.isArray(category.comments)
            ? category.comments.length
            : 0,
        }),
      })
    );

    const result = hierarchical
      ? buildCategoryHierarchy(formattedCategories)
      : formattedCategories;

    return NextResponse.json(result);
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

    // ✅ Validation simple avec Zod
    const validationResult = validate.category(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details:
            validationResult.errors?.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data as CreateCategoryInput;

    // ✅ Génération d'un slug unique simple
    let slug = validatedData.slug;
    if (!slug) {
      slug = validatedData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Vérifier l'unicité du slug
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const existingCategory = await prisma.categories.findUnique({
        where: { slug: finalSlug },
      });

      if (!existingCategory) break;
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // ✅ Vérification simple du parent si spécifié
    if (validatedData.parentId) {
      const parentCategory = await prisma.categories.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: "Catégorie parent introuvable" },
          { status: 404 }
        );
      }
    }

    // ✅ Création de la catégorie
    const category = await prisma.categories.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name.trim(),
        slug: finalSlug,
        description: validatedData.description?.trim() || null,
        color: validatedData.color || null,
        parentId: validatedData.parentId || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // ✅ Réponse formatée
    const response: CategoryResponse = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parentId: category.parentId,
      parent: category.categories || null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la catégorie:", error);

    // ✅ Gestion simple des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Une catégorie avec ce slug existe déjà" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Référence parent invalide" },
            { status: 400 }
          );
      }
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la catégorie" },
      { status: 500 }
    );
  }
}
