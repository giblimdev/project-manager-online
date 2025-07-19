// app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schéma de validation pour la mise à jour
const updateProjectSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    key: z
      .string()
      .min(2)
      .max(10)
      .regex(/^[A-Z0-9]+$/)
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]).optional(),
    visibility: z.enum(["PRIVATE", "PUBLIC", "INTERNAL"]).optional(),
    isActive: z.boolean().optional(),
    settings: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endDate"],
    }
  );

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/projects/[id] - Récupérer un projet spécifique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        // ✅ Suppression de la relation team
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          where: { isActive: true },
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
          orderBy: {
            joinedAt: "asc",
          },
        },
        initiatives: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            progress: true,
            startDate: true,
            endDate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        features: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
            progress: true,
            storyPoints: true,
          },
          orderBy: {
            position: "asc",
          },
        },
        sprints: {
          select: {
            id: true,
            name: true,
            goal: true,
            startDate: true,
            endDate: true,
            status: true,
            capacity: true,
            velocity: true,
          },
          orderBy: {
            startDate: "desc",
          },
        },
        files: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            createdAt: true,
            uploader: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        channels: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            isPrivate: true,
            _count: {
              select: {
                messages: true,
                members: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            initiatives: true,
            features: true,
            sprints: true,
            files: true,
            channels: true,
            templates: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du projet" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Mettre à jour un projet
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true, slug: true, key: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const validatedData = updateProjectSchema.parse(body);

    let slug = existingProject.slug;
    if (validatedData.name) {
      slug = validatedData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Vérifier l'unicité du slug et de la clé si ils changent
    if (
      validatedData.key !== existingProject.key ||
      slug !== existingProject.slug
    ) {
      const conflictingProject = await prisma.project.findFirst({
        where: {
          NOT: { id },
          OR: [{ slug }, { key: validatedData.key }],
        },
      });

      if (conflictingProject) {
        return NextResponse.json(
          {
            error: "Un projet avec cette clé ou ce nom existe déjà",
            field:
              conflictingProject.key === validatedData.key ? "key" : "slug",
          },
          { status: 409 }
        );
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...validatedData,
        slug,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : undefined,
        endDate: validatedData.endDate
          ? new Date(validatedData.endDate)
          : undefined,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
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
        },
        _count: {
          select: {
            initiatives: true,
            features: true,
            sprints: true,
            files: true,
            channels: true,
            templates: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Supprimer un projet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            initiatives: true,
            features: true,
            sprints: true,
            files: true,
            channels: true,
            templates: true,
          },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const hasActiveContent = Object.values(existingProject._count).some(
      (count) => count > 0
    );

    if (hasActiveContent) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer ce projet car il contient des données",
          details:
            "Supprimez d'abord les initiatives, fonctionnalités, sprints et autres éléments associés",
        },
        { status: 409 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Projet supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du projet" },
      { status: 500 }
    );
  }
}
