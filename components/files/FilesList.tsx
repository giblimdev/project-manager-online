// components/files/FilesList.tsx

/**
 * RÔLE : Gestionnaire d'affichage des fichiers selon le mode sélectionné avec actions CRUD
 * RESPONSABILITÉS :
 * - Sélection du composant de vue approprié (FilesViewList, FilesViewCard, FilesViewBranch)
 * - Transmission des props communes vers les composants de vue spécialisés avec viewMode
 * - Gestion des actions CRUD communes (create, edit, delete, up, down) pour tous les modes
 * - Interface entre la page principale et les composants de vue avec props typées strictement
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 * - Gestion du mimeType nullable selon le nouveau schéma Prisma via types centralisés
 * - Interface responsive moderne compatible avec la page mise à jour
 * - Types unifiés via fichier central types/files.ts
 * - Correction des signatures de callback pour navigation hiérarchique
 *
 * COMPOSANTS UTILISÉS :
 * - FilesViewList: Vue en mode tableau avec colonnes détaillées et responsivité
 * - FilesViewCard: Vue en mode grille avec cartes visuelles responsive
 * - FilesViewBranch: Vue en mode arbre hiérarchique avec navigation
 * - Skeleton: Composant de loading state pendant les opérations
 * - Card, CardContent, ScrollArea: Composants UI pour structuration et design moderne
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useCallback, useMemo, JSX pour gestion optimisée des états
 * - Next.js 15 client component avec TypeScript strict mode
 * - Dynamic imports pour optimisation des performances (lazy loading des vues)
 * - shadcn/ui: Skeleton, Card, ScrollArea components pour UX moderne
 * - Tailwind CSS: Design responsive mobile-first avec classes adaptatives
 * - lucide-react: Icons cohérentes pour tous les types de fichiers et actions
 *
 * TYPES UTILISÉS :
 * - Types centralisés depuis @/types/files pour cohérence entre composants
 * - FileWithRelations avec mimeType nullable unifié
 * - Interfaces FilesViewProps standardisées avec signatures corrigées
 */

"use client";

import React, {
  JSX,
  lazy,
  Suspense,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Grid,
  List,
  GitBranch,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
  Download,
  Share2,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// ✅ Import des types centralisés pour éviter les conflits
import type {
  FileWithRelations,
  ViewMode,
  FilesViewProps,
  FileStats,
} from "@/types/files";

// Import dynamique des composants de vue
const FilesViewList = lazy(() => import("./views/FilesViewList"));
const FilesViewCard = lazy(() => import("./views/FilesViewCard"));
const FilesViewBranch = lazy(() => import("./views/FilesViewBranch"));

// ✅ Interface mise à jour avec types centralisés et signatures corrigées
interface FilesListProps {
  files: FileWithRelations[]; // ✅ Type unifié via types/files.ts
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void; // ✅ Signature correcte
  onDelete?: (file: FileWithRelations) => void;
  onDownload?: (file: FileWithRelations) => void;
  onShare?: (file: FileWithRelations) => void;
  onDuplicate?: (file: FileWithRelations) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function FilesList({
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
  isLoading = false,
  error = null,
}: FilesListProps): JSX.Element {
  // États locaux
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // ✅ Fonction pour obtenir l'icône selon le type avec gestion isFolder
  const getFileTypeIcon = useCallback(
    (type: string, isFolder?: boolean): JSX.Element => {
      if (isFolder) {
        return <Folder className="h-4 w-4 text-blue-600" />;
      }

      switch (type) {
        case "PAGE":
          return <FileText className="h-4 w-4 text-purple-600" />;
        case "COMPONENT":
          return <Package className="h-4 w-4 text-blue-600" />;
        case "UTILS":
          return <Settings className="h-4 w-4 text-orange-600" />;
        case "LIB":
          return <Layers className="h-4 w-4 text-indigo-600" />;
        case "STORE":
          return <Database className="h-4 w-4 text-green-600" />;
        case "HOOK":
          return <Code2 className="h-4 w-4 text-teal-600" />;
        case "DOCUMENT":
          return <FileText className="h-4 w-4 text-blue-600" />;
        case "IMAGE":
          return <Image className="h-4 w-4 text-pink-600" />;
        case "VIDEO":
          return <Video className="h-4 w-4 text-red-600" />;
        case "ARCHIVE":
          return <Archive className="h-4 w-4 text-yellow-600" />;
        case "CODE":
          return <Code2 className="h-4 w-4 text-gray-600" />;
        case "SPECIFICATION":
          return <FileText className="h-4 w-4 text-cyan-600" />;
        case "DESIGN":
          return <Paintbrush className="h-4 w-4 text-rose-600" />;
        case "TEST":
          return <TestTube className="h-4 w-4 text-emerald-600" />;
        default:
          return <File className="h-4 w-4 text-gray-400" />;
      }
    },
    []
  );

  // ✅ Fonction pour obtenir le label en français du type
  const getTypeLabel = useCallback((type: string): string => {
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
  }, []);

  // ✅ Fonction pour formater la taille avec gestion du nullable
  const formatFileSize = useCallback((bytes: number | null): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // ✅ Actions par défaut si pas fournies
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

  // ✅ CORRECTION: Fonction qui adapte la signature des callbacks
  const handleFolderNavigate = useCallback(
    (file: FileWithRelations) => {
      if (file.isFolder) {
        // ✅ Appel avec la signature correcte (folderId, folderName)
        onFolderNavigate(file.id, file.name);
      } else {
        onEdit(file);
      }
    },
    [onFolderNavigate, onEdit]
  );

  // ✅ Gestion de la sélection multiple
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  // ✅ Skeleton responsive selon le mode
  const ViewSkeleton = useCallback((): JSX.Element => {
    if (viewMode === "list") {
      return (
        <div className="space-y-3 sm:space-y-4">
          <div className="hidden sm:grid grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4 px-2 sm:px-4 py-2 bg-gray-50 rounded-lg">
            <Skeleton className="h-3 sm:h-4 w-8 sm:w-12" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
            <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
            <Skeleton className="h-3 sm:h-4 w-14 sm:w-20" />
            <Skeleton className="h-3 sm:h-4 w-12 sm:w-18 hidden lg:block" />
            <Skeleton className="h-3 sm:h-4 w-12 sm:w-18 hidden lg:block" />
            <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
            <Skeleton className="h-3 sm:h-4 w-12 sm:w-16" />
          </div>

          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 border-b"
            >
              <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
                <Skeleton className="h-3 w-3 sm:h-4 sm:w-4" />
                <Skeleton className="h-3 sm:h-4 w-20 sm:w-32" />
              </div>
              <Skeleton className="h-3 sm:h-4 w-8 sm:w-12 hidden sm:block" />
              <div className="flex items-center space-x-2  sm:flex">
                <Skeleton className="h-4 w-4 sm:h-6 sm:w-6 rounded-full" />
                <Skeleton className="h-3 sm:h-4 w-12 sm:w-20" />
              </div>
              <Skeleton className="h-3 sm:h-4 w-10 sm:w-16 hidden lg:block" />
              <Skeleton className="h-3 sm:h-4 w-10 sm:w-16 hidden lg:block" />
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-28 hidden sm:block" />
              <div className="flex items-center space-x-1">
                <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
                <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (viewMode === "card") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {[...Array(12)].map((_, i) => (
            <Card key={i} className="h-40 sm:h-48">
              <CardContent className="p-3 sm:p-6">
                <div className="space-y-2 sm:space-y-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Skeleton className="h-6 w-6 sm:h-8 sm:w-8" />
                    <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
                  </div>
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-3/4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Skeleton className="h-4 w-4 sm:h-6 sm:w-6 rounded-full" />
                      <Skeleton className="h-2 sm:h-3 w-10 sm:w-16" />
                    </div>
                    <Skeleton className="h-2 sm:h-3 w-8 sm:w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-1 sm:space-y-2">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-1 sm:py-2"
          >
            <div
              className="flex items-center space-x-1 sm:space-x-2"
              style={{ paddingLeft: `${(i % 3) * 12}px` }}
            >
              <Skeleton className="h-3 w-3 sm:h-4 sm:w-4" />
              <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
            </div>
            <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
              <Skeleton className="h-2 sm:h-3 w-10 sm:w-16" />
              <Skeleton className="h-2 sm:h-3 w-8 sm:w-12" />
              <div className="flex space-x-1">
                <Skeleton className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [viewMode]);

  // ✅ Props communes avec types unifiés et callbacks corrigés
  const commonProps = useMemo(
    (): FilesViewProps => ({
      files,
      viewMode,
      currentFolder,
      onEdit,
      onRefresh,
      onFolderNavigate, // ✅ Callback original avec la bonne signature
      onDelete: handleDelete,
      onDownload: handleDownload,
      onShare: handleShare,
      onDuplicate,
      selectedFiles,
      onToggleSelection: toggleFileSelection,
      getFileTypeIcon,
      getTypeLabel,
      formatFileSize,
    }),
    [
      files,
      viewMode,
      currentFolder,
      onEdit,
      onRefresh,
      onFolderNavigate, // ✅ Signature correcte passée aux composants de vue
      handleDelete,
      handleDownload,
      handleShare,
      onDuplicate,
      selectedFiles,
      toggleFileSelection,
      getFileTypeIcon,
      getTypeLabel,
      formatFileSize,
    ]
  );

  // ✅ Statistiques des fichiers avec gestion du size nullable
  const fileStats = useMemo((): FileStats => {
    const stats = files.reduce(
      (acc, file) => {
        acc.total++;
        if (file.isFolder) {
          acc.folders++;
        } else {
          acc.files++;
        }
        acc.byType[file.type] = (acc.byType[file.type] || 0) + 1;

        if (!file.isFolder && file.size) {
          acc.totalSize += file.size;
        }

        return acc;
      },
      {
        total: 0,
        files: 0,
        folders: 0,
        totalSize: 0,
        byType: {} as Record<string, number>,
      }
    );

    return stats;
  }, [files]);

  // ✅ Sélection du composant de vue avec gestion d'erreur
  const renderView = useCallback((): JSX.Element => {
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

    switch (viewMode) {
      case "list":
        return (
          <Suspense fallback={<ViewSkeleton />}>
            <FilesViewList {...commonProps} />
          </Suspense>
        );

      case "card":
        return (
          <Suspense fallback={<ViewSkeleton />}>
            <FilesViewCard {...commonProps} />
          </Suspense>
        );

      case "branch":
        return (
          <Suspense fallback={<ViewSkeleton />}>
            <FilesViewBranch {...commonProps} />
          </Suspense>
        );

      default:
        console.warn(
          "Mode d'affichage invalide:",
          viewMode,
          "- Fallback vers 'list'"
        );
        return (
          <Suspense fallback={<ViewSkeleton />}>
            <FilesViewList {...commonProps} />
          </Suspense>
        );
    }
  }, [error, onRefresh, viewMode, commonProps, ViewSkeleton]);

  // ✅ Message si aucun fichier
  if (files.length === 0 && !isLoading && !error) {
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
              <p>
                📁 Vous pouvez créer des dossiers pour organiser vos fichiers
              </p>
              <p className="hidden sm:block">
                🔧 Types supportés: Pages, Composants, Utils, Stores, Hooks...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Barre de sélection multiple */}
      {selectedFiles.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {selectedFiles.length} sélectionné
                  {selectedFiles.length > 1 ? "s" : ""}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedFiles([])}
                  className="text-xs sm:text-sm"
                >
                  Désélectionner tout
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    selectedFiles.forEach((id) => {
                      const file = files.find((f) => f.id === id);
                      if (file) handleDownload(file);
                    })
                  }
                  className="text-xs sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Télécharger</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    selectedFiles.forEach((id) => {
                      const file = files.find((f) => f.id === id);
                      if (file) handleDelete(file);
                    })
                  }
                  className="text-xs sm:text-sm"
                >
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Supprimer</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 px-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {viewMode === "list" && <List className="h-3 w-3 sm:h-4 sm:w-4" />}
            {viewMode === "card" && <Grid className="h-3 w-3 sm:h-4 sm:w-4" />}
            {viewMode === "branch" && (
              <GitBranch className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span>
              {fileStats.total} élément{fileStats.total > 1 ? "s" : ""}
            </span>
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

          {fileStats.totalSize > 0 && (
            <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
              <span>Taille: {formatFileSize(fileStats.totalSize)}</span>
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

      {/* Contenu principal */}
      <div className="w-full">
        {isLoading && files.length === 0 ? (
          <ViewSkeleton />
        ) : (
          <ScrollArea className="w-full">{renderView()}</ScrollArea>
        )}
      </div>
    </div>
  );
}
