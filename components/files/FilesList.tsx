// components/files/FilesList.tsx

/**
 * RÔLE : Gestionnaire d'affichage des métadonnées de fichiers selon le mode sélectionné avec actions CRUD et sélection multiple
 * RESPONSABILITÉS :
 * - Affichage des métadonnées de fichiers (pas de stockage physique) selon viewMode
 * - Gestion des actions CRUD pour référentiel de fichiers (create, edit, delete, view)
 * - Support de la sélection multiple avec selectedFiles et callbacks de gestion
 * - Interface entre la page principale et les composants de vue avec props typées strictement
 * - Support des nouveaux types de fichiers selon schéma Prisma FileType enum mis à jour
 * - Gestion hiérarchique avec navigation parent/enfant pour dossiers
 * - Actions contextuelles selon le type de fichier (voir code, documentation, tests)
 * - Interface responsive moderne compatible avec Next.js 15 et design épuré
 * - Types simplifiés via fichier central types/files.ts avec FileMetadata
 * - Support complet des actions sur sélection multiple avec callbacks optimisés
 *
 * COMPOSANTS UTILISÉS :
 * - Table, TableBody, TableCell, TableHead, TableHeader, TableRow: Composants tableau shadcn/ui
 * - Card, CardContent: Composants de structuration moderne
 * - Button: Composant d'action avec variants et tailles
 * - Badge: Composant d'affichage de type de fichier
 * - Skeleton: Composant de loading state avec animations
 * - ScrollArea: Composant de défilement pour contenu long
 * - DropdownMenu: Menu contextuel pour actions sur fichiers
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useCallback, useMemo, JSX pour gestion optimisée
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Table, Card, Button, Badge, Skeleton components pour UX moderne
 * - Tailwind CSS: Design responsive mobile-first avec classes adaptatives
 * - lucide-react: Icons cohérentes pour tous les types de fichiers et actions
 * - sonner: Toast notifications pour feedback utilisateur temps réel
 *
 * TYPES UTILISÉS :
 * - Types centralisés depuis @/types/files pour cohérence entre composants
 * - FileMetadata avec métadonnées unifiées selon schéma Prisma
 * - Interfaces FilesViewProps standardisées avec signatures corrigées
 * - Support de selectedFiles pour sélection multiple et actions en lot
 */

"use client";

import React, { JSX, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
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
  File,
  Folder,
  FolderOpen,
  RefreshCw,
  AlertTriangle,
  Edit,
  ExternalLink,
  Share2,
  MoreVertical,
  Users,
  Trash2,
  Download,
  Eye,
  Calendar,
  User,
  Hash,
  ChevronRight,
  ChevronDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import des types centralisés pour éviter les conflits
import type { FileMetadata, ViewMode, FilesViewProps } from "@/types/files";

// ✅ Interface mise à jour avec types simplifiés et selectedFiles ajoutée
interface FilesListProps {
  files: FileMetadata[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileMetadata) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  onDelete?: (file: FileMetadata) => void;
  onViewCode?: (file: FileMetadata) => void;
  onShare?: (file: FileMetadata) => void;
  onDuplicate?: (file: FileMetadata) => void;
  isLoading?: boolean;
  error?: string | null;
  selectedFiles?: string[];
  onToggleSelection?: (fileId: string) => void;
}

export default function FilesList({
  files,
  viewMode,
  currentFolder,
  onEdit,
  onRefresh,
  onFolderNavigate,
  onDelete,
  onViewCode,
  onShare,
  onDuplicate,
  isLoading = false,
  error = null,
  selectedFiles = [],
  onToggleSelection,
}: FilesListProps): JSX.Element {
  // États locaux
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // ✅ Fonction pour obtenir l'icône selon le type avec gestion isFolder
  const getFileTypeIcon = useCallback(
    (type: string, isFolder?: boolean): JSX.Element => {
      if (isFolder) {
        return <Folder className="h-4 w-4 text-blue-600" />;
      }

      const iconMap: Record<string, JSX.Element> = {
        PAGE: <FileText className="h-4 w-4 text-purple-600" />,
        COMPONENT: <Package className="h-4 w-4 text-blue-600" />,
        UTILS: <Settings className="h-4 w-4 text-orange-600" />,
        LIB: <Layers className="h-4 w-4 text-indigo-600" />,
        STORE: <Database className="h-4 w-4 text-green-600" />,
        HOOK: <Code2 className="h-4 w-4 text-teal-600" />,
        DOCUMENT: <FileText className="h-4 w-4 text-blue-600" />,
        IMAGE: <Image className="h-4 w-4 text-pink-600" />,
        VIDEO: <Video className="h-4 w-4 text-red-600" />,
        ARCHIVE: <Archive className="h-4 w-4 text-yellow-600" />,
        CODE: <Code2 className="h-4 w-4 text-gray-600" />,
        SPECIFICATION: <FileText className="h-4 w-4 text-cyan-600" />,
        DESIGN: <Paintbrush className="h-4 w-4 text-rose-600" />,
        TEST: <TestTube className="h-4 w-4 text-emerald-600" />,
        OTHER: <File className="h-4 w-4 text-gray-400" />,
      };
      return iconMap[type] || <File className="h-4 w-4 text-gray-400" />;
    },
    []
  );

  // ✅ Fonction pour obtenir le label en français du type
  const getTypeLabel = useCallback((type: string): string => {
    const labelMap: Record<string, string> = {
      PAGE: "Page Next.js",
      COMPONENT: "Composant React",
      UTILS: "Utilitaires",
      LIB: "Librairie",
      STORE: "Store",
      HOOK: "Hook React",
      DOCUMENT: "Document",
      IMAGE: "Image",
      VIDEO: "Vidéo",
      ARCHIVE: "Archive",
      CODE: "Code",
      SPECIFICATION: "Spécification",
      DESIGN: "Design",
      TEST: "Test",
      OTHER: "Autre",
    };
    return labelMap[type] || "Autre";
  }, []);

  // ✅ Fonction pour formater la taille avec gestion du nullable
  const formatFileSize = useCallback((bytes: number | null): string => {
    if (!bytes || bytes === 0) return "N/A";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // ✅ Actions par défaut avec support des métadonnées
  const handleViewCode = useCallback(
    (file: FileMetadata) => {
      if (onViewCode) {
        onViewCode(file);
      } else if (file.url) {
        window.open(file.url, "_blank");
        toast.success(`Ouverture de ${file.name}`);
      } else {
        toast.error("URL non disponible pour ce fichier");
      }
    },
    [onViewCode]
  );

  const handleShare = useCallback(
    (file: FileMetadata) => {
      if (onShare) {
        onShare(file);
      } else if (file.url) {
        navigator.clipboard.writeText(file.url);
        toast.success("URL copiée dans le presse-papiers");
      } else {
        toast.error("URL non disponible pour partage");
      }
    },
    [onShare]
  );

  const handleDelete = useCallback(
    (file: FileMetadata) => {
      if (onDelete) {
        onDelete(file);
      } else {
        toast.info(`Suppression de ${file.name} - Action non configurée`);
      }
    },
    [onDelete]
  );

  // ✅ Gestion de la sélection multiple
  const toggleFileSelection = useCallback(
    (fileId: string) => {
      if (onToggleSelection) {
        onToggleSelection(fileId);
      }
    },
    [onToggleSelection]
  );

  const isFileSelected = useCallback(
    (fileId: string): boolean => {
      return selectedFiles.includes(fileId);
    },
    [selectedFiles]
  );

  // ✅ Gestion des dossiers pliables
  const toggleFolderExpansion = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // ✅ Actions en lot sur sélection multiple
  const handleBulkActions = useCallback(
    (action: string) => {
      if (!selectedFiles.length) return;

      switch (action) {
        case "view":
          selectedFiles.forEach((fileId) => {
            const file = files.find((f) => f.id === fileId);
            if (file) handleViewCode(file);
          });
          break;
        case "delete":
          selectedFiles.forEach((fileId) => {
            const file = files.find((f) => f.id === fileId);
            if (file) handleDelete(file);
          });
          break;
        default:
          toast.info(`Action ${action} sur ${selectedFiles.length} fichier(s)`);
      }
    },
    [selectedFiles, files, handleViewCode, handleDelete]
  );

  // ✅ Statistiques des fichiers
  const fileStats = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        acc.total++;
        if (file.isFolder) {
          acc.folders++;
        } else {
          acc.files++;
        }
        acc.byType[file.type] = (acc.byType[file.type] || 0) + 1;
        return acc;
      },
      {
        total: 0,
        files: 0,
        folders: 0,
        byType: {} as Record<string, number>,
      }
    );
  }, [files]);

  // ✅ Skeleton responsive pour l'état de chargement
  const LoadingSkeleton = useCallback((): JSX.Element => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  // ✅ Message si aucun fichier
  if (files.length === 0 && !isLoading && !error) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
          <Database className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Aucun fichier référencé
          </h3>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6 max-w-md">
            {currentFolder
              ? "Ce dossier ne contient aucune référence de fichier pour le moment."
              : "Aucune référence de fichier n'a été trouvée dans ce projet."}
          </p>
          <div className="text-xs sm:text-sm text-gray-500 space-y-1 text-center max-w-sm">
            <p>💡 Cliquez sur "Référencer un fichier" pour commencer</p>
            <p>
              📁 Vous pouvez créer des dossiers pour organiser vos références
            </p>
            <p className="hidden sm:block">
              🔧 Types supportés: Pages, Composants, Utils, Stores, Hooks...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ Affichage des erreurs
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
          <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-sm text-red-600 text-center mb-4">{error}</p>
          <Button
            onClick={onRefresh}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ✅ Skeleton pendant le chargement
  if (isLoading && files.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* ✅ Barre de sélection multiple */}
      {selectedFiles.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {selectedFiles.length} sélectionné
                    {selectedFiles.length > 1 ? "s" : ""}
                  </Badge>
                  <p className="text-xs text-blue-600 mt-1">
                    Actions en lot disponibles
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkActions("view")}
                  className="text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Voir</span>
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkActions("delete")}
                  className="text-xs sm:text-sm"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Statistiques avec sélection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 px-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Database className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>
              {fileStats.total} référence{fileStats.total > 1 ? "s" : ""}
            </span>
            {selectedFiles.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedFiles.length} sélectionné
                {selectedFiles.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {fileStats.folders > 0 && (
            <div className="flex items-center space-x-1">
              <Folder className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span>
                {fileStats.folders} dossier{fileStats.folders > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {fileStats.files > 0 && (
            <div className="flex items-center space-x-1">
              <File className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
              <span>
                {fileStats.files} fichier{fileStats.files > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Types les plus fréquents */}
        {Object.keys(fileStats.byType).length > 0 && (
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Types:
            </span>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {Object.entries(fileStats.byType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center space-x-1">
                    {getFileTypeIcon(type)}
                    <span className="text-xs font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          disabled={isLoading}
          className="ml-auto sm:ml-0"
        >
          <RefreshCw
            className={`h-3 w-3 sm:h-4 sm:w-4 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
          <span className="hidden sm:inline ml-2">Actualiser</span>
        </Button>
      </div>

      {/* ✅ Contenu principal - Table responsive */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedFiles.length === files.length &&
                        files.length > 0
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          files.forEach((file) => {
                            if (!selectedFiles.includes(file.id)) {
                              toggleFileSelection(file.id);
                            }
                          });
                        } else {
                          selectedFiles.forEach((fileId) =>
                            toggleFileSelection(fileId)
                          );
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">
                    URL/Chemin
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Modifié
                  </TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow
                    key={file.id}
                    className={isFileSelected(file.id) ? "bg-blue-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isFileSelected(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {getFileTypeIcon(file.type, file.isFolder)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {file.isFolder && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-4 w-4"
                            onClick={() => toggleFolderExpansion(file.id)}
                          >
                            {expandedFolders.has(file.id) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <div
                          className={
                            file.isFolder
                              ? "cursor-pointer hover:text-blue-600"
                              : ""
                          }
                          onClick={() =>
                            file.isFolder &&
                            onFolderNavigate(file.id, file.name)
                          }
                        >
                          <div className="font-medium">{file.name}</div>
                          {file.originalName &&
                            file.originalName !== file.name && (
                              <div className="text-sm text-gray-500">
                                Origine: {file.originalName}
                              </div>
                            )}
                          {file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {file.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <Hash className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {file.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{file.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(file.type)}
                      </Badge>
                      {file.version > 1 && (
                        <Badge variant="outline" className="text-xs ml-1">
                          v{file.version}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-xs truncate text-sm">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {file.url}
                        </a>
                      </div>
                      {file.path && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {file.path}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="max-w-xs truncate text-sm text-gray-600">
                        {file.description || (
                          <span className="text-gray-400 italic">
                            Aucune description
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(file.updatedAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                        {file.uploader && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>
                              {file.uploader.name || file.uploader.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCode(file)}
                          title="Voir le fichier"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(file)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(file)}>
                              <Share2 className="h-4 w-4 mr-2" />
                              Partager
                            </DropdownMenuItem>
                            {onDuplicate && (
                              <DropdownMenuItem
                                onClick={() => onDuplicate(file)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Dupliquer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
