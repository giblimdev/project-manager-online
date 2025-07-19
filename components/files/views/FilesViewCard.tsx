// components/files/views/FilesViewCard.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Download,
  MoreHorizontal,
  FolderOpen,
  FileText,
  Image,
  Video,
  Archive,
  Code,
  FileCode,
  Palette,
  TestTube,
  MessageSquare,
  ExternalLink,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { deleteItemUtil } from "@/utils/delete-item";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Interface identique à FilesViewList
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

export interface FilesViewCardProps {
  files: FileWithRelations[];
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
}

export const FilesViewCard: React.FC<FilesViewCardProps> = ({
  files,
  onEdit,
  onRefresh,
  onFolderNavigate,
}) => {
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

  const getFileIcon = (file: FileWithRelations, size: string = "h-8 w-8") => {
    if (file.isFolder) {
      return <FolderOpen className={cn(size, "text-blue-600")} />;
    }

    switch (file.type) {
      case "DOCUMENT":
        return <FileText className={cn(size, "text-red-600")} />;
      case "IMAGE":
        return <Image className={cn(size, "text-green-600")} />;
      case "VIDEO":
        return <Video className={cn(size, "text-purple-600")} />;
      case "ARCHIVE":
        return <Archive className={cn(size, "text-yellow-600")} />;
      case "CODE":
        return <Code className={cn(size, "text-blue-600")} />;
      case "SPECIFICATION":
        return <FileCode className={cn(size, "text-indigo-600")} />;
      case "DESIGN":
        return <Palette className={cn(size, "text-pink-600")} />;
      case "TEST":
        return <TestTube className={cn(size, "text-orange-600")} />;
      default:
        return <MoreHorizontal className={cn(size, "text-gray-600")} />;
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
      window.open(file.url, "_blank");
    }
  };

  const getFilePreview = (file: FileWithRelations) => {
    if (file.isFolder) {
      return (
        <div className="h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
          {getFileIcon(file, "h-12 w-12")}
        </div>
      );
    }

    if (file.type === "IMAGE") {
      return (
        <div className="h-32 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.parentElement!.innerHTML = `
                <div class="w-full h-full flex items-center justify-center">
                  ${getFileIcon(file, "h-12 w-12")}
                </div>
              `;
            }}
          />
        </div>
      );
    }

    const bgColor = {
      DOCUMENT: "from-red-50 to-red-100",
      VIDEO: "from-purple-50 to-purple-100",
      ARCHIVE: "from-yellow-50 to-yellow-100",
      CODE: "from-blue-50 to-blue-100",
      SPECIFICATION: "from-indigo-50 to-indigo-100",
      DESIGN: "from-pink-50 to-pink-100",
      TEST: "from-orange-50 to-orange-100",
      OTHER: "from-gray-50 to-gray-100",
    }[file.type];

    return (
      <div
        className={cn(
          "h-32 bg-gradient-to-br rounded-lg flex items-center justify-center",
          bgColor
        )}
      >
        {getFileIcon(file, "h-12 w-12")}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {files.map((file) => (
          <Card
            key={file.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden"
            onClick={() => handleFileClick(file)}
          >
            {/* Menu d'actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => handleEdit(e, file)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  {!file.isFolder && (
                    <DropdownMenuItem onClick={(e) => handleDownload(e, file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => handleMoveUp(e, file.id)}>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Monter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleMoveDown(e, file.id)}>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Descendre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => handleDelete(e, file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges de statut */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {file.isPublic && (
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  Public
                </Badge>
              )}
              {file.versions && file.versions.length > 1 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  v{file.version}
                </Badge>
              )}
            </div>

            <CardHeader className="pb-3">{getFilePreview(file)}</CardHeader>

            <CardContent className="pt-0 space-y-3">
              {/* Nom et type */}
              <div>
                <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {file.name}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-xs">
                    {file.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {file.isFolder ? (
                      <span className="flex items-center">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {file._count?.children || 0} éléments
                      </span>
                    ) : (
                      formatFileSize(file.size)
                    )}
                  </span>
                </div>
              </div>

              {/* Description */}
              {file.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {file.description}
                </p>
              )}

              {/* Tags */}
              {file.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {file.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {file.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{file.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Informations de l'uploader */}
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={file.uploader.image || undefined} />
                  <AvatarFallback className="text-xs bg-gray-200">
                    {file.uploader.name?.charAt(0) ||
                      file.uploader.firstName?.charAt(0) ||
                      file.uploader.email?.charAt(0) ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">
                    {getUserDisplayName(file.uploader)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {file.updatedAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {file.comments && file.comments.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center text-xs text-gray-500">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {file.comments.length}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {file.comments.length} commentaire
                        {file.comments.length > 1 ? "s" : ""}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Relations */}
              {(file.project ||
                file.feature ||
                file.userStory ||
                file.task ||
                file.sprint) && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  {file.project && (
                    <div className="flex items-center text-xs text-gray-500">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        Projet: {file.project.name}
                      </span>
                    </div>
                  )}
                  {file.feature && (
                    <div className="flex items-center text-xs text-gray-500">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        Feature: {file.feature.name}
                      </span>
                    </div>
                  )}
                  {file.userStory && (
                    <div className="flex items-center text-xs text-gray-500">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        Story: {file.userStory.title}
                      </span>
                    </div>
                  )}
                  {file.task && (
                    <div className="flex items-center text-xs text-gray-500">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="truncate">Tâche: {file.task.title}</span>
                    </div>
                  )}
                  {file.sprint && (
                    <div className="flex items-center text-xs text-gray-500">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        Sprint: {file.sprint.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};
