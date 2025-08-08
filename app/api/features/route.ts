// app/api/features/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Priority } from "@/lib/generated/prisma/client";

// ✅ Interface pour les requêtes de création
interface CreateFeatureRequest {
  name: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  priority?: Priority;
  status?: string;
  storyPoints?: number | null;
  businessValue?: number | null;
  technicalRisk?: number | null;
  effort?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  position?: number;
  epicId: string;
  userId?: string | null;
  parentId?: string | null;
  projectId?: string | null;
}

// ✅ Interface pour les réponses selon votre schéma
interface FeatureResponse {
  id: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  epic?: {
    id: string;
    name: string;
    status: string;
    priority: Priority;
    initiativeId: string;
  };
  users?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: {
    id: string;
    name: string;
    status: string;
    progress: number;
  }[];
  userStories?: {
    id: string;
    title: string;
    status: string;
    storyPoints: number | null;
    priority: Priority;
  }[];
}

// ✅ Interface pour la réponse paginée
interface PaginatedResponse {
  data: FeatureResponse[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
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

/**
 * GET /api/features
 * Récupère la liste des features avec filtres et pagination
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<PaginatedResponse | { error: string; details?: string }>
> {
  try {
    const { searchParams } = new URL(request.url);

    // ✅ Paramètres de requête avec validation
    const epicId = searchParams.get("epicId");
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const parentId = searchParams.get("parentId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority") as Priority | null;
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20"))
    );

    // ✅ Validation des UUIDs
    const uuidFields = [
      { name: "epicId", value: epicId },
      { name: "projectId", value: projectId },
      { name: "userId", value: userId },
      { name: "parentId", value: parentId },
    ];

    for (const field of uuidFields) {
      if (field.value && !isValidUUID(field.value)) {
        return NextResponse.json(
          {
            error: `Format UUID invalide pour ${field.name}`,
            details: `La valeur '${field.value}' n'est pas un UUID valide`,
          },
          { status: 400 }
        );
      }
    }

    // ✅ Construction de la clause WHERE
    const whereClause: any = {};

    if (epicId) whereClause.epicId = epicId;
    if (projectId) whereClause.projectId = projectId;
    if (userId) whereClause.userId = userId;
    if (parentId) whereClause.parentId = parentId;
    if (status) whereClause.status = status;

    // Validation de la priorité
    if (priority && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(priority)) {
      whereClause.priority = priority;
    }

    // Recherche textuelle
    if (search?.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
        {
          acceptanceCriteria: { contains: search.trim(), mode: "insensitive" },
        },
      ];
    }

    const skip = (page - 1) * limit;

    // ✅ Requête Prisma conforme à votre schéma
    const [features, totalCount] = await Promise.all([
      prisma.feature.findMany({
        where: whereClause,
        include: {
          epic: {
            select: {
              id: true,
              name: true,
              status: true,
              priority: true,
              initiativeId: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              status: true,
              progress: true,
            },
            take: 10,
          },
          userStories: {
            select: {
              id: true,
              title: true,
              status: true,
              storyPoints: true,
              priority: true,
            },
            take: 5,
          },
        },
        orderBy: [
          { position: "asc" },
          { priority: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.feature.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response: PaginatedResponse = {
      data: features,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des features:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des features",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features
 * Crée une nouvelle feature
 */
export async function POST(
  request: NextRequest
): Promise<
  NextResponse<FeatureResponse | { error: string; details?: string }>
> {
  try {
    const body: CreateFeatureRequest = await request.json();
    const {
      name,
      description,
      acceptanceCriteria,
      priority = "MEDIUM",
      status = "ACTIVE",
      storyPoints,
      businessValue,
      technicalRisk,
      effort,
      startDate,
      endDate,
      position = 0,
      epicId,
      userId,
      parentId,
      projectId,
    } = body;

    // ✅ Validation des champs obligatoires
    if (!name?.trim()) {
      return NextResponse.json(
        {
          error: "Le nom de la feature est obligatoire",
          details: "Le champ 'name' ne peut pas être vide",
        },
        { status: 400 }
      );
    }

    if (!epicId?.trim()) {
      return NextResponse.json(
        {
          error: "L'ID de l'epic est obligatoire",
          details: "Le champ 'epicId' est requis",
        },
        { status: 400 }
      );
    }

    // ✅ Validation des UUIDs
    if (!isValidUUID(epicId)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide pour epicId",
          details: `La valeur '${epicId}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    if (userId && !isValidUUID(userId)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide pour userId",
          details: `La valeur '${userId}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    if (parentId && !isValidUUID(parentId)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide pour parentId",
          details: `La valeur '${parentId}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    if (projectId && !isValidUUID(projectId)) {
      return NextResponse.json(
        {
          error: "Format UUID invalide pour projectId",
          details: `La valeur '${projectId}' n'est pas un UUID valide`,
        },
        { status: 400 }
      );
    }

    // ✅ Validation de la priorité
    const validPriorities: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          error: "Priorité invalide",
          details: `Valeurs autorisées: ${validPriorities.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ✅ Validation des valeurs numériques
    if (storyPoints !== undefined && storyPoints !== null) {
      if (
        !Number.isInteger(storyPoints) ||
        storyPoints < 0 ||
        storyPoints > 100
      ) {
        return NextResponse.json(
          {
            error: "Points d'histoire invalides",
            details:
              "Les points d'histoire doivent être un entier entre 0 et 100",
          },
          { status: 400 }
        );
      }
    }

    if (businessValue !== undefined && businessValue !== null) {
      if (
        !Number.isInteger(businessValue) ||
        businessValue < 0 ||
        businessValue > 100
      ) {
        return NextResponse.json(
          {
            error: "Valeur métier invalide",
            details: "La valeur métier doit être un entier entre 0 et 100",
          },
          { status: 400 }
        );
      }
    }

    if (technicalRisk !== undefined && technicalRisk !== null) {
      if (
        !Number.isInteger(technicalRisk) ||
        technicalRisk < 0 ||
        technicalRisk > 100
      ) {
        return NextResponse.json(
          {
            error: "Risque technique invalide",
            details: "Le risque technique doit être un entier entre 0 et 100",
          },
          { status: 400 }
        );
      }
    }

    if (effort !== undefined && effort !== null) {
      if (!Number.isInteger(effort) || effort < 0 || effort > 1000) {
        return NextResponse.json(
          {
            error: "Effort invalide",
            details: "L'effort doit être un entier entre 0 et 1000",
          },
          { status: 400 }
        );
      }
    }

    // ✅ Validation des dates
    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          {
            error: "Format de date de début invalide",
            details: "Utilisez le format ISO 8601",
          },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          {
            error: "Format de date de fin invalide",
            details: "Utilisez le format ISO 8601",
          },
          { status: 400 }
        );
      }
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        {
          error: "Dates incohérentes",
          details: "La date de fin doit être postérieure à la date de début",
        },
        { status: 400 }
      );
    }

    // ✅ Vérifier que l'epic existe
    const epic = await prisma.epic.findUnique({
      where: { id: epicId },
      select: { id: true, name: true },
    });

    if (!epic) {
      return NextResponse.json(
        {
          error: "Epic non trouvé",
          details: `Aucun epic trouvé avec l'ID: ${epicId}`,
        },
        { status: 404 }
      );
    }

    // ✅ Vérifier l'utilisateur si fourni
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!user) {
        return NextResponse.json(
          {
            error: "Utilisateur non trouvé",
            details: `Aucun utilisateur trouvé avec l'ID: ${userId}`,
          },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            error: "Utilisateur inactif",
            details: "L'utilisateur n'est pas actif",
          },
          { status: 400 }
        );
      }
    }

    // ✅ Vérifier le parent si fourni
    if (parentId) {
      const parentFeature = await prisma.feature.findUnique({
        where: { id: parentId },
        select: { id: true, epicId: true },
      });

      if (!parentFeature) {
        return NextResponse.json(
          {
            error: "Feature parent non trouvée",
            details: `Aucune feature trouvée avec l'ID: ${parentId}`,
          },
          { status: 404 }
        );
      }

      if (parentFeature.epicId !== epicId) {
        return NextResponse.json(
          {
            error: "Epic incompatible",
            details: "La feature parent doit appartenir au même epic",
          },
          { status: 400 }
        );
      }
    }

    // ✅ Vérifier le projet si fourni
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, isActive: true },
      });

      if (!project) {
        return NextResponse.json(
          {
            error: "Projet non trouvé",
            details: `Aucun projet trouvé avec l'ID: ${projectId}`,
          },
          { status: 404 }
        );
      }

      if (!project.isActive) {
        return NextResponse.json(
          {
            error: "Projet inactif",
            details: "Le projet n'est pas actif",
          },
          { status: 400 }
        );
      }
    }

    // ✅ Calcul automatique de la position si non fournie
    let finalPosition = position;
    if (position === 0) {
      const maxPosition = await prisma.feature.findFirst({
        where: { epicId },
        select: { position: true },
        orderBy: { position: "desc" },
      });

      finalPosition = (maxPosition?.position || 0) + 1;
    }

    // ✅ Création de la feature
    const feature = await prisma.feature.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        acceptanceCriteria: acceptanceCriteria?.trim() || null,
        priority,
        status,
        storyPoints,
        businessValue,
        technicalRisk,
        effort,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        position: finalPosition,
        progress: 0,
        epicId,
        userId,
        parentId,
        projectId,
      },
      include: {
        epic: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            initiativeId: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        userStories: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            priority: true,
          },
          take: 5,
        },
      },
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur lors de la création de la feature:", error);

    // ✅ Gestion des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2002":
          return NextResponse.json(
            {
              error: "Contrainte d'unicité violée",
              details: "Une feature avec ce nom existe déjà dans cet epic",
            },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            {
              error: "Référence invalide",
              details: "Epic, utilisateur, parent ou projet inexistant",
            },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            {
              error: "Enregistrement non trouvé",
              details: "Une des références spécifiées n'existe pas",
            },
            { status: 404 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la création de la feature",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
