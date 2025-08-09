// components/files/views/FilesViewList.tsx

/**
 * RÔLE : Vue tableau des fichiers avec colonnes détaillées et actions en ligne
 * RESPONSABILITÉS :
 * - Affichage en tableau responsive avec toutes les propriétés des fichiers
 * - Colonnes : nom, type, taille, créateur, dates, relations, actions
 * - Actions par ligne : edit, delete, download, share avec boutons compacts
 * - Gestion des dossiers avec navigation et icônes différenciées
 * - Tri visuel par colonnes avec indicateurs d'état
 * - Support D&D préparé pour réorganisation future des lignes
 * - Responsive design avec colonnes masquables sur mobile
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 * - Gestion du mimeType nullable selon le nouveau schéma Prisma
 * - Types unifiés via fichier central types/files.ts
 *
 * COMPOSANTS UTILISÉS :
 * - Table: Composant tableau shadcn/ui avec styling moderne
 * - Button: Composants boutons pour les actions avec variants
 * - Badge: Affichage des types, statuts et propriétés
 * - Avatar: Affichage des créateurs avec fallback
 * - Tooltip: Info-bulles pour les actions et métadonnées
 * - Checkbox: Sélection multiple des éléments
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useCallback, useMemo, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Table, Button, Badge, Avatar, Tooltip components
 * - lucide-react: Icons pour types de fichiers, actions et navigation
 * - Tailwind CSS: Styling responsive avec hover effects et transitions
 * - date-fns: Formatage des dates avec locale française
 * - sonner: Toast notifications pour feedback utilisateur
 *
 * PROPS reçues de FilesList :
 * - files: Liste des fichiers avec relations complètes selon types/files.ts
 * - viewMode: Mode d'affichage ("list" pour cette vue)
 * - currentFolder: ID du dossier courant
 * - onEdit: Callback d'édition
 * - onRefresh: Callback de rafraîchissement
 * - onFolderNavigate: Callback de navigation
 * - Actions supplémentaires: onDelete, onDownload, onShare, onDuplicate
 */

"use client";

import React, { JSX, useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  User,
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ✅ Import des types centralisés pour éviter les conflits
import type {
  FileWithRelations,
  ViewMode,
  FilesViewProps,
  SortBy,
  SortOrder,
} from "@/types/files";

// Interface pour les props du composant
interface FilesViewListProps extends FilesViewProps {
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

// Type pour le tri local
type SortConfig = {
  key: SortBy | null;
  direction: SortOrder;
};

export default function FilesViewList({
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
}: FilesViewListProps): JSX.Element {
  // État local pour le tri
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  // ✅ Fonction pour obtenir l'icône du type avec gestion des dossiers
  const getFileIcon = useCallback(
    (file: FileWithRelations, size: "sm" | "md" = "sm"): JSX.Element => {
      const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

      if (getFileTypeIcon) {
        return getFileTypeIcon(file.type, file.isFolder);
      }

      if (file.isFolder) {
        return <Folder className={`${sizeClass} text-blue-600`} />;
      }

      switch (file.type) {
        case "PAGE":
          return <FileText className={`${sizeClass} text-purple-600`} />;
        case "COMPONENT":
          return <Package className={`${sizeClass} text-blue-600`} />;
        case "UTILS":
          return <Settings className={`${sizeClass} text-orange-600`} />;
        case "LIB":
          return <Layers className={`${sizeClass} text-indigo-600`} />;
        case "STORE":
          return <Database className={`${sizeClass} text-green-600`} />;
        case "HOOK":
          return <Code2 className={`${sizeClass} text-teal-600`} />;
        case "DOCUMENT":
          return <FileText className={`${sizeClass} text-blue-600`} />;
        case "IMAGE":
          return <Image className={`${sizeClass} text-pink-600`} />;
        case "VIDEO":
          return <Video className={`${sizeClass} text-red-600`} />;
        case "ARCHIVE":
          return <Archive className={`${sizeClass} text-yellow-600`} />;
        case "CODE":
          return <Code2 className={`${sizeClass} text-gray-600`} />;
        case "SPECIFICATION":
          return <FileText className={`${sizeClass} text-cyan-600`} />;
        case "DESIGN":
          return <Paintbrush className={`${sizeClass} text-rose-600`} />;
        case "TEST":
          return <TestTube className={`${sizeClass} text-emerald-600`} />;
        default:
          return <File className={`${sizeClass} text-gray-400`} />;
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
          return "Page";
        case "COMPONENT":
          return "Composant";
        case "UTILS":
          return "Utils";
        case "LIB":
          return "Lib";
        case "STORE":
          return "Store";
        case "HOOK":
          return "Hook";
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
          return "Spec";
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
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    [formatFileSize]
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

  // ✅ Gestion du tri
  const handleSort = useCallback((key: SortBy) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // ✅ Tri des fichiers
  const sortedFiles = useMemo(() => {
    if (!sortConfig.key) return files;

    return [...files].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "size":
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case "date":
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case "uploader":
          aValue = getUserDisplayName(a.uploader).toLowerCase();
          bValue = getUserDisplayName(b.uploader).toLowerCase();
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });
  }, [files, sortConfig, getUserDisplayName]);

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

  // ✅ Gestion du clic sur une ligne
  const handleRowClick = useCallback(
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

  // ✅ Sélection de tous les fichiers
  const handleSelectAll = useCallback(() => {
    if (!onToggleSelection) return;

    const allSelected = files.every((f) => selectedFiles.includes(f.id));
    files.forEach((f) => {
      if (allSelected && selectedFiles.includes(f.id)) {
        onToggleSelection(f.id);
      } else if (!allSelected && !selectedFiles.includes(f.id)) {
        onToggleSelection(f.id);
      }
    });
  }, [files, selectedFiles, onToggleSelection]);

  // ✅ Composant pour l'en-tête de colonne avec tri
  const SortableHeader = useCallback(
    ({
      sortKey,
      children,
      className = "",
    }: {
      sortKey: SortBy;
      children: React.ReactNode;
      className?: string;
    }) => (
      <TableHead className={className}>
        <Button
          variant="ghost"
          className="h-auto p-0 font-semibold hover:bg-transparent"
          onClick={() => handleSort(sortKey)}
        >
          <div className="flex items-center space-x-1">
            <span>{children}</span>
            {sortConfig.key === sortKey ? (
              sortConfig.direction === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            )}
          </div>
        </Button>
      </TableHead>
    ),
    [sortConfig, handleSort]
  );

  // ✅ Message si aucun fichier
  if (files.length === 0) {
    return (
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Aucun fichier dans ce dossier
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Cliquez sur "Ajouter un fichier" pour commencer
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                {/* Sélection globale */}
                {onToggleSelection && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        files.length > 0 &&
                        files.every((f) => selectedFiles.includes(f.id))
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableHead>
                )}

                {/* Colonnes triables */}
                <SortableHeader sortKey="name" className="min-w-[200px]">
                  Nom
                </SortableHeader>

                <SortableHeader sortKey="type" className="hidden sm:table-cell">
                  Type
                </SortableHeader>

                <SortableHeader sortKey="size" className="hidden md:table-cell">
                  Taille
                </SortableHeader>

                <SortableHeader
                  sortKey="uploader"
                  className="hidden lg:table-cell"
                >
                  Créateur
                </SortableHeader>

                <SortableHeader sortKey="date" className="hidden lg:table-cell">
                  Modifié
                </SortableHeader>

                <TableHead className="hidden xl:table-cell">
                  Relations
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedFiles.map((file, index) => {
                const isSelected = selectedFiles.includes(file.id);

                return (
                  <TableRow
                    key={file.id}
                    className={`group hover:bg-gray-50/80 transition-colors cursor-pointer ${
                      isSelected ? "bg-blue-50 border-blue-200" : ""
                    }`}
                    onClick={() => handleRowClick(file)}
                  >
                    {/* Sélection */}
                    {onToggleSelection && (
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelection(file.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}

                    {/* Nom avec icône */}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {file.name}
                          </div>

                          {/* Badges et informations */}
                          <div className="flex items-center space-x-2 mt-1">
                            {file.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            )}

                            {file.version > 1 && (
                              <Badge variant="outline" className="text-xs">
                                v{file.version}
                              </Badge>
                            )}

                            {file.isFolder && (
                              <Badge variant="outline" className="text-xs">
                                Dossier
                              </Badge>
                            )}
                          </div>

                          {/* Description (mobile) */}
                          {file.description && (
                            <div className="text-xs text-gray-500 mt-1 sm:hidden truncate">
                              {file.description}
                            </div>
                          )}

                          {/* Tags (mobile) */}
                          {file.tags.length > 0 && (
                            <div className="sm:hidden mt-1">
                              <div className="text-xs text-gray-500 truncate">
                                {file.tags.slice(0, 2).join(", ")}
                                {file.tags.length > 2 &&
                                  ` +${file.tags.length - 2}`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {getLabel(file.type)}
                        </Badge>

                        {/* MimeType pour les nouveaux types */}
                        {file.mimeType && !file.isFolder && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-xs text-blue-600 truncate max-w-[100px]">
                                  {file.mimeType.split("/").pop()}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{file.mimeType}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>

                    {/* Taille */}
                    <TableCell className="hidden md:table-cell">
                      {file.isFolder ? (
                        <div className="text-sm text-gray-600">
                          {file._count?.children || 0} éléments
                        </div>
                      ) : (
                        <div className="text-sm">
                          {formatSize(file.size)}
                          {/* Affichage du nombre de versions si applicable */}
                          {file._count?.versions &&
                            file._count.versions > 1 && (
                              <div className="text-xs text-gray-500">
                                {file._count.versions} versions
                              </div>
                            )}
                        </div>
                      )}
                    </TableCell>

                    {/* Créateur */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          {file.uploader.image ? (
                            <AvatarImage src={file.uploader.image} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {getUserDisplayName(file.uploader).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {getUserDisplayName(file.uploader)}
                          </div>
                          {file.uploader.username && (
                            <div className="text-xs text-gray-500">
                              @{file.uploader.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Date de modification */}
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {format(file.updatedAt, "dd/MM/yyyy", { locale: fr })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(file.updatedAt, "HH:mm", { locale: fr })}
                      </div>
                    </TableCell>

                    {/* Relations */}
                    <TableCell className="hidden xl:table-cell">
                      <div className="space-y-1">
                        {file.project && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  {file.project.key}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-semibold">
                                    Projet: {file.project.name}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {file.feature && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  F: {file.feature.name.substring(0, 10)}
                                  {file.feature.name.length > 10 && "..."}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-semibold">
                                    Feature: {file.feature.name}
                                  </p>
                                  {file.feature.description && (
                                    <p className="text-sm">
                                      {file.feature.description}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {file.userStory && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  US: {file.userStory.title.substring(0, 10)}
                                  {file.userStory.title.length > 10 && "..."}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">
                                  User Story: {file.userStory.title}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {file.task && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  T: {file.task.title.substring(0, 10)}
                                  {file.task.title.length > 10 && "..."}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-semibold">
                                  Task: {file.task.title}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {file.sprint && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  S: {file.sprint.name.substring(0, 10)}
                                  {file.sprint.name.length > 10 && "..."}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div>
                                  <p className="font-semibold">
                                    Sprint: {file.sprint.name}
                                  </p>
                                  {file.sprint.goal && (
                                    <p className="text-sm">
                                      {file.sprint.goal}
                                    </p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
