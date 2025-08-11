// app/api/projects/[id]/route.ts

/**
 * RÔLE : API Route pour la gestion d'un projet spécifique (CRUD)
 *
 * RESPONSABILITÉS :
 * - GET: Récupérer un projet par son ID avec ses relations complètes selon le schéma Prisma
 * - PUT: Mettre à jour un projet existant avec validation complète des champs
 * - DELETE: Supprimer un projet après vérification des dépendances et contraintes
 * - Validation des ID avec support UUID et CUID (compatibilité Prisma)
 * - Gestion d'erreurs robuste avec codes HTTP appropriés et messages explicites
 * - Interface typée conforme au schéma Prisma Project avec Next.js 15 API routes
 * - Réponses JSON structurées avec timestamps et détails d'erreur
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest/NextResponse de Next.js 15 pour l'API routes async
 * - Prisma Client pour les requêtes base de données PostgreSQL
 * - Validation CUID/UUID avec regex appropriées pour Prisma
 * - Gestion d'erreurs Prisma avec codes spécifiques (P2025, P2002, P2003)
 *
 * LIBS UTILISÉS :
 * - Next.js 15 API routes avec paramètres selon contraintes TypeScript strictes
 * - Prisma ORM pour PostgreSQL selon schéma fourni avec relations optimisées
 * - TypeScript strict mode avec interfaces complètes et validation de types
 * - Validation d'ID robuste (UUID + CUID support) avec regex personnalisées
 * - Date-fns pour manipulation des dates ISO et validation des plages
 *
 * API :
 * - GET /api/projects/[id] - Récupération d'un projet avec relations (members, initiatives, features, _count)
 * - PUT /api/projects/[id] - Mise à jour d'un projet avec validation des contraintes
 * - DELETE /api/projects/[id] - Suppression d'un projet avec vérification des dépendances
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Interface pour les requêtes de mise à jour selon votre schéma Prisma
interface UpdateProjectRequest {
  name?: string;
  description?: string | null;
  slug?: string;
  key?: string;
  order?: number;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  visibility?: string;
  isActive?: boolean;
  settings?: any;
  metadata?: any;
}

// Interface pour les réponses de projet avec toutes les propriétés selon votre schéma
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
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    isActive: boolean;
  }[];
  members?: {
    id: string;
    role: string;
    joinedAt: Date;
    isActive: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  initiatives?: {
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  features?: {
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    storyPoints: number | null;
    position: number;
  }[];
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

// Interfaces pour les réponses d'erreur et de succès
interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  timestamp: string;
}

interface SuccessDataResponse {
  success: true;
  data: ProjectResponse;
  message?: string;
  timestamp: string;
}

interface SuccessMessageResponse {
  success: true;
  message: string;
  timestamp: string;
}

// Interface pour les paramètres conforme aux contraintes TypeScript Next.js 15
interface RouteContext {
  params: Promise<{ id: string; [key: string]: string | string[] | undefined }>;
}

// Validation d'ID pour UUID et CUID (Prisma par défaut)
function isValidId(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const cuidRegex = /^c[^\s-]{8,}$/i;
  const cuid2Regex = /^[a-z][a-z0-9]*$/i;
  return uuidRegex.test(id) || cuidRegex.test(id) || cuid2Regex.test(id);
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" && err !== null && "code" in err && "message" in err
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Erreur inconnue";
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 50);
}

/**
 * GET /api/projects/[id]
 * Récupère un projet spécifique avec ses relations
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<SuccessDataResponse | ErrorResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // ✅ CORRECTION: Await params to handle Next.js 15 dynamic route behavior
    const { id } = await context.params;

    console.log("🔍 API GET /api/projects/[id] - ID reçu:", id);

    // Validation de l'ID avec support UUID/CUID
    if (!id || typeof id !== "string" || !isValidId(id)) {
      console.error("❌ Format ID invalide:", id);
      return NextResponse.json(
        {
          success: false,
          error: "Format ID invalide",
          details: `La valeur '${id}' n'est pas un ID valide (UUID ou CUID attendu)`,
          timestamp,
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    console.log("✅ Validation ID OK, requête Prisma...");

    // Requête Prisma selon votre schéma avec toutes les relations
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            isActive: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
          take: 50,
        },
        initiatives: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            progress: true,
            startDate: true,
            endDate: true,
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: 20,
        },
        features: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            progress: true,
            storyPoints: true,
            position: true,
          },
          orderBy: { position: "asc" },
          take: 30,
        },
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

    if (!project) {
      console.error("❌ Projet non trouvé pour ID:", id);
      return NextResponse.json(
        {
          success: false,
          error: "Projet non trouvé",
          details: `Aucun projet trouvé avec l'ID: ${id}`,
          timestamp,
        } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    console.log("✅ Projet trouvé:", project.name);

    // Formatage de la réponse avec conversion des données
    const response: SuccessDataResponse = {
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        slug: project.slug,
        key: project.key,
        order: project.order,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        visibility: project.visibility,
        settings: project.settings,
        metadata: project.metadata,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        user: project.user,
        members: project.members,
        initiatives: project.initiatives?.map((initiative) => ({
          ...initiative,
          progress: Math.round((initiative.progress || 0) * 100),
        })),
        features: project.features?.map((feature) => ({
          ...feature,
          progress: Math.round((feature.progress || 0) * 100),
        })),
        _count: project._count,
      },
      timestamp,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("💥 Erreur lors de la récupération du projet:", error);

    // Gestion spécifique des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Projet non trouvé",
              details: "Le projet demandé n'existe pas en base de données",
              timestamp,
            } satisfies ErrorResponse,
            { status: 404 }
          );
        case "P2021":
          return NextResponse.json(
            {
              success: false,
              error: "Table non trouvée",
              details:
                "La table 'projects' n'existe pas dans la base de données",
              timestamp,
            } satisfies ErrorResponse,
            { status: 500 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du projet",
        details: getErrorMessage(error),
        timestamp,
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Met à jour un projet existant
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<SuccessDataResponse | ErrorResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // ✅ CORRECTION: Await params to handle Next.js 15 dynamic route behavior
    const { id } = await context.params;

    // Validation de l'ID
    if (!id || typeof id !== "string" || !isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format ID invalide",
          details: `La valeur '${id}' n'est pas un ID valide (UUID ou CUID attendu)`,
          timestamp,
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Validation du JSON body
    let body: UpdateProjectRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Corps de requête JSON invalide",
          details: "Le corps de la requête doit être un JSON valide",
          timestamp,
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Vérification de l'existence du projet
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true, slug: true, key: true, name: true },
    });

    if (!existingProject) {
      return NextResponse.json(
        {
          success: false,
          error: "Projet non trouvé",
          details: `Aucun projet trouvé avec l'ID: ${id}`,
          timestamp,
        } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    // Validation des champs
    const updateData: UpdateProjectRequest = {};
    if (body.name) {
      updateData.name = body.name;
      updateData.slug = generateSlug(body.name);
    }
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.key) updateData.key = body.key.toUpperCase().substring(0, 10);
    if (body.order !== undefined) updateData.order = body.order;
    if (body.startDate !== undefined)
      updateData.startDate = body.startDate
        ? new Date(body.startDate).toISOString()
        : null;
    if (body.endDate !== undefined)
      updateData.endDate = body.endDate
        ? new Date(body.endDate).toISOString()
        : null;
    if (body.status) updateData.status = body.status;
    if (body.visibility) updateData.visibility = body.visibility;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.settings) updateData.settings = body.settings;
    if (body.metadata) updateData.metadata = body.metadata;

    // Validation des contraintes
    if (body.name && body.name.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Nom invalide",
          details: "Le nom du projet doit contenir au moins 3 caractères",
          timestamp,
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    if (body.key) {
      const keyExists = await prisma.project.findFirst({
        where: { key: body.key.toUpperCase(), NOT: { id } },
      });
      if (keyExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Clé déjà utilisée",
            details: `La clé '${body.key}' est déjà utilisée par un autre projet`,
            timestamp,
          } satisfies ErrorResponse,
          { status: 400 }
        );
      }
    }

    if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      if (start > end) {
        return NextResponse.json(
          {
            success: false,
            error: "Dates invalides",
            details: "La date de début doit être antérieure à la date de fin",
            timestamp,
          } satisfies ErrorResponse,
          { status: 400 }
        );
      }
    }

    // Mise à jour du projet
    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            isActive: true,
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
          take: 50,
        },
        initiatives: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            progress: true,
            startDate: true,
            endDate: true,
          },
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
          take: 20,
        },
        features: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            progress: true,
            storyPoints: true,
            position: true,
          },
          orderBy: { position: "asc" },
          take: 30,
        },
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description,
          slug: updatedProject.slug,
          key: updatedProject.key,
          order: updatedProject.order,
          startDate: updatedProject.startDate,
          endDate: updatedProject.endDate,
          status: updatedProject.status,
          visibility: updatedProject.visibility,
          settings: updatedProject.settings,
          metadata: updatedProject.metadata,
          isActive: updatedProject.isActive,
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          user: updatedProject.user,
          members: updatedProject.members,
          initiatives: updatedProject.initiatives?.map((initiative) => ({
            ...initiative,
            progress: Math.round((initiative.progress || 0) * 100),
          })),
          features: updatedProject.features?.map((feature) => ({
            ...feature,
            progress: Math.round((feature.progress || 0) * 100),
          })),
          _count: updatedProject._count,
        },
        message: "Projet mis à jour avec succès",
        timestamp,
      } satisfies SuccessDataResponse,
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("💥 Erreur lors de la mise à jour du projet:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Projet non trouvé",
              details: "Le projet demandé n'existe pas en base de données",
              timestamp,
            } satisfies ErrorResponse,
            { status: 404 }
          );
        case "P2002":
          return NextResponse.json(
            {
              success: false,
              error: "Conflit de données",
              details: "Une contrainte unique a été violée (slug ou clé)",
              timestamp,
            } satisfies ErrorResponse,
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour du projet",
        details: getErrorMessage(error),
        timestamp,
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Supprime un projet avec vérification des dépendances
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<SuccessMessageResponse | ErrorResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // ✅ CORRECTION: Await params to handle Next.js 15 dynamic route behavior
    const { id } = await context.params;

    // Validation de l'ID
    if (!id || typeof id !== "string" || !isValidId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format ID invalide",
          details: `La valeur '${id}' n'est pas un ID valide (UUID ou CUID attendu)`,
          timestamp,
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Vérification des dépendances
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
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

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Projet non trouvé",
          details: `Aucun projet trouvé avec l'ID: ${id}`,
          timestamp,
        } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    // Vérification des dépendances actives
    if (
      project._count.initiatives > 0 ||
      project._count.features > 0 ||
      project._count.sprints > 0 ||
      project._count.members > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Dépendances actives",
          details:
            "Le projet ne peut pas être supprimé car il contient des initiatives, features, sprints ou membres actifs",
          timestamp,
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // Suppression du projet
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Projet supprimé avec succès",
        timestamp,
      } satisfies SuccessMessageResponse,
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("💥 Erreur lors de la suppression du projet:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            {
              success: false,
              error: "Projet non trouvé",
              details: "Le projet demandé n'existe pas en base de données",
              timestamp,
            } satisfies ErrorResponse,
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json(
            {
              success: false,
              error: "Contrainte de dépendance",
              details:
                "Le projet ne peut pas être supprimé en raison de dépendances existantes",
              timestamp,
            } satisfies ErrorResponse,
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression du projet",
        details: getErrorMessage(error),
        timestamp,
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}
