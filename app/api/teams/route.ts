// app/api/teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

const createTeamSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  slug: z.string().min(1, "Le slug est requis"),
  logoUrl: z.string().url().optional(),
  parentTeamId: z.string().cuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const teams = await prisma.team.findMany({
      where: {
        isActive: true,
        ...(parentId && { parentTeamId: parentId }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        parentTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        templates: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // Vérifier que le slug est unique
    const existingTeam = await prisma.team.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé" },
        { status: 409 }
      );
    }

    const team = await prisma.team.create({
      data: validatedData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        templates: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la création de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
