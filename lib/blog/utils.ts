// lib/blog/utils.ts
import prisma from "@/lib/prisma";
import { Visibility } from "@/lib/generated/prisma/client";

// ✅ Génération automatique de slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Supprimer les caractères spéciaux
    .replace(/[\s_-]+/g, "-") // Remplacer espaces et underscores par des tirets
    .replace(/^-+|-+$/g, ""); // Supprimer les tirets en début et fin
}

// ✅ Génération de slug unique
export async function generateUniqueSlug(
  text: string,
  tableName: "categories" | "tag", // Removed "comments"
  excludeId?: string
): Promise<string> {
  let baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await (tableName === "categories"
      ? prisma.category.findFirst({
          where: {
            slug,
            ...(excludeId && { id: { not: excludeId } }),
          },
        })
      : prisma.tag.findFirst({
          where: {
            slug,
            ...(excludeId && { id: { not: excludeId } }),
          },
        }));

    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// ✅ Calcul du temps de lecture
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
}

// ✅ Génération d'extrait
export function generateExcerpt(
  content: string,
  maxLength: number = 300
): string {
  if (content.length <= maxLength) return content;

  const truncated = content.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

// ✅ Validation des permissions
export async function checkBlogPermission(
  userId: string,
  action: "read" | "write" | "delete",
  resourceVisibility: Visibility = "PRIVATE"
): Promise<boolean> {
  // Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      projectMemberships: {
        select: { role: true },
      },
    },
  });

  if (!user || !user.isActive) return false;

  // Vérifier les permissions selon l'action et la visibilité
  switch (action) {
    case "read":
      return resourceVisibility === "PUBLIC" || true; // L'utilisateur connecté peut lire

    case "write":
      // Seuls les admins, product owners et scrum masters peuvent écrire
      return user.projectMemberships.some((membership) =>
        ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"].includes(membership.role)
      );

    case "delete":
      // Seuls les admins peuvent supprimer
      return user.projectMemberships.some(
        (membership) => membership.role === "ADMIN"
      );

    default:
      return false;
  }
}

// ✅ Formatage des données pour l'API
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  parent?: CategoryResponse | null;
  children?: CategoryResponse[];
  _count?: {
    blog_tags: number;
    comments: number;
  };
}

export interface BlogTagResponse {
  id: string;
  name: string;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoriesId: string | null;
  category?: CategoryResponse | null;
  _count?: {
    comments: number;
  };
}

export interface BlogCommentResponse {
  id: string;
  content: string;
  title: string | null;
  excerpt: string | null;
  slug: string | null;
  status: string;
  visibility: Visibility;
  blogImage: string | null;
  readingTime: number | null;
  order: number;
  isActive: boolean;
  isPinned: boolean;
  isResolved: boolean;
  publishedAt: Date | null;
  metadata: any;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  categories?: CategoryResponse[];
  tags?: BlogTagResponse[];
  replies?: BlogCommentResponse[];
  _count?: {
    replies: number;
  };
}

// ✅ Fonction de tri hiérarchique pour les catégories
export function buildCategoryHierarchy(
  categories: CategoryResponse[]
): CategoryResponse[] {
  const categoryMap = new Map<string, CategoryResponse>();
  const rootCategories: CategoryResponse[] = [];

  // Créer une map de toutes les catégories
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Construire la hiérarchie
  categories.forEach((category) => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

// ✅ Interface pour les filtres de recherche
export interface BlogFilters {
  search?: string;
  category?: string;
  tag?: string;
  status?: string;
  visibility?: Visibility;
  author?: string;
  startDate?: Date;
  endDate?: Date;
  isPinned?: boolean;
  isActive?: boolean;
}

// ✅ Construction de la clause WHERE pour Prisma
export function buildBlogWhereClause(filters: BlogFilters) {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
      { excerpt: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.visibility) {
    where.visibility = filters.visibility;
  }

  if (filters.author) {
    where.authorId = filters.author;
  }

  if (filters.isPinned !== undefined) {
    where.isPinned = filters.isPinned;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.startDate) {
    where.createdAt = { ...where.createdAt, gte: filters.startDate };
  }

  if (filters.endDate) {
    where.createdAt = { ...where.createdAt, lte: filters.endDate };
  }

  if (filters.category) {
    where.categories = {
      some: { id: filters.category },
    };
  }

  if (filters.tag) {
    where.blog_tags = {
      some: { id: filters.tag },
    };
  }

  return where;
}