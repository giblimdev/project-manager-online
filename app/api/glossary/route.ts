// 📄 /app/api/glossary/route.ts
// 🎯 Rôle : API route principale pour la gestion des termes du glossaire
// 📦 Responsabilités : CRUD des termes (GET, POST uniquement - pas de paramètres dynamiques)
// 🔧 Composants utilisés : NextResponse, Prisma Client, Zod pour validation
// 🌐 Base de données : PostgreSQL via Prisma

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

// 🔧 Schémas de validation Zod
const glossarySchema = z.object({
  term: z
    .string()
    .min(1, "Le terme est requis")
    .max(255, "Le terme ne peut pas dépasser 255 caractères"),
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

// 📋 GET - Récupérer tous les termes du glossaire avec pagination et filtres
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;

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
      sortBy: (searchParams.get("sortBy") as any) || "order",
      sortOrder: (searchParams.get("sortOrder") as any) || "asc",
    });

    if (!params.success) {
      return NextResponse.json(
        {
          error: "Paramètres de requête invalides",
          details: params.error.issues,
        },
        { status: 400 }
      );
    }

    const { search, type, isActive, page, limit, sortBy, sortOrder } =
      params.data;

    // Construction dynamique du filtre WHERE
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

    const skip = (page - 1) * limit;

    // Exécution parallèle des requêtes
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

    return NextResponse.json(
      {
        success: true,
        data: {
          terms,
          pagination: {
            totalCount,
            totalPages,
            currentPage: page,
            pageSize: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/glossary error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des termes du glossaire",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ➕ POST - Créer un nouveau terme du glossaire
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = glossarySchema.safeParse(body);

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

    // Vérification de l'unicité du terme
    const existingTerm = await prisma.glossary.findFirst({
      where: {
        term: { equals: data.term, mode: "insensitive" },
        isActive: true,
      },
    });

    if (existingTerm) {
      return NextResponse.json(
        {
          success: false,
          error: "Terme déjà existant",
          details: "Un terme avec ce nom existe déjà dans le glossaire",
        },
        { status: 409 }
      );
    }

    // Création du nouveau terme
    const newTerm = await prisma.glossary.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: newTerm,
        message: "Terme créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/glossary error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du terme",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
