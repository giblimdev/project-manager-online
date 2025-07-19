// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Schéma de validation pour la création
const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  key: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z
    .enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"])
    .default("ACTIVE"),
  visibility: z.enum(["PRIVATE", "PUBLIC", "INTERNAL"]).default("PRIVATE"),
  isActive: z.boolean().default(true),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  slug: z.string().optional(),
});

// GET /api/projects - Récupérer tous les projets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const visibility = searchParams.get("visibility");
    const isActive = searchParams.get("isActive");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const orderBy = searchParams.get("orderBy") || "order";
    const orderDirection = searchParams.get("orderDirection") || "asc";

    // Construction des filtres (sans teamId)
    const where: any = {};
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (isActive !== null) where.isActive = isActive === "true";

    // Pagination
    const skip = (page - 1) * limit;

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: {
          [orderBy]: orderDirection as "asc" | "desc",
        },
        skip,
        take: limit,
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
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(projects, {
      headers: {
        "X-Total-Count": totalCount.toString(),
        "X-Total-Pages": totalPages.toString(),
        "X-Current-Page": page.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets", details: error },
      { status: 500 }
    );
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Générer le slug si non fourni
    const slug =
      validatedData.slug ||
      validatedData.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // ✅ Vérifier l'unicité du slug et de la clé (globalement, plus par équipe)
    const existingProject = await prisma.project.findFirst({
      where: {
        OR: [{ slug }, { key: validatedData.key }],
      },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          error: "Un projet avec cette clé ou ce nom existe déjà",
          field: existingProject.key === validatedData.key ? "key" : "slug",
        },
        { status: 409 }
      );
    }

    // ✅ Obtenir l'ordre maximal global
    const maxOrder = await prisma.project.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrder?.order || 0) + 1000;

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        slug,
        order: newOrder,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        settings: validatedData.settings || {},
        metadata: validatedData.metadata || {},
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

    return NextResponse.json(project, { status: 201 });
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

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    );
  }
}
