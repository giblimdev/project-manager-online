// 📄 /app/api/glossary/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1, "Au moins un ID requis"),
});

// 📋 POST - Réorganiser l'ordre des termes
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = reorderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderedIds } = validation.data; 

    // Mise à jour de l'ordre pour chaque terme
    const updates = orderedIds.map((id, index) =>
      prisma.glossary.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updates);

    return NextResponse.json(
      {
        success: true,
        message: "Ordre mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/glossary/reorder error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la réorganisation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
