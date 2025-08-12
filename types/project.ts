// types/project.ts

/**
 * RÔLE : Types TypeScript pour la gestion des projets
 * RESPONSABILITÉS :
 * - Définir les interfaces pour les projets avec et sans relations
 * - Types pour les API responses et les données de création
 * - Types pour les vues et modes d'affichage
 *
 * COMPOSANTS UTILISÉS :
 * - Types Prisma générés (@/lib/generated/prisma/client)
 * - TypeScript strict mode
 * - Next.js 15 App Router
 */

import type {
  Project,
  ProjectMember,
  User,
} from "@/lib/generated/prisma/client";

// Interface pour un projet avec ses relations
export interface ProjectWithRelations extends Project {
  members?: (ProjectMember & { user: User })[];
  _count?: {
    members?: number;
    features?: number;
    sprints?: number;
    files?: number;
    initiatives?: number;
    channels?: number;
    templates?: number;
  };
}

// Interface pour un projet simple (sans relations)
export interface ProjectSimple {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour les données de création d'un projet
export interface CreateProjectData {
  name: string;
  description?: string;
  slug: string;
  key: string;
  order?: number;
  status?: string;
  visibility?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

// Interface pour les réponses API standardisées
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  timestamp: string;
}

// Interface pour les filtres de recherche
export interface ProjectFilters {
  status?: string;
  search?: string;
  visibility?: string;
  startDate?: Date;
  endDate?: Date;
}

// Interface pour la pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Type pour le mode d'affichage
export type ViewMode = "grid" | "list";

// Type pour les statuts de projet
export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

// Type pour la visibilité
export type ProjectVisibility = "PRIVATE" | "PUBLIC" | "INTERNAL";

// Interface pour les statistiques de projet
export interface ProjectStats {
  totalMembers: number;
  totalFeatures: number;
  totalSprints: number;
  totalFiles: number;
  totalInitiatives: number;
  totalChannels: number;
  completionRate: number;
}

// Interface pour un projet avec statistiques
export interface ProjectWithStats extends ProjectSimple {
  stats?: ProjectStats;
}

// Type pour les erreurs de validation
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Interface pour les réponses d'erreur
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: ValidationError[];
  timestamp: string;
}
