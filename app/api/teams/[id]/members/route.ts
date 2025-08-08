// app/api/teams/[id]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { z } from "zod";
import { UserRole } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

type Params = Promise<{
  id: string;
}>;

const addMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.nativeEnum(UserRole).default(UserRole.DEVELOPER),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: teamId } = await params;

    const members = await prisma.teamMember.findMany({
      where: {
        teamId,
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
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: teamId } = await params;
    const body = await request.json();
    const { userId, role } = addMemberSchema.parse(body);

    // Vérifier si l'équipe existe et est active
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        isActive: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée ou inactive" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur existe et est actif
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.isActive) {
        return NextResponse.json(
          { error: "L'utilisateur est déjà membre de cette équipe" },
          { status: 409 }
        );
      } else {
        // Réactiver le membre existant
        const reactivatedMember = await prisma.teamMember.update({
          where: {
            id: existingMember.id,
          },
          data: {
            isActive: true,
            role,
            joinedAt: new Date(),
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
        });

        return NextResponse.json(reactivatedMember, { status: 200 });
      }
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
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
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'ajout du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
