// @/app/api/files/[id]/route.ts

/**
 * RÔLE : API route Next.js 15 pour gestion CRUD individuelle des métadonnées de fichiers
 * RESPONSABILITÉS :
 * - GET /api/files/[id] : Récupération d'un fichier spécifique avec relations complètes
 * - PUT /api/files/[id] : Mise à jour des métadonnées avec validation native TypeScript CORRIGÉE
 * - DELETE /api/files/[id] : Suppression sécurisée avec vérification des dépendances
 * - CORRECTION MAJEURE : Interface UpdateFileData avec types string appropriés
 * - CORRECTION : Fonction validateUpdateData avec assignations correctes
 * - CORRECTION : Types TypeScript stricts sans erreur d'assignation
 * - Support des types FileType EXACTS selon schéma Prisma fourni
 * - Gestion des relations hiérarchiques parent/enfant avec store Project
 * - Compatible avec FilesForm.tsx, page.tsx et store useSelectedProjectStore
 *
 * COMPOSANTS UTILISÉS :
 * - NextRequest, NextResponse: API Next.js 15 pour requêtes/réponses HTTP
 * - PrismaClient: ORM pour base de données PostgreSQL avec relations selon schéma fourni
 * - Validation native TypeScript avec interfaces strictes
 *
 * LIBS UTILISÉS :
 * - Next.js 15 API routes avec TypeScript strict mode et paramètres Promise-based
 * - Prisma ORM avec types générés depuis schéma fourni (PJ9)
 * - TypeScript strict : Types stricts pour sécurité et performance
 */

import { NextRequest, NextResponse } from "next/server";
import { JSX } from "react";
import prisma from "@/lib/prisma";

// ✅ Interface pour les paramètres Next.js 15 (Promise-based)
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ✅ Types FileType selon votre schéma Prisma EXACT
type FileType =
  | "DOSSIER"
  | "PAGE"
  | "COMPONENT"
  | "UTILS"
  | "LIB"
  | "STORE"
  | "HOOK"
  | "ENV"
  | "SYSTEM"
  | "TEST"
  | "OTHER";

// ✅ CORRECTION MAJEURE : Interface UpdateFileData avec types corrects (string au lieu d'undefined)
interface UpdateFileData {
  name?: string;
  type?: FileType;
  // ✅ CORRECTION : Types string | null pour compatibilité (pas undefined)
  mimeType?: string | null;
  path?: string | null;
  description?: string | null;
  import?: string | null;
  use?: string | null;
  export?: string | null;
  script?: string | null;
  isFolder?: boolean;
  tags?: string[];
  metadata?: Record<string, any> | null;
  // Relations optionnelles selon votre schéma - CORRIGÉES
  parentId?: string | null;
  featureId?: string | null;
  userStoryId?: string | null;
  taskId?: string | null;
  sprintId?: string | null;
}

// ✅ Interface pour la réponse d'erreur
interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  context?: string;
  timestamp: string;
}

// ✅ Interface pour la réponse de succès
interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

// ✅ Fonction de validation CUID native
function isValidCUID(id: string): boolean {
  const cuidRegex = /^[cC][a-zA-Z0-9]{24,}$/;
  return cuidRegex.test(id);
}

// ✅ Fonction de validation FileType native
function isValidFileType(type: any): type is FileType {
  const validTypes: FileType[] = [
    "DOSSIER",
    "PAGE",
    "COMPONENT",
    "UTILS",
    "LIB",
    "STORE",
    "HOOK",
    "ENV",
    "SYSTEM",
    "TEST",
    "OTHER",
  ];
  return typeof type === "string" && validTypes.includes(type as FileType);
}

// ✅ CORRECTION : Fonction de validation avec assignations correctes
function validateUpdateData(data: any): {
  isValid: boolean;
  errors: string[];
  validData?: UpdateFileData;
} {
  const errors: string[] = [];
  const validData: UpdateFileData = {};

  // Validation du nom
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      errors.push("Le nom doit être une chaîne non vide");
    } else if (data.name.length > 255) {
      errors.push("Le nom ne peut pas dépasser 255 caractères");
    } else {
      validData.name = data.name.trim(); // ✅ CORRECTION : string assigné à string
    }
  }

  // Validation du type
  if (data.type !== undefined) {
    if (!isValidFileType(data.type)) {
      errors.push(
        `Type invalide. Types acceptés: DOSSIER, PAGE, COMPONENT, UTILS, LIB, STORE, HOOK, ENV, SYSTEM, TEST, OTHER`
      );
    } else {
      validData.type = data.type; // ✅ CORRECTION : FileType assigné à FileType
    }
  }

  // ✅ CORRECTION : Validation des champs string | null avec assignations correctes
  const nullableStringFields: Array<{
    key: keyof UpdateFileData;
    fieldName: string;
  }> = [
    { key: "mimeType", fieldName: "mimeType" },
    { key: "path", fieldName: "path" },
    { key: "description", fieldName: "description" },
    { key: "import", fieldName: "import" },
    { key: "use", fieldName: "use" },
    { key: "export", fieldName: "export" },
    { key: "script", fieldName: "script" },
  ];

  nullableStringFields.forEach(({ key, fieldName }) => {
    if (data[fieldName] !== undefined) {
      if (data[fieldName] === null || typeof data[fieldName] === "string") {
        // ✅ CORRECTION : Assignation avec type assertion approprié
        (validData as any)[key] = data[fieldName];
      } else {
        errors.push(`${fieldName} doit être une chaîne ou null`);
      }
    }
  });

  // Validation isFolder
  if (data.isFolder !== undefined) {
    if (typeof data.isFolder !== "boolean") {
      errors.push("isFolder doit être un booléen");
    } else {
      validData.isFolder = data.isFolder;
    }
  }

  // Validation tags
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push("tags doit être un tableau");
    } else if (!data.tags.every((tag: any) => typeof tag === "string")) {
      errors.push("tous les tags doivent être des chaînes");
    } else {
      validData.tags = data.tags;
    }
  }

  // Validation metadata
  if (data.metadata !== undefined) {
    if (
      data.metadata === null ||
      (typeof data.metadata === "object" && data.metadata !== null)
    ) {
      validData.metadata = data.metadata;
    } else {
      errors.push("metadata doit être un objet ou null");
    }
  }

  // ✅ CORRECTION : Validation des relations avec assignations correctes
  const relationFields: Array<{
    key: keyof UpdateFileData;
    fieldName: string;
  }> = [
    { key: "parentId", fieldName: "parentId" },
    { key: "featureId", fieldName: "featureId" },
    { key: "userStoryId", fieldName: "userStoryId" },
    { key: "taskId", fieldName: "taskId" },
    { key: "sprintId", fieldName: "sprintId" },
  ];

  relationFields.forEach(({ key, fieldName }) => {
    if (data[fieldName] !== undefined) {
      if (data[fieldName] === null) {
        // ✅ CORRECTION : Assignation null avec type assertion
        (validData as any)[key] = null;
      } else if (
        typeof data[fieldName] === "string" &&
        isValidCUID(data[fieldName])
      ) {
        // ✅ CORRECTION : Assignation string avec type assertion
        (validData as any)[key] = data[fieldName];
      } else {
        errors.push(`${fieldName} doit être un CUID valide ou null`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validData: errors.length === 0 ? validData : undefined,
  };
}

// ✅ Fonction utilitaire pour créer une réponse d'erreur
function createErrorResponse(
  error: string,
  details?: string,
  context?: string,
  status: number = 500
): NextResponse {
  console.error(`💥 Erreur ${context || "inconnue"}:`, error, details);

  const errorResponse: ErrorResponse = {
    success: false,
    error,
    ...(details && { details }),
    ...(context && { context }),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(errorResponse, { status });
}

// ✅ Fonction utilitaire pour créer une réponse de succès
function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse {
  const successResponse: SuccessResponse<T> = {
    success: true,
    ...(data && { data }),
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(successResponse, { status });
}

/**
 * GET /api/files/[id] - Récupération d'un fichier spécifique selon votre schéma
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    console.log("📡 GET /api/files/[id] - Début");

    // ✅ Résolution Promise des paramètres Next.js 15
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    console.log("🔍 ID reçu:", id);

    // Validation native de l'ID
    if (!id || !isValidCUID(id)) {
      return createErrorResponse(
        "ID invalide",
        "L'ID doit être un CUID valide",
        "Validation ID",
        400
      );
    }

    // ✅ Récupération avec relations complètes selon votre schéma Prisma EXACT
    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        // ✅ Relations selon votre schéma Prisma (PJ9) EXACT
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            slug: true,
            description: true,
            status: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
            description: true,
            priority: true,
            status: true,
          },
        },
        userStory: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            storyPoints: true,
            status: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            estimatedHours: true,
            status: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            goal: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        // ✅ Relation author[] multiple selon votre schéma
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        // ✅ Hiérarchie des fichiers selon votre schéma
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
            isFolder: true,
            path: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
            isFolder: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: [{ isFolder: "desc" }, { name: "asc" }],
        },
        // ✅ Versions et commentaires selon votre schéma
        versions: {
          select: {
            id: true,
            version: true,
            url: true,
            size: true,
            changelog: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { version: "desc" },
        },
        comments: {
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        // ✅ Relations items selon votre schéma
        items: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
            items: true,
          },
        },
      },
    });

    if (!file) {
      return createErrorResponse(
        "Fichier non trouvé",
        `Aucun fichier trouvé avec l'ID: ${id}`,
        "GET /api/files/[id]",
        404
      );
    }

    console.log("✅ Fichier trouvé:", file.name);

    // ✅ Transformation des dates pour JSON compatible avec votre architecture
    const serializedFile = {
      ...file,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      versions:
        file.versions?.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })) || [],
      comments:
        file.comments?.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })) || [],
      children:
        file.children?.map((child) => ({
          ...child,
          createdAt: child.createdAt.toISOString(),
          updatedAt: child.updatedAt.toISOString(),
        })) || [],
      sprint: file.sprint
        ? {
            ...file.sprint,
            startDate: file.sprint.startDate.toISOString(),
            endDate: file.sprint.endDate.toISOString(),
          }
        : null,
    };

    return createSuccessResponse(serializedFile);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur interne du serveur";
    return createErrorResponse(errorMessage, undefined, "GET /api/files/[id]");
  }
}

/**
 * PUT /api/files/[id] - Mise à jour d'un fichier compatible avec votre FilesForm.tsx
 */
export async function PUT(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    console.log("📡 PUT /api/files/[id] - Début");

    // ✅ Résolution Promise des paramètres Next.js 15
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    console.log("🔍 ID reçu:", id);

    // Validation native de l'ID
    if (!id || !isValidCUID(id)) {
      return createErrorResponse(
        "ID invalide",
        "L'ID doit être un CUID valide",
        "Validation ID",
        400
      );
    }

    // ✅ Lecture et parsing sécurisé du body
    let body: any;
    try {
      body = await request.json();
      console.log("📥 Body reçu:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error("❌ Erreur parsing JSON:", parseError);
      return createErrorResponse(
        "Corps de la requête JSON invalide",
        parseError instanceof Error ? parseError.message : "Erreur de parsing",
        "Parsing JSON",
        400
      );
    }

    // ✅ Validation native des données avec types corrigés
    const validation = validateUpdateData(body);
    if (!validation.isValid || !validation.validData) {
      console.error("❌ Validation échouée:", validation.errors);
      return createErrorResponse(
        "Données invalides",
        validation.errors.join(", "),
        "Validation données PUT",
        400
      );
    }

    const validatedData = validation.validData;
    console.log("✅ Données validées:", validatedData);

    // ✅ Vérification existence du fichier
    const existingFile = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        projectId: true,
        parentId: true,
        version: true,
        type: true,
        isFolder: true,
      },
    });

    if (!existingFile) {
      return createErrorResponse(
        "Fichier non trouvé",
        `Aucun fichier avec l'ID: ${id}`,
        "PUT /api/files/[id]",
        404
      );
    }

    console.log("✅ Fichier existant trouvé:", existingFile);

    // ✅ Vérification unicité du nom si modifié
    if (validatedData.name && validatedData.name !== existingFile.name) {
      const duplicateName = await prisma.file.findFirst({
        where: {
          name: validatedData.name,
          projectId: existingFile.projectId,
          parentId: existingFile.parentId,
          NOT: { id },
        },
      });

      if (duplicateName) {
        return createErrorResponse(
          "Conflit de nom",
          `Un fichier nommé "${validatedData.name}" existe déjà dans ce dossier`,
          "PUT /api/files/[id]",
          409
        );
      }
    }

    // ✅ Validation du parent si modifié
    if (
      validatedData.parentId !== undefined &&
      validatedData.parentId !== existingFile.parentId
    ) {
      if (validatedData.parentId) {
        const parentFile = await prisma.file.findUnique({
          where: { id: validatedData.parentId },
          select: {
            id: true,
            isFolder: true,
            projectId: true,
            name: true,
          },
        });

        if (!parentFile) {
          return createErrorResponse(
            "Parent non trouvé",
            `Aucun dossier parent avec l'ID: ${validatedData.parentId}`,
            "PUT /api/files/[id]",
            404
          );
        }

        if (!parentFile.isFolder) {
          return createErrorResponse(
            "Parent invalide",
            `"${parentFile.name}" n'est pas un dossier`,
            "PUT /api/files/[id]",
            400
          );
        }

        if (parentFile.projectId !== existingFile.projectId) {
          return createErrorResponse(
            "Parent invalide",
            "Le parent doit être dans le même projet",
            "PUT /api/files/[id]",
            400
          );
        }

        // Vérification référence circulaire
        if (validatedData.parentId === id) {
          return createErrorResponse(
            "Référence circulaire",
            "Un dossier ne peut pas être son propre parent",
            "PUT /api/files/[id]",
            400
          );
        }
      }
    }

    // ✅ CORRECTION : Construction données de mise à jour avec types corrects
    const updateData: Record<string, any> = {};

    // Champs de base - gestion explicite avec types corrects
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type;
    }
    if (validatedData.mimeType !== undefined) {
      updateData.mimeType = validatedData.mimeType;
    }
    if (validatedData.path !== undefined) {
      updateData.path = validatedData.path;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.import !== undefined) {
      updateData.import = validatedData.import;
    }
    if (validatedData.use !== undefined) {
      updateData.use = validatedData.use;
    }
    if (validatedData.export !== undefined) {
      updateData.export = validatedData.export;
    }
    if (validatedData.script !== undefined) {
      updateData.script = validatedData.script;
    }
    if (validatedData.isFolder !== undefined) {
      updateData.isFolder = validatedData.isFolder;
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = validatedData.tags;
    }
    if (validatedData.metadata !== undefined) {
      updateData.metadata = validatedData.metadata;
    }

    // Relations optionnelles selon votre schéma
    if (validatedData.parentId !== undefined) {
      updateData.parentId = validatedData.parentId;
    }
    if (validatedData.featureId !== undefined) {
      updateData.featureId = validatedData.featureId;
    }
    if (validatedData.userStoryId !== undefined) {
      updateData.userStoryId = validatedData.userStoryId;
    }
    if (validatedData.taskId !== undefined) {
      updateData.taskId = validatedData.taskId;
    }
    if (validatedData.sprintId !== undefined) {
      updateData.sprintId = validatedData.sprintId;
    }

    // Incrémentation version selon votre logique
    const shouldIncrementVersion =
      validatedData.script !== undefined ||
      validatedData.import !== undefined ||
      validatedData.export !== undefined ||
      validatedData.use !== undefined;

    if (shouldIncrementVersion) {
      updateData.version = existingFile.version + 1;
    }

    console.log("📤 Données de mise à jour:", updateData);

    // ✅ Mise à jour avec Prisma
    const updatedFile = await prisma.file.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true,
            slug: true,
          },
        },
        feature: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        userStory: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            isFolder: true,
          },
        },
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
            items: true,
          },
        },
      },
    });

    console.log("✅ Fichier mis à jour:", updatedFile.name);

    // ✅ Sérialisation pour JSON
    const serializedFile = {
      ...updatedFile,
      createdAt: updatedFile.createdAt.toISOString(),
      updatedAt: updatedFile.updatedAt.toISOString(),
    };

    const message = `Référence "${updatedFile.name}" mise à jour avec succès${
      shouldIncrementVersion ? ` (v${updatedFile.version})` : ""
    }`;

    return createSuccessResponse(serializedFile, message);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur interne du serveur";
    return createErrorResponse(errorMessage, undefined, "PUT /api/files/[id]");
  }
}

/**
 * DELETE /api/files/[id] - Suppression d'un fichier selon votre logique
 */
export async function DELETE(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    console.log("📡 DELETE /api/files/[id] - Début");

    // ✅ Résolution Promise des paramètres Next.js 15
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Validation native de l'ID
    if (!id || !isValidCUID(id)) {
      return createErrorResponse(
        "ID invalide",
        "L'ID doit être un CUID valide",
        "Validation ID DELETE",
        400
      );
    }

    console.log("🗑️ Suppression fichier ID:", id);

    // ✅ Vérification existence avec comptages
    const existingFile = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        isFolder: true,
        projectId: true,
        _count: {
          select: {
            children: true,
            versions: true,
            comments: true,
            items: true,
          },
        },
      },
    });

    if (!existingFile) {
      return createErrorResponse(
        "Fichier non trouvé",
        `Aucun fichier avec l'ID: ${id}`,
        "DELETE /api/files/[id]",
        404
      );
    }

    // ✅ Vérification dossier vide
    if (existingFile.isFolder && existingFile._count.children > 0) {
      return createErrorResponse(
        "Dossier non vide",
        `Le dossier "${existingFile.name}" contient ${existingFile._count.children} élément(s). Videz-le avant de le supprimer.`,
        "DELETE /api/files/[id]",
        400
      );
    }

    // ✅ Suppression avec cascade Prisma
    await prisma.file.delete({
      where: { id },
    });

    console.log("✅ Fichier supprimé:", existingFile.name);

    const responseData = {
      id: existingFile.id,
      name: existingFile.name,
      type: existingFile.type,
      isFolder: existingFile.isFolder,
    };

    return createSuccessResponse(
      responseData,
      `Référence "${existingFile.name}" supprimée avec succès`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur interne du serveur";
    return createErrorResponse(
      errorMessage,
      undefined,
      "DELETE /api/files/[id]"
    );
  }
}

// ✅ OPTIONS pour CORS et documentation selon votre architecture
export async function OPTIONS(): Promise<NextResponse> {
  const optionsResponse = {
    success: true,
    methods: ["GET", "PUT", "DELETE", "OPTIONS"],
    description: "API pour gestion individuelle des métadonnées de fichiers",
    endpoints: {
      GET: "Récupération d'un fichier avec toutes ses relations",
      PUT: "Mise à jour des métadonnées d'un fichier avec validation native corrigée",
      DELETE: "Suppression d'une référence de fichier avec vérifications",
    },
    schema: {
      fileTypes: [
        "DOSSIER",
        "PAGE",
        "COMPONENT",
        "UTILS",
        "LIB",
        "STORE",
        "HOOK",
        "ENV",
        "SYSTEM",
        "TEST",
        "OTHER",
      ],
      relations: [
        "project",
        "feature",
        "userStory",
        "task",
        "sprint",
        "parent",
        "children",
        "author",
        "versions",
        "comments",
        "items",
      ],
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(optionsResponse, {
    status: 200,
    headers: {
      Allow: "GET, PUT, DELETE, OPTIONS",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
  });
}
