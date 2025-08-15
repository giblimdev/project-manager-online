// app/api/tasks/[id]/reorder/route.ts

/**
 * RÔLE : API route pour la réorganisation d'une tâche dans une user story
 * RESPONSABILITÉS :
 * - PUT : Changement de position d'une tâche avec mise à jour automatique des positions
 * - Validation de l'existence de la tâche et de la user story de destination
 * - Gestion des positions avec réorganisation automatique des autres tâches
 * - Gestion d'erreurs complète avec codes HTTP appropriés
 * - Types stricts TypeScript avec interfaces Prisma
 * - Transaction atomique pour maintenir la cohérence des données
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: Next.js 15 API routes
 * - Prisma Client: ORM pour base de données avec transactions
 * - Interface ReorderTaskRequest: Types pour requête de réorganisation
 * - Transaction Prisma: Pour opérations atomiques
 * - Error handling: Gestion complète des erreurs
 *
 * LIBS UTILISÉS :
 * - Next.js 15 App Router: API routes avec params Promise
 * - Prisma ORM: Base de données avec relations TypeScript
 * - TypeScript strict mode: Types complets et validation
 * - Console logging: Debug et monitoring
 *
 * API ENDPOINTS :
 * - PUT /api/tasks/[id]/reorder : Réorganisation position tâche
 * - Status codes: 200, 400, 404, 500 avec messages explicites
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Interface pour les requêtes de réorganisation
interface ReorderTaskRequest {
  userStoryId: string;
  position: number;
}

/**
 * PUT - Réorganisation d'une tâche
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: ReorderTaskRequest = await request.json();

    console.log(`🔄 PUT Task Reorder - ID: ${id}`, body);

    // Validation des données requises
    if (!body.userStoryId) {
      return NextResponse.json(
        {
          success: false,
          error: "L'ID de la user story est requis",
          code: "MISSING_USERSTORY_ID",
        },
        { status: 400 }
      );
    }

    if (typeof body.position !== "number" || body.position < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La position doit être un nombre positif",
          code: "INVALID_POSITION",
        },
        { status: 400 }
      );
    }

    // Vérifier que la tâche existe
    const existingTask = await prisma.task.findUnique({
      where: { id },
      
    });

    if (!existingTask) {
      console.log(`❌ Task not found - ID: ${id}`);
      return NextResponse.json(
        {
          success: false,
          error: "Tâche non trouvée",
          code: "TASK_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Vérifier que la user story de destination existe
    const targetUserStory = await prisma.userStory.findUnique({
      where: { id: body.userStoryId },
      include: {
        feature: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!targetUserStory) {
      console.log(`❌ Target UserStory not found - ID: ${body.userStoryId}`);
      return NextResponse.json(
        {
          success: false,
          error: "User story de destination non trouvée",
          code: "TARGET_USERSTORY_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Valider que la position n'est pas trop élevée
    const maxPosition = targetUserStory._count.tasks;
    if (body.position > maxPosition) {
      return NextResponse.json(
        {
          success: false,
          error: `La position ${body.position} est trop élevée. Maximum autorisé: ${maxPosition}`,
          code: "POSITION_TOO_HIGH",
        },
        { status: 400 }
      );
    }

    // Effectuer la réorganisation dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const currentUserStoryId = existingTask.userstoryId;
      const targetUserStoryId = body.userStoryId;
      const newPosition = body.position;

      console.log(`📋 Reordering task from UserStory ${currentUserStoryId} to ${targetUserStoryId} at position ${newPosition}`);

      // Si la tâche change de user story
      if (currentUserStoryId !== targetUserStoryId) {
        // 1. Réorganiser les positions dans l'ancienne user story
        await tx.task.updateMany({
          where: {
            userstoryId: currentUserStoryId,
            position: {
              gt: existingTask.position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });





        console.log(`📤 Decreased positions in source UserStory: ${currentUserStoryId}`);

        // 2. Faire de la place dans la nouvelle user story
        await tx.task.updateMany({
          where: {
            userstoryId: targetUserStoryId,
            position: {
              gte: newPosition,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
        console.log(`📥 Made space in target UserStory: ${targetUserStoryId} at position ${newPosition}`);




        // 3. Déplacer la tâche vers la nouvelle user story et position
        const updatedTask = await tx.task.update({
          where: { id },
          data: {
            userstoryId: targetUserStoryId,
            position: newPosition,
          },
         });


        return updatedTask;
      } else {
        // Si la tâche reste dans la même user story, juste changer la position
        const currentPosition = existingTask.position;

        if (currentPosition === newPosition) {
          console.log(`⚡ Task already at position ${newPosition}, no change needed`);
          return existingTask;
        }

        // Déplacer vers le haut (position plus petite)
        if (newPosition < currentPosition) {
          await tx.task.updateMany({
            where: {
              userstoryId: currentUserStoryId,
              position: {
                gte: newPosition,
                lt: currentPosition,
              },
            },
            data: {
              position: {
                increment: 1,
              },
            },
          });
          console.log(`⬆️ Moved tasks down between positions ${newPosition} and ${currentPosition - 1}`);
        } 
        // Déplacer vers le bas (position plus grande)
        else {
          await tx.task.updateMany({
            where: {
              userstoryId: currentUserStoryId,
              position: {
                gt: currentPosition,
                lte: newPosition,
              },
            },
            data: {
              position: {
                decrement: 1,
              },
            },
          });
          console.log(`⬇️ Moved tasks up between positions ${currentPosition + 1} and ${newPosition}`);
        }

        // Mettre à jour la position de la tâche
        const updatedTask = await tx.task.update({
          where: { id },
          data: {
            position: newPosition,
          },
          
        });

        console.log(`✅ Task position updated to ${newPosition} within same UserStory`);
        return updatedTask;
      }
    });


    return NextResponse.json({
      success: true,
      data: result,
      message: "Tâche réorganisée avec succès",
    });

  } catch (error) {
    console.error("💥 Erreur lors de la réorganisation de la tâche:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la réorganisation de la tâche",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
