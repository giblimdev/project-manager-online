// components/files/views/FilesViewCard.tsx

/**
 * RÔLE : Vue grille des fichiers avec cartes visuelles responsive
 * RESPONSABILITÉS :
 * - Affichage en mode grille responsive avec cartes modernes pour chaque fichier/dossier
 * - Interface visuelle attrayante avec aperçus, métadonnées et actions rapides
 * - Support D&D préparé pour déplacer les fichiers vers les dossiers (isFolder: true)
 * - Gestion différenciée des dossiers et fichiers avec icônes et comportements spécifiques
 * - Actions par carte : edit, delete, download, share avec boutons hover compacts
 * - Navigation dans l'arborescence avec double-clic sur dossiers
 * - Design responsive adaptatif avec grid variable selon la taille d'écran
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 * - Gestion du mimeType nullable selon le nouveau schéma Prisma
 * - Types unifiés via fichier central types/files.ts
 *
 * COMPOSANTS UTILISÉS :
 * - Card, CardContent: Composants shadcn/ui pour les conteneurs de fichiers
 * - Button: Composants boutons pour les actions avec variants hover
 * - Badge: Affichage des types, tags, statuts et propriétés avec couleurs
 * - Avatar: Affichage des créateurs avec fallback et images utilisateur
 * - Tooltip: Info-bulles pour les actions et métadonnées détaillées
 * - Progress: Barre de progression pour les fichiers avec suivi d'avancement
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useCallback, useMemo, JSX pour optimisation performances
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Card, Button, Badge, Avatar, Tooltip, Progress components
 * - lucide-react: Icons pour types de fichiers, actions, navigation et métadonnées
 * - Tailwind CSS: Grid responsive, hover effects, transitions et design moderne
 * - date-fns: Formatage des dates avec locale française pour affichage utilisateur
 * - sonner: Toast notifications pour feedback utilisateur sur les actions
 *
 * PROPS reçues de FilesList :
 * - files: Liste des fichiers avec relations complètes selon types/files.ts
 * - viewMode: Mode d'affichage ("card" pour cette vue)
 * - currentFolder: ID du dossier courant pour navigation hiérarchique
 * - onEdit: Callback d'édition d'un fichier avec type FileWithRelations
 * - onRefresh: Callback de rafraîchissement de la liste après actions
 * - onFolderNavigate: Callback de navigation dans l'arborescence avec gestion isFolder
 * - Actions supplémentaires: onDelete, onDownload, onShare, onDuplicate
 */

"use client";

import React, { JSX, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  Download,
  Share2,
  Copy,
  MoreVertical,
  FolderOpen,
  File,
  ExternalLink,
  Calendar,
  Hash,
  Tag,
  Globe,
  Lock,
  FileText,
  Package,
  Settings,
  Layers,
  Database,
  Code2,
  Image,
  Video,
  Archive,
  Paintbrush,
  TestTube,
  Folder,
  Eye,
  Clock,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ✅ Import des types centralisés pour éviter les conflits
import type {
  FileWithRelations,
  ViewMode,
  FilesViewProps,
} from "@/types/files";

// Interface pour les props du composant
interface FilesViewCardProps extends FilesViewProps {
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

export default function FilesViewCard({
  files,
  viewMode,
  currentFolder,
  onEdit,
  onRefresh,
  onFolderNavigate,
  onDelete,
  onDownload,
  onShare,
  onDuplicate,
  selectedFiles = [],
  onToggleSelection,
  getFileTypeIcon,
  getTypeLabel,
  formatFileSize,
}: FilesViewCardProps): JSX.Element {
  // ✅ Fonction pour obtenir l'icône du type avec gestion des dossiers
  const getFileIcon = useCallback(
    (file: FileWithRelations): JSX.Element => {
      if (getFileTypeIcon) {
        return getFileTypeIcon(file.type, file.isFolder);
      }

      if (file.isFolder) {
        return <Folder className="h-8 w-8 text-blue-600" />;
      }

      switch (file.type) {
        case "PAGE":
          return <FileText className="h-8 w-8 text-purple-600" />;
        case "COMPONENT":
          return <Package className="h-8 w-8 text-blue-600" />;
        case "UTILS":
          return <Settings className="h-8 w-8 text-orange-600" />;
        case "LIB":
          return <Layers className="h-8 w-8 text-indigo-600" />;
        case "STORE":
          return <Database className="h-8 w-8 text-green-600" />;
        case "HOOK":
          return <Code2 className="h-8 w-8 text-teal-600" />;
        case "DOCUMENT":
          return <FileText className="h-8 w-8 text-blue-600" />;
        case "IMAGE":
          return <Image className="h-8 w-8 text-pink-600" />;
        case "VIDEO":
          return <Video className="h-8 w-8 text-red-600" />;
        case "ARCHIVE":
          return <Archive className="h-8 w-8 text-yellow-600" />;
        case "CODE":
          return <Code2 className="h-8 w-8 text-gray-600" />;
        case "SPECIFICATION":
          return <FileText className="h-8 w-8 text-cyan-600" />;
        case "DESIGN":
          return <Paintbrush className="h-8 w-8 text-rose-600" />;
        case "TEST":
          return <TestTube className="h-8 w-8 text-emerald-600" />;
        default:
          return <File className="h-8 w-8 text-gray-400" />;
      }
    },
    [getFileTypeIcon]
  );

  // ✅ Fonction pour obtenir le label du type
  const getLabel = useCallback(
    (type: string): string => {
      if (getTypeLabel) {
        return getTypeLabel(type);
      }

      switch (type) {
        case "PAGE":
          return "Page Next.js";
        case "COMPONENT":
          return "Composant React";
        case "UTILS":
          return "Utilitaires";
        case "LIB":
          return "Librairie";
        case "STORE":
          return "Store";
        case "HOOK":
          return "Hook React";
        case "DOCUMENT":
          return "Document";
        case "IMAGE":
          return "Image";
        case "VIDEO":
          return "Vidéo";
        case "ARCHIVE":
          return "Archive";
        case "CODE":
          return "Code";
        case "SPECIFICATION":
          return "Spécification";
        case "DESIGN":
          return "Design";
        case "TEST":
          return "Test";
        default:
          return "Autre";
      }
    },
    [getTypeLabel]
  );

  // ✅ Fonction pour formater la taille avec gestion du nullable
  const formatSize = useCallback(
    (bytes: number | null): string => {
      if (formatFileSize) {
        return formatFileSize(bytes);
      }

      if (!bytes || bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    [formatFileSize]
  );

  // ✅ Actions par défaut si non fournies
  const handleDelete = useCallback(
    (file: FileWithRelations) => {
      if (onDelete) {
        onDelete(file);
      } else {
        toast.info(`Suppression de ${file.name} - Action non configurée`);
      }
    },
    [onDelete]
  );

  const handleDownload = useCallback(
    (file: FileWithRelations) => {
      if (onDownload) {
        onDownload(file);
      } else if (file.url) {
        window.open(file.url, "_blank");
      } else {
        toast.error("URL de téléchargement non disponible");
      }
    },
    [onDownload]
  );

  const handleShare = useCallback(
    (file: FileWithRelations) => {
      if (onShare) {
        onShare(file);
      } else {
        navigator.clipboard.writeText(file.url);
        toast.success("URL copiée dans le presse-papiers");
      }
    },
    [onShare]
  );

  const handleDuplicate = useCallback(
    (file: FileWithRelations) => {
      if (onDuplicate) {
        onDuplicate(file);
      } else {
        toast.info(`Duplication de ${file.name} - Action non configurée`);
      }
    },
    [onDuplicate]
  );

  // ✅ Gestion du clic sur une carte
  const handleCardClick = useCallback(
    (file: FileWithRelations) => {
      if (file.isFolder) {
        onFolderNavigate(file.id, file.name);
      } else {
        onEdit(file);
      }
    },
    [onFolderNavigate, onEdit]
  );

  // ✅ Gestion de la sélection
  const handleToggleSelection = useCallback(
    (fileId: string) => {
      if (onToggleSelection) {
        onToggleSelection(fileId);
      }
    },
    [onToggleSelection]
  );

  // ✅ Obtenir le nom d'affichage de l'utilisateur
  const getUserDisplayName = useCallback(
    (user: FileWithRelations["uploader"]): string => {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return user.name || user.email;
    },
    []
  );

  // ✅ Message si aucun fichier
  if (files.length === 0) {
    return (
      <div className="w-full">
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Aucun fichier trouvé
            </h3>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6 max-w-md">
              {currentFolder
                ? "Ce dossier ne contient aucun fichier pour le moment."
                : "Aucun fichier n'a été trouvé dans ce projet."}
            </p>
            <div className="text-xs sm:text-sm text-gray-500 space-y-1 text-center max-w-sm">
              <p>💡 Cliquez sur "Ajouter un fichier" pour commencer</p>
              <p>📁 Vous pouvez créer des dossiers pour organiser</p>
              <p className="hidden sm:block">
                🔧 Supportés: Pages, Composants, Utils, Stores, Hooks...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* Grille responsive des cartes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {files.map((file) => {
            const isSelected = selectedFiles.includes(file.id);
            const childrenCount = file._count?.children || 0;

            return (
              <Card
                key={file.id}
                className={`group relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleCardClick(file)}
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Header avec icône et sélection */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file)}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                          {file.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getLabel(file.type)}
                          </Badge>
                          {file.isFolder && childrenCount > 0 && (
                            <span className="text-xs text-gray-500">
                              {childrenCount} élément
                              {childrenCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Checkbox de sélection */}
                    {onToggleSelection && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelection(file.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>

                  {/* Informations principales */}
                  <div className="space-y-3 mb-4">
                    {/* Description si présente */}
                    {file.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {file.description}
                      </p>
                    )}

                    {/* Métadonnées techniques */}
                    <div className="space-y-2">
                      {/* MimeType et taille */}
                      {!file.isFolder && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          {file.mimeType && (
                            <span className="truncate">{file.mimeType}</span>
                          )}
                          {file.size && (
                            <span className="flex-shrink-0">
                              {formatSize(file.size)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Nom original si différent */}
                      {file.originalName && file.originalName !== file.name && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Original:</span>{" "}
                          {file.originalName}
                        </div>
                      )}

                      {/* Statut public/privé */}
                      <div className="flex items-center gap-2">
                        {file.isPublic ? (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Privé
                          </Badge>
                        )}

                        {file.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{file.version}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs px-2 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 3 && (
                          <span className="text-xs text-gray-500 self-center">
                            +{file.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Relations */}
                  <div className="space-y-2 mb-4">
                    {file.project && (
                      <div className="text-xs text-blue-600">
                        <span className="font-medium">Projet:</span>{" "}
                        {file.project.name}
                      </div>
                    )}
                    {file.feature && (
                      <div className="text-xs text-green-600">
                        <span className="font-medium">Feature:</span>{" "}
                        {file.feature.name}
                      </div>
                    )}
                    {file.userStory && (
                      <div className="text-xs text-purple-600">
                        <span className="font-medium">User Story:</span>{" "}
                        {file.userStory.title}
                      </div>
                    )}
                    {file.task && (
                      <div className="text-xs text-orange-600">
                        <span className="font-medium">Task:</span>{" "}
                        {file.task.title}
                      </div>
                    )}
                    {file.sprint && (
                      <div className="text-xs text-indigo-600">
                        <span className="font-medium">Sprint:</span>{" "}
                        {file.sprint.name}
                        {file.sprint.goal && (
                          <div className="text-gray-500 mt-1">
                            {file.sprint.goal}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer avec auteur et date */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        {file.uploader.image ? (
                          <AvatarImage src={file.uploader.image} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {getUserDisplayName(file.uploader).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600 truncate">
                        {getUserDisplayName(file.uploader)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {format(file.updatedAt, "dd/MM", { locale: fr })}
                    </div>
                  </div>

                  {/* Menu d'actions (visible au hover) */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(file);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>

                        {!file.isFolder && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(file);
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Partager
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(file);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
