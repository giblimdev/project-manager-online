// 📄 /types/glossary.ts
// 🎯 Rôle : Types TypeScript partagés pour le module glossaire
// 📦 Responsabilités : Définition centralisée des interfaces et types pour la cohérence
// 🔧 Composants utilisés : Types Prisma, énums personnalisés
// 🌐 Base de données : Basé sur le schéma Prisma Glossary

// 🔧 Type pour les catégories de termes du glossaire
export type GlossaryTermType =
  | "TERM"
  | "ACRONYM"
  | "ABBREVIATION"
  | "CONCEPT"
  | "TEAM"
  | "PROJECT";

// 🔧 Interface principale pour un terme du glossaire
export interface GlossaryTerm {
  id: string;
  term: string;
  description?: string | null;
  type: GlossaryTermType;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 🔧 Interface pour les données de formulaire (création/modification)
export interface GlossaryFormData {
  term: string;
  description?: string;
  type: GlossaryTermType;
  order: number;
  isActive: boolean;
}

// 🔧 Interface pour les paramètres de requête API
export interface GlossaryQueryParams {
  search?: string;
  type?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// 🔧 Interface pour la pagination
export interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 🔧 Interface pour les réponses API
export interface GlossaryApiResponse {
  success: boolean;
  data?: {
    terms: GlossaryTerm[];
    pagination: PaginationData;
  };
  message?: string;
  error?: string;
  details?: string;
}

// 🔧 Constantes pour les types de termes
export const GLOSSARY_TERM_TYPES = [
  { value: "ALL" as const, label: "Tous les types" },
  { value: "TERM" as const, label: "Terme" },
  { value: "ACRONYM" as const, label: "Acronyme" },
  { value: "ABBREVIATION" as const, label: "Abréviation" },
  { value: "CONCEPT" as const, label: "Concept" },
  { value: "TEAM" as const, label: "Équipe" },
  { value: "PROJECT" as const, label: "Projet" },
] as const;

// 🔧 Couleurs pour les types de termes
export const TERM_TYPE_COLORS = {
  TERM: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
  ACRONYM: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
  ABBREVIATION:
    "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200",
  CONCEPT:
    "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200",
  TEAM: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
  PROJECT: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
} as const;
