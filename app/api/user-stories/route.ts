// app/api/user-stories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z, ZodError } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import type { Priority, TaskStatus } from "@/lib/generated/prisma/client";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const userStorySchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z
    .enum([
      "TODO",
      "IN_PROGRESS",
      "CODE_REVIEW",
      "TESTING",
      "DONE",
      "BLOCKED",
      "CANCELLED",
    ])
    .default("TODO"),
  storyPoints: z.number().int().positive().optional(),
  businessValue: z.number().int().positive().optional(),
  technicalRisk: z.number().int().positive().optional(),
  effort: z.number().int().positive().optional(),
  position: z.number().int().default(0),
  labels: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  featureId: z.string().cuid(),
  assigneeIds: z.array(z.string().cuid()).default([]),
});

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as Priority | null;
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "position";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const where: any = {
      OR: [
        { creatorId: session.user.id },
        { UserStoryAssignees: { some: { A: session.user.id } } },
      ],
    };

    if (featureId) where.featureId = featureId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) {
      where.UserStoryAssignees = {
        some: {
          users: {
            id: assigneeId,
          },
        },
      };
    }
    if (search) {
      where.OR = [
        ...where.OR,
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [userStories, total] = await Promise.all([
      prisma.userStory.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          UserStoryAssignees: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          feature: {
            select: {
              id: true,
              name: true,
              epic: {
                select: {
                  id: true,
                  name: true,
                  initiative: {
                    select: {
                      id: true,
                      name: true,
                      project: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              comments: true,
              timeEntries: true,
              files: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userStory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        userStories: userStories.map((us) => ({
          ...us,
          assignees: us.UserStoryAssignees.map((usa) => usa.users),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user stories:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = userStorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Vérifier que la feature existe et que l'utilisateur a accès
    const feature = await prisma.feature.findUnique({
      where: {
        id: data.featureId,
        Project: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: { id: true },
    });

    if (!feature) {
      return NextResponse.json(
        { success: false, error: "Feature non trouvée ou accès refusé" },
        { status: 404 }
      );
    }

    // Vérifier les assignés
    const validAssignees: string[] = [];
    if (data.assigneeIds.length > 0) {
      const assignees = await prisma.user.findMany({
        where: {
          id: { in: data.assigneeIds },
          isActive: true,
        },
        select: { id: true },
      });

      validAssignees.push(...assignees.map((a) => a.id));
    }

    // Obtenir la position si non spécifiée
    let position = data.position;
    if (position === 0) {
      const lastUserStory = await prisma.userStory.findFirst({
        where: { featureId: data.featureId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      position = (lastUserStory?.position || 0) + 1000;
    }

    // Créer la User Story avec transaction
    const newUserStory = await prisma.$transaction(async (tx) => {
      const userStory = await tx.userStory.create({
        data: {
          title: data.title,
          description: data.description,
          acceptanceCriteria: data.acceptanceCriteria,
          priority: data.priority,
          status: data.status,
          storyPoints: data.storyPoints,
          businessValue: data.businessValue,
          technicalRisk: data.technicalRisk,
          effort: data.effort,
          position,
          labels: data.labels,
          tags: data.tags,
          estimatedHours: data.estimatedHours,
          actualHours: data.actualHours,
          featureId: data.featureId,
          creatorId: session.user.id,
        },
      });

      // Ajouter les assignés
      if (validAssignees.length > 0) {
        await tx.userStoryAssignees.createMany({
          data: validAssignees.map((userId) => ({
            A: userId,
            B: userStory.id,
          })),
        });
      }

      return tx.userStory.findUnique({
        where: { id: userStory.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          UserStoryAssignees: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          feature: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newUserStory,
          assignees:
            newUserStory?.UserStoryAssignees.map((usa) => usa.users) || [],
        },
        message: "User Story créée avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user story:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
