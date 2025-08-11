// types/files.ts - CORRECTION pour FileFormProps manquante

/**
 * RÔLE : Types centralisés pour la gestion des métadonnées de fichiers selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Définition des interfaces TypeScript strictes basées EXACTEMENT sur le schéma Prisma
 * - Types pour les relations complètes avec _count et objets imbriqués
 * - CORRECTION MAJEURE : Interface FileFormProps pour le composant FilesForm
 * - Enums FileType EXACTS du schéma : DOSSIER, PAGE, COMPONENT, UTILS, LIB, STORE, HOOK, ENV, SYSTEM, TEST, OTHER
 * - Interfaces pour les props des composants de vue avec gestion métadonnées développement
 * - Types pour les réponses API et les actions CRUD
 * - Support de l'aide au développement : import, export, use, script
 *
 * LIBS UTILISÉS :
 * - TypeScript strict mode avec Next.js 15
 * - Prisma types et enums selon le schéma fourni EXACTEMENT
 * - React 19 pour les types JSX et événements
 */

import { JSX } from "react";

// ✅ Enums basés EXACTEMENT sur le schéma Prisma
export type FileType =
  | "DOSSIER"
  | "PAGE"
  | "COMPONENT"
  | "UTILS"
  | "LIB"
  | "STORE"
  | "HOOK"
  | "ENV"
  | "SYSTEM"
  | "TEST"
  | "OTHER";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Visibility = "PRIVATE" | "PUBLIC" | "INTERNAL";
export type UserRole =
  | "ADMIN"
  | "PRODUCT_OWNER"
  | "SCRUM_MASTER"
  | "DEVELOPER"
  | "STAKEHOLDER"
  | "VIEWER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "CODE_REVIEW"
  | "TESTING"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type ItemStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "SPRINT_STARTED"
  | "MENTION"
  | "COMMENT_REPLY"
  | "DEADLINE_REMINDER"
  | "FILE_SHARED";

// ✅ Types pour les modes de vue
export type ViewMode = "list" | "card" | "branch";
export type SortBy = "name" | "type" | "size" | "date" | "author";
export type SortOrder = "asc" | "desc";
export type DateTime = Date | string;

// ✅ Interface User basée sur le schéma Prisma - COMPLÈTE
export interface UserSimple {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  timezone: string | null;
  preferences: Record<string, any> | null;
  isActive: boolean;
  lastLoginAt: DateTime | null;
  twoFactorEnabled: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}

// ✅ Interface Project basée sur le schéma Prisma - CORRIGÉE
export interface ProjectSimple {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: DateTime | null;
  endDate: DateTime | null;
  status: string;
  visibility: string;
  settings: Record<string, any> | null;
  metadata: Record<string, any> | null;
  isActive: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
  // ✅ CORRECTION MAJEURE : Project a plusieurs owners selon le schéma
  user: UserSimple[]; // @relation("ProjectOwner") - relation multiple !
}

// ✅ Interface Feature basée sur le schéma Prisma
export interface FeatureSimple {
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
  startDate: DateTime | null;
  endDate: DateTime | null;
  progress: number;
  position: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
}

// ✅ Interface UserStory basée sur le schéma Prisma
export interface UserStorySimple {
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
  createdAt: DateTime;
  updatedAt: DateTime;
  featureId: string;
  creatorId: string;
}

// ✅ Interface Task basée sur le schéma Prisma
export interface TaskSimple {
  id: string;
  title: string;
  order: number;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  type: string;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours: number | null;
  actualHours: number | null;
  dueDate: DateTime | null;
  startDate: DateTime | null;
  completedAt: DateTime | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  userStoryId: string;
  creatorId: string;
}

// ✅ Interface Sprint basée sur le schéma Prisma
export interface SprintSimple {
  id: string;
  name: string;
  order: number;
  goal: string | null;
  description: string | null;
  startDate: DateTime;
  endDate: DateTime;
  status: SprintStatus;
  capacity: number | null;
  velocity: number | null;
  burndownData: Record<string, any> | null;
  retrospective: Record<string, any> | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  projectId: string;
}

// ✅ Interface Item basée sur le schéma Prisma - COMPLÈTE
export interface ItemSimple {
  id: string;
  type: string;
  name: string;
  description: string | null;
  objective: string | null;
  slug: string;
  key: string | null;
  priority: Priority | null;
  acceptanceCriteria: string | null;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  progress: number | null;
  status: ItemStatus;
  visibility: Visibility;
  startDate: DateTime | null;
  endDate: DateTime | null;
  completedAt: DateTime | null;
  settings: Record<string, any> | null;
  metadata: Record<string, any> | null;
  text: Record<string, any> | null;
  backlogPosition: number | null;
  DoD: string | null;
  isActive: boolean;
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: DateTime;
  updatedAt: DateTime;
  parentId: string | null;
  sprintId: string | null;
  userId: string;
}

// ✅ Interface Comment basée sur le schéma Prisma - COMPLÈTE
export interface CommentSimple {
  id: string;
  title: string;
  order: number;
  content: string;
  mentions: string[];
  createdAt: DateTime;
  updatedAt: DateTime;
  authorId: string;
  taskId: string | null;
  userStoryId: string | null;
  fileId: string | null;
  itemId: string | null;
  parentCommentId: string | null;
  blogImage: string | null;
  excerpt: string | null;
  isActive: boolean;
  isPinned: boolean;
  isResolved: boolean;
  metadata: Record<string, any> | null;
  publishedAt: DateTime | null;
  readingTime: number | null;
  slug: string | null;
  status: string;
  visibility: Visibility;
  author: UserSimple;
}

// ✅ Interface pour les versions de fichiers - EXACTE selon schéma
export interface FileVersionSimple {
  id: string;
  version: number;
  url: string;
  size: number;
  checksum: string | null;
  changelog: string | null;
  createdAt: DateTime;
  fileId: string;
  authorId: string;
  author: UserSimple;
}

// ✅ Interface File EXACTE selon nouveau schéma Prisma - CORRECTIONS MAJEURES
export interface FileWithRelations {
  // Champs de base EXACTS du schéma
  id: string;
  name: string;
  order: number; // ✅ Présent dans le schéma
  type: FileType;
  mimeType: string | null;
  path: string | null;
  description: string | null;
  import: string | null; // Imports du fichier
  use: string | null; // "biblioteque, lib, utils, store, hook, ..." selon schéma
  export: string | null; // Exports du fichier
  script: string | null; // Contenu/script du fichier
  version: number;
  isFolder: boolean;
  metadata: Record<string, any> | null;
  tags: string[];
  createdAt: DateTime;
  updatedAt: DateTime;

  // Relations selon schéma Prisma - IDs
  parentId: string | null;
  projectId: string; // ✅ OBLIGATOIRE selon schéma
  featureId: string | null; // ✅ NULLABLE dans le schéma
  userStoryId: string | null; // ✅ NULLABLE dans le schéma
  taskId: string | null; // ✅ NULLABLE dans le schéma
  sprintId: string | null; // ✅ NULLABLE dans le schéma

  // Relations complètes selon nouveau schéma Prisma
  parent: FileWithRelations | null;
  children: FileWithRelations[];
  project: ProjectSimple; // ✅ OBLIGATOIRE (pas null selon schéma)
  feature: FeatureSimple | null;
  userStory: UserStorySimple | null;
  task: TaskSimple | null;
  sprint: SprintSimple | null;
  // ✅ CORRECTIONS IMPORTANTES selon le nouveau schéma :
  author: UserSimple[]; // ✅ Relation multiple CONFIRMÉE : author User[]
  versions: FileVersionSimple[]; // ✅ Relation FileVersion[]
  comments: CommentSimple[]; // ✅ Relation Comment[]
  items: ItemSimple[]; // ✅ NOUVELLE RELATION : items Item[] @relation("FileToItem")

  // Compteurs Prisma
  _count: {
    children: number;
    versions: number;
    comments: number;
    items: number; // ✅ AJOUTÉ pour la relation items
  };
}

// ✅ Interface pour les actions de fichier
export interface FileActions {
  onEdit: (file: FileWithRelations) => void;
  onDelete?: (file: FileWithRelations) => void;
  onDownload?: (file: FileWithRelations) => void;
  onShare?: (file: FileWithRelations) => void;
  onDuplicate?: (file: FileWithRelations) => void;
  onMove?: (file: FileWithRelations, targetFolderId: string) => void;
  onCreateVersion?: (file: FileWithRelations) => void;
}

// ✅ Interface pour les props communes des vues
export interface FilesViewProps extends FileActions {
  files: FileWithRelations[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  selectedFiles?: string[];
  onToggleSelection?: (fileId: string) => void;
  // Fonctions de formatage optionnelles
  getFileTypeIcon?: (type: string, isFolder?: boolean) => JSX.Element;
  getTypeLabel?: (type: string) => string;
  formatFileSize?: (bytes: number | null) => string;
}

// ✅ Interface pour la création/édition de fichiers
export interface FileFormData {
  name: string;
  type: FileType;
  description?: string;
  import?: string;
  use?: string;
  export?: string;
  script?: string;
  tags?: string[];
  parentId?: string | null;
  projectId: string; // ✅ OBLIGATOIRE selon schéma
  featureId?: string | null;
  userStoryId?: string | null;
  taskId?: string | null;
  sprintId?: string | null;
  isFolder?: boolean;
  metadata?: Record<string, any>;
}

// ✅ CORRECTION MAJEURE : Interface pour les props de formulaire - MANQUAIT !
export interface FileFormProps {
  file?: FileWithRelations | null;
  currentFolder?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

// ✅ Interface pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ✅ Type pour le filtre avec ALL + types Prisma EXACTS
export type FilterType = "ALL" | FileType;

// ✅ Interface pour les paramètres de recherche
export interface FileSearchParams {
  search?: string;
  type?: FilterType;
  projectId?: string;
  featureId?: string;
  userStoryId?: string;
  taskId?: string;
  sprintId?: string;
  parentId?: string | null;
  tags?: string[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}
