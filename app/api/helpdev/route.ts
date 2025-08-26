//@/app/api/helpdev/route.ts



import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const helpDevData = await prisma.helpDev.findMany({
      orderBy: {
        titre: 'asc'
      }
    });
    return NextResponse.json(helpDevData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titre, presentationProjet, section } = body;

    const newHelpDev = await prisma.helpDev.create({
      data: {
        titre,
        presentationProjet,
        section,
      },
    });

    return NextResponse.json(newHelpDev);
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' }, 
      { status: 500 }
    );
  }
}
