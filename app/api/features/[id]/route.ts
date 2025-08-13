// @/app/api/features/[id]/route.ts

// Rôle : Route API pour gérer une feature spécifique (GET, PUT, DELETE)
// Responsabilités : CRUD individuel des features, validation, gestion d'erreurs
// Utilisé par : composants React, hooks de données

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Priority } from "@/lib/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Récupérer une feature par ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la feature requis",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const feature = await prisma.feature.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        order: true,
        description: true,
        acceptanceCriteria: true,
        priority: true,
        status: true,
        storyPoints: true,
        businessValue: true,
        technicalRisk: true,
        effort: true,
        startDate: true,
        endDate: true,
        progress: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        epicId: true,
        parentId: true,
        projectId: true,
        userId: true,
      },
    });

    if (!feature) {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: feature,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération de la feature:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la feature",
        details: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une feature
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la feature requis",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Vérifier que la feature existe
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const updatedFeature = await prisma.feature.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.acceptanceCriteria !== undefined && {
          acceptanceCriteria: body.acceptanceCriteria,
        }),
        ...(body.priority && { priority: body.priority }),
        ...(body.status && { status: body.status }),
        ...(body.storyPoints !== undefined && {
          storyPoints: body.storyPoints,
        }),
        ...(body.businessValue !== undefined && {
          businessValue: body.businessValue,
        }),
        ...(body.technicalRisk !== undefined && {
          technicalRisk: body.technicalRisk,
        }),
        ...(body.effort !== undefined && { effort: body.effort }),
        ...(body.startDate !== undefined && {
          startDate: body.startDate ? new Date(body.startDate) : null,
        }),
        ...(body.endDate !== undefined && {
          endDate: body.endDate ? new Date(body.endDate) : null,
        }),
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.projectId !== undefined && { projectId: body.projectId }),
        ...(body.userId !== undefined && { userId: body.userId }),
      },
      select: {
        id: true,
        name: true,
        order: true,
        description: true,
        acceptanceCriteria: true,
        priority: true,
        status: true,
        storyPoints: true,
        businessValue: true,
        technicalRisk: true,
        effort: true,
        startDate: true,
        endDate: true,
        progress: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        epicId: true,
        parentId: true,
        projectId: true,
        userId: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFeature,
      message: "Feature mise à jour avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de la feature:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la feature",
        details: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une feature
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de la feature requis",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Vérifier que la feature existe
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      return NextResponse.json(
        {
          success: false,
          error: "Feature non trouvée",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Feature supprimée avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur lors de la suppression de la feature:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression de la feature",
        details: error?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
