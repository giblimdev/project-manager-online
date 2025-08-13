// @/types/feature.ts

// Rôle : Types et interfaces centralisés pour les features avec modes d'affichage
// Responsabilités : Définition types, modes affichage, interfaces composants, types réorganisation
// Composants utilisés : aucun (types purs)
// Types utilisés : Priority (Prisma), interfaces features, enums modes
// Libs externes : @/lib/generated/prisma/client
// Utilisé par : composants features, hooks, pages, API routes

import { Priority } from "@/lib/generated/prisma/client";

// Type de base complet pour une feature
export interface SimpleFeature {
  id: string;
  name: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
}

// Type étendu avec hiérarchie
export interface FeatureWithHierarchy extends SimpleFeature {
  parent?: SimpleFeature | null;
  children?: SimpleFeature[];
}

// ✅ Interface pour les données simplifiées (liste et arbre) - ÉTENDUE
export interface FeatureSimple extends SimpleFeature {
  // Hérite de tous les champs de SimpleFeature
  children?: FeatureSimple[];
}

// ✅ Interface pour l'affichage compact (optionnel - pour optimisation future)
export interface FeatureDisplayOnly {
  id: string;
  name: string;
  description: string | null;
  priority: Priority;
  status: string;
  progress: number;
  order: number;
  parentId: string | null;
  children?: FeatureDisplayOnly[];
}

// Type pour les données de formulaire
export interface FeatureFormData {
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: string | null;
  endDate: string | null;
  parentId: string | null;
}

// Type pour les données API
export interface FeatureApiData {
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  parentId: string | null;
}

// Type pour la réorganisation
export interface ReorderRequest {
  featureId: string;
  newOrder: number;
  newPosition?: number;
  targetPosition?: "before" | "after";
  referenceFeatureId?: string;
}

// Modes d'affichage disponibles
export enum FeatureDisplayMode {
  LIST = "list",
  TREE = "tree",
  DETAIL = "detail",
}

// ✅ Props communes pour tous les composants d'affichage - CORRIGÉES
export interface FeatureDisplayProps {
  features: FeatureWithHierarchy[];
  isLoading: boolean;
  error: string | null;
  onCreateFeature: () => void;
  onEditFeature: (feature: SimpleFeature) => void; // ✅ Utilise SimpleFeature
  onDeleteFeature: (feature: SimpleFeature) => void; // ✅ Utilise SimpleFeature
  onMoveUp?: (featureId: string) => Promise<boolean>;
  onMoveDown?: (featureId: string) => Promise<boolean>;
  onReorderFeatures?: (reorderData: ReorderRequest[]) => Promise<boolean>;
  className?: string;
}

// ✅ Props spécifiques pour les vues simplifiées
export interface FeatureSimpleDisplayProps extends FeatureDisplayProps {
  featuresSimple: FeatureSimple[];
}

export interface FeatureTreeDisplayProps extends FeatureDisplayProps {
  featuresTree: FeatureSimple[];
}

// Configuration des modes d'affichage
export interface DisplayModeConfig {
  mode: FeatureDisplayMode;
  label: string;
  description: string;
  icon: string;
  showReorderControls: boolean;
  showHierarchy: boolean;
  compactView: boolean;
}

// Configurations par défaut
export const DISPLAY_MODE_CONFIGS: Record<
  FeatureDisplayMode,
  DisplayModeConfig
> = {
  [FeatureDisplayMode.LIST]: {
    mode: FeatureDisplayMode.LIST,
    label: "Liste",
    description: "Affichage en liste simple",
    icon: "List",
    showReorderControls: true,
    showHierarchy: false,
    compactView: true,
  },
  [FeatureDisplayMode.TREE]: {
    mode: FeatureDisplayMode.TREE,
    label: "Arbre",
    description: "Affichage hiérarchique en arbre",
    icon: "GitBranch",
    showReorderControls: false,
    showHierarchy: true,
    compactView: true,
  },
  [FeatureDisplayMode.DETAIL]: {
    mode: FeatureDisplayMode.DETAIL,
    label: "Détail",
    description: "Affichage détaillé complet",
    icon: "FileText",
    showReorderControls: true,
    showHierarchy: false,
    compactView: false,
  },
};

// Type pour les réponses API standardisées
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  count?: number;
  details?: string;
}

// Type pour les statistiques de features
export interface FeatureStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  withParent: number;
  withChildren: number;
  totalStoryPoints: number;
  averageProgress: number;
}

// Type pour les résultats de réorganisation
export interface ReorderResult {
  featureId: string;
  oldOrder: number;
  newOrder: number;
  oldPosition: number;
  newPosition: number;
  success: boolean;
  error?: string;
}

// Type pour les statistiques de réorganisation
export interface ReorganizationStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  conflicts: number;
  hierarchyViolations: number;
}

// Type pour les données de la requête batch de réorganisation
export interface BatchReorderRequest {
  epicId: string;
  reorders: ReorderRequest[];
  strategy?: "preserve_gaps" | "compact" | "auto";
  validateHierarchy?: boolean;
}

// Constantes pour les labels
export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.CRITICAL]: "Critique",
  [Priority.HIGH]: "Élevée",
  [Priority.MEDIUM]: "Moyenne",
  [Priority.LOW]: "Faible",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.CRITICAL]: "destructive",
  [Priority.HIGH]: "orange",
  [Priority.MEDIUM]: "blue",
  [Priority.LOW]: "secondary",
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  ARCHIVED: "Archivé",
};

// Type pour les options de sélection
export interface SelectOption {
  value: string;
  label: string;
}

export const STATUS_OPTIONS: SelectOption[] = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
];

export const PRIORITY_OPTIONS: SelectOption[] = [
  { value: Priority.CRITICAL, label: "Critique" },
  { value: Priority.HIGH, label: "Élevée" },
  { value: Priority.MEDIUM, label: "Moyenne" },
  { value: Priority.LOW, label: "Faible" },
];

// Type pour l'ordre des priorités (pour le tri)
export type PriorityOrderMap = Record<Priority, number>;

// Map d'ordre des priorités pour le tri
export const PRIORITY_ORDER: PriorityOrderMap = {
  [Priority.CRITICAL]: 1,
  [Priority.HIGH]: 2,
  [Priority.MEDIUM]: 3,
  [Priority.LOW]: 4,
} as const;
