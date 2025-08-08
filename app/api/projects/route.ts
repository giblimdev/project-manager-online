// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Interface simple pour la création de projet
interface CreateProjectRequest {
  name: string;
  description?: string;
  key: string;
  status?: string;
  visibility?: string;
  isActive?: boolean;
}

// ✅ Interface simple pour la réponse
interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: any;
  metadata: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    initiatives: number;
    features: number;
    sprints: number;
    files: number;
    channels: number;
    templates: number;
    members: number;
  };
}

// ✅ Fonction utilitaire pour générer un slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 50);
}

// ✅ Fonction utilitaire pour les erreurs
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Erreur inconnue";
}

/**
 * GET /api/projects
 * Récupère tous les projets
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );
    const status = searchParams.get("status");
    const isActive = searchParams.get("isActive");

    // Construction du filtre simple
    const where: any = {};
    if (status) where.status = status;
    if (isActive !== null) where.isActive = isActive === "true";

    const skip = (page - 1) * limit;

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { order: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          key: true,
          order: true,
          startDate: true,
          endDate: true,
          status: true,
          visibility: true,
          settings: true,
          metadata: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              initiatives: true,
              features: true,
              sprints: true,
              files: true,
              channels: true,
              templates: true,
              members: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: projects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/projects:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des projets",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Crée un nouveau projet
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: CreateProjectRequest;

    // Validation du JSON
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corps de requête JSON invalide" },
        { status: 400 }
      );
    }

    // Validation des champs obligatoires
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Le nom du projet est obligatoire" },
        { status: 400 }
      );
    }

    if (!body.key || !body.key.trim()) {
      return NextResponse.json(
        { error: "La clé du projet est obligatoire" },
        { status: 400 }
      );
    }

    // Validation de la clé (format)
    if (!/^[A-Z0-9]{2,10}$/.test(body.key)) {
      return NextResponse.json(
        {
          error:
            "La clé doit contenir 2-10 caractères majuscules et chiffres uniquement",
        },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const key = body.key.trim();
    const slug = generateSlug(name);

    // Vérification de l'unicité
    const existingProject = await prisma.project.findFirst({
      where: {
        OR: [{ key }, { slug }],
      },
      select: { key: true, slug: true, name: true },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          error: "Un projet avec cette clé ou ce nom existe déjà",
          details: `Conflit avec le projet "${existingProject.name}"`,
        },
        { status: 409 }
      );
    }

    // Calcul de l'ordre
    const maxOrder = await prisma.project.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order || 0) + 1000;

    // Création du projet
    const project = await prisma.project.create({
      data: {
        name,
        description: body.description?.trim() || null,
        key,
        slug,
        order: newOrder,
        status: body.status || "ACTIVE",
        visibility: body.visibility || "PRIVATE",
        isActive: body.isActive !== false,
        settings: {},
        metadata: {},
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        key: true,
        order: true,
        startDate: true,
        endDate: true,
        status: true,
        visibility: true,
        settings: true,
        metadata: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            initiatives: true,
            features: true,
            sprints: true,
            files: true,
            channels: true,
            templates: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/projects:", error);

    // Gestion des erreurs Prisma
    if (typeof error === "object" && error !== null && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Un projet avec ces informations existe déjà" },
            { status: 409 }
          );
        case "P2000":
          return NextResponse.json(
            { error: "Une valeur fournie est trop longue" },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", prismaError.code);
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création du projet",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
