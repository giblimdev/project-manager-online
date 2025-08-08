// app/api/teams/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { UserRole } from "@/lib/generated/prisma/client";

type Params = Promise<{
  id: string;
  userId: string;
}>;

const updateMemberSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { id: teamId, userId } = await params;
    const body = await request.json();
    const { role } = updateMemberSchema.parse(body);

    const member = await prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du membre:", error);
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
    const { id: teamId, userId } = await params;

    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
