// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Interface pour les requêtes de mise à jour selon votre schéma
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

// ✅ Interface pour les réponses selon votre schéma Prisma
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
    progress: number; // Converti en pourcentage
    startDate: Date | null;
    endDate: Date | null;
  }[];
  features?: {
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number; // Converti en pourcentage
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

// ✅ Interfaces pour les réponses d'erreur
interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  message: string;
}

// ✅ Interface pour les paramètres de route Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Fonctions utilitaires
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplace par des tirets
    .replace(/(^-|-$)/g, "") // Supprime les tirets en début/fin
    .substring(0, 50); // Limite la longueur
}

/**
 * GET /api/projects/[id]
 * Récupère un projet spécifique avec ses relations
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ProjectResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide",
          details: `La valeur '${id}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Requête Prisma selon votre schéma
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
          take: 20, // Limiter pour les performances
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
          take: 10,
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
          take: 15,
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
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // ✅ Formatage de la réponse avec conversion des données
    const response: ProjectResponse = {
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
        progress: Math.round((initiative.progress || 0) * 100), // Float -> pourcentage
      })),
      features: project.features?.map((feature) => ({
        ...feature,
        progress: Math.round((feature.progress || 0) * 100), // Float -> pourcentage
      })),
      _count: project._count,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération du projet:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du projet",
        details: getErrorMessage(error),
      },
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
  { params }: RouteParams
): Promise<NextResponse<ProjectResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide",
          details: `La valeur '${id}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Validation du JSON body
    let body: UpdateProjectRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corps de requête JSON invalide" },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le projet existe
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true, slug: true, key: true, name: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // ✅ Validation des champs obligatoires
    if (
      body.name !== undefined &&
      (!body.name || body.name.trim().length < 2)
    ) {
      return NextResponse.json(
        { error: "Le nom du projet doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    if (body.key !== undefined && body.key) {
      if (!/^[A-Z0-9]{2,10}$/.test(body.key)) {
        return NextResponse.json(
          {
            error:
              "La clé doit contenir 2-10 caractères majuscules et chiffres uniquement",
          },
          { status: 400 }
        );
      }
    }

    // ✅ Génération du slug si le nom change
    let slug = existingProject.slug;
    if (body.name && body.name !== existingProject.name) {
      slug = generateSlug(body.name);
    }
    if (body.slug) {
      slug = generateSlug(body.slug);
    }

    // ✅ Vérifier l'unicité du slug et de la clé
    if (body.key !== existingProject.key || slug !== existingProject.slug) {
      const conflictingProject = await prisma.project.findFirst({
        where: {
          NOT: { id },
          OR: [{ slug }, ...(body.key ? [{ key: body.key }] : [])],
        },
        select: { slug: true, key: true, name: true },
      });

      if (conflictingProject) {
        return NextResponse.json(
          {
            error: "Un projet avec cette clé ou cette URL existe déjà",
            details: `Conflit avec le projet "${conflictingProject.name}"`,
          },
          { status: 409 }
        );
      }
    }

    // ✅ Validation des dates
    let startDate = undefined;
    let endDate = undefined;

    if (body.startDate) {
      startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Format de date de début invalide" },
          { status: 400 }
        );
      }
    }

    if (body.endDate) {
      endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Format de date de fin invalide" },
          { status: 400 }
        );
      }
    }

    if (startDate && endDate && endDate <= startDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    // ✅ Préparation des données de mise à jour
    const updateData: any = {
      ...body,
      slug,
      updatedAt: new Date(),
    };

    if (body.name) {
      updateData.name = body.name.trim();
    }
    if (startDate !== undefined) {
      updateData.startDate = startDate;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate;
    }

    // ✅ Mise à jour du projet
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
          take: 20,
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
          orderBy: { createdAt: "desc" },
          take: 5,
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
          take: 5,
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

    // ✅ Formatage de la réponse
    const response: ProjectResponse = {
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
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du projet:", error);

    // ✅ Gestion des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Projet non trouvé" },
            { status: 404 }
          );
        case "P2002":
          return NextResponse.json(
            { error: "Un projet avec ces informations existe déjà" },
            { status: 409 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du projet",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Supprime un projet après vérification des dépendances
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Validation de l'UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide",
          details: `La valeur '${id}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le projet existe et ses dépendances
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
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

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // ✅ Vérifier s'il y a du contenu associé
    const totalContent = Object.values(existingProject._count).reduce(
      (sum, count) => sum + count,
      0
    );

    if (totalContent > 0) {
      const details = Object.entries(existingProject._count)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `${count} ${key}`)
        .join(", ");

      return NextResponse.json(
        {
          error: "Impossible de supprimer ce projet",
          details: `Le projet contient: ${details}. Supprimez d'abord ces éléments.`,
        },
        { status: 409 }
      );
    }

    // ✅ Suppression du projet
    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: `Projet "${existingProject.name}" supprimé avec succès` },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la suppression du projet:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Projet non trouvé" },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Impossible de supprimer : contraintes de clé étrangère" },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du projet",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
