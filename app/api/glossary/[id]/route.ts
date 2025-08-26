// 📄 /app/api/glossary/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ Import corrigé
import { z } from "zod";

const updateGlossarySchema = z.object({
  term: z
    .string()
    .min(1, "Le terme est requis") 
    .max(255, "Le terme ne peut pas dépasser 255 caractères")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_\.]+$/, "Caractères non autorisés")
    .optional(),
  description: z.string().nullable().optional(),
  type: z
    .enum([
      "TERM",
      "ACRONYM",
      "CONCEPT", 
      "TOOL",
      "PROCESS",
      "ROLE",
      "METHODOLOGY",
      "FRAMEWORK",
      "TECHNOLOGY"
    ])
    .optional(),
  category: z.string().max(100).nullable().optional(),
  order: z.number().int().min(0).max(999999).optional(),
  isActive: z.boolean().optional(),
  metadata: z.any().optional(),
});

// 📋 GET - Récupérer un terme spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const term = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!term) {
      return NextResponse.json(
        { success: false, error: "Terme non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: term },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/glossary/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du terme",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// ✏️ PUT - Mettre à jour un terme
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validation = updateGlossarySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données de mise à jour invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Vérifier existence
    const existingTerm = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json(
        { success: false, error: "Terme non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier unicité si terme modifié
    if (data.term && data.term !== existingTerm.term) {
      const duplicateTerm = await prisma.glossary.findFirst({
        where: {
          term: { equals: data.term, mode: "insensitive" },
          NOT: { id },
        },
      });

      if (duplicateTerm) {
        return NextResponse.json(
          {
            success: false,
            error: "Terme déjà existant",
            details: "Un terme avec ce nom existe déjà dans le glossaire",
          },
          { status: 409 }
        );
      }
    }

    // Mise à jour
    const updateData: any = { updatedAt: new Date() };

    if (data.term !== undefined) updateData.term = data.term.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category?.trim() || null;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.metadata !== undefined) updateData.metadata = data.metadata || {};

    const updatedTerm = await prisma.glossary.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedTerm,
        message: "Terme mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/glossary/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour du terme",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// 🗑️ DELETE - Supprimer un terme
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    // Vérifier existence
    const existingTerm = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json(
        { success: false, error: "Terme non trouvé" },
        { status: 404 }
      );
    }

    // Suppression physique
    const deletedTerm = await prisma.glossary.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        data: deletedTerm,
        message: "Terme supprimé définitivement avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/glossary/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression du terme",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
