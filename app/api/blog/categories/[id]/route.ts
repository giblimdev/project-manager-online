// app/api/blog/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Ajustez le chemin selon votre structure

// GET - Récupérer une catégorie spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        posts: true,
        tags: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la catégorie' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une catégorie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la catégorie' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une catégorie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Catégorie supprimée avec succès' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la catégorie' },
      { status: 500 }
    );
  }
}