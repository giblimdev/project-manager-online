// app/api/epics/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Priority, Epic } from "@/lib/generated/prisma/client";

interface CreateEpicRequest {
  name: string;
  description?: string | null;
  priority?: Priority;
  status?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  initiativeId: string;
}

interface EpicResponse extends Epic {
  initiative?: {
    id: string;
    name: string;
    projectId: string;
  };
  features?: {
    id: string;
    name: string;
    status: string;
    progress: number;
  }[];
}

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

export async function GET(
  request: NextRequest
): Promise<NextResponse<EpicResponse[] | { error: string; details?: string }>> {
  try {
    const { searchParams } = new URL(request.url);
    const initiativeId = searchParams.get("initiativeId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority") as Priority | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const whereClause: any = {};

    // Filtrage par initiative
    if (initiativeId) {
      whereClause.initiativeId = initiativeId;
    }

    // Filtrage par projet (via initiative)
    if (projectId) {
      whereClause.initiative = {
        projectId: projectId,
      };
    }

    // Filtrage par statut
    if (status) {
      whereClause.status = status;
    }

    // Filtrage par priorité avec validation enum
    if (priority && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(priority)) {
      whereClause.priority = priority;
    }

    // Filtrage par dates avec validation
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        whereClause.startDate = {
          gte: parsedStartDate,
        };
      }
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        whereClause.endDate = {
          lte: parsedEndDate,
        };
      }
    }

    // Recherche textuelle avec insensibilité à la casse
    if (search && search.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const epics = await prisma.epic.findMany({
      where: whereClause,
      include: {
        initiative: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        features: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(epics);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des épics:", error);

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des épics",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<EpicResponse | { error: string; details?: string }>> {
  try {
    const body: CreateEpicRequest = await request.json();
    const {
      name,
      description,
      priority = "MEDIUM",
      status = "ACTIVE",
      startDate,
      endDate,
      initiativeId,
    } = body;

    // Validation des données obligatoires
    if (!name?.trim() || !initiativeId) {
      return NextResponse.json(
        { error: "Le nom et l'ID de l'initiative sont obligatoires" },
        { status: 400 }
      );
    }

    // Validation des énumérations
    const validPriorities: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          error:
            "Priorité invalide. Valeurs autorisées: CRITICAL, HIGH, MEDIUM, LOW",
        },
        { status: 400 }
      );
    }

    // Validation des dates
    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          { error: "Format de date de début invalide" },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { error: "Format de date de fin invalide" },
          { status: 400 }
        );
      }
    }

    // Vérification que la date de fin est postérieure à la date de début
    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    // Vérifier que l'initiative existe
    const initiative = await prisma.initiative.findUnique({
      where: { id: initiativeId },
    });

    if (!initiative) {
      return NextResponse.json(
        { error: "Initiative non trouvée" },
        { status: 404 }
      );
    }

    // Créer l'épic
    const epic = await prisma.epic.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        priority,
        status,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        progress: 0,
        initiativeId,
      },
      include: {
        initiative: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        features: {
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
          },
        },
      },
    });

    return NextResponse.json(epic, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur lors de la création de l'épic:", error);

    // Gestion des erreurs Prisma spécifiques
    if (isPrismaError(error)) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Un épic avec ce nom existe déjà dans cette initiative" },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Référence invalide (initiative inexistante)" },
          { status: 400 }
        );
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'épic",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
