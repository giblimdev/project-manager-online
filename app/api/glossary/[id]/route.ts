// 📄 /app/api/glossary/[id]/route.ts
// 🎯 Rôle : API route pour la gestion d'un terme spécifique du glossaire
// 📦 Responsabilités : CRUD d'un terme individuel (GET, PUT, DELETE)
// 🔧 Composants utilisés : NextResponse, Prisma Client, Zod pour validation
// 🌐 Base de données : PostgreSQL via Prisma

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { z } from "zod";

const prisma = new PrismaClient();

// 🔧 Schéma de validation pour la mise à jour
const updateGlossarySchema = z.object({
  term: z
    .string()
    .min(1, "Le terme est requis")
    .max(255, "Le terme ne peut pas dépasser 255 caractères")
    .optional(),
  description: z.string().optional().nullable(),
  type: z
    .enum(["TERM", "ACRONYM", "ABBREVIATION", "CONCEPT", "TEAM", "PROJECT"])
    .optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// 📋 GET - Récupérer un terme spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID du terme requis",
        },
        { status: 400 }
      );
    }

    const term = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!term) {
      return NextResponse.json(
        {
          success: false,
          error: "Terme non trouvé",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: term,
      },
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
  } finally {
    await prisma.$disconnect();
  }
}

// ✏️ PUT - Mettre à jour un terme spécifique
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID du terme requis",
        },
        { status: 400 }
      );
    }

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

    // Vérifier que le terme existe
    const existingTerm = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json(
        {
          success: false,
          error: "Terme non trouvé",
        },
        { status: 404 }
      );
    }

    // Vérification de l'unicité si le terme est modifié
    if (data.term && data.term !== existingTerm.term) {
      const duplicateTerm = await prisma.glossary.findFirst({
        where: {
          term: { equals: data.term, mode: "insensitive" },
          isActive: true,
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

    // Mise à jour du terme
    const updatedTerm = await prisma.glossary.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
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
  } finally {
    await prisma.$disconnect();
  }
}

// 🗑️ DELETE - Supprimer (désactiver) un terme spécifique
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID du terme requis",
        },
        { status: 400 }
      );
    }

    // Vérifier que le terme existe
    const existingTerm = await prisma.glossary.findUnique({
      where: { id },
    });

    if (!existingTerm) {
      return NextResponse.json(
        {
          success: false,
          error: "Terme non trouvé",
        },
        { status: 404 }
      );
    }

    // Suppression logique (désactivation)
    const deletedTerm = await prisma.glossary.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: deletedTerm,
        message: "Terme supprimé avec succès",
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
  } finally {
    await prisma.$disconnect();
  }
}
