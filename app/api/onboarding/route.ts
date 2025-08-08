// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { z } from "zod";
import { UserRole } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

const onboardingSchema = z.object({
  userId: z.string().cuid(),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  bio: z.string().optional(),
  timezone: z.string().default("UTC"),
  preferences: z.record(z.string(), z.any()).optional(),
  teamIds: z.array(z.string().cuid()).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.DEVELOPER),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      firstName,
      lastName,
      bio,
      timezone,
      preferences,
      teamIds = [],
      role,
    } = onboardingSchema.parse(body);

    // Mise à jour du profil utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        bio,
        timezone,
        preferences: preferences || {},
        isActive: true,
      },
    });

    // Ajout aux équipes si spécifié
    if (teamIds.length > 0) {
      const teamMemberData = teamIds.map((teamId) => ({
        teamId,
        userId,
        role: role,
      }));

      await prisma.teamMember.createMany({
        data: teamMemberData,
        skipDuplicates: true,
      });
    }

    // Récupération des données complètes avec la bonne relation
    const userWithTeams = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMemberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        projectMemberships: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      user: userWithTeams,
      message: "Onboarding terminé avec succès",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'onboarding:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
