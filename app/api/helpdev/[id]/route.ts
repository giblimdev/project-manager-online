import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const helpDev = await prisma.helpDev.findUnique({
      where: { id },
    });

    if (!helpDev) {
      return NextResponse.json(
        { error: 'Documentation non trouvée' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(helpDev);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { titre, presentationProjet, section } = body;

    const updatedHelpDev = await prisma.helpDev.update({
      where: { id },
      data: {
        titre,
        presentationProjet,
        section,
      },
    });

    return NextResponse.json(updatedHelpDev);
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.helpDev.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Documentation supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' }, 
      { status: 500 }
    );
  }
}
