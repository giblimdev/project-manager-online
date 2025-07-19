// components/files/views/FilesViewBranch.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Download,
  FolderOpen,
  Folder,
  FileText,
  Image,
  Video,
  Archive,
  Code,
  FileCode,
  Palette,
  TestTube,
  MoreHorizontal,
} from "lucide-react";
import { deleteItemUtil } from "@/utils/delete-item";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Interface identique aux autres vues
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

export interface FilesViewBranchProps {
  files: FileWithRelations[];
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
}

export const FilesViewBranch: React.FC<FilesViewBranchProps> = ({
  files,
  onEdit,
  onRefresh,
  onFolderNavigate,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleMoveUp = async (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/files/${fileId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "up" }),
      });
      onRefresh();
      toast.success("Fichier déplacé vers le haut");
    } catch (error) {
      toast.error("Impossible de déplacer le fichier");
    }
  };

  const handleMoveDown = async (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/files/${fileId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "down" }),
      });
      onRefresh();
      toast.success("Fichier déplacé vers le bas");
    } catch (error) {
      toast.error("Impossible de déplacer le fichier");
    }
  };

  const handleEdit = (e: React.MouseEvent, file: FileWithRelations) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(file);
  };

  const handleDelete = async (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible."
      )
    )
      return;

    try {
      await deleteItemUtil("files", fileId);
      onRefresh();
      toast.success("Fichier supprimé avec succès");
    } catch (error) {
      toast.error("Impossible de supprimer le fichier");
    }
  };

  const handleDownload = async (
    e: React.MouseEvent,
    file: FileWithRelations
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await fetch(`/api/files/${file.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName || file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Téléchargement commencé");
    } catch (error) {
      toast.error("Erreur lors du téléchargement");
    }
  };

  const getFileIcon = (file: FileWithRelations, isExpanded?: boolean) => {
    if (file.isFolder) {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-blue-600" />
      ) : (
        <Folder className="h-4 w-4 text-blue-600" />
      );
    }

    switch (file.type) {
      case "DOCUMENT":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "IMAGE":
        return <Image className="h-4 w-4 text-green-600" />;
      case "VIDEO":
        return <Video className="h-4 w-4 text-purple-600" />;
      case "ARCHIVE":
        return <Archive className="h-4 w-4 text-yellow-600" />;
      case "CODE":
        return <Code className="h-4 w-4 text-blue-600" />;
      case "SPECIFICATION":
        return <FileCode className="h-4 w-4 text-indigo-600" />;
      case "DESIGN":
        return <Palette className="h-4 w-4 text-pink-600" />;
      case "TEST":
        return <TestTube className="h-4 w-4 text-orange-600" />;
      default:
        return <MoreHorizontal className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileClick = (file: FileWithRelations) => {
    if (file.isFolder) {
      onFolderNavigate(file.id, file.name);
    } else {
      window.open(file.url, "_blank");
    }
  };

  // Construction de l'arbre hiérarchique
  const buildFileTree = (
    files: FileWithRelations[],
    parentId: string | null = null
  ): FileWithRelations[] => {
    return files
      .filter((file) => (file.parent?.id || null) === parentId)
      .sort((a, b) => {
        // Les dossiers en premier
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        // Puis par nom
        return a.name.localeCompare(b.name);
      });
  };

  const renderFileNode = (
    file: FileWithRelations,
    level: number = 0
  ): React.ReactNode => {
    const isExpanded = expandedFolders.has(file.id);
    const childFiles = file.isFolder ? buildFileTree(files, file.id) : [];
    const hasChildren = childFiles.length > 0;

    return (
      <div key={file.id} className="select-none">
        <div
          className={cn(
            "flex items-center hover:bg-gray-50 rounded-lg transition-colors group",
            "py-1 px-2"
          )}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {/* Indentation et icône d'expansion */}
          <div className="flex items-center w-6">
            {file.isFolder && hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(file.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          {/* Icône du fichier */}
          <div className="mr-2">{getFileIcon(file, isExpanded)}</div>

          {/* Nom et informations */}
          <div
            className="flex-1 flex items-center space-x-2 cursor-pointer min-w-0"
            onClick={() => handleFileClick(file)}
          >
            <span className="truncate text-sm text-gray-900 hover:text-blue-600 transition-colors">
              {file.name}
            </span>

            {file.isPublic && (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200 shrink-0"
              >
                Public
              </Badge>
            )}

            {file.versions && file.versions.length > 1 && (
              <Badge variant="outline" className="text-xs shrink-0">
                v{file.version}
              </Badge>
            )}

            <Badge variant="outline" className="text-xs shrink-0">
              {file.type}
            </Badge>
          </div>

          {/* Taille du fichier */}
          <div className="text-xs text-gray-500 w-20 text-right shrink-0 hidden sm:block">
            {file.isFolder ? (
              <span>{file._count?.children || 0} éléments</span>
            ) : (
              formatFileSize(file.size)
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {!file.isFolder && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                    onClick={(e) => handleDownload(e, file)}
                  >
                    <Download className="h-3 w-3 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Télécharger</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={(e) => handleEdit(e, file)}
                >
                  <Edit className="h-3 w-3 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Modifier</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={(e) => handleMoveUp(e, file.id)}
                >
                  <ChevronUp className="h-3 w-3 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer vers le haut</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={(e) => handleMoveDown(e, file.id)}
                >
                  <ChevronDown className="h-3 w-3 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Déplacer vers le bas</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                  onClick={(e) => handleDelete(e, file.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Supprimer</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Enfants (si dossier expandé) */}
        {file.isFolder && isExpanded && hasChildren && (
          <div className="ml-2">
            {childFiles.map((childFile) =>
              renderFileNode(childFile, level + 1)
            )}
          </div>
        )}

        {/* Informations supplémentaires (tags, description) */}
        {(file.description || file.tags.length > 0) && (
          <div
            className="text-xs text-gray-500 mt-1 ml-8"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {file.description && (
              <p className="truncate mb-1">{file.description}</p>
            )}
            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {file.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {file.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{file.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const rootFiles = buildFileTree(files);

  return (
    <TooltipProvider>
      <div className="p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Nom</span>
            <span className="hidden sm:inline">Taille</span>
            <span>Actions</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedFolders(new Set())}
              className="text-xs"
            >
              Tout réduire
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allFolders = files
                  .filter((f) => f.isFolder)
                  .map((f) => f.id);
                setExpandedFolders(new Set(allFolders));
              }}
              className="text-xs"
            >
              Tout développer
            </Button>
          </div>
        </div>

        {/* Arbre des fichiers */}
        <div className="space-y-1">
          {rootFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun fichier à afficher
            </div>
          ) : (
            rootFiles.map((file) => renderFileNode(file))
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
