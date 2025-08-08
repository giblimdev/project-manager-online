// app/api/initiatives/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Priority } from "@/lib/generated/prisma/client";

interface CreateInitiativeRequest {
  name: string;
  description?: string | null;
  objective?: string | null;
  priority?: Priority;
  status?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  budget?: number | null;
  roi?: number | null;
  progress?: number;
  projectId: string;
  // ✅ CORRECTION: Selon votre schéma, userId n'est pas obligatoire dans Initiative
  userId?: string | null;
}

interface InitiativeResponse {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  priority: Priority;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  // ✅ CORRECTION: progress est Float dans votre schéma, pas Int
  progress: number;
  budget: number | null;
  roi: number | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    name: string;
    key: string;
  };
  // ✅ CORRECTION: Relation optionnelle selon votre schéma
  User?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  epics?: {
    id: string;
    name: string;
    status: string;
    progress: number;
  }[];
}

// ✅ Fonctions utilitaires améliorées
function isError(err: unknown): err is Error {
  return err instanceof Error;
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" && err !== null && "code" in err && "message" in err
  );
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Erreur inconnue";
}

// ✅ Validation des priorités avec les valeurs exactes de votre enum
const VALID_PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function isValidPriority(priority: string): priority is Priority {
  return VALID_PRIORITIES.includes(priority as Priority);
}

export async function GET(
  request: NextRequest
): Promise<
  NextResponse<InitiativeResponse[] | { error: string; details?: string }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const userId = searchParams.get("userId");

    // ✅ AMÉLIORATION: Interface typée pour la clause WHERE
    interface WhereClause {
      projectId?: string;
      userId?: string | null;
      status?: string;
      priority?: Priority;
      startDate?: { gte: Date };
      endDate?: { lte: Date };
      OR?: Array<{
        [key: string]: {
          contains: string;
          mode: "insensitive";
        };
      }>;
    }

    const whereClause: WhereClause = {};

    // Filtrage par projet (obligatoire selon votre logique métier)
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Filtrage par utilisateur
    if (userId) {
      whereClause.userId = userId;
    }

    // Filtrage par statut
    if (status) {
      whereClause.status = status;
    }

    // ✅ AMÉLIORATION: Validation stricte de la priorité
    if (priority && isValidPriority(priority)) {
      whereClause.priority = priority;
    }

    // ✅ AMÉLIORATION: Gestion des dates avec try-catch
    if (startDate) {
      try {
        const parsedStartDate = new Date(startDate);
        if (!isNaN(parsedStartDate.getTime())) {
          whereClause.startDate = { gte: parsedStartDate };
        }
      } catch {
        // Date invalide, on l'ignore silencieusement
      }
    }

    if (endDate) {
      try {
        const parsedEndDate = new Date(endDate);
        if (!isNaN(parsedEndDate.getTime())) {
          whereClause.endDate = { lte: parsedEndDate };
        }
      } catch {
        // Date invalide, on l'ignore silencieusement
      }
    }

    // Recherche textuelle améliorée
    if (search?.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          objective: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    const initiatives = await prisma.initiative.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        // ✅ CORRECTION: Relation User (pas Users) selon votre schéma
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        epics: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { name: "asc" }, // Tri secondaire par nom
      ],
    });

    // ✅ AMÉLIORATION: Conversion du progrès pour l'affichage
    const formattedInitiatives: InitiativeResponse[] = initiatives.map(
      (initiative) => ({
        ...initiative,
        progress: Math.round((initiative.progress || 0) * 100), // Conversion Float -> pourcentage
      })
    );

    return NextResponse.json(formattedInitiatives);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des initiatives:", error);

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des initiatives",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<InitiativeResponse | { error: string; details?: string }>
> {
  try {
    const body: CreateInitiativeRequest = await request.json();
    const {
      name,
      description,
      objective,
      priority = "MEDIUM",
      status = "ACTIVE",
      startDate,
      endDate,
      budget,
      roi,
      progress = 0,
      projectId,
      userId,
    } = body;

    // ✅ AMÉLIORATION: Validation plus stricte
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Le nom de l'initiative est obligatoire" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "L'ID du projet est obligatoire" },
        { status: 400 }
      );
    }

    // ✅ CORRECTION: userId optionnel selon votre schéma
    // Validation de la priorité
    if (!isValidPriority(priority)) {
      return NextResponse.json(
        {
          error: `Priorité invalide. Valeurs autorisées: ${VALID_PRIORITIES.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // ✅ AMÉLIORATION: Validation des dates plus robuste
    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;

    if (startDate) {
      try {
        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return NextResponse.json(
            { error: "Format de date de début invalide" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Format de date de début invalide" },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      try {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return NextResponse.json(
            { error: "Format de date de fin invalide" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Format de date de fin invalide" },
          { status: 400 }
        );
      }
    }

    // Validation de la cohérence des dates
    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    // ✅ AMÉLIORATION: Validation des valeurs numériques plus stricte
    if (
      budget !== undefined &&
      budget !== null &&
      (budget < 0 || !isFinite(budget))
    ) {
      return NextResponse.json(
        { error: "Le budget doit être un nombre positif valide" },
        { status: 400 }
      );
    }

    if (roi !== undefined && roi !== null && !isFinite(roi)) {
      return NextResponse.json(
        { error: "Le ROI doit être un nombre valide" },
        { status: 400 }
      );
    }

    if (progress < 0 || progress > 100 || !isFinite(progress)) {
      return NextResponse.json(
        { error: "Le progrès doit être compris entre 0 et 100" },
        { status: 400 }
      );
    }

    // ✅ AMÉLIORATION: Vérification d'existence en une seule requête
    const [project, user] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true },
      }),
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    if (userId && !user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // ✅ CORRECTION: Selon votre schéma, progress est Float (0-1) pas Int (0-100)
    const initiative = await prisma.initiative.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        objective: objective?.trim() || null,
        priority,
        status,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        budget: budget || null,
        roi: roi || null,
        progress: progress / 100, // Conversion pourcentage -> Float (0-1)
        projectId,
        // ✅ CORRECTION: userId optionnel selon votre schéma
        ...(userId && { userId }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        epics: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    // ✅ AMÉLIORATION: Conversion pour la réponse
    const responseInitiative: InitiativeResponse = {
      ...initiative,
      progress: Math.round((initiative.progress || 0) * 100), // Float -> pourcentage
    };

    return NextResponse.json(responseInitiative, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur lors de la création de l'initiative:", error);

    // ✅ AMÉLIORATION: Gestion plus complète des erreurs Prisma
    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Une contrainte d'unicité a été violée" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Référence invalide (projet ou utilisateur inexistant)" },
            { status: 400 }
          );
        case "P2025":
          return NextResponse.json(
            { error: "Enregistrement non trouvé" },
            { status: 404 }
          );
        case "P2000":
          return NextResponse.json(
            { error: "Valeur fournie trop longue pour le type de colonne" },
            { status: 400 }
          );
        case "P2006":
          return NextResponse.json(
            { error: "Valeur fournie invalide pour ce champ" },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma non gérée:", error.code, error.message);
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'initiative",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
