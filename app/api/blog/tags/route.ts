// app/api/tags/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fonction utilitaire pour générer un slug
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")    // Supprimer les caractères non alphanumériques
    .replace(/[\s_-]+/g, "-")    // Remplacer les espaces par des tirets
    .replace(/^-+|-+$/g, "");      // Supprimer les tirets au début/fin
};

/**
 * GET /api/tags
 * Récupère tous les tags avec filtres et pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Récupération des paramètres de l'URL
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const offset = (page - 1) * limit;

    // 2. Construction de la clause de filtre (WHERE)
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (categoryId) {
      where.categoryId = categoryId; // Correction du nom de champ
    }

    // 3. Exécution des requêtes pour les données et le comptage total
    const [tags, totalCount] = await prisma.$transaction([
      prisma.tag.findMany({ // Correction du nom du modèle
        where,
        include: {
          category: true, // Correction du nom de la relation
          _count: {
            select: { posts: true }, // Correction du comptage de la relation
          },
        },
        orderBy: { name: "asc" },
        skip: offset,
        take: limit,
      }),
      prisma.tag.count({ where }), // Correction du nom du modèle
    ]);

    // 4. Calcul de la pagination
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tags,
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
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Crée un nouveau tag.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Le nom du tag est requis." }, { status: 400 });
    }

    // Création du tag avec un slug généré automatiquement
    const newTag = await prisma.tag.create({ // Correction du nom du modèle
      data: {
        ...body,
        slug: generateSlug(name), // Ajout de la génération du slug
      },
    });

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du tag:", error);
    // Gère les erreurs de contraintes uniques (nom, slug)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        return NextResponse.json({ error: "Un tag avec ce nom ou ce slug existe déjà." }, { status: 409 });
    }
    // Gère les erreurs de clé étrangère (categoryId invalide)
    if (error instanceof Error && 'code' in error && (error as any).code === 'P2003') {
        return NextResponse.json({ error: "La catégorie spécifiée n'existe pas." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}