// @/app/api/features/[id]/route.ts
// Rôle : API REST pour la gestion d'une feature spécifique
// Responsabilités : GET, PUT, DELETE d'une feature, gestion des relations

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>; // Update to Promise
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params; // Await the params to resolve the id

    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            children: true,
            userStories: {
              select: {
                id: true,
                title: true,
                status: true,
                storyPoints: true,
              },
            },
          },
        },
        epic: {
          include: {
            initiative: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        Project: true,
        users: true,
        userStories: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        files: true,
        dependencies: {
          include: {
            dependsOnFeature: true,
          },
        },
        dependents: {
          include: {
            dependentFeature: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error("Error fetching feature:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params; // Await the params to resolve the id
    const data = await request.json();

    // Vérifier que la feature existe
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
    });

    if (!existingFeature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Vérification du parent si fourni
    if (data.parentId && data.parentId !== existingFeature.parentId) {
      if (data.parentId === id) {
        return NextResponse.json(
          { error: "Feature cannot be its own parent" },
          { status: 400 }
        );
      }

      const parent = await prisma.feature.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent feature not found" },
          { status: 404 }
        );
      }

      // Vérifier qu'on ne crée pas une relation circulaire
      if (await hasCircularDependency(id, data.parentId)) {
        return NextResponse.json(
          { error: "Circular dependency detected" },
          { status: 400 }
        );
      }
    }

    const updatedFeature = await prisma.feature.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        acceptanceCriteria: data.acceptanceCriteria,
        priority: data.priority,
        status: data.status,
        storyPoints: data.storyPoints,
        businessValue: data.businessValue,
        technicalRisk: data.technicalRisk,
        effort: data.effort,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        parentId: data.parentId === "" ? null : data.parentId,
        progress: data.progress,
        position: data.position,
      },
      include: {
        parent: true,
        children: true,
        epic: true,
        Project: true,
        users: true,
      },
    });

    return NextResponse.json(updatedFeature);
  } catch (error) {
    console.error("Error updating feature:", error);
    return NextResponse.json(
      { error: "Failed to update feature" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params; // Await the params to resolve the id

    // Vérifier que la feature existe
    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        children: true,
        userStories: true,
      },
    });

    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    // Vérifier s'il y a des enfants
    if (feature.children.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete feature with child features. Please delete or reassign child features first.",
        },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des user stories
    if (feature.userStories.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete feature with user stories. Please delete or reassign user stories first.",
        },
        { status: 400 }
      );
    }

    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Error deleting feature:", error);
    return NextResponse.json(
      { error: "Failed to delete feature" },
      { status: 500 }
    );
  }
}

async function hasCircularDependency(
  featureId: string,
  parentId: string
): Promise<boolean> {
  if (featureId === parentId) return true;

  const parent = await prisma.feature.findUnique({
    where: { id: parentId },
    select: { parentId: true },
  });

  if (!parent?.parentId) return false;

  return hasCircularDependency(featureId, parent.parentId);
}
