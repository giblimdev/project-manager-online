// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

type Params = Promise<{
  id: string;
}>;

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  parentTeamId: z.string().cuid().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          where: {
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
                timezone: true,
              },
            },
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
          },
        },
        parentTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        templates: {
          where: {
            isSystem: false,
          },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            category: true,
            version: true,
            isPublic: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

    // Vérifier si l'équipe existe et est active
    const existingTeam = await prisma.team.findUnique({
      where: { id },
    });

    if (!existingTeam) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    // Si on change le parentTeamId, vérifier qu'il n'y a pas de référence circulaire
    if (
      validatedData.parentTeamId &&
      validatedData.parentTeamId !== existingTeam.parentTeamId
    ) {
      const parentTeam = await prisma.team.findUnique({
        where: { id: validatedData.parentTeamId },
      });

      if (!parentTeam || !parentTeam.isActive) {
        return NextResponse.json(
          { error: "Équipe parent non trouvée ou inactive" },
          { status: 400 }
        );
      }

      // Vérifier la référence circulaire (éviter qu'une équipe soit parent d'elle-même)
      if (validatedData.parentTeamId === id) {
        return NextResponse.json(
          { error: "Une équipe ne peut pas être parent d'elle-même" },
          { status: 400 }
        );
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: validatedData,
      include: {
        members: {
          where: {
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
        },
        parentTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la mise à jour de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;

    // Vérifier si l'équipe a des équipes enfants actives
    const childTeams = await prisma.team.findMany({
      where: {
        parentTeamId: id,
        isActive: true,
      },
    });

    if (childTeams.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de désactiver une équipe qui a des sous-équipes actives",
          details: `${childTeams.length} sous-équipe(s) active(s) trouvée(s)`,
        },
        { status: 409 }
      );
    }

    // Désactivation soft delete
    await prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Équipe désactivée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
