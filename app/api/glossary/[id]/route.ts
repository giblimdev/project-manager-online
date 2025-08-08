// app/api/glossary/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema pour la mise à jour (tous les champs optionnels)
const updateGlossarySchema = z.object({
  term: z.string().min(1, "Le terme ne peut pas être vide").optional(),
  description: z.string().nullable().optional(),
  type: z
    .enum(["TERM", "ACRONYM", "ABBREVIATION", "CONCEPT", "TEAM", "PROJECT"])
    .optional(),
  order: z.number().int().min(0, "L'ordre doit être positif").optional(),
  isActive: z.boolean().optional(),
});

// Fonction utilitaire pour valider l'ID
function validateId(id: string): boolean {
  return typeof id === "string" && id.length > 0;
}

/**
 * GET /api/glossary/[id]
 * Récupère un terme spécifique du glossaire
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!validateId(id)) {
      return NextResponse.json(
        { error: "ID du terme invalide" },
        { status: 400 }
      );
    }

    const term = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!term) {
      return NextResponse.json({ error: "Terme non trouvé" }, { status: 404 });
    }

    // Optionnel : ne pas retourner les termes inactifs
    if (!term.isActive) {
      return NextResponse.json({ error: "Terme non trouvé" }, { status: 404 });
    }

    return NextResponse.json(term);
  } catch (error) {
    console.error("GET /api/glossary/[id] error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/glossary/[id]
 * Met à jour un terme du glossaire
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!validateId(id)) {
      return NextResponse.json(
        { error: "ID du terme invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validation des données
    const validation = updateGlossarySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Si aucune donnée à mettre à jour
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucune donnée à mettre à jour" },
        { status: 400 }
      );
    }

    // Vérification de l'existence du terme
    const existingTerm = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!existingTerm || !existingTerm.isActive) {
      return NextResponse.json({ error: "Terme non trouvé" }, { status: 404 });
    }

    // Vérification de l'unicité du nom si modifié
    if (data.term && data.term !== existingTerm.term) {
      const duplicateTerm = await prisma.glossary.findFirst({
        where: {
          term: { equals: data.term, mode: "insensitive" },
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateTerm) {
        return NextResponse.json(
          { error: "Un terme avec ce nom existe déjà" },
          { status: 409 }
        );
      }
    }

    // Mise à jour du terme
    const updatedTerm = await prisma.glossary.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedTerm);
  } catch (error) {
    console.error("PATCH /api/glossary/[id] error:", error);

    // Gestion spécifique des erreurs Prisma
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json({ error: "Terme non trouvé" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/glossary/[id]
 * Supprime définitivement un terme du glossaire (suppression physique)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!validateId(id)) {
      return NextResponse.json(
        { error: "ID du terme invalide" },
        { status: 400 }
      );
    }

    // Vérification de l'existence du terme
    const existingTerm = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json({ error: "Terme non trouvé" }, { status: 404 });
    }

    // ✅ SUPPRESSION PHYSIQUE - Supprime définitivement l'enregistrement
    await prisma.glossary.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Terme supprimé définitivement avec succès",
      deletedId: id,
    });
  } catch (error) {
    console.error("DELETE /api/glossary/[id] error:", error);

    // Gestion spécifique des erreurs Prisma
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json({ error: "Terme non trouvé" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
