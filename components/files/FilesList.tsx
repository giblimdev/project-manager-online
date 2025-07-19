// components/files/FilesList.tsx
"use client";

import React from "react";
import { FilesViewList } from "./views/FilesViewList";
import { FilesViewCard } from "./views/FilesViewCard";
import { FilesViewBranch } from "./views/FilesViewBranch";

// Interface basée sur votre schéma Prisma
interface FileWithRelations {
  id: string;
  name: string;
  originalName: string | null;
  type:
    | "DOCUMENT"
    | "IMAGE"
    | "VIDEO"
    | "ARCHIVE"
    | "CODE"
    | "SPECIFICATION"
    | "DESIGN"
    | "TEST"
    | "OTHER";
  mimeType: string;
  size: number;
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

type ViewMode = "list" | "card" | "branch";

export interface FilesListProps {
  files: FileWithRelations[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
}

export const FilesList: React.FC<FilesListProps> = ({
  files,
  viewMode,
  currentFolder,
  onEdit,
  onRefresh,
  onFolderNavigate,
}) => {
  if (!Array.isArray(files)) {
    console.error("FilesList: files prop is not an array:", files);
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">
          <svg
            className="h-8 w-8 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement des fichiers
        </h3>
        <p className="text-gray-600 mb-4">
          Les données des fichiers ne sont pas au format attendu.
        </p>
        <button
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recharger
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun fichier trouvé
        </h3>
        <p className="text-gray-600">
          {currentFolder
            ? "Ce dossier est vide."
            : "Commencez par ajouter votre premier fichier."}
        </p>
      </div>
    );
  }

  const normalizedFiles: FileWithRelations[] = files.map((file) => ({
    ...file,
    createdAt: new Date(file.createdAt),
    updatedAt: new Date(file.updatedAt),
    tags: file.tags || [],
    metadata: file.metadata || {},
    versions: (file.versions || []).map((version) => ({
      ...version,
      createdAt: new Date(version.createdAt),
    })),
    comments: (file.comments || []).map((comment) => ({
      ...comment,
      createdAt: new Date(comment.createdAt),
      updatedAt: new Date(comment.updatedAt),
    })),
    _count: file._count || {
      children: file.children?.length || 0,
      versions: file.versions?.length || 0,
      comments: file.comments?.length || 0,
      items: file.items?.length || 0,
    },
  }));

  switch (viewMode) {
    case "list":
      return (
        <FilesViewList
          files={normalizedFiles}
          onEdit={onEdit}
          onRefresh={onRefresh}
          onFolderNavigate={onFolderNavigate}
        />
      );
    case "card":
      return (
        <FilesViewCard
          files={normalizedFiles}
          onEdit={onEdit}
          onRefresh={onRefresh}
          onFolderNavigate={onFolderNavigate}
        />
      );
    case "branch":
      return (
        <FilesViewBranch
          files={normalizedFiles}
          onEdit={onEdit}
          onRefresh={onRefresh}
          onFolderNavigate={onFolderNavigate}
        />
      );
    default:
      return (
        <FilesViewList
          files={normalizedFiles}
          onEdit={onEdit}
          onRefresh={onRefresh}
          onFolderNavigate={onFolderNavigate}
        />
      );
  }
};
