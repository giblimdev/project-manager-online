// components/files/FileList.tsx

/**
 * RÔLE : Composant principal de liste des fichiers avec boutons d'action et vues multiples
 * RESPONSABILITÉS :
 * - Affichage des fichiers selon le mode sélectionné (list/card/branch)
 * - Bouton d'ajout de fichiers avec accès rapide
 * - Actions rapides par fichier : edit, delete, up, down (réorganisation)
 * - Gestion des états loading, empty et error avec feedback visuel
 * - Intégration des trois vues : FilesViewList, FilesViewCard, FilesViewBranch
 * - Support de la sélection multiple avec actions en lot
 * - Navigation hiérarchique dans l'arborescence des dossiers
 * - Gestion responsive avec adaptation mobile/desktop
 *
 * COMPOSANTS UTILISÉS :
 * - FilesViewList: Vue tableau détaillée avec colonnes triables
 * - FilesViewCard: Vue grille moderne avec cartes visuelles
 * - FilesViewBranch: Vue arborescente hiérarchique avec navigation
 * - Button: Boutons d'action avec variants et states
 * - Card, CardContent: Conteneurs structurants
 * - Skeleton: Composants de chargement animés
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useCallback, useMemo, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Button, Card, Skeleton components avec design cohérent
 * - lucide-react: Icons modernes pour actions et états
 * - Tailwind CSS: Design responsive avec animations et hover effects
 * - sonner: Toast notifications pour feedback utilisateur temps réel
 */

"use client";

import React, { JSX, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  FileText,
  Folder,
  Loader2,
  Search,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import des vues spécialisées
import FilesViewList from "@/components/files/views/FilesViewList";
import FilesViewCard from "@/components/files/views/FilesViewCard";
import FilesViewBranch from "@/components/files/views/FilesViewBranch";

// ✅ Import des types centralisés
import type {
  FileWithRelations,
  ViewMode,
  FilesViewProps,
} from "@/types/files";

// Interface pour les props du composant
interface FileListProps {
  files: FileWithRelations[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onDelete?: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  selectedFiles?: string[];
  onToggleSelection?: (fileId: string) => void;
  isLoading?: boolean;
  onCreateNew?: () => void;
}

export default function FileList({
  files,
  viewMode,
  currentFolder,
  onEdit,
  onDelete,
  onRefresh,
  onFolderNavigate,
  selectedFiles = [],
  onToggleSelection,
  isLoading = false,
  onCreateNew,
}: FileListProps): JSX.Element {
  // ✅ État local pour la réorganisation
  const [isReorganizing, setIsReorganizing] = useState(false);

  // ✅ Fonction pour déplacer un fichier vers le haut
  const handleMoveUp = useCallback(
    async (file: FileWithRelations) => {
      if (isReorganizing) return;

      setIsReorganizing(true);
      try {
        const response = await fetch(`/api/files/${file.id}/move`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            direction: "up",
            currentFolder,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Erreur lors du déplacement");
        }

        toast.success("Élément déplacé vers le haut");
        onRefresh();
      } catch (error) {
        console.error("💥 Erreur lors du déplacement:", error);
        toast.error("Erreur lors du déplacement");
      } finally {
        setIsReorganizing(false);
      }
    },
    [currentFolder, onRefresh, isReorganizing]
  );

  // ✅ Fonction pour déplacer un fichier vers le bas
  const handleMoveDown = useCallback(
    async (file: FileWithRelations) => {
      if (isReorganizing) return;

      setIsReorganizing(true);
      try {
        const response = await fetch(`/api/files/${file.id}/move`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            direction: "down",
            currentFolder,
          }),
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Erreur lors du déplacement");
        }

        toast.success("Élément déplacé vers le bas");
        onRefresh();
      } catch (error) {
        console.error("💥 Erreur lors du déplacement:", error);
        toast.error("Erreur lors du déplacement");
      } finally {
        setIsReorganizing(false);
      }
    },
    [currentFolder, onRefresh, isReorganizing]
  );

  // ✅ Fonction pour obtenir l'icône du type de fichier
  const getFileTypeIcon = useCallback(
    (type: string, isFolder?: boolean): JSX.Element => {
      if (isFolder) {
        return <Folder className="h-4 w-4 text-blue-500" />;
      }

      const iconProps = "h-4 w-4";

      switch (type) {
        case "PAGE":
          return <FileText className={`${iconProps} text-blue-600`} />;
        case "COMPONENT":
          return <FileText className={`${iconProps} text-green-600`} />;
        case "UTILS":
          return <FileText className={`${iconProps} text-orange-600`} />;
        case "LIB":
          return <FileText className={`${iconProps} text-purple-600`} />;
        case "STORE":
          return <FileText className={`${iconProps} text-red-600`} />;
        case "HOOK":
          return <FileText className={`${iconProps} text-pink-600`} />;
        case "ENV":
          return <FileText className={`${iconProps} text-yellow-600`} />;
        case "SYSTEM":
          return <FileText className={`${iconProps} text-gray-600`} />;
        case "TEST":
          return <FileText className={`${iconProps} text-indigo-600`} />;
        default:
          return <FileText className={`${iconProps} text-gray-500`} />;
      }
    },
    []
  );

  // ✅ Fonction pour obtenir le label du type
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
      case "ENV":
        return "Environment";
      case "SYSTEM":
        return "Système";
      case "TEST":
        return "Test";
      default:
        return "Autre";
    }
  }, []);

  // ✅ Fonction pour formater la taille des fichiers
  const formatFileSize = useCallback((bytes: number | null): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // ✅ Actions étendues avec boutons up/down
  const extendedActions = useMemo(() => {
    return {
      onEdit,
      onDelete,
      onMoveUp: handleMoveUp,
      onMoveDown: handleMoveDown,
      getFileTypeIcon,
      getTypeLabel,
      formatFileSize,
    };
  }, [
    onEdit,
    onDelete,
    handleMoveUp,
    handleMoveDown,
    getFileTypeIcon,
    getTypeLabel,
    formatFileSize,
  ]);

  // ✅ Props communes pour toutes les vues
  const commonProps: FilesViewProps = {
    files,
    viewMode,
    currentFolder,
    onRefresh,
    onFolderNavigate,
    selectedFiles,
    onToggleSelection,
    ...extendedActions,
  };

  // ✅ Composant de chargement
  const LoadingSkeleton = (): JSX.Element => {
    const skeletonCount = viewMode === "card" ? 6 : 5;

    return (
      <div className="space-y-4">
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ✅ Barre d'outils avec bouton d'ajout et actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentFolder ? "Contenu du dossier" : "Fichiers du projet"}
            </h2>
            <div className="text-sm text-gray-500">
              {files.length} élément{files.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bouton d'actualisation */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>

            {/* ✅ Bouton principal d'ajout de fichiers */}
            <Button
              onClick={onCreateNew}
              className="shadow-sm"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une référence
            </Button>
          </div>
        </div>

        {/* ✅ Indicateur de sélection multiple */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="text-blue-700">
                {selectedFiles.length} fichier
                {selectedFiles.length > 1 ? "s" : ""} sélectionné
                {selectedFiles.length > 1 ? "s" : ""}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    selectedFiles.forEach(() => onToggleSelection?.(""))
                  }
                >
                  Désélectionner tout
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ✅ Affichage conditionnel selon l'état */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : files.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentFolder ? "Dossier vide" : "Aucune référence de fichier"}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentFolder
                ? "Ce dossier ne contient aucune référence pour le moment."
                : "Commencez par ajouter des références de fichiers à votre projet."}
            </p>
            <Button onClick={onCreateNew} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première référence
            </Button>
          </div>
        </Card>
      ) : (
        // ✅ Rendu conditionnel selon le mode de vue
        <>
          {viewMode === "list" && <FilesViewList {...commonProps} />}
          {viewMode === "card" && <FilesViewCard {...commonProps} />}
          {viewMode === "branch" && <FilesViewBranch {...commonProps} />}
        </>
      )}

      {/* ✅ Indicateur de réorganisation */}
      {isReorganizing && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center text-yellow-700">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Réorganisation en cours...
          </div>
        </Card>
      )}
    </div>
  );
}
