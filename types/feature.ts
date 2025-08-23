// @/types/feature.ts

import { Priority } from "@/lib/generated/prisma/client";

// ✅ Type de base STRICT aligné sur le schéma Prisma
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
  // ✅ CORRECTION : Champs alignés sur le schéma
  epicId: string | null;        // Nullable dans le schéma
  parentId: string | null;      // Nullable dans le schéma
  projectId: string;            // NON-nullable dans le schéma
  userId: string | null;        // Nullable dans le schéma
}

// ✅ Type étendu avec hiérarchie - IDENTIQUE à SimpleFeature + relations
export interface FeatureWithHierarchy extends SimpleFeature {
  parent?: SimpleFeature | null;
  children?: SimpleFeature[];
  epic?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

// ✅ Alias pour compatibilité arrière
export interface FeatureSimple extends SimpleFeature {
  children?: FeatureSimple[];
}

// ✅ Type formulaire avec projectId OBLIGATOIRE
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
  startDate: string | null;      // String pour les inputs HTML
  endDate: string | null;        // String pour les inputs HTML
  parentId: string | null;
  projectId: string;             // ✅ OBLIGATOIRE
  epicId?: string | null;        // ✅ Optionnel
}

// ✅ Type pour la réorganisation
export interface ReorderRequest {
  featureId: string;
  newOrder: number;
  newPosition?: number;
  targetPosition?: "before" | "after";
  referenceFeatureId?: string;
}

// ✅ Modes d'affichage
export enum FeatureDisplayMode {
  LIST = "list",
  TREE = "tree",
  DETAIL = "detail",
}

// ✅ Props pour composants d'affichage
export interface FeatureDisplayProps {
  features: FeatureWithHierarchy[];
  isLoading: boolean;
  error: string | null;
  onCreateFeature: () => void;
  onEditFeature: (feature: SimpleFeature) => void;
  onDeleteFeature: (feature: SimpleFeature) => void;
  onMoveUp?: (featureId: string) => Promise<boolean>;
  onMoveDown?: (featureId: string) => Promise<boolean>;
  onReorderFeatures?: (reorderData: ReorderRequest[]) => Promise<boolean>;
  className?: string;
}

// ✅ Props spécifiques pour vues simplifiées
export interface FeatureSimpleDisplayProps extends FeatureDisplayProps {
  featuresSimple: FeatureSimple[];
}

export interface FeatureTreeDisplayProps extends FeatureDisplayProps {
  featuresTree: FeatureSimple[];
}

// ✅ Configuration des modes d'affichage
export interface DisplayModeConfig {
  mode: FeatureDisplayMode;
  label: string;
  description: string;
  icon: string;
  showReorderControls: boolean;
  showHierarchy: boolean;
  compactView: boolean;
}

// ✅ Réponse API standardisée
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  count?: number;
  details?: string;
}

// ✅ Constantes et mappings
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

export const DISPLAY_MODE_CONFIGS: Record<FeatureDisplayMode, DisplayModeConfig> = {
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
export interface FeatureStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  withParent: number;
  withChildren: number;
  totalStoryPoints: number;
  averageProgress: number;
}
// ✅ Options pour les sélecteurs
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

export const PRIORITY_ORDER: Record<Priority, number> = {
  [Priority.CRITICAL]: 1,
  [Priority.HIGH]: 2,
  [Priority.MEDIUM]: 3,
  [Priority.LOW]: 4,
} as const;
