// types/files.ts

import { JSX } from "react";

/**
 * RÔLE : Types centralisés pour la gestion des fichiers avec support multiple formats de réponse
 * RESPONSABILITÉS :
 * - Interface FileWithRelations unifiée selon schéma Prisma mis à jour
 * - Types pour ViewMode, FilterType, SortBy, SortOrder cohérents
 * - Interface ApiResponse flexible supportant différents formats de réponse
 * - Support de la compatibilité avec l'API route existante
 * - Gestion du mimeType nullable selon nouveau schéma
 *
 * COMPOSANTS UTILISÉS :
 * - Aucun (fichier de types uniquement)
 *
 * LIBS UTILISÉS :
 * - TypeScript strict mode avec interfaces strictes
 * - Conformité avec schéma Prisma FileType enum
 * - Support Next.js 15 et React 19 types
 *
 * UTILISATION :
 * - Import dans tous les composants files (page, FilesList, FilesForm, etc.)
 * - Garantit la cohérence des types entre tous les composants
 * - Évite les conflits de types entre définitions multiples
 */

// ✅ Interface FileWithRelations selon votre schéma Prisma
export interface FileWithRelations {
  id: string;
  name: string;
  originalName: string | null;
  type:
    | "PAGE"
    | "COMPONENT"
    | "UTILS"
    | "LIB"
    | "STORE"
    | "HOOK"
    | "DOCUMENT"
    | "IMAGE"
    | "VIDEO"
    | "ARCHIVE"
    | "CODE"
    | "SPECIFICATION"
    | "DESIGN"
    | "TEST"
    | "OTHER";
  mimeType: string | null; // ✅ MimeType nullable selon votre schéma
  size: number | null;
  url: string;
  path: string | null;
  description: string | null;
  import: any;
  export: any;
  script: string | null;
  version: number;
  isPublic: boolean;
  isFolder: boolean;
  metadata: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  // Relations Prisma selon votre schéma
  uploader: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    timezone?: string | null;
    preferences?: any;
    isActive: boolean;
  };

  parent?: {
    id: string;
    name: string;
    isFolder: boolean;
  } | null;

  children?: FileWithRelations[];

  project?: {
    id: string;
    name: string;
    key: string;
    slug: string;
  } | null;

  feature?: {
    id: string;
    name: string;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } | null;

  userStory?: {
    id: string;
    title: string;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } | null;

  task?: {
    id: string;
    title: string;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } | null;

  sprint?: {
    id: string;
    name: string;
    goal?: string | null;
    status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  } | null;

  versions?: Array<{
    id: string;
    version: number;
    url: string;
    size: number;
    checksum?: string | null;
    changelog?: string | null;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;

  comments?: Array<{
    id: string;
    content: string;
    mentions: string[];
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;

  items?: Array<{
    id: string;
    type: string;
    name: string;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";
  }>;

  _count?: {
    children?: number;
    versions?: number;
    comments?: number;
    items?: number;
  };
}

// ✅ Interface ApiResponse CORRIGÉE pour supporter les deux formats
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  files?: T; // ✅ Ajout de 'files' pour compatibilité avec votre API route existante
  error?: string;
  message?: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ✅ Type union pour gérer différents formats de réponse
export type FilesApiResponse =
  | ApiResponse<FileWithRelations[]> // Format standardisé avec success/data
  | { files: FileWithRelations[]; pagination?: any } // Format de votre API existante
  | FileWithRelations[]; // Format tableau direct

// Types pour les filtres selon FilesFilter
export type FilterType =
  | "ALL"
  | "PAGE"
  | "COMPONENT"
  | "UTILS"
  | "LIB"
  | "STORE"
  | "HOOK"
  | "DOCUMENT"
  | "IMAGE"
  | "VIDEO"
  | "ARCHIVE"
  | "CODE"
  | "SPECIFICATION"
  | "DESIGN"
  | "TEST"
  | "OTHER";

export type SortBy = "name" | "type" | "size" | "date" | "uploader";
export type SortOrder = "asc" | "desc";
export type ViewMode = "list" | "card" | "branch";

// ✅ Interface pour les props des composants de vue
export interface FilesViewProps {
  files: FileWithRelations[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  onDelete?: (file: FileWithRelations) => void;
  onDownload?: (file: FileWithRelations) => void;
  onShare?: (file: FileWithRelations) => void;
  onDuplicate?: (file: FileWithRelations) => void;
  selectedFiles?: string[];
  onToggleSelection?: (fileId: string) => void;
  getFileTypeIcon?: (type: string, isFolder?: boolean) => JSX.Element;
  getTypeLabel?: (type: string) => string;
  formatFileSize?: (bytes: number | null) => string;
}

// ✅ Interface pour les statistiques de fichiers
export interface FileStats {
  total: number;
  files: number;
  folders: number;
  totalSize: number;
  byType: Record<string, number>;
}
