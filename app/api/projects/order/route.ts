// app/api/projects/order/route.ts
// Rôle : Route API pour sauvegarder l'ordre des projets
// Méthodes : PUT pour mise à jour de l'ordre
// Responsabilités : Validation données, mise à jour base de données, gestion erreurs
// Next.js 15 : Utilisation de NextRequest et NextResponse

import { NextRequest, NextResponse } from "next/server";

interface ProjectOrderItem {
  id: string;
  order: number;
}

interface RequestBody {
  projectOrder: ProjectOrderItem[];
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Récupération et validation du body
    const body: RequestBody = await request.json();

    if (!body.projectOrder || !Array.isArray(body.projectOrder)) {
      return NextResponse.json(
        { error: "Format de données invalide. projectOrder requis." },
        { status: 400 }
      );
    }

    // Validation des éléments du tableau
    const isValidOrder = body.projectOrder.every(
      (item) =>
        typeof item.id === "string" &&
        typeof item.order === "number" &&
        item.id.length > 0 &&
        Number.isInteger(item.order) &&
        item.order >= 0
    );

    if (!isValidOrder) {
      return NextResponse.json(
        {
          error:
            "Données d'ordre invalides. Chaque élément doit avoir un id (string) et order (number).",
        },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas de doublons d'ID
    const projectIds = body.projectOrder.map((item) => item.id);
    const uniqueIds = new Set(projectIds);

    if (projectIds.length !== uniqueIds.size) {
      return NextResponse.json(
        { error: "IDs de projets dupliqués détectés." },
        { status: 400 }
      );
    }

    // Ici vous intégrerez votre logique de base de données
    // Exemple avec Prisma :
    // const updatePromises = body.projectOrder.map(async (item) => {
    //   return await prisma.project.update({
    //     where: { id: item.id },
    //     data: { order: item.order }
    //   });
    // });
    // await Promise.all(updatePromises);

    // Simulation pour l'exemple
    console.log(
      `Mise à jour de l'ordre de ${body.projectOrder.length} projets`
    );
    body.projectOrder.forEach((item) => {
      console.log(`Projet ${item.id} -> ordre ${item.order}`);
    });

    return NextResponse.json(
      {
        message: "Ordre des projets sauvegardé avec succès",
        updatedCount: body.projectOrder.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde de l'ordre des projets:",
      error
    );

    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Méthode OPTIONS pour CORS si nécessaire
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
