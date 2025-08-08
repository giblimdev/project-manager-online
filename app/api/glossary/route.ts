// app/api/glossary/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema de validation pour la création/mise à jour
const glossarySchema = z.object({
  term: z.string().min(1, "Le terme est requis"),
  description: z.string().optional().nullable(),
  type: z
    .enum(["TERM", "ACRONYM", "ABBREVIATION", "CONCEPT", "TEAM", "PROJECT"])
    .default("TERM"),
  order: z.number().int().min(0).default(1000),
  isActive: z.boolean().default(true),
});

const querySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["term", "order", "type", "createdAt", "updatedAt"])
    .default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/glossary
 * Récupère la liste des termes du glossaire avec filtrage et pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Validation des paramètres de requête
    const params = querySchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      isActive:
        searchParams.get("isActive") === "true"
          ? true
          : searchParams.get("isActive") === "false"
          ? false
          : undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
      sortBy: searchParams.get("sortBy") || "order",
      sortOrder: searchParams.get("sortOrder") || "asc",
    });

    if (!params.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: params.error.issues },
        { status: 400 }
      );
    }

    const { search, type, isActive, page, limit, sortBy, sortOrder } =
      params.data;

    // Construction des filtres
    const where: any = {};

    if (search) {
      where.OR = [
        { term: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    // Calcul de la pagination
    const skip = (page - 1) * limit;

    // Exécution des requêtes
    const [terms, totalCount] = await Promise.all([
      prisma.glossary.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.glossary.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      terms,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/glossary error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glossary
 * Crée un nouveau terme dans le glossaire
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des données
    const validation = glossarySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérification de l'unicité du terme
    const existingTerm = await prisma.glossary.findFirst({
      where: {
        term: { equals: data.term, mode: "insensitive" },
        isActive: true,
      },
    });

    if (existingTerm) {
      return NextResponse.json(
        { error: "Un terme avec ce nom existe déjà" },
        { status: 409 }
      );
    }

    // Création du terme
    const newTerm = await prisma.glossary.create({
      data,
    });

    return NextResponse.json(newTerm, { status: 201 });
  } catch (error) {
    console.error("POST /api/glossary error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
