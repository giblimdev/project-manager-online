// types/project.ts

/**
 * RÔLE : Types simplifiés pour les projets sans relations
 * RESPONSABILITÉS :
 * - Définir les interfaces de base pour les projets
 * - Types pour les réponses API
 * - Types pour la création/modification de projets
 *
 * COMPOSANTS UTILISÉS :
 * - Types de base Prisma Project
 * - TypeScript strict mode
 *
 * LIBS UTILISÉS :
 * - @prisma/client (types générés)
 * - TypeScript strict mode
 * - Next.js 15 App Router
 * 
 // on crera un aute type pour un project et ses relations.
 *  */

import type { Project } from "@/lib/generated/prisma/client";

// Interface pour un projet simple (sans relations)
export interface ProjectSimple extends Omit<Project, "settings" | "metadata"> {
  settings: Record<string, any>;
  metadata: Record<string, any>;
}

// Interface pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Interface pour la création d'un projet
export interface CreateProjectData {
  name: string;
  description?: string;
  slug: string;
  key: string;
  order?: number;
  status?: string;
  visibility?: string;
  startDate?: string | null;
  endDate?: string | null;
}

// Interface pour la mise à jour d'un projet
export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}

// Types pour les vues
export type ViewMode = "grid" | "list";

// Interface pour les statistiques de base
export interface ProjectStats {
  total: number;
  active: number;
  inactive: number;
  archived: number;
}

// Export du type Project de base
export type { Project };
