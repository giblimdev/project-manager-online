// app/api/sprints/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ Interface simple pour les requêtes de mise à jour
interface UpdateSprintRequest {
  name?: string;
  goal?: string | null;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  status?: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  capacity?: number | null;
  velocity?: number | null;
  burndownData?: any;
  retrospective?: any;
}

// ✅ Interface simple pour les réponses - uniquement les champs essentiels
interface SprintResponse {
  id: string;
  name: string;
  goal: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  capacity: number | null;
  velocity: number | null;
  burndownData: any;
  retrospective: any;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  _count: {
    users: number;
    userStories: number;
    items: number;
    timeEntries: number;
    files: number;
  };
}

// ✅ Interfaces pour les erreurs
interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  message: string;
}

// ✅ Interface pour les paramètres Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Fonctions utilitaires simples
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Erreur inconnue";
}

function isPrismaError(err: unknown): err is { code: string; message: string } {
  return (
    typeof err === "object" && err !== null && "code" in err && "message" in err
  );
}

/**
 * GET /api/sprints/[id]
 * Récupère un sprint spécifique avec ses informations de base
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SprintResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Validation UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Format UUID invalide" },
        { status: 400 }
      );
    }

    // ✅ Requête Prisma simple et directe
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        goal: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        capacity: true,
        velocity: true,
        burndownData: true,
        retrospective: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        _count: {
          select: {
            users: true,
            userStories: true,
            items: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    if (!sprint) {
      return NextResponse.json({ error: "Sprint non trouvé" }, { status: 404 });
    }

    return NextResponse.json(sprint);
  } catch (error: unknown) {
    console.error("Erreur GET sprint:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du sprint",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sprints/[id]
 * Met à jour un sprint existant
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SprintResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Validation UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Format UUID invalide" },
        { status: 400 }
      );
    }

    // ✅ Validation du body JSON
    let body: UpdateSprintRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corps de requête JSON invalide" },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le sprint existe
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!existingSprint) {
      return NextResponse.json({ error: "Sprint non trouvé" }, { status: 404 });
    }

    // ✅ Préparation des données de mise à jour
    const updateData: any = { updatedAt: new Date() };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { error: "Le nom ne peut pas être vide" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.goal !== undefined) {
      updateData.goal = body.goal?.trim() || null;
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.status !== undefined) {
      const validStatuses = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (body.capacity !== undefined) {
      if (
        body.capacity !== null &&
        (body.capacity < 0 || !Number.isInteger(body.capacity))
      ) {
        return NextResponse.json(
          { error: "La capacité doit être un entier positif" },
          { status: 400 }
        );
      }
      updateData.capacity = body.capacity;
    }

    if (body.velocity !== undefined) {
      if (body.velocity !== null && body.velocity < 0) {
        return NextResponse.json(
          { error: "La vélocité doit être positive" },
          { status: 400 }
        );
      }
      updateData.velocity = body.velocity;
    }

    // ✅ Gestion des dates
    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Format de date de début invalide" },
          { status: 400 }
        );
      }
      updateData.startDate = startDate;
    }

    if (body.endDate !== undefined) {
      const endDate = new Date(body.endDate);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Format de date de fin invalide" },
          { status: 400 }
        );
      }
      updateData.endDate = endDate;
    }

    // ✅ Validation cohérence des dates
    const finalStartDate = updateData.startDate ?? existingSprint.startDate;
    const finalEndDate = updateData.endDate ?? existingSprint.endDate;

    if (finalEndDate <= finalStartDate) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    if (body.burndownData !== undefined) {
      updateData.burndownData = body.burndownData;
    }

    if (body.retrospective !== undefined) {
      updateData.retrospective = body.retrospective;
    }

    // ✅ Mise à jour du sprint
    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        goal: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        capacity: true,
        velocity: true,
        burndownData: true,
        retrospective: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            key: true,
          },
        },
        _count: {
          select: {
            users: true,
            userStories: true,
            items: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSprint);
  } catch (error: unknown) {
    console.error("Erreur PUT sprint:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Sprint non trouvé" },
            { status: 404 }
          );
        case "P2002":
          return NextResponse.json(
            { error: "Un sprint avec ce nom existe déjà" },
            { status: 409 }
          );
        default:
          console.error("Erreur Prisma:", error.code);
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du sprint",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprints/[id]
 * Supprime un sprint après vérification
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    // ✅ Validation UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Format UUID invalide" },
        { status: 400 }
      );
    }

    // ✅ Vérifier que le sprint existe et ses dépendances
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: {
            userStories: true,
            items: true,
            timeEntries: true,
            files: true,
          },
        },
      },
    });

    if (!existingSprint) {
      return NextResponse.json({ error: "Sprint non trouvé" }, { status: 404 });
    }

    // ✅ Vérification des contraintes métier
    if (existingSprint.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Impossible de supprimer un sprint actif" },
        { status: 400 }
      );
    }

    const hasContent = Object.values(existingSprint._count).some(
      (count) => count > 0
    );

    if (hasContent) {
      const details = Object.entries(existingSprint._count)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `${count} ${key}`)
        .join(", ");

      return NextResponse.json(
        {
          error: "Impossible de supprimer le sprint",
          details: `Le sprint contient: ${details}. Supprimez d'abord ces éléments.`,
        },
        { status: 409 }
      );
    }

    // ✅ Suppression du sprint
    await prisma.sprint.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: `Sprint "${existingSprint.name}" supprimé avec succès` },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur DELETE sprint:", error);

    if (isPrismaError(error)) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Sprint non trouvé" },
            { status: 404 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Contraintes de suppression non respectées" },
            { status: 400 }
          );
        default:
          console.error("Erreur Prisma:", error.code);
      }
    }

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du sprint",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
