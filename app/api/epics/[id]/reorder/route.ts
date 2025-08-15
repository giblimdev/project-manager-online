// app/api/epics/[id]/reorder/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> } // params est un Promise
) {
  // On attend la résolution pour lire l'id
  const { id: epicId } = await context.params;

  const { direction } = (await request.json()) as { direction: "up" | "down" };

  // Validation
  if (!epicId || (direction !== "up" && direction !== "down")) {
    return NextResponse.json(
      { success: false, error: "Paramètres invalides" },
      { status: 400 }
    );
  }

  try {
    // Récupérer l’épic courant
    const current = await prisma.epic.findUnique({
      where: { id: epicId },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: "Épic non trouvé" },
        { status: 404 }
      );
    }

    // Trouver l’épic voisin dans la direction donnée
    const neighbor = await prisma.epic.findFirst({
      where: {
        initiativeId: current.initiativeId,
        order:
          direction === "up"
            ? { lt: current.order }
            : { gt: current.order },
      },
      orderBy: {
        order: direction === "up" ? "desc" : "asc",
      },
    });

    // Pas de voisin => front désactive bouton
    if (!neighbor) {
      return NextResponse.json(
        { success: false, error: "Pas d'épic voisin" },
        { status: 409 }
      );
    }

    // Swap des positions
    await prisma.$transaction([
      prisma.epic.update({
        where: { id: current.id },
        data: { order: neighbor.order },
      }),
      prisma.epic.update({
        where: { id: neighbor.id },
        data: { order: current.order },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
