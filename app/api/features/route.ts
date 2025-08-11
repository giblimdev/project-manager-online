import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ajustez le chemin selon votre structure
import { Priority } from "@/lib/generated/prisma/client";

// Type pour une Feature simple sans relations
type SimpleFeature = {
  id: string;
  name: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
};

// GET - Récupérer toutes les features
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const epicId = searchParams.get("epicId");
    const projectId = searchParams.get("projectId");

    const whereClause: any = {};

    if (epicId) {
      whereClause.epicId = epicId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const features = await prisma.feature.findMany({
      where: whereClause,
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
      orderBy: [{ order: "asc" }, { position: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: features,
      count: features.length,
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des features:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des features",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle feature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des champs requis
    if (!body.name || !body.epicId) {
      return NextResponse.json(
        {
          success: false,
          error: "Le nom et l'epicId sont requis",
        },
        { status: 400 }
      );
    }

    // Obtenir le prochain order disponible
    const lastFeature = await prisma.feature.findFirst({
      where: { epicId: body.epicId },
      orderBy: { order: "desc" },
    });

    const nextOrder = lastFeature ? lastFeature.order + 1 : 1;

    const newFeature = await prisma.feature.create({
      data: {
        name: body.name,
        order: body.order || nextOrder,
        description: body.description || null,
        acceptanceCriteria: body.acceptanceCriteria || null,
        priority: body.priority || Priority.MEDIUM,
        status: body.status || "ACTIVE",
        storyPoints: body.storyPoints || null,
        businessValue: body.businessValue || null,
        technicalRisk: body.technicalRisk || null,
        effort: body.effort || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        progress: body.progress || 0,
        position: body.position || 0,
        epicId: body.epicId,
        parentId: body.parentId || null,
        projectId: body.projectId || null,
        userId: body.userId || null,
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

    return NextResponse.json(
      {
        success: true,
        data: newFeature,
        message: "Feature créée avec succès",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la création de la feature:", error);

    // Gestion des erreurs spécifiques de Prisma
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Une feature avec ces informations existe déjà",
        },
        { status: 409 }
      );
    }

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Epic non trouvé",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de la feature",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
