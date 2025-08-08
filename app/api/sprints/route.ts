// app/api/sprints/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { SprintStatus, Sprint } from "@/lib/generated/prisma/client";

interface CreateSprintRequest {
  name: string;
  goal?: string | null;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  capacity?: number | null;
  velocity?: number | null;
  projectId: string;
  userIds?: string[];
}

interface SprintResponse extends Sprint {
  project?: {
    id: string;
    name: string;
    key: string;
  };
  userStories?: {
    id: string;
    title: string;
    status: string;
    storyPoints: number | null;
    priority: string;
  }[];
  User?: {
    id: string;
    name: string | null;
    email: string;
  }[];
  items?: {
    id: string;
    name: string;
    type: string;
    status: string;
    priority: string | null;
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
): Promise<
  NextResponse<SprintResponse[] | { error: string; details?: string }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status") as SprintStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const userId = searchParams.get("userId");

    const whereClause: any = {};

    // Filtrage par projet
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Filtrage par utilisateur (membre du sprint)
    if (userId) {
      whereClause.User = {
        some: {
          id: userId,
        },
      };
    }

    // Filtrage par statut avec validation enum
    if (
      status &&
      ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"].includes(status)
    ) {
      whereClause.status = status;
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
        {
          goal: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userStories: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            priority: true,
            estimatedHours: true,
            actualHours: true,
          },
          orderBy: {
            backlogPosition: "asc",
          },
        },
        timeEntries: {
          select: {
            id: true,
            hours: true,
            date: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        files: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
    });

    return NextResponse.json(sprints);
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération des sprints:", error);

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des sprints",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SprintResponse | { error: string; details?: string }>> {
  try {
    const body: CreateSprintRequest = await request.json();
    const {
      name,
      goal,
      description,
      startDate,
      endDate,
      capacity,
      velocity,
      projectId,
      userIds = [],
    } = body;

    // Validation des données obligatoires
    if (!name?.trim() || !projectId || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Le nom, l'ID du projet, la date de début et la date de fin sont obligatoires",
        },
        { status: 400 }
      );
    }

    // Validation des dates
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: "Format de date invalide" },
        { status: 400 }
      );
    }

    // Vérification que la date de fin est postérieure à la date de début
    if (parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    // Validation des valeurs numériques
    if (capacity !== undefined && capacity !== null && capacity < 0) {
      return NextResponse.json(
        { error: "La capacité ne peut pas être négative" },
        { status: 400 }
      );
    }

    if (velocity !== undefined && velocity !== null && velocity < 0) {
      return NextResponse.json(
        { error: "La vélocité ne peut pas être négative" },
        { status: 400 }
      );
    }

    // Vérifier que le projet existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier que tous les utilisateurs existent
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      });

      if (users.length !== userIds.length) {
        return NextResponse.json(
          { error: "Un ou plusieurs utilisateurs n'existent pas" },
          { status: 404 }
        );
      }
    }

    // Vérifier qu'il n'y a pas de sprint actif qui chevauche
    const overlappingSprint = await prisma.sprint.findFirst({
      where: {
        projectId,
        status: "ACTIVE",
        OR: [
          {
            AND: [
              { startDate: { lte: parsedEndDate } },
              { endDate: { gte: parsedStartDate } },
            ],
          },
        ],
      },
    });

    if (overlappingSprint) {
      return NextResponse.json(
        { error: "Un sprint actif chevauche déjà avec ces dates" },
        { status: 409 }
      );
    }

    // Créer le sprint avec les relations
    const sprint = await prisma.sprint.create({
      data: {
        name: name.trim(),
        goal: goal?.trim() || null,
        description: description?.trim() || null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        capacity,
        velocity,
        status: "PLANNED",
        projectId,
        users:
          userIds.length > 0
            ? {
                connect: userIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
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
        },
        items: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur lors de la création du sprint:", error);

    // Gestion des erreurs Prisma spécifiques
    if (isPrismaError(error)) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Un sprint avec ce nom existe déjà dans ce projet" },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Référence invalide (projet ou utilisateurs inexistants)" },
          { status: 400 }
        );
      }
    }

    const errorMessage = getErrorMessage(error);

    return NextResponse.json(
      {
        error: "Erreur lors de la création du sprint",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
