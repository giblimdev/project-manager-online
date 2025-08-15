// 📄 /app/api/sprints/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { SprintStatus } from "@/lib/generated/prisma";

const updateSprintSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  goal: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  capacity: z.number().int().min(0).nullable().optional(),
  velocity: z.number().min(0).nullable().optional(),
  status: z.nativeEnum(SprintStatus).optional(),
  userIds: z.array(z.string()).optional(),
  userStoryIds: z.array(z.string()).optional(),
  itemIds: z.array(z.string()).optional(),
});

// ✅ CORRECTION : Signature correcte pour Next.js 15
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ✅ Await des params car ils sont Promise dans Next.js 15
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID du sprint requis" },
        { status: 400 }
      );
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, slug: true, key: true, description: true } },
        users: { select: { id: true, name: true, email: true, image: true } },
        userStories: { 
          select: { 
            id: true, 
            title: true, 
            status: true, 
            storyPoints: true, 
            priority: true,
            estimatedHours: true,
            actualHours: true,
            position: true
          } 
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
            backlogPosition: true
          } 
        },
        timeEntries: { 
          select: { 
            id: true, 
            hours: true, 
            date: true, 
            user: { select: { id: true, name: true } } 
          } 
        },
        files: { select: { id: true, name: true, type: true, path: true } },
        _count: { 
          select: { 
            users: true, 
            userStories: true, 
            items: true, 
            timeEntries: true, 
            files: true 
          } 
        },
      },
    });

    if (!sprint) {
      return NextResponse.json(
        { success: false, error: "Sprint non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: sprint },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("GET /api/sprints/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du sprint",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ CORRECTION : Signature correcte pour PUT
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ✅ Await des params car ils sont Promise dans Next.js 15
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID du sprint requis" },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log("PUT /api/sprints/[id] - Données reçues:", body);

    const validation = updateSprintSchema.safeParse(body);

    if (!validation.success) {
      console.error("PUT validation failed:", validation.error.issues);
      return NextResponse.json(
        {
          success: false,
          error: "Données de mise à jour invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Vérifier que le sprint existe
    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
    });

    if (!existingSprint) {
      return NextResponse.json(
        { success: false, error: "Sprint non trouvé" },
        { status: 404 }
      );
    }

    // Validation des dates si modifiées
    let parsedStartDate = existingSprint.startDate;
    let parsedEndDate = existingSprint.endDate;

    if (updateData.startDate) {
      parsedStartDate = new Date(updateData.startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Format de date de début invalide" },
          { status: 400 }
        );
      }
    }

    if (updateData.endDate) {
      parsedEndDate = new Date(updateData.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json(
          { success: false, error: "Format de date de fin invalide" },
          { status: 400 }
        );
      }
    }

    if (parsedEndDate <= parsedStartDate) {
      return NextResponse.json(
        { success: false, error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    // Préparer les données pour Prisma
    const prismaUpdateData: any = {
      name: updateData.name?.trim(),
      goal: updateData.goal?.trim() || null,
      description: updateData.description?.trim() || null,
      startDate: updateData.startDate ? parsedStartDate : undefined,
      endDate: updateData.endDate ? parsedEndDate : undefined,
      capacity: updateData.capacity,
      velocity: updateData.velocity,
      status: updateData.status,
      updatedAt: new Date(),
    };

    // Nettoyer les champs undefined
    Object.keys(prismaUpdateData).forEach(key => {
      if (prismaUpdateData[key] === undefined) {
        delete prismaUpdateData[key];
      }
    });

    // Gestion des relations many-to-many
    if (updateData.userIds !== undefined) {
      prismaUpdateData.users = updateData.userIds.length > 0
        ? { set: [], connect: updateData.userIds.map(id => ({ id })) }
        : { set: [] };
    }

    if (updateData.userStoryIds !== undefined) {
      prismaUpdateData.userStories = updateData.userStoryIds.length > 0
        ? { set: [], connect: updateData.userStoryIds.map(id => ({ id })) }
        : { set: [] };
    }

    if (updateData.itemIds !== undefined) {
      prismaUpdateData.items = updateData.itemIds.length > 0
        ? { set: [], connect: updateData.itemIds.map(id => ({ id })) }
        : { set: [] };
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        project: { select: { id: true, name: true, slug: true, key: true, description: true } },
        users: { select: { id: true, name: true, email: true, image: true } },
        userStories: { select: { id: true, title: true, status: true, storyPoints: true, priority: true } },
        items: { select: { id: true, name: true, type: true, status: true, priority: true } },
        _count: { select: { users: true, userStories: true, items: true, timeEntries: true, files: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedSprint,
        message: "Sprint mis à jour avec succès",
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("PUT /api/sprints/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour du sprint",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ CORRECTION : Signature correcte pour DELETE
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // ✅ Await des params car ils sont Promise dans Next.js 15
    const { id } = await context.params;

    const existingSprint = await prisma.sprint.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });

    if (!existingSprint) {
      return NextResponse.json(
        { success: false, error: "Sprint non trouvé" },
        { status: 404 }
      );
    }

    // Ne pas supprimer un sprint actif
    if (existingSprint.status === SprintStatus.ACTIVE) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de supprimer un sprint actif",
          details: "Veuillez d'abord terminer ou annuler le sprint",
        },
        { status: 409 }
      );
    }

    await prisma.sprint.delete({ where: { id } });

    return NextResponse.json(
      {
        success: true,
        data: { id: existingSprint.id, name: existingSprint.name },
        message: "Sprint supprimé avec succès",
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error("DELETE /api/sprints/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression du sprint",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
