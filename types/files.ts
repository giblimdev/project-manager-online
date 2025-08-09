// types/files.ts

/**
 * RÔLE : Types simplifiés pour le référentiel de métadonnées des fichiers de développement
 * RESPONSABILITÉS :
 * - Types pour cataloguer les fichiers du projet avec leurs métadonnées essentielles
 * - Interface pour organiser la structure hiérarchique du codebase
 * - Types pour associer les fichiers aux éléments du projet
 * - Support des métadonnées de développement (imports, exports, scripts)
 * - Types simplifiés pour une utilisation optimale
 *
 * NOTE IMPORTANTE : Cette table ne gère PAS le stockage de fichiers physiques,
 * seulement leurs métadonnées pour aider au développement
 *
 * COMPOSANTS UTILISÉS :
 * - Aucun (fichier de types uniquement)
 *
 * LIBS UTILISÉS :
 * - TypeScript strict mode avec interfaces strictes Next.js 15
 * - Conformité avec schéma Prisma FileType enum fourni
 * - Support React 19 JSX et Next.js 15 types
 */

// ✅ Types de base selon votre schéma Prisma
export type FileType =
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

export type ViewMode = "list" | "card" | "branch";
export type FilterType = "ALL" | FileType;
export type SortBy = "name" | "type" | "date";
export type SortOrder = "asc" | "desc";

// ✅ Interface principale simplifiée selon votre schéma
export interface FileMetadata {
  id: string;
  name: string;
  originalName?: string | null;
  type: FileType;
  mimeType?: string | null;
  size?: number | null;
  url: string;
  path?: string | null;
  description?: string | null;
  import?: any;
  export?: any;
  script?: string | null;
  version: number;
  isPublic: boolean;
  isFolder: boolean;
  metadata?: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  // Relations simplifiées
  uploaderId: string;
  parentId?: string | null;
  projectId?: string | null;
  featureId?: string | null;
  userStoryId?: string | null;
  taskId?: string | null;
  sprintId?: string | null;

  // Relations peuplées (optionnelles)
  uploader?: {
    id: string;
    name?: string | null;
    email: string;
  };
  parent?: {
    id: string;
    name: string;
    isFolder: boolean;
  } | null;
  children?: FileMetadata[];
  project?: {
    id: string;
    name: string;
    key: string;
  } | null;
}

// ✅ Interfaces pour les composants
export interface FilesViewProps {
  files: FileMetadata[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileMetadata) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  onDelete?: (file: FileMetadata) => void;
  onViewCode?: (file: FileMetadata) => void;
  selectedFiles?: string[];
  onToggleSelection?: (fileId: string) => void;
}

export interface FilesFormProps {
  file?: FileMetadata | null;
  currentFolder: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export interface FilesFilterProps {
  value: string;
  onChange: (value: string) => void;
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  placeholder?: string;
}

// ✅ Interface API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export type FilesApiResponse = ApiResponse<FileMetadata[]>;
