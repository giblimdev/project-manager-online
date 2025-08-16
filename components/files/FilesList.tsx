// @/components/files/FilesList.tsx

"use client";

import React, { JSX, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Loader2, 
  FileText, 
  Folder, 
  Package, 
  Settings, 
  Layers, 
  Database, 
  Code2, 
  TestTube,
  Globe,
  Lock
} from "lucide-react";
import { toast } from "sonner";

// Import des types centralisés
import type { FileWithRelations, ViewMode, SortBy, SortOrder } from "@/types/files";
import { FileType } from "@/lib/generated/prisma/client";
// Import des vues spécialisées
import FilesViewList from "@/components/files/views/FilesViewList";
import FilesViewCard from "@/components/files/views/FilesViewCard";
import FilesViewBranch from "@/components/files/views/FilesViewBranch";

// ✅ Interface stricte pour les props reçues du parent (page.tsx)
export interface FileListProps {
  files: FileWithRelations[];
  viewMode: ViewMode; 
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onDelete: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

// ✅ Interface pour la gestion de la réorganisation
interface ReorganizationState {
  isReorganizing: boolean;
  processingFileId: string | null;
}

export default function FilesList({
  files,
  viewMode,
  currentFolder,
  onEdit,
  onDelete,
  onRefresh,
  onFolderNavigate,
  selectedFiles,
  onToggleSelection,
  onCreateNew,
  isLoading,
}: FileListProps): JSX.Element {
  // ✅ État de réorganisation
  const [reorganizationState, setReorganizationState] = useState<ReorganizationState>({
    isReorganizing: false,
    processingFileId: null,
  });

  // ✅ États de tri (spécifiques à la vue liste)
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // ✅ Fonction pour obtenir l'icône selon le type de fichier
  const getFileTypeIcon = useCallback((type: FileType, isFolder?: boolean): JSX.Element => {
    if (isFolder) {
      return <Folder className="h-5 w-5 text-blue-500" />;
    }

    switch (type) {
      case FileType.PAGE:
        return <FileText className="h-5 w-5 text-green-500" />;
      case FileType.COMPONENT:
        return <Package className="h-5 w-5 text-purple-500" />;
      case FileType.UTILS:
        return <Settings className="h-5 w-5 text-orange-500" />;
      case FileType.LIB:
        return <Layers className="h-5 w-5 text-indigo-500" />;
      case FileType.STORE:
        return <Database className="h-5 w-5 text-red-500" />;
      case FileType.HOOK:
        return <Code2 className="h-5 w-5 text-pink-500" />;
      case FileType.ENV:
        return <Lock className="h-5 w-5 text-yellow-500" />;
      case FileType.SYSTEM:
        return <Globe className="h-5 w-5 text-gray-500" />;
      case FileType.TEST:
        return <TestTube className="h-5 w-5 text-cyan-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  }, []);

  // ✅ Fonction pour obtenir le label du type (CORRIGÉE)
  const getTypeLabel = useCallback((type: FileType): string => {
    const labels: Record<FileType, string> = {
      [FileType.DOSSIER]: "Dossier",
      [FileType.PAGE]: "Page Next.js",
      [FileType.COMPONENT]: "Composant React",
      [FileType.UTILS]: "Utilitaires",
      [FileType.LIB]: "Librairie",
      [FileType.STORE]: "Store",
      [FileType.HOOK]: "Hook React",
      [FileType.ENV]: "Environment",
      [FileType.SYSTEM]: "Système",
      [FileType.TEST]: "Test",
      [FileType.OTHER]: "Autre",
    };
    return labels[type];
  }, []);

  // ✅ Fonction pour formater la taille des fichiers
  const formatFileSize = useCallback((bytes: number | null): string => {
    if (!bytes || bytes === 0) return "0 B";
    
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // ✅ Gestion du changement de tri (spécifique à la vue liste)
  const handleSortChange = useCallback((newSortBy: SortBy) => {
    setSortBy(newSortBy);
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  }, []);

  // ✅ Gestion de la réorganisation (API /api/files/{id}/move)
  const handleReorganize = useCallback(async (
    fileId: string, 
    direction: "up" | "down",
    currentIndex: number,
    totalFiles: number
  ) => {
    // Vérifications de validité
    if (reorganizationState.isReorganizing) {
      console.log("⚠️ Réorganisation déjà en cours");
      return;
    }

    if (direction === "up" && currentIndex === 0) {
      toast.warning("Impossible de déplacer", {
        description: "Le fichier est déjà en première position",
      });
      return;
    }

    if (direction === "down" && currentIndex === totalFiles - 1) {
      toast.warning("Impossible de déplacer", {
        description: "Le fichier est déjà en dernière position",
      });
      return;
    }

    // Démarrer la réorganisation
    setReorganizationState({
      isReorganizing: true,
      processingFileId: fileId,
    });

    try {
      const response = await fetch(`/api/files/${fileId}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction,
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

      toast.success("Déplacement réussi", {
        description: `Fichier déplacé vers ${direction === "up" ? "le haut" : "le bas"}`,
      });

      // Rafraîchir les données
      onRefresh();

    } catch (error) {
      console.error("❌ Erreur lors de la réorganisation:", error);
      toast.error("Erreur de déplacement", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      // Arrêter la réorganisation
      setReorganizationState({
        isReorganizing: false,
        processingFileId: null,
      });
    }
  }, [reorganizationState.isReorganizing, currentFolder, onRefresh]);

  // ✅ Actions par défaut pour les fonctionnalités optionnelles
  const handleDownload = useCallback((file: FileWithRelations) => {
    // Priorité à l'URL de la dernière version
    if (file.versions && file.versions.length > 0 && file.versions[0].url) {
      window.open(file.versions[0].url, "_blank");
      toast.success("Téléchargement démarré");
    }
    // Fallback vers le path
    else if (file.path) {
      window.open(file.path, "_blank");
      toast.success("Ouverture du fichier");
    }
    // Afficher le script si disponible
    else if (file.script) {
      const blob = new Blob([file.script], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Script téléchargé");
    }
    else {
      toast.info("Aucun contenu téléchargeable disponible");
    }
  }, []);

  const handleShare = useCallback((file: FileWithRelations) => {
    let shareUrl: string;
    
    // Construire l'URL de partage
    if (file.versions && file.versions.length > 0 && file.versions[0].url) {
      shareUrl = file.versions[0].url;
    } else if (file.path) {
      shareUrl = `${window.location.origin}/api/files/${file.id}/download`;
    } else {
      shareUrl = `${window.location.origin}/files/${file.id}`;
    }

    // Copier dans le presse-papiers
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Lien copié", {
          description: "L'URL a été copiée dans le presse-papiers",
        });
      })
      .catch(() => {
        toast.error("Erreur de copie", {
          description: "Impossible de copier l'URL",
        });
      });
  }, []);

  const handleDuplicate = useCallback((file: FileWithRelations) => {
    toast.info("Duplication", {
      description: `Duplication de "${file.name}" - Action non implémentée`,
    });
    
    // TODO: Implémenter la logique de duplication
    // Cela nécessiterait un endpoint API pour cloner un fichier
    console.log("🔄 Duplication demandée pour:", file.name);
  }, []);

  // ✅ Mémoisation des props communes aux vues
  const commonViewProps = useMemo(() => ({
    files,
    currentFolder,
    onEdit,
    onDelete,
    onFolderNavigate,
    selectedFiles,
    onToggleSelection,
    onDownload: handleDownload,
    onShare: handleShare,
    onDuplicate: handleDuplicate,
    getFileTypeIcon,
    getTypeLabel,
    formatFileSize,
    onCreateNew,
    onReorganize: handleReorganize,
    isReorganizing: reorganizationState.isReorganizing,
    processingFileId: reorganizationState.processingFileId,
    viewMode, // AJOUT CRITIQUE : Inclure le viewMode
  }), [
    files,
    currentFolder, 
    onEdit,
    onDelete,
    onFolderNavigate,
    selectedFiles,
    onToggleSelection,
    handleDownload,
    handleShare,
    handleDuplicate,
    getFileTypeIcon,
    getTypeLabel,
    formatFileSize,
    onCreateNew,
    handleReorganize,
    reorganizationState.isReorganizing,
    reorganizationState.processingFileId,
  ]); 

  // ✅ États de chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="animate-spin h-6 w-6 mr-3" />
          Chargement des fichiers...
        </div>
        
        {/* Skeletons selon le mode d'affichage */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : viewMode === "branch" ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ✅ État vide
  if (files.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="flex justify-center mb-6">
          {currentFolder ? (
            <Folder className="h-16 w-16 text-gray-300" />
          ) : (
            <FileText className="h-16 w-16 text-gray-300" />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-700">
          {currentFolder ? "Dossier vide" : "Aucun fichier"}
        </h3>
        
        <p className="text-gray-500 max-w-md mx-auto">
          {currentFolder 
            ? "Ce dossier ne contient aucune référence pour le moment."
            : "Commencez par ajouter des références de fichiers à votre projet."
          }
        </p>

        <div className="text-sm text-gray-400 space-y-1 max-w-lg mx-auto">
          <p>💡 Utilisez le bouton "Ajouter" pour créer votre première référence</p>
          <p>📁 Organisez vos fichiers avec des dossiers virtuels</p>
          <p>🔧 Types supportés : Pages, Composants, Utils, Stores, Hooks, etc.</p>
        </div>
      </div>
    );
  }

  // ✅ Rendu selon le mode d'affichage
  switch (viewMode) {
    case "list":
      return (
        <FilesViewList
          {...commonViewProps}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      );

    case "card": 
      return (
        <FilesViewCard
          {...commonViewProps}
        />
      );

    case "branch":
      return (
        <FilesViewBranch
          {...commonViewProps}
        />
      );

    default:
      console.warn(`Mode d'affichage non supporté: ${viewMode}`);
      return (
        <div className="text-center py-8 text-red-500">
          <p>Mode d'affichage "${viewMode}" non supporté</p>
          <p className="text-sm text-gray-500 mt-2">
            Modes disponibles : list, card, branch
          </p>
        </div>
      );
  }
}