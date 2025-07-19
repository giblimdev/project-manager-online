// components/files/views/FilesViewList.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Download,
  Eye,
  FolderOpen,
  FileText,
  Image,
  Video,
  Archive,
  Code,
  FileCode,
  Palette,
  TestTube,
  MoreHorizontal,
  MessageSquare,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { deleteItemUtil } from "@/utils/delete-item";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export interface FilesViewListProps {
  files: FileWithRelations[];
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
}

export const FilesViewList: React.FC<FilesViewListProps> = ({
  files,
  onEdit,
  onRefresh,
  onFolderNavigate,
}) => {
  const handleMoveUp = async (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Implémentation du déplacement vers le haut
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
      // Implémentation du déplacement vers le bas
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

  const getFileIcon = (file: FileWithRelations) => {
    if (file.isFolder) {
      return <FolderOpen className="h-5 w-5 text-blue-600" />;
    }

    switch (file.type) {
      case "DOCUMENT":
        return <FileText className="h-5 w-5 text-red-600" />;
      case "IMAGE":
        return <Image className="h-5 w-5 text-green-600" />;
      case "VIDEO":
        return <Video className="h-5 w-5 text-purple-600" />;
      case "ARCHIVE":
        return <Archive className="h-5 w-5 text-yellow-600" />;
      case "CODE":
        return <Code className="h-5 w-5 text-blue-600" />;
      case "SPECIFICATION":
        return <FileCode className="h-5 w-5 text-indigo-600" />;
      case "DESIGN":
        return <Palette className="h-5 w-5 text-pink-600" />;
      case "TEST":
        return <TestTube className="h-5 w-5 text-orange-600" />;
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getUserDisplayName = (user: {
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const handleFileClick = (file: FileWithRelations) => {
    if (file.isFolder) {
      onFolderNavigate(file.id, file.name);
    } else {
      // Ouvrir le fichier dans un nouvel onglet
      window.open(file.url, "_blank");
    }
  };

  return (
    <TooltipProvider>
      <div className="overflow-hidden">
        {/* En-tête du tableau */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
            <div className="col-span-4">Nom</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Taille</div>
            <div className="col-span-2">Uploader</div>
            <div className="col-span-2">Modifié</div>
            <div className="col-span-1">Actions</div>
          </div>
        </div>

        {/* Liste des fichiers */}
        <div className="divide-y divide-gray-200">
          {files.map((file) => (
            <div
              key={file.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleFileClick(file)}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Nom du fichier */}
                <div className="col-span-4 flex items-center space-x-3 min-w-0">
                  {getFileIcon(file)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {file.name}
                      </h3>
                      {file.isPublic && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          Public
                        </Badge>
                      )}
                      {file.versions && file.versions.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          v{file.version}
                        </Badge>
                      )}
                    </div>
                    {file.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {file.description}
                      </p>
                    )}
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {file.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
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
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <Badge variant="outline" className="text-xs">
                    {file.type}
                  </Badge>
                </div>

                {/* Taille */}
                <div className="col-span-1 text-sm text-gray-600">
                  {file.isFolder ? (
                    <span className="flex items-center text-xs text-gray-500">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      {file._count?.children || 0} éléments
                    </span>
                  ) : (
                    formatFileSize(file.size)
                  )}
                </div>

                {/* Uploader */}
                <div className="col-span-2 flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={file.uploader.image || undefined} />
                    <AvatarFallback className="text-xs bg-gray-200">
                      {file.uploader.name?.charAt(0) ||
                        file.uploader.firstName?.charAt(0) ||
                        file.uploader.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600 truncate">
                    {getUserDisplayName(file.uploader)}
                  </span>
                </div>

                {/* Date de modification */}
                <div className="col-span-2 text-sm text-gray-600">
                  <Tooltip>
                    <TooltipTrigger>
                      {file.updatedAt.toLocaleDateString("fr-FR")}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{file.updatedAt.toLocaleString("fr-FR")}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Actions */}
                <div className="col-span-1">
                  <div
                    className="flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!file.isFolder && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                            onClick={(e) => handleDownload(e, file)}
                          >
                            <Download className="h-4 w-4 text-blue-600" />
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={(e) => handleEdit(e, file)}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={(e) => handleMoveUp(e, file.id)}
                        >
                          <ChevronUp className="h-4 w-4 text-gray-600" />
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
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={(e) => handleMoveDown(e, file.id)}
                        >
                          <ChevronDown className="h-4 w-4 text-gray-600" />
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
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                          onClick={(e) => handleDelete(e, file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Supprimer</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              {(file.comments && file.comments.length > 0) ||
                ((file.project ||
                  file.feature ||
                  file.userStory ||
                  file.task ||
                  file.sprint) && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {file.comments && file.comments.length > 0 && (
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {file.comments.length} commentaire
                          {file.comments.length > 1 ? "s" : ""}
                        </span>
                      )}

                      {file.project && (
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Projet: {file.project.name}
                        </span>
                      )}

                      {file.feature && (
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Feature: {file.feature.name}
                        </span>
                      )}

                      {file.userStory && (
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Story: {file.userStory.title}
                        </span>
                      )}

                      {file.task && (
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Tâche: {file.task.title}
                        </span>
                      )}

                      {file.sprint && (
                        <span className="flex items-center">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Sprint: {file.sprint.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
