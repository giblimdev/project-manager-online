// app/api/files/reorder/route.ts
/**
 * Rôle : Gestionnaire de route API pour réordonner les fichiers
 * Responsabilités :
 * - Gère la mise à jour en batch des ordres de fichiers
 * - Utilise les transactions Prisma pour l'atomicité
 * - Typage strict des données JSON reçues
 * - Conformité Next.js 15 avec NextRequest/NextResponse
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Interface pour typer strictement les données reçues
interface FileOrderUpdate {
  id: string;
  order: number;
}

interface ReorderRequestBody {
  files: FileOrderUpdate[];
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { files }: ReorderRequestBody = await request.json();

    // Validation des données
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Invalid files array" },
        { status: 400 }
      );
    }

    // Créer une transaction pour mettre à jour tous les ordres
    const transaction = files.map((file: FileOrderUpdate) =>
      prisma.file.update({
        where: { id: file.id },
        data: { order: file.order },
      })
    );

    await prisma.$transaction(transaction);

    return NextResponse.json(
      { 
        success: true, 
        message: "Order updated successfully",
        updatedCount: files.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
