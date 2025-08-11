// @/types/feature.ts

// Rôle : Types centralisés pour les features avec relations Prisma, exports unifiés sans conflits
// Responsabilités : Définition unique des interfaces Feature, FeatureWithRelations, ViewMode, API types
// Utilisé par : FeaturesList, FeatureForm, API routes, pages features, composants views
// Base : Modèle Prisma Feature avec extensions pour les relations hiérarchiques
// TypeScript : Mode strict avec types optionnels, unions strictes, pas de redéfinition
// Next.js 15 : Compatible avec les nouvelles API routes et gestion des paramètres Promise
// Relations : Epic, User, Files, Dependencies, UserStories selon le schéma Prisma
// Design : Types responsive et fonctionnels pour l'interface moderne
// Import : Types Prisma uniquement, export des types définis localement

import { Priority, FileType, TaskStatus } from "@/lib/generated/prisma/client";

// ✅ Re-export du type Priority depuis Prisma pour utilisation externe
export { Priority, FileType, TaskStatus } from "@/lib/generated/prisma/client";

// ✅ Types pour les modes d'affichage - DÉFINITION UNIQUE
export type ViewMode = "list" | "card" | "tree";

// ✅ Types pour les priorités et statuts - DÉFINITION UNIQUE
export type FeaturePriority = Priority;
export type FeatureStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

// ✅ Interface de base Feature conforme au schéma Prisma - DÉFINITION UNIQUE
export interface BaseFeature {
  id: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string; // Status flexible pour compatibilité
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: string | null; // Sérialisé en string pour JSON
  endDate: string | null; // Sérialisé en string pour JSON
  progress: number;
  position: number;
  order: number;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  createdAt: string; // Sérialisé en string pour JSON
  updatedAt: string; // Sérialisé en string pour JSON
}

// ✅ Interface pour les fichiers liés aux features - DÉFINITION UNIQUE
export interface FeatureFile {
  id: string;
  name: string;
  order: number;
  type: FileType;
  mimeType: string | null;
  path: string | null;
  description: string | null;
  version: number;
  isFolder: boolean;
  metadata: any;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ✅ Interface pour les dépendances entre features - DÉFINITION UNIQUE
export interface FeatureDependency {
  id: string;
  type: string;
  order: number;
  description: string | null;
  createdAt: string;
  dependentFeatureId: string;
  dependsOnFeatureId: string;
}

// ✅ Interface pour les User Stories - DÉFINITION UNIQUE
export interface FeatureUserStory {
  id: string;
  title: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: TaskStatus;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
}

// ✅ Interface pour l'Epic - DÉFINITION UNIQUE
export interface FeatureEpic {
  id: string;
  name: string;
  order: number;
  description: string | null;
  priority: Priority;
  status: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  initiativeId: string;
}

// ✅ Interface pour l'utilisateur - DÉFINITION UNIQUE
export interface FeatureUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  bio: string | null;
  timezone: string | null;
}

// ✅ Interface FeatureWithRelations - DÉFINITION UNIQUE ET PRINCIPALE
export interface FeatureWithRelations extends BaseFeature {
  // Relations hiérarchiques - Récursivité pour l'arborescence
  children?: FeatureWithRelations[];
  parent?: BaseFeature | null;

  // Relations avec autres entités
  files?: FeatureFile[];
  dependencies?: FeatureDependency[];
  dependents?: FeatureDependency[];
  userStories?: FeatureUserStory[];

  // Epic simplifié pour compatibilité composants
  epic?: {
    id: string;
    name: string;
    description?: string | null;
    priority?: Priority;
    status?: string;
    progress?: number;
    order?: number;
  } | null;

  // Relations utilisateur et projet (optionnelles)
  user?: FeatureUser | null;
  project?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

// ✅ Types pour les props des composants - DÉFINITION UNIQUE
export interface FeaturesListProps {
  userId: string;
  projectId: string;
  viewMode: ViewMode;
  features?: FeatureWithRelations[];
  onUpdate?: () => void;
  onFeatureSelect?: (feature: FeatureWithRelations) => void;
  onFeatureCreate?: () => void;
  onFeatureEdit?: (feature: FeatureWithRelations) => void;
  onFeatureDelete?: (featureId: string) => void;
}

// ✅ Types pour les filtres - DÉFINITION UNIQUE
export interface FeatureFilter {
  search?: string;
  status?: FeatureStatus | FeatureStatus[] | "all";
  priority?: Priority | Priority[] | "all";
  epicId?: string | string[];
  parentId?: string | null;
  assigneeId?: string | string[];
  startDate?: string;
  endDate?: string;
  tags?: string[];
  hasChildren?: boolean;
  isComplete?: boolean;
}

// ✅ Types pour les statistiques - DÉFINITION UNIQUE
export interface FeatureStats {
  total: number;
  byStatus: Record<FeatureStatus, number>;
  byPriority: Record<Priority, number>;
  averageProgress: number;
  completedPercentage: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  estimatedHours: number;
  actualHours: number;
}

// ✅ Types pour les actions CRUD - DÉFINITION UNIQUE
export interface CreateFeatureData {
  name: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  priority: Priority;
  status?: string;
  epicId: string;
  parentId?: string | null;
  projectId: string;
  userId: string;
  storyPoints?: number | null;
  businessValue?: number | null;
  technicalRisk?: number | null;
  effort?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number;
  position?: number;
  order?: number;
}

export interface UpdateFeatureData extends Partial<CreateFeatureData> {
  id: string;
}

// ✅ Types pour les réponses API Next.js 15 - DÉFINITION UNIQUE
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  metadata?: {
    total: number;
    projectId: string;
    userId?: string;
    filters?: FeatureFilter;
    pagination?: {
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary?: FeatureStats;
  };
}

// ✅ Types pour les événements en temps réel - DÉFINITION UNIQUE
export interface FeatureEvent {
  type:
    | "create"
    | "update"
    | "delete"
    | "move"
    | "status_change"
    | "priority_change"
    | "assign"
    | "unassign";
  featureId: string;
  feature?: FeatureWithRelations;
  previousData?: Partial<FeatureWithRelations>;
  newData?: Partial<FeatureWithRelations>;
  timestamp: string;
  userId: string;
  projectId: string;
}

// ✅ Types pour les vues de données UI - DÉFINITION UNIQUE
export interface FeatureTreeNode extends FeatureWithRelations {
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  childrenCount: number;
  path: string[];
}

export interface FeatureCardData extends FeatureWithRelations {
  isSelected: boolean;
  isEditing: boolean;
  isDragging: boolean;
  dropZone?: "before" | "after" | "inside";
}

export interface FeatureListItem extends FeatureWithRelations {
  isVisible: boolean;
  matchesFilter: boolean;
  hierarchyLevel: number;
  siblings: string[];
  nextSibling?: string;
  previousSibling?: string;
}

// ✅ Types pour la gestion des permissions - DÉFINITION UNIQUE
export interface FeaturePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreateChild: boolean;
  canMove: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canChangePriority: boolean;
}

// ✅ Types pour l'import/export - DÉFINITION UNIQUE
export interface FeatureImportData {
  name: string;
  description?: string;
  acceptanceCriteria?: string;
  priority: Priority;
  status: string;
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  epicName: string;
  parentName?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export interface FeatureExportData extends FeatureWithRelations {
  epicName?: string;
  parentName?: string;
  childrenNames?: string[];
  assigneeName?: string;
  projectName?: string;
  hierarchyPath?: string;
}

// ✅ Types pour les formulaires avec validation - DÉFINITION UNIQUE
export interface FeatureFormData {
  name: string;
  description: string;
  acceptanceCriteria: string;
  priority: Priority;
  status: string;
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  startDate: string;
  endDate: string;
  progress: number;
  epicId: string;
  parentId: string;
}

export interface FeatureFormErrors {
  name?: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: string;
  status?: string;
  storyPoints?: string;
  businessValue?: string;
  technicalRisk?: string;
  effort?: string;
  startDate?: string;
  endDate?: string;
  progress?: string;
  epicId?: string;
  parentId?: string;
  general?: string;
}

// ✅ Types pour les props des composants de vue - DÉFINITION UNIQUE
export interface FeatureViewProps {
  features: FeatureWithRelations[];
  loading: boolean;
  onEdit: (feature: FeatureWithRelations) => void;
  onDelete: (featureId: string) => void;
  onOrderChange: (featureId: string, direction: "up" | "down") => void;
  onSelect?: (feature: FeatureWithRelations) => void;
  onStatusChange?: (featureId: string, status: string) => void;
  onPriorityChange?: (featureId: string, priority: Priority) => void;
  permissions?: FeaturePermissions;
  selectedFeatures?: string[];
  expandedFeatures?: string[];
  onToggleExpand?: (featureId: string) => void;
}

// ✅ Types pour les hooks personnalisés - DÉFINITION UNIQUE
export interface UseFeatureReturn {
  features: FeatureWithRelations[];
  loading: boolean;
  error: string | null;
  stats: FeatureStats | null;
  createFeature: (data: CreateFeatureData) => Promise<FeatureWithRelations>;
  updateFeature: (
    id: string,
    data: UpdateFeatureData
  ) => Promise<FeatureWithRelations>;
  deleteFeature: (id: string) => Promise<void>;
  moveFeature: (id: string, newPosition: number) => Promise<void>;
  refreshFeatures: () => Promise<void>;
  exportFeatures: (format: "json" | "csv" | "xlsx") => Promise<Blob>;
  importFeatures: (file: File) => Promise<FeatureWithRelations[]>;
}

// ✅ Types pour les webhooks et intégrations - DÉFINITION UNIQUE
export interface FeatureWebhookPayload {
  event: FeatureEvent;
  feature: FeatureWithRelations;
  project: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  timestamp: string;
  signature?: string;
}

// ✅ Export par défaut pour l'utilisation simplifiée
export default FeatureWithRelations;

// ✅ Export groupé de tous les types principaux (PAS DE REDÉFINITION)
export type {
  BaseFeature as Feature,
  FeatureWithRelations as FeatureRelations,
  FeaturePriority as PriorityType,
  FeatureStatus as StatusType,
};
