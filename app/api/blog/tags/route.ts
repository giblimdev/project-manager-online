// app/api/blog/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  validateUUID,
  type CreateBlogTagInput,
  type ValidationResult,
  VALIDATION_MESSAGES,
} from "@/lib/blog/validations/blog";
import type { Visibility } from "@/lib/generated/prisma/client";

// ✅ Interface pour les réponses de tags
interface BlogTagResponse {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoriesId: string | null;
  category?: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    color: string | null;
    isActive: boolean;
  } | null;
  _count?: {
    comments: number;
  };
}

// ✅ Fonction utilitaire pour générer un slug
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Supprimer les caractères spéciaux
    .replace(/[\s_-]+/g, "-") // Remplacer espaces et underscores par des tirets
    .replace(/^-+|-+$/g, ""); // Supprimer les tirets en début et fin
};

/**
 * GET /api/blog/tags
 * Récupère tous les tags de blog avec filtres
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<
    | {
        tags: BlogTagResponse[];
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
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const withCounts = searchParams.get("withCounts") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );

    // ✅ Validation UUID si fourni
    if (categoryId && !validateUUID(categoryId)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide pour categoryId",
          details: VALIDATION_MESSAGES.INVALID_UUID,
        },
        { status: 400 }
      );
    }

    // ✅ Construction de la clause WHERE typée
    interface WhereClause {
      isActive?: boolean;
      categoriesId?: string;
      AND?: Array<{
        name: {
          contains: string;
          mode: "insensitive";
        };
      }>;
    }

    const where: WhereClause = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoriesId = categoryId;
    }

    // Recherche textuelle
    if (search?.trim()) {
      where.AND = [
        {
          name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const offset = (page - 1) * limit;

    // ✅ Requête Prisma conforme à votre schéma
    const [tags, totalCount] = await Promise.all([
      prisma.blog_tags.findMany({
        where,
        include: {
          categories: includeInactive
            ? {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  color: true,
                  isActive: true,
                },
              }
            : {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  color: true,
                  isActive: true,
                },
              },
          ...(withCounts && {
            comments: {
              where: { isActive: true },
              select: { id: true },
            },
          }),
        },
        orderBy: [{ name: "asc" }],
        skip: offset,
        take: limit,
      }),
      prisma.blog_tags.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // ✅ Formatage des données de réponse
    const formattedTags: BlogTagResponse[] = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      categoriesId: tag.categoriesId,
      category: tag.categories || null,
      ...(withCounts && {
        _count: {
          comments: Array.isArray(tag.comments) ? tag.comments.length : 0,
        },
      }),
    }));

    return NextResponse.json({
      tags: formattedTags,
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
    console.error("Erreur lors de la récupération des tags:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des tags",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blog/tags
 * Crée un nouveau tag de blog
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<BlogTagResponse | { error: string; details?: any }>> {
  try {
    const body = await request.json();

    // ✅ Validation avec votre système Zod corrigé
    const validationResult = validate.blogTag(body);

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

    const data = validationResult.data as CreateBlogTagInput;

    // ✅ Vérification que la catégorie existe si spécifiée
    if (data.categoriesId) {
      if (!validateUUID(data.categoriesId)) {
        return NextResponse.json(
          { error: VALIDATION_MESSAGES.INVALID_UUID },
          { status: 400 }
        );
      }

      const category = await prisma.categories.findUnique({
        where: {
          id: data.categoriesId,
          isActive: true,
        },
        select: { id: true, name: true },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Catégorie non trouvée ou inactive" },
          { status: 404 }
        );
      }
    }

    // ✅ Vérification de l'unicité du nom
    const existingTag = await prisma.blog_tags.findFirst({
      where: {
        name: {
          equals: data.name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Un tag avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // ✅ Création du tag selon votre schéma Prisma
    const tag = await prisma.blog_tags.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        color: data.color || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        categoriesId: data.categoriesId || null,
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            isActive: true,
          },
        },
      },
    });

    // ✅ Formatage de la réponse
    const response: BlogTagResponse = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      isActive: tag.isActive,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      categoriesId: tag.categoriesId,
      category: tag.categories || null,
    };

    // ✅ Revalidation des chemins concernés
    try {
      // Note: revalidatePath nécessite d'être importé depuis next/cache
      // import { revalidatePath } from "next/cache";
      // revalidatePath("/blog/tags");
      // revalidatePath("/api/blog/tags");
    } catch (error) {
      console.warn("Erreur lors de la revalidation:", error);
      // Non-bloquant
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du tag:", error);

    // ✅ Gestion des erreurs Prisma spécifiques
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Un tag avec ce nom existe déjà" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Référence invalide (catégorie inexistante)" },
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
        error: "Erreur lors de la création du tag",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
