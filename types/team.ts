// @/types/team.ts

// Rôle : Types centralisés pour les équipes avec relations Prisma
// Responsabilités : Définition des interfaces Team, TeamWithRelations, ViewMode, API types
// Utilisé par : TeamsList, TeamForm, API routes, pages teams, composants views
// Base : Modèle Prisma Team avec extensions pour les relations hiérarchiques
// TypeScript : Mode strict avec types optionnels, unions strictes
// Next.js 15 : Compatible avec les nouvelles API routes et gestion des paramètres Promise

import { UserRole } from "@/lib/generated/prisma/client";

// ✅ Re-export des types Prisma
export { UserRole } from "@/lib/generated/prisma/client";

// ✅ Types pour les modes d'affichage
export type ViewMode = "list" | "card" | "branch";

// ✅ Interface de base Team conforme au schéma Prisma
export interface BaseTeam {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  logoUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string; // Sérialisé en string pour JSON
  updatedAt: string; // Sérialisé en string pour JSON
  parentTeamId: string | null;
}

// ✅ Interface pour les membres d'équipe
export interface TeamMember {
  id: string;
  role: UserRole;
  order: number;
  joinedAt: string;
  isActive: boolean;
  teamId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

// ✅ Interface Team avec relations hiérarchiques
export interface Team extends BaseTeam {
  // Relations hiérarchiques
  children?: Team[];
  parent?: BaseTeam | null;
  // Relations avec les membres
  members?: TeamMember[];
  // Nombre d'enfants calculé
  childrenCount?: number;
}

// ✅ Interface pour les formulaires
export interface TeamFormData {
  name: string;
  description: string | null;
  slug: string;
  logoUrl: string | null;
  order: number;
  parentTeamId: string | null;
  isActive: boolean;
}

// ✅ Interface pour les filtres
export interface TeamFilter {
  search?: string;
  isActive?: boolean;
  parentTeamId?: string | null;
  hasChildren?: boolean;
}

// ✅ Interface pour les erreurs de formulaire
export interface TeamFormErrors {
  name?: string;
  description?: string;
  slug?: string;
  logoUrl?: string;
  order?: string;
  parentTeamId?: string;
  submit?: string;
}

// ✅ Types pour les props des composants
export interface TeamListProps {
  teams: Team[];
  parentTeams: Team[];
  viewMode: ViewMode;
  loading: boolean;
  filter: TeamFilter;
  onCreateTeam: (teamData: TeamFormData) => Promise<void>;
  onUpdateTeam: (teamData: TeamFormData & { id: string }) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
}

// ✅ Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
