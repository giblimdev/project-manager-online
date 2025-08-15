// @/types/files.ts

// Rôle : Types et interfaces centralisés pour les fichiers avec modes d'affichage
// Responsabilités : Définition types, modes affichage, interfaces composants, types navigation
// Composants utilisés : aucun (types purs)
// Types utilisés : FileType, Priority, TaskStatus, UserRole (Prisma), interfaces files, enums modes
// Libs externes : @/lib/generated/prisma/client
// Utilisé par : composants files, hooks, pages, API routes

import { 
  FileType, 
  Priority, 
  TaskStatus, 
  UserRole,
  Visibility 
} from "@/lib/generated/prisma/client";
import { JSX } from "react";

// ========================================
// TYPES DE BASE
// ========================================

// Type de base complet pour un fichier (correspond exactement au modèle Prisma)
export interface SimpleFile {
  id: string;
  name: string;
  order: number;
  type: FileType;
  mimeType: string | null;
  path: string | null;
  description: string | null;
  import: string | null;
  use: string | null; // bibliotheque, lib, utils, store, hook, ...
  export: string | null;
  script: string | null;
  version: number;
  isFolder: boolean;
  metadata: Record<string, any> | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  projectId: string;
  featureId: string | null;
  userStoryId: string | null;
  taskId: string | null;
  sprintId: string | null;
}

// Type étendu avec hiérarchie simple
export interface FileWithHierarchy extends SimpleFile {
  parent?: SimpleFile | null;
  children?: SimpleFile[];
}

// ✅ Interface pour les données simplifiées (liste et arbre)
export interface FileSimple extends SimpleFile {
  children?: FileSimple[];
  _count?: {
    children: number;
    comments: number;
    versions: number;
  };
}

// ========================================
// TYPES AVEC RELATIONS COMPLÈTES
// ========================================

// Type avec toutes les relations Prisma
export interface FileWithRelations extends SimpleFile {
  // Relations User (auteurs/développeurs)
  author?: Array<{
    id: string;
    name: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    image: string | null;
  }>;
  
  // Relations avec les entités liées
  feature?: {
    id: string;
    name: string;
    description: string | null;
    priority: Priority;
    status: string;
    epicId: string;
  } | null;
  
  userStory?: {
    id: string;
    title: string;
    description: string | null;
    priority: Priority;
    status: TaskStatus;
    storyPoints: number | null;
    featureId: string;
  } | null;
  
  task?: {
    id: string;
    title: string;
    description: string | null;
    priority: Priority;
    status: TaskStatus;
    userStoryId: string;
  } | null;
  
  sprint?: {
    id: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    status: string;
    projectId: string;
  } | null;
  
  project: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    key: string;
    status: string;
    visibility: string;
  };
  
  // Relations hiérarchiques
  parent?: FileWithRelations | null;
  children?: FileWithRelations[];
  
  // Versions et commentaires
  versions?: Array<{
    id: string;
    version: number;
    url: string;
    size: number;
    checksum: string | null;
    changelog: string | null;
    createdAt: Date;
    authorId: string;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  
  comments?: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    authorId: string;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  
  // Compteurs pour l'affichage
  _count?: {
    children: number;
    comments: number;
    versions: number;
  };
}

// ========================================
// TYPES POUR FORMULAIRES ET API
// ========================================

// Type pour les données de formulaire
export interface FileFormData {
  name: string;
  type: FileType;
  description: string | null;
  import: string | null;
  use: string | null;
  export: string | null;
  script: string | null;
  path: string | null;
  mimeType: string | null;
  tags: string[];
  parentId: string | null;
  featureId: string | null;
  userStoryId: string | null;
  taskId: string | null;
  sprintId: string | null;
  isFolder: boolean;
  metadata: Record<string, any> | null;
}

// Type pour les données API
export interface FileApiData {
  name: string;
  type: FileType;
  description: string | null;
  import: string | null;
  use: string | null;
  export: string | null;
  script: string | null;
  path: string | null;
  mimeType: string | null;
  tags: string[];
  parentId: string | null;
  projectId: string;
  featureId: string | null;
  userStoryId: string | null;
  taskId: string | null;
  sprintId: string | null;
  isFolder: boolean;
  metadata: Record<string, any> | null;
}

// ========================================
// TYPES POUR LA NAVIGATION
// ========================================

// Interface pour l'état de navigation hiérarchique
export interface NavigationState {
  currentFolder: string | null;
  folderName: string;
  breadcrumb: Array<{
    id: string | null;
    name: string;
    path?: string;
  }>;
}

// Type pour l'historique de navigation
export interface NavigationHistory {
  path: NavigationState[];
  currentIndex: number;
}

// ========================================
// TYPES POUR LES FILTRES ET LA RECHERCHE
// ========================================

// Types pour les filtres
export type FilterType = FileType | "ALL" | "DOSSIER" | "FILE";

export type SortBy = "name" | "type" | "date" | "size" | "author";
export type SortOrder = "asc" | "desc";

// Interface pour l'état des filtres
export interface FilterState {
  search: string;
  type: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

// Type pour les filtres de fichiers
export interface FileFilters {
  type?: FilterType[];
  hasParent?: boolean;
  hasChildren?: boolean;
  projectId?: string;
  featureId?: string;
  userStoryId?: string;
  taskId?: string;
  sprintId?: string;
  authorId?: string;
  tags?: string[];
  search?: string;
  isFolder?: boolean;
  hasVersions?: boolean;
  hasComments?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

// Type pour les options de tri
export interface SortOptions {
  field: keyof SimpleFile;
  direction: SortOrder;
}

// ========================================
// TYPES POUR LA PAGINATION
// ========================================

// Interface pour la pagination côté client (avec indicateurs de navigation)
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Type pour la pagination dans les réponses API (sans les indicateurs de navigation)
export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Type pour les paramètres de pagination
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

// Type pour les résultats paginés
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationState;
}

// ========================================
// MODES D'AFFICHAGE
// ========================================

// Modes d'affichage disponibles
export type ViewMode = "list" | "card" | "branch";

// Configuration des modes d'affichage
export interface DisplayModeConfig {
  mode: ViewMode;
  label: string;
  description: string;
  icon: string;
  showDetails: boolean;
  supportHierarchy: boolean;
  compactView: boolean;
}

// Configurations par défaut
export const DISPLAY_MODE_CONFIGS: Record<ViewMode, DisplayModeConfig> = {
  list: {
    mode: "list",
    label: "Liste",
    description: "Affichage en tableau détaillé",
    icon: "List",
    showDetails: true,
    supportHierarchy: false,
    compactView: false,
  },
  card: {
    mode: "card",
    label: "Cartes",
    description: "Affichage en grille de cartes",
    icon: "LayoutGrid",
    showDetails: false,
    supportHierarchy: false,
    compactView: true,
  },
  branch: {
    mode: "branch",
    label: "Arborescence",
    description: "Affichage hiérarchique en arbre",
    icon: "GitBranch",
    showDetails: false,
    supportHierarchy: true,
    compactView: true,
  },
};

// ========================================
// INTERFACES POUR LES COMPOSANTS
// ========================================

// Props communes pour tous les composants d'affichage
export interface FileDisplayProps {
  files: FileWithRelations[];
  isLoading: boolean;
  error: string | null;
  onCreateFile: () => void;
  onEditFile: (file: FileWithRelations) => void;
  onDeleteFile: (file: FileWithRelations) => void;
  onRefresh?: () => void;
  onFolderNavigate?: (folderId: string | null, folderName?: string) => void;
  className?: string;
}

// Props pour les vues avec sélection
export interface FileSelectionProps extends FileDisplayProps {
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  onSelectAll?: () => void;
}

// Props spécifiques pour les vues avec hiérarchie
export interface FileHierarchyProps extends FileSelectionProps {
  currentFolder: string | null;
  navigation?: NavigationState;
}

// Props pour les composants avec relations complètes
export interface FileDetailProps extends FileHierarchyProps {
  showVersions?: boolean;
  showComments?: boolean;
  showMetadata?: boolean;
}

// ========================================
// TYPES POUR LES RÉPONSES API
// ========================================

// Type pour les réponses API standardisées
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  count?: number;
  details?: any; // Changé de string à any pour gérer les erreurs Zod
  pagination?: PaginationResult; // Utilise le nouveau type PaginationResult
}

// Type pour les statistiques de fichiers
export interface FileStats {
  total: number;
  folders: number;
  files: number;
  selected: number;
  byType: Record<string, number>;
  totalSize?: number;
  averageSize?: number;
  withVersions?: number;
  withComments?: number;
}

// ========================================
// CONSTANTES ET LABELS
// ========================================

// Constantes pour les labels de types de fichiers
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  [FileType.DOSSIER]: "Dossier",
  [FileType.PAGE]: "Page",
  [FileType.COMPONENT]: "Composant",
  [FileType.UTILS]: "Utils",
  [FileType.LIB]: "Bibliothèque",
  [FileType.STORE]: "Store",
  [FileType.HOOK]: "Hook",
  [FileType.ENV]: "Configuration",
  [FileType.SYSTEM]: "Système",
  [FileType.TEST]: "Test",
  [FileType.OTHER]: "Autre",
};

// Couleurs pour les types de fichiers
export const FILE_TYPE_COLORS: Record<FileType, string> = {
  [FileType.DOSSIER]: "blue",
  [FileType.PAGE]: "green",
  [FileType.COMPONENT]: "purple",
  [FileType.UTILS]: "gray",
  [FileType.LIB]: "indigo",
  [FileType.STORE]: "orange",
  [FileType.HOOK]: "pink",
  [FileType.ENV]: "yellow",
  [FileType.SYSTEM]: "red",
  [FileType.TEST]: "emerald",
  [FileType.OTHER]: "slate",
};

// Type pour les options de sélection
export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

// Options pour les types de fichiers
export const FILE_TYPE_OPTIONS: SelectOption<FileType>[] = [
  { value: FileType.PAGE, label: "Page", description: "Composant de page React" },
  { value: FileType.COMPONENT, label: "Composant", description: "Composant React réutilisable" },
  { value: FileType.UTILS, label: "Utils", description: "Fonctions utilitaires" },
  { value: FileType.LIB, label: "Bibliothèque", description: "Bibliothèque ou module" },
  { value: FileType.STORE, label: "Store", description: "Store de gestion d'état" },
  { value: FileType.HOOK, label: "Hook", description: "Hook React personnalisé" },
  { value: FileType.ENV, label: "Configuration", description: "Fichier de configuration" },
  { value: FileType.SYSTEM, label: "Système", description: "Fichier système" },
  { value: FileType.TEST, label: "Test", description: "Fichier de test" },
  { value: FileType.OTHER, label: "Autre", description: "Autre type de fichier" },
];

// Options pour les filtres de type
export const FILTER_TYPE_OPTIONS: SelectOption<FilterType>[] = [
  { value: "ALL", label: "Tous les types" },
  { value: "DOSSIER", label: "Dossiers uniquement" },
  { value: "FILE", label: "Fichiers uniquement" },
  ...FILE_TYPE_OPTIONS,
];

// Options pour le tri
export const SORT_OPTIONS: SelectOption<SortBy>[] = [
  { value: "name", label: "Nom" },
  { value: "type", label: "Type" },
  { value: "date", label: "Date de modification" },
  { value: "size", label: "Taille" },
  { value: "author", label: "Auteur" },
];

// ========================================
// TYPES POUR LA VALIDATION
// ========================================

// Type pour les erreurs de validation
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Type pour les résultats de validation
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Règles de validation pour les fichiers
export interface FileValidationRules {
  nameRequired: boolean;
  nameMinLength?: number;
  nameMaxLength?: number;
  namePattern?: RegExp;
  descriptionMaxLength?: number;
  scriptMaxLength?: number;
  pathPattern?: RegExp;
  tagsMaxCount?: number;
  tagMaxLength?: number;
  allowedMimeTypes?: string[];
  requiredFields?: (keyof FileFormData)[];
}

// ========================================
// TYPES POUR LES OPÉRATIONS EN LOT
// ========================================

// Type pour les opérations en lot
export interface BatchOperation {
  type: "delete" | "move" | "copy" | "update";
  fileIds: string[];
  targetFolderId?: string | null;
  updateData?: Partial<FileFormData>;
}

// Type pour les résultats d'opérations en lot
export interface BatchOperationResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    fileId: string;
    success: boolean;
    error?: string;
  }>;
}

// ========================================
// EXPORTS DE TYPES UTILITAIRES
// ========================================

// Types utilitaires pour l'extraction de propriétés
export type FileId = SimpleFile['id'];
export type FileName = SimpleFile['name'];
export type FileTypeValue = SimpleFile['type'];
export type FileVersion = SimpleFile['version'];

// Type pour les mises à jour partielles
export type FileUpdate = Partial<Omit<SimpleFile, 'id' | 'createdAt' | 'updatedAt' | 'version'>>;

// Type pour la création (sans id, createdAt, updatedAt, version)
export type FileCreate = Omit<SimpleFile, 'id' | 'createdAt' | 'updatedAt' | 'version'>;

// Type pour les métadonnées étendues
export interface FileMetadata {
  size?: number;
  encoding?: string;
  language?: string;
  framework?: string;
  dependencies?: string[];
  exports?: string[];
  imports?: string[];
  complexity?: number;
  coverage?: number;
  lastAnalyzed?: Date;
  customFields?: Record<string, any>;
}

// Type pour l'historique des versions
export interface FileVersionHistory {
  id: string;
  version: number;
  changes: string[];
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
  size: number;
  url: string;
  changelog?: string;
}

// Type pour les suggestions d'auto-complétion
export interface FileSuggestion {
  type: "folder" | "file" | "tag" | "author";
  value: string;
  label: string;
  count?: number;
  icon?: string;
}

// ========================================
// TYPES POUR L'INTÉGRATION EXTERNE
// ========================================

// Type pour l'intégration Git
export interface GitIntegration {
  repository?: string;
  branch?: string;
  commit?: string;
  lastSync?: Date;
  syncEnabled?: boolean;
}

// Type pour l'intégration IDE
export interface IDEIntegration {
  openInIDE?: (path: string) => void;
  getFileContent?: (path: string) => Promise<string>;
  saveFileContent?: (path: string, content: string) => Promise<void>;
}

// Type pour les hooks d'événements
export interface FileEventHooks {
  onFileCreated?: (file: FileWithRelations) => void;
  onFileUpdated?: (file: FileWithRelations, changes: Partial<FileWithRelations>) => void;
  onFileDeleted?: (fileId: string) => void;
  onFileMoved?: (fileId: string, oldParentId: string | null, newParentId: string | null) => void;
  onFolderNavigated?: (folderId: string | null, folderName?: string) => void;
}


// ========================================
// INTERFACES POUR LES VUES DE FICHIERS (FilesList et enfants)
// ========================================

// ✅ Interface commune pour toutes les vues (FilesViewList, FilesViewCard, FilesViewBranch)
export interface FilesViewProps {
  files: FileWithRelations[];
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onDelete: (file: FileWithRelations) => void;
  onDownload: (file: FileWithRelations) => void;
  onShare: (file: FileWithRelations) => void;
  onDuplicate: (file: FileWithRelations) => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  getFileTypeIcon: (type: FileType, isFolder?: boolean) => JSX.Element;
  getTypeLabel: (type: FileType) => string;
  formatFileSize: (bytes: number | null) => string;
  onCreateNew?: () => void;
}

// ✅ Props spécifiques pour la vue arborescente (FilesViewBranch)
export interface FilesViewBranchProps extends FilesViewProps {
  onReorganize: (
    fileId: string, 
    direction: "up" | "down",
    currentIndex: number,
    totalFiles: number
  ) => void;
  isReorganizing: boolean;
  processingFileId: string | null;
}

// ✅ Props spécifiques pour la vue tableau (FilesViewList)
export interface FilesViewListProps extends FilesViewProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy) => void;
  onReorganize: (
    fileId: string, 
    direction: "up" | "down",
    currentIndex: number,
    totalFiles: number
  ) => void;
  isReorganizing: boolean;
  processingFileId: string | null;
}

// ✅ Props spécifiques pour la vue carte (FilesViewCard)
export interface FilesViewCardProps extends FilesViewProps {
  // Pas de propriétés supplémentaires pour le moment
}