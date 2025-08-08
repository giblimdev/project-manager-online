// app/api/blog/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validate,
  type UpdateCategoryInput,
} from "@/lib/blog/validations/blog";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        other_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blog_tags: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Erreur lors de la récupération de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la catégorie" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validation
    const validationResult = validate.categoryUpdate(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details:
            validationResult.errors?.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })) || [],
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data as UpdateCategoryInput;

    // Vérifier que la catégorie existe
    const existingCategory = await prisma.categories.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    // Gestion du slug si le nom change
    let finalSlug = validatedData.slug || existingCategory.slug;

    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const baseSlug = validatedData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Vérifier l'unicité
      let counter = 1;
      finalSlug = baseSlug;

      while (true) {
        const existing = await prisma.categories.findFirst({
          where: {
            slug: finalSlug,
            id: { not: id },
          },
        });

        if (!existing) break;
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Mise à jour
    const updatedCategory = await prisma.categories.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name.trim() }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description?.trim() || null,
        }),
        ...(validatedData.color !== undefined && {
          color: validatedData.color,
        }),
        ...(validatedData.parentId !== undefined && {
          parentId: validatedData.parentId,
        }),
        slug: finalSlug,
        updatedAt: new Date(),
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la catégorie:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      switch (prismaError.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Une catégorie avec ce slug existe déjà" },
            { status: 409 }
          );
        case "P2003":
          return NextResponse.json(
            { error: "Référence parent invalide" },
            { status: 400 }
          );
      }
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la catégorie" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    // Vérifier que la catégorie existe
    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        other_categories: true, // Enfants
        blog_tags: true,
        comments: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Catégorie non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des éléments liés
    if (category.other_categories.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer une catégorie qui a des sous-catégories",
        },
        { status: 400 }
      );
    }

    if (category.blog_tags.length > 0 || category.comments.length > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer une catégorie qui contient des tags ou des commentaires",
        },
        { status: 400 }
      );
    }

    // Supprimer la catégorie
    await prisma.categories.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Catégorie supprimée avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la catégorie:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la catégorie" },
      { status: 500 }
    );
  }
}
