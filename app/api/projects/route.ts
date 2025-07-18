// /app/api/projects/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ✅ Schéma conforme au modèle Item de votre nouveau Prisma
const ItemSchema = z.object({
  id: z.string().cuid(),
  type: z.string(),
  name: z.string().min(1).max(200), // ✅ name au lieu de title
  description: z.string().optional(),
  objective: z.string().optional(),
  slug: z.string(),
  key: z.string().optional(),
  priority: z
    .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]) // ✅ Bonnes valeurs
    .optional()
    .default("MEDIUM"),
  acceptanceCriteria: z.string().optional(),
  storyPoints: z.number().int().optional(),
  businessValue: z.number().int().min(1).max(10).optional(),
  technicalRisk: z.number().int().min(1).max(10).optional(),
  effort: z.number().int().min(1).max(10).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  status: z
    .enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]) // ✅ Bonnes valeurs
    .default("ACTIVE"),
  visibility: z.enum(["PRIVATE", "PUBLIC", "INTERNAL"]).default("PRIVATE"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  text: z.record(z.any()).optional(),
  backlogPosition: z.number().int().optional(),
  DoD: z.string().optional(),
  isActive: z.boolean().default(true),
  estimatedHours: z.number().int().optional(),
  actualHours: z.number().int().optional(),
  ownerId: z.string().cuid(), // ✅ ownerId au lieu de teamId/projectId
  parentId: z.string().cuid().optional(),
  sprintId: z.string().cuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const CreateItemSchema = ItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ownerId: z.string().cuid().optional(), // ✅ Optionnel car déterminé par le contexte
  slug: z.string().optional(), // Généré automatiquement
});

type Item = z.infer<typeof ItemSchema>;
type CreateItem = z.infer<typeof CreateItemSchema>;

// ✅ Données de démonstration conformes au nouveau schéma
let items: Item[] = [
  {
    id: "cm2abc123def456ghi789",
    type: "TASK",
    name: "Analyser les besoins utilisateurs", // ✅ name au lieu de title
    description:
      "Effectuer une analyse complète des besoins des utilisateurs finaux",
    objective:
      "Comprendre les attentes utilisateurs pour orienter le développement",
    slug: "analyser-besoins-utilisateurs",
    key: "USR-001",
    priority: "HIGH",
    acceptanceCriteria: "Rapport complet avec interviews et personas",
    storyPoints: 8,
    businessValue: 9,
    technicalRisk: 3,
    effort: 6,
    progress: 25,
    status: "ACTIVE", // ✅ Bonne valeur
    visibility: "INTERNAL",
    startDate: new Date("2024-01-01").toISOString(),
    endDate: new Date("2024-01-15").toISOString(),
    settings: {},
    metadata: {},
    text: {},
    backlogPosition: 1,
    DoD: "Rapport validé par le PO et les stakeholders",
    isActive: true,
    estimatedHours: 40,
    actualHours: 10,
    ownerId: "ttPPg6AvLXcz4y0Kr6H1Ex7y1fbNxpQN", // ✅ ownerId au lieu de teamId
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "cm2abc456def789ghi012",
    type: "USER_STORY",
    name: "Créer les maquettes UI", // ✅ name au lieu de title
    description: "Concevoir les interfaces utilisateur principales",
    slug: "creer-maquettes-ui",
    key: "USR-002",
    priority: "MEDIUM",
    storyPoints: 5,
    businessValue: 7,
    technicalRisk: 2,
    effort: 4,
    progress: 0,
    status: "ACTIVE", // ✅ Bonne valeur
    visibility: "PRIVATE",
    settings: {},
    metadata: {},
    text: {},
    backlogPosition: 2,
    isActive: true,
    estimatedHours: 24,
    actualHours: 0,
    ownerId: "ttPPg6AvLXcz4y0Kr6H1Ex7y1fbNxpQN", // ✅ ownerId
    createdAt: new Date("2024-01-02").toISOString(),
    updatedAt: new Date("2024-01-02").toISOString(),
  },
];

// Fonction utilitaire pour générer un slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ✅ Fonction utilitaire pour générer une clé unique par utilisateur
function generateKey(ownerId: string, name: string): string {
  const prefix = ownerId.substring(0, 3).toUpperCase();
  const existingKeys = items
    .filter((item) => item.ownerId === ownerId)
    .map((item) => item.key)
    .filter((key) => key?.startsWith(prefix));

  const nextNumber = existingKeys.length + 1;
  return `${prefix}-${nextNumber.toString().padStart(3, "0")}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("GET /api/projects/items called");

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId"); // ✅ ownerId au lieu de teamId
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");

    let filteredItems = items;

    // ✅ Filtrage par ownerId
    if (ownerId) {
      filteredItems = filteredItems.filter((item) => item.ownerId === ownerId);
    }

    // Filtrage par type
    if (type) {
      filteredItems = filteredItems.filter((item) => item.type === type);
    }

    // Filtrage par priorité
    if (priority) {
      filteredItems = filteredItems.filter(
        (item) => item.priority === priority
      );
    }

    // Filtrage par statut
    if (status) {
      filteredItems = filteredItems.filter((item) => item.status === status);
    }

    // Recherche textuelle
    if (search) {
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) || // ✅ name au lieu de title
          item.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Tri par position dans le backlog
    filteredItems.sort(
      (a, b) => (a.backlogPosition || 0) - (b.backlogPosition || 0)
    );

    // Limitation du nombre d'items
    const limitedItems = filteredItems.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedItems,
      pagination: {
        page: 1,
        limit,
        total: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/projects/items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("POST /api/projects/items called");

    const body = await request.json();
    console.log("Request body:", body);

    // ✅ Utiliser l'ownerId par défaut
    const defaultOwnerId = "ttPPg6AvLXcz4y0Kr6H1Ex7y1fbNxpQN"; // Utilisateur par défaut
    const itemData = {
      type: "TASK", // Valeur par défaut
      ownerId: defaultOwnerId,
      ...body,
    };

    // Générer le slug si non fourni
    if (!itemData.slug && itemData.name) {
      itemData.slug = generateSlug(itemData.name);
    }

    // ✅ Générer la clé basée sur ownerId
    if (!itemData.key && itemData.name) {
      itemData.key = generateKey(itemData.ownerId, itemData.name);
    }

    // Définir la position dans le backlog par utilisateur
    if (!itemData.backlogPosition) {
      const userItems = items.filter(
        (item) => item.ownerId === itemData.ownerId
      );
      const maxPosition = Math.max(
        ...userItems.map((item) => item.backlogPosition || 0),
        0
      );
      itemData.backlogPosition = maxPosition + 1;
    }

    const validatedData = CreateItemSchema.parse(itemData);

    const newItem: Item = {
      ...validatedData,
      id: crypto.randomUUID().replace(/-/g, "").substring(0, 25),
      ownerId: validatedData.ownerId || defaultOwnerId, // ✅ ownerId
      slug: validatedData.slug || generateSlug(validatedData.name),
      key:
        validatedData.key ||
        generateKey(
          validatedData.ownerId || defaultOwnerId,
          validatedData.name
        ),
      settings: validatedData.settings || {},
      metadata: validatedData.metadata || {},
      text: validatedData.text || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.push(newItem);

    return NextResponse.json(
      {
        success: true,
        data: newItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/projects/items:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.errors,
          message: "Données invalides. Vérifiez les champs requis.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
