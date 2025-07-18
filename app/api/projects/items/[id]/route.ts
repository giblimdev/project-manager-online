// app/api/projects/items/[id]/route.ts
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

interface UpdateItemBody {
  type?: string;
  name?: string;
  description?: string;
  objective?: string;
  slug?: string;
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
  parentId?: string;
  sprintId?: string;
  assigneeIds?: string[];
  isActive?: boolean;
}

interface RouteParams {
  id: string;
}

// =====================================
// ROUTE GET - RÉCUPÉRATION D'UN ITEM
// =====================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validation de l'ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide",
          details: "L'ID de l'item est requis et doit être une chaîne valide",
        },
        { status: 400 }
      );
    }

    // Récupération de l'item avec toutes ses relations
    const item = await prisma.item.findUnique({
      where: { id },
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
          take: 10,
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
              take: 5,
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
    });

    // Vérification de l'existence
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Item non trouvé",
          details: `L'item avec l'ID ${id} n'existe pas`,
        },
        { status: 404 }
      );
    }

    // Vérification des permissions (optionnel)
    // if (item.visibility === "PRIVATE" && item.userId !== currentUserId) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Accès interdit",
    //       details: "Vous n'avez pas les permissions pour voir cet item"
    //     },
    //     { status: 403 }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        data: item,
        meta: {
          timestamp: new Date().toISOString(),
          itemId: item.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération de l'item:", error);
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
// ROUTE PUT - MISE À JOUR D'UN ITEM
// =====================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: UpdateItemBody = await request.json();

    // Validation de l'ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide",
          details: "L'ID de l'item est requis et doit être une chaîne valide",
        },
        { status: 400 }
      );
    }

    // Vérification de l'existence de l'item
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        slug: true,
        name: true,
        type: true,
        status: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Item non trouvé",
          details: `L'item avec l'ID ${id} n'existe pas`,
        },
        { status: 404 }
      );
    }

    // Validation des champs modifiés
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Nom invalide",
            details: "Le nom est requis et doit être une chaîne non vide",
          },
          { status: 400 }
        );
      }
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
    }

    // Validation du slug si fourni
    if (body.slug !== undefined) {
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

      // Vérification de l'unicité du slug
      if (body.slug !== existingItem.slug) {
        const slugExists = await prisma.item.findFirst({
          where: {
            slug: body.slug,
            userId: existingItem.userId,
            id: { not: id },
          },
        });

        if (slugExists) {
          return NextResponse.json(
            {
              success: false,
              error: "Slug déjà utilisé",
              details: "Ce slug est déjà utilisé par un autre item",
            },
            { status: 409 }
          );
        }
      }
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
          error: "Statut invalide",
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
    if (
      body.progress !== undefined &&
      (body.progress < 0 || body.progress > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Progression invalide",
          details: "La progression doit être entre 0 et 100",
        },
        { status: 400 }
      );
    }

    if (body.storyPoints !== undefined && body.storyPoints < 0) {
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

    // Vérification du parent si spécifié
    if (body.parentId !== undefined) {
      if (body.parentId && body.parentId !== existingItem.id) {
        const parent = await prisma.item.findUnique({
          where: { id: body.parentId },
          select: { id: true, userId: true },
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

        if (parent.userId !== existingItem.userId) {
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
    }

    // Vérification des assignés si spécifiés
    if (body.assigneeIds !== undefined && body.assigneeIds.length > 0) {
      const assignees = await prisma.user.findMany({
        where: {
          id: { in: body.assigneeIds },
          isActive: true,
        },
        select: { id: true },
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

    // Mise à jour de l'item avec transaction
    const updatedItem = await prisma.$transaction(async (tx) => {
      // Préparation des données à mettre à jour
      const updateData: any = {};

      // Copie des champs simples
      const simpleFields = [
        "type",
        "name",
        "description",
        "objective",
        "slug",
        "key",
        "priority",
        "acceptanceCriteria",
        "storyPoints",
        "businessValue",
        "technicalRisk",
        "effort",
        "progress",
        "status",
        "visibility",
        "settings",
        "metadata",
        "text",
        "backlogPosition",
        "DoD",
        "estimatedHours",
        "actualHours",
        "parentId",
        "sprintId",
        "isActive",
      ];

      simpleFields.forEach((field) => {
        if (body[field as keyof UpdateItemBody] !== undefined) {
          updateData[field] = body[field as keyof UpdateItemBody];
        }
      });

      // Gestion des dates
      if (body.startDate !== undefined) {
        updateData.startDate = body.startDate ? new Date(body.startDate) : null;
      }
      if (body.endDate !== undefined) {
        updateData.endDate = body.endDate ? new Date(body.endDate) : null;
      }

      // Gestion des assignés
      if (body.assigneeIds !== undefined) {
        updateData.assignees = {
          set:
            body.assigneeIds.length > 0
              ? body.assigneeIds.map((id) => ({ id }))
              : [],
        };
      }

      // Mise à jour de l'item
      const item = await tx.item.update({
        where: { id },
        data: updateData,
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
        data: updatedItem,
        message: "Item mis à jour avec succès",
        meta: {
          timestamp: new Date().toISOString(),
          updatedId: updatedItem.id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'item:", error);

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

// =====================================
// ROUTE DELETE - SUPPRESSION D'UN ITEM
// =====================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Validation de l'ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide",
          details: "L'ID de l'item est requis et doit être une chaîne valide",
        },
        { status: 400 }
      );
    }

    // Vérification de l'existence de l'item
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        userId: true,
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

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Item non trouvé",
          details: `L'item avec l'ID ${id} n'existe pas`,
        },
        { status: 404 }
      );
    }

    // Vérification des permissions (optionnel)
    // if (existingItem.userId !== currentUserId) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "Accès interdit",
    //       details: "Vous n'avez pas les permissions pour supprimer cet item"
    //     },
    //     { status: 403 }
    //   );
    // }

    // Vérification des dépendances
    if (existingItem._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Suppression impossible",
          details: `Cet item a ${existingItem._count.children} enfant(s). Veuillez d'abord supprimer ou déplacer les items enfants.`,
        },
        { status: 409 }
      );
    }

    // Suppression avec transaction pour maintenir l'intégrité
    const deletedItem = await prisma.$transaction(async (tx) => {
      // Supprimer les relations many-to-many
      await tx.item.update({
        where: { id },
        data: {
          assignees: {
            set: [],
          },
        },
      });

      // Supprimer l'item
      const item = await tx.item.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          userId: true,
        },
      });

      return item;
    });

    return NextResponse.json(
      {
        success: true,
        data: deletedItem,
        message: "Item supprimé avec succès",
        meta: {
          timestamp: new Date().toISOString(),
          deletedId: deletedItem.id,
          deletedName: deletedItem.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'item:", error);

    // Gestion des erreurs Prisma spécifiques
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          {
            success: false,
            error: "Suppression impossible",
            details:
              "Cet item est référencé par d'autres éléments. Veuillez d'abord supprimer les références.",
          },
          { status: 409 }
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
