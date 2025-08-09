// app/api/projects/route.ts

/**
 * RÔLE : API Route simplifiée pour la gestion des projets
 * RESPONSABILITÉS :
 * - GET: Récupérer la liste des projets sans relations
 * - POST: Créer un nouveau projet avec validation de base
 * - Gestion des erreurs Prisma
 * - Réponses JSON standardisées
 *
 * COMPOSANTS UTILISÉS :
 * - PrismaClient du schéma généré (@/lib/generated/prisma/client)
 * - Types ProjectSimple, ApiResponse (@/types/project)
 * - Next.js 15 App Router API
 *
 * LIBS UTILISÉS :
 * - @prisma/client (généré)
 * - Next.js Request/Response
 * - TypeScript strict mode
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  ProjectSimple,
  ApiResponse,
  CreateProjectData,
} from "@/types/project";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// GET /api/projects - Récupérer tous les projets (sans relations)
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("🔄 API /api/projects - GET appelé");

  try {
    // Extraction des paramètres optionnels
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Connexion à la base de données
    await prisma.$connect();
    console.log("✅ Connexion DB établie");

    // Construction des conditions WHERE
    const whereConditions: any = {
      isActive: true,
    };

    if (status) {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { key: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    // Récupération des projets sans relations
    const projects = await prisma.project.findMany({
      where: whereConditions,
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
      },
      orderBy: {
        order: "asc",
      },
    });

    console.log(`✅ ${projects.length} projets récupérés`);

    // Transformation des données pour assurer la compatibilité TypeScript
    const validProjects: ProjectSimple[] = projects.map((project) => ({
      ...project,
      settings: (project.settings as Record<string, any>) || {},
      metadata: (project.metadata as Record<string, any>) || {},
    }));

    const response: ApiResponse<ProjectSimple[]> = {
      success: true,
      data: validProjects,
      message: `${validProjects.length} projets récupérés avec succès`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("💥 Erreur API /api/projects:", error);

    // Gestion des erreurs Prisma
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as any;

      switch (prismaError.code) {
        case "P1001":
          return NextResponse.json(
            {
              success: false,
              error: "Impossible de se connecter à la base de données",
              message: "Vérifiez que PostgreSQL est démarré",
              timestamp: new Date().toISOString(),
            } as ApiResponse,
            { status: 503 }
          );

        case "P2021":
          return NextResponse.json(
            {
              success: false,
              error: "Table 'projects' introuvable",
              message: "Exécutez 'npx prisma db push'",
              timestamp: new Date().toISOString(),
            } as ApiResponse,
            { status: 500 }
          );

        default:
          console.error("Erreur Prisma:", prismaError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors du chargement des projets",
        timestamp: new Date().toISOString(),
      } as ApiResponse,
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("🔄 API /api/projects - POST appelé");

  try {
    const body: CreateProjectData = await request.json();
    console.log("📦 Données reçues:", body);

    // Validation des champs obligatoires
    const requiredFields: (keyof CreateProjectData)[] = ["name", "slug", "key"];
    const missingFields = requiredFields.filter(
      (field) => !body[field]?.toString().trim()
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs obligatoires manquants",
          message: `Les champs suivants sont obligatoires: ${missingFields.join(
            ", "
          )}`,
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validation des formats
    if (body.key && !/^[A-Z][A-Z0-9]*$/.test(body.key)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de clé invalide",
          message: "La clé doit commencer par une lettre majuscule",
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (body.slug && !/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de slug invalide",
          message:
            "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets",
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Connexion DB
    await prisma.$connect();

    // Vérification de l'unicité
    const existingProject = await prisma.project.findFirst({
      where: {
        OR: [{ slug: body.slug }, { key: body.key }],
      },
    });

    if (existingProject) {
      const conflictField = existingProject.slug === body.slug ? "slug" : "key";
      return NextResponse.json(
        {
          success: false,
          error: "Conflit de données",
          message: `Un projet avec ce ${conflictField} existe déjà`,
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 409 }
      );
    }

    // Préparation des données
    const projectData = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      slug: body.slug.trim(),
      key: body.key.trim().toUpperCase(),
      order: typeof body.order === "number" ? body.order : 1000,
      status: body.status || "ACTIVE",
      visibility: body.visibility || "PRIVATE",
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      settings: {},
      metadata: {},
      isActive: true,
    };

    // Validation des dates
    if (
      projectData.startDate &&
      projectData.endDate &&
      projectData.startDate >= projectData.endDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Dates invalides",
          message: "La date de fin doit être postérieure à la date de début",
          timestamp: new Date().toISOString(),
        } as ApiResponse,
        { status: 400 }
      );
    }

    console.log("💾 Création du projet:", projectData.name);

    // Création du projet
    const project = await prisma.project.create({
      data: projectData,
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
      },
    });

    console.log("✅ Projet créé avec l'ID:", project.id);

    const response: ApiResponse<ProjectSimple> = {
      success: true,
      data: {
        ...project,
        settings: (project.settings as Record<string, any>) || {},
        metadata: (project.metadata as Record<string, any>) || {},
      },
      message: "Projet créé avec succès",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("💥 Erreur création projet:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as any;

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            error: "Contrainte d'unicité violée",
            message: "Un projet avec ces informations existe déjà",
            timestamp: new Date().toISOString(),
          } as ApiResponse,
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création",
        message: "Impossible de créer le projet",
        timestamp: new Date().toISOString(),
      } as ApiResponse,
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
