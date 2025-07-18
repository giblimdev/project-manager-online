// app/api/projects/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  Priority,
  ItemStatus,
  Visibility,
} from "@/lib/generated/prisma/client";
import prisma from "@/lib/prisma";

// =====================================
// INTERFACES TYPESCRIPT
// =====================================

interface SearchParams {
  type?: string;
  status?: string;
  priority?: string;
  userId?: string;
  sprintId?: string;
  parentId?: string;
  visibility?: string;
  page?: string;
  limit?: string;
}

interface CreateItemBody {
  type: string;
  name: string;
  description?: string;
  objective?: string;
  slug: string;
  key?: string;
  priority?: Priority;
  acceptanceCriteria?: string;
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  progress?: number;
  status?: ItemStatus;
  visibility?: Visibility;
  startDate?: string;
  endDate?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  text?: Record<string, any>;
  backlogPosition?: number;
  DoD?: string;
  estimatedHours?: number;
  actualHours?: number;
  userId: string;
  parentId?: string;
  sprintId?: string;
  assigneeIds?: string[];
}

// =====================================
// ROUTE GET - RÉCUPÉRATION DES ITEMS
// =====================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const params: SearchParams = {
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      priority: searchParams.get("priority") || undefined,
      userId: searchParams.get("userId") || undefined,
      sprintId: searchParams.get("sprintId") || undefined,
      parentId: searchParams.get("parentId") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    };

    const page: number = parseInt(params.page as string, 10);
    const limit: number = parseInt(params.limit as string, 10);
    const skip: number = (page - 1) * limit;

    // Validation des paramètres de pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres de pagination invalides",
          details: "La page doit être >= 1 et la limite entre 1 et 100",
        },
        { status: 400 }
      );
    }

    // Construction du filtre WHERE
    const whereFilter: any = {
      isActive: true,
    };

    if (params.type) {
      whereFilter.type = params.type;
    }

    if (params.status) {
      whereFilter.status = params.status;
    }

    if (params.priority) {
      whereFilter.priority = params.priority;
    }

    if (params.userId) {
      whereFilter.userId = params.userId;
    }

    if (params.sprintId) {
      whereFilter.sprintId = params.sprintId;
    }

    if (params.parentId) {
      whereFilter.parentId = params.parentId;
    }

    if (params.visibility) {
      whereFilter.visibility = params.visibility;
    }

    // Récupération des données avec relations complètes
    const items = await prisma.item.findMany({
      where: whereFilter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            progress: true,
            priority: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            progress: true,
            priority: true,
            assignees: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            backlogPosition: "asc",
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            goal: true,
            description: true,
          },
        },
        comments: {
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            replies: {
              take: 3,
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
        files: {
          select: {
            id: true,
            name: true,
            type: true,
            size: true,
            url: true,
            mimeType: true,
            isPublic: true,
            description: true,
            tags: true,
            uploader: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        timeEntries: {
          select: {
            id: true,
            hours: true,
            date: true,
            description: true,
            startTime: true,
            endTime: true,
            isManual: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
        _count: {
          select: {
            children: true,
            comments: true,
            files: true,
            timeEntries: true,
          },
        },
      },
      orderBy: [{ backlogPosition: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    });

    // Comptage total pour pagination
    const totalItems = await prisma.item.count({
      where: whereFilter,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json(
      {
        success: true,
        data: items,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        meta: {
          timestamp: new Date().toISOString(),
          count: items.length,
          filters: params,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// =====================================
// ROUTE POST - CRÉATION D'UN ITEM
// =====================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateItemBody = await request.json();

    // Validation des champs requis
    if (!body.type || !body.name || !body.slug || !body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: "Les champs type, name, slug et userId sont requis",
          missing: {
            type: !body.type,
            name: !body.name,
            slug: !body.slug,
            userId: !body.userId,
          },
        },
        { status: 400 }
      );
    }

    // Validation des longueurs
    if (body.name.length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: "Nom trop long",
          details: "Le nom ne peut pas dépasser 255 caractères",
        },
        { status: 400 }
      );
    }

    if (body.slug.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Slug trop long",
          details: "Le slug ne peut pas dépasser 100 caractères",
        },
        { status: 400 }
      );
    }

    // Validation du format du slug
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        {
          success: false,
          error: "Format de slug invalide",
          details:
            "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets",
        },
        { status: 400 }
      );
    }

    // Validation des types énumérés
    if (body.priority && !Object.values(Priority).includes(body.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: "Priorité invalide",
          details: `Les priorités valides sont: ${Object.values(Priority).join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (body.status && !Object.values(ItemStatus).includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Status invalide",
          details: `Les statuts valides sont: ${Object.values(ItemStatus).join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    if (
      body.visibility &&
      !Object.values(Visibility).includes(body.visibility)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Visibilité invalide",
          details: `Les visibilités valides sont: ${Object.values(
            Visibility
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validation des valeurs numériques
    if (body.progress && (body.progress < 0 || body.progress > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: "Progression invalide",
          details: "La progression doit être entre 0 et 100",
        },
        { status: 400 }
      );
    }

    if (body.storyPoints && body.storyPoints < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Story points invalides",
          details: "Les story points doivent être positifs",
        },
        { status: 400 }
      );
    }

    // Validation des dates
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

      if (startDate >= endDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Dates invalides",
            details: "La date de début doit être antérieure à la date de fin",
          },
          { status: 400 }
        );
      }
    }

    // Vérification de l'unicité du slug pour cet utilisateur
    const existingItem = await prisma.item.findFirst({
      where: {
        slug: body.slug,
        userId: body.userId,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Conflit de données",
          details: "Un item avec ce slug existe déjà pour cet utilisateur",
        },
        { status: 409 }
      );
    }

    // Vérification de l'existence de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, name: true, email: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable",
          details: `L'utilisateur avec l'ID ${body.userId} n'existe pas`,
        },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur inactif",
          details: "L'utilisateur n'est pas actif",
        },
        { status: 403 }
      );
    }

    // Vérification du parent si spécifié
    if (body.parentId) {
      const parent = await prisma.item.findUnique({
        where: { id: body.parentId },
        select: { id: true, name: true, type: true, userId: true },
      });

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            error: "Parent introuvable",
            details: `L'item parent avec l'ID ${body.parentId} n'existe pas`,
          },
          { status: 404 }
        );
      }

      // Vérification que le parent appartient au même utilisateur
      if (parent.userId !== body.userId) {
        return NextResponse.json(
          {
            success: false,
            error: "Parent non autorisé",
            details: "Le parent doit appartenir au même utilisateur",
          },
          { status: 403 }
        );
      }
    }

    // Vérification du sprint si spécifié
    if (body.sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: body.sprintId },
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      });

      if (!sprint) {
        return NextResponse.json(
          {
            success: false,
            error: "Sprint introuvable",
            details: `Le sprint avec l'ID ${body.sprintId} n'existe pas`,
          },
          { status: 404 }
        );
      }
    }

    // Vérification des assignés si spécifiés
    if (body.assigneeIds && body.assigneeIds.length > 0) {
      const assignees = await prisma.user.findMany({
        where: {
          id: {
            in: body.assigneeIds,
          },
          isActive: true,
        },
        select: { id: true, name: true, email: true },
      });

      if (assignees.length !== body.assigneeIds.length) {
        const foundIds = assignees.map((a) => a.id);
        const missingIds = body.assigneeIds.filter(
          (id) => !foundIds.includes(id)
        );

        return NextResponse.json(
          {
            success: false,
            error: "Assignés introuvables",
            details: `Les utilisateurs suivants n'existent pas ou sont inactifs: ${missingIds.join(
              ", "
            )}`,
          },
          { status: 404 }
        );
      }
    }

    // Calcul de la position dans le backlog si non spécifiée
    let backlogPosition = body.backlogPosition;
    if (!backlogPosition) {
      const lastItem = await prisma.item.findFirst({
        where: {
          userId: body.userId,
          parentId: body.parentId || null,
        },
        orderBy: {
          backlogPosition: "desc",
        },
        select: { backlogPosition: true },
      });
      backlogPosition = lastItem ? (lastItem.backlogPosition || 0) + 1 : 1;
    }

    // Création de l'item avec transaction
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          type: body.type,
          name: body.name,
          description: body.description,
          objective: body.objective,
          slug: body.slug,
          key: body.key,
          priority: body.priority || Priority.MEDIUM,
          acceptanceCriteria: body.acceptanceCriteria,
          storyPoints: body.storyPoints,
          businessValue: body.businessValue,
          technicalRisk: body.technicalRisk,
          effort: body.effort,
          progress: body.progress,
          status: body.status || ItemStatus.ACTIVE,
          visibility: body.visibility || Visibility.PRIVATE,
          startDate: body.startDate ? new Date(body.startDate) : null,
          endDate: body.endDate ? new Date(body.endDate) : null,
          settings: body.settings || {},
          metadata: body.metadata || {},
          text: body.text || {},
          backlogPosition,
          DoD: body.DoD,
          estimatedHours: body.estimatedHours,
          actualHours: body.actualHours,
          userId: body.userId,
          parentId: body.parentId,
          sprintId: body.sprintId,
          assignees:
            body.assigneeIds && body.assigneeIds.length > 0
              ? {
                  connect: body.assigneeIds.map((id) => ({ id })),
                }
              : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          assignees: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
          },
          sprint: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
          _count: {
            select: {
              children: true,
              comments: true,
              files: true,
              timeEntries: true,
            },
          },
        },
      });

      return item;
    });

    return NextResponse.json(
      {
        success: true,
        data: newItem,
        message: "Item créé avec succès",
        meta: {
          timestamp: new Date().toISOString(),
          createdId: newItem.id,
          backlogPosition,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'item:", error);

    // Gestion des erreurs Prisma spécifiques
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Conflit de données",
            details: "Une contrainte d'unicité a été violée",
          },
          { status: 409 }
        );
      }

      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Référence invalide",
            details: "Une référence vers un élément inexistant a été détectée",
          },
          { status: 400 }
        );
      }

      if (error.message.includes("Invalid JSON")) {
        return NextResponse.json(
          {
            success: false,
            error: "Format JSON invalide",
            details: "Les données JSON fournies ne sont pas valides",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
