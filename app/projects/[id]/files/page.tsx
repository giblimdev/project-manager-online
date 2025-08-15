// @/app/files/page.tsx

/**
 * RÔLE : Page principale de gestion des métadonnées de fichiers avec intégration store Zustand
 * RESPONSABILITÉS :
 * - Point d'entrée de l'application de gestion des références de fichiers
 * - Orchestration de tous les composants Files selon leur rôle spécifique
 * - Récupération du projectId via le store Zustand avec cache optimisé
 * - Interface responsive moderne avec navigation et feedback utilisateur
 * - Intégration complète avec le système CRUD selon schéma Prisma EXACT
 * - Gestion des erreurs et états de chargement avec fallbacks appropriés
 * - Support de la hiérarchie des dossiers et navigation avancée
 * - Hydratation sécurisée avec store pattern optimisé
 *
 * COMPOSANTS UTILISÉS :
 * - FilesDisplay : Sélecteur de mode d'affichage (list/card/branch)
 * - FilesFilter : Filtrage avancé par type, recherche, tri
 * - FilesForm : Formulaire modal CRUD pour création/édition
 * - FilesList : Orchestrateur principal des vues qui utilise :
 * - FilesViewList : Vue tableau détaillée avec colonnes triables
 * - FilesViewCard : Vue grille moderne avec cartes visuelles
 * - FilesViewBranch : Vue arborescente hiérarchique avec navigation
 * - Card, Button, Skeleton : Composants UI shadcn/ui
 *
 * LIBS UTILISÉES :
 * - React 19 hooks : useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 : Client component moderne avec TypeScript strict
 * - Zustand : Store state management avec cache TTL et persistence
 * - sonner : Toast notifications pour feedback utilisateur temps réel
 * - Tailwind CSS : Design responsive mobile-first avec animations
 * - TypeScript : Mode strict avec types centralisés depuis types/files.ts
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  FileText,
  Home,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import du store Project avec pattern optimisé
import {
  useProjectStoreHydration,
  useProjectStore,
} from "@/stores/useSelectedProjectStore";

// ✅ Import des composants spécialisés selon leur rôle
import FilesDisplay from "@/components/files/FilesDisplay";
import FilesFilter from "@/components/files/FilesFilter";
import FilesForm from "@/components/files/FilesForm";
import FilesList from "@/components/files/FilesList";

// ✅ Import des types centralisés
import type {
  FileWithRelations,
  ViewMode,
  FilterType,
  SortBy,
  SortOrder,
  ApiResponse,
  FileStats,
  NavigationState,
  FilterState,
  PaginationState,
} from "@/types/files";

// ✅ Configuration et constantes
const PAGE_SIZES = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;
const CACHE_INVALIDATION_TIME = 30 * 1000; // 30 secondes

export default function FilesPage(): JSX.Element {
  // ✅ Store Project avec hooks optimisés
  const {
    selectedProjectId,
    projectData,
    isLoading: isProjectLoading,
    error: projectError,
    isHydrated,
    loadProjectData,
    refreshProject,
    isDataFresh,
  } = useProjectStore();

  // ✅ Hydratation sécurisée du store
  const isStoreHydrated = useProjectStoreHydration();

  // ✅ États principaux avec types stricts
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  // ✅ États de navigation avec initialisation typée
  const [navigation, setNavigation] = useState<NavigationState>({
    currentFolder: null,
    folderName: "Racine",
    breadcrumb: [{ id: null, name: "Racine" }],
  });

  // ✅ États d'interface avec valeurs par défaut
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(null);

  // ✅ États de filtrage avec configuration par défaut
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "ALL",
    sortBy: "name",
    sortOrder: "asc",
  });

  // ✅ État de pagination avec validation stricte
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ✅ État de performance et cache
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);

  // ✅ Validation des dépendances pour éviter les re-renders inutiles
  const projectId = selectedProjectId;
  const currentFolder = navigation.currentFolder;
  const filtersString = JSON.stringify(filters);
  const { page, limit } = pagination;

  // ✅ Fonction de récupération optimisée avec cache intelligent
  const fetchFiles = useCallback(
    async (options: {
      showLoadingState?: boolean;
      force?: boolean;
      silent?: boolean;
    } = {}) => {
      const { showLoadingState = true, force = false, silent = false } = options;

      if (!selectedProjectId || !isStoreHydrated) {
        console.log("⏳ Attente de l'hydratation du store:", {
          selectedProjectId: !!selectedProjectId,
          isStoreHydrated,
        });
        setIsLoading(false);
        return;
      }

      // ✅ Vérification du cache intelligent
      const now = Date.now();
      const isCacheValid = 
        lastFetch && 
        (now - lastFetch) < CACHE_INVALIDATION_TIME && 
        !force;

      if (isCacheValid) {
        console.log("📋 Utilisation du cache local");
        return;
      }

      try {
        if (showLoadingState && !silent) {
          setIsLoading(true);
        }
        if (!silent) {
          setError(null);
        }

        // ✅ Construction des paramètres avec validation
        const searchParams = new URLSearchParams({
          projectId: selectedProjectId,
          page: Math.max(1, pagination.page).toString(),
          limit: Math.max(1, Math.min(100, pagination.limit)).toString(),
          ...(navigation.currentFolder && {
            parentId: navigation.currentFolder,
          }),
          ...(filters.type !== "ALL" && { type: filters.type }),
          ...(filters.search.trim() && { search: filters.search.trim() }),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          // ✅ Ajout du timestamp pour éviter le cache navigateur
          _t: now.toString(),
        });

        console.log("📡 Récupération des fichiers:", {
          projectId: selectedProjectId,
          params: Object.fromEntries(searchParams.entries()),
          force,
        });

        const response = await fetch(`/api/files?${searchParams}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": force ? "no-cache" : "default",
          },
          // ✅ Gestion du cache navigateur
          cache: force ? "no-store" : "default",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Erreur ${response.status}: ${response.statusText}\n${errorText}`
          );
        }

        const result: ApiResponse<{
          files: FileWithRelations[];
          pagination?: PaginationState;
          stats?: FileStats;
        }> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors du chargement");
        }

        const { files: filesData = [], pagination: paginationData, stats } = result.data || {};

        // ✅ Validation et normalisation des données
        const validatedFiles = filesData.filter((file): file is FileWithRelations => {
          return (
            file &&
            typeof file.id === "string" &&
            typeof file.name === "string" &&
            typeof file.type === "string" &&
            typeof file.isFolder === "boolean"
          );
        });

        setFiles(validatedFiles);
        setFilteredFiles(validatedFiles);
        setLastFetch(now);

        // ✅ Gestion de la pagination avec validation stricte
        if (paginationData) {
          const validatedPagination: PaginationState = {
            page: Math.max(1, paginationData.page || 1),
            limit: Math.max(1, paginationData.limit || DEFAULT_PAGE_SIZE),
            total: Math.max(0, paginationData.total || 0),
            totalPages: Math.max(1, paginationData.totalPages || 1),
            hasNextPage: Boolean(paginationData.hasNextPage),
            hasPreviousPage: Boolean(paginationData.hasPreviousPage),
          };
          setPagination(validatedPagination);
        } else {
          // ✅ Pagination par défaut pour les réponses sans pagination
          setPagination({
            page: 1,
            limit: DEFAULT_PAGE_SIZE,
            total: validatedFiles.length,
            totalPages: Math.max(1, Math.ceil(validatedFiles.length / DEFAULT_PAGE_SIZE)),
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }

        console.log("✅ Fichiers chargés avec succès:", {
          count: validatedFiles.length,
          total: paginationData?.total || validatedFiles.length,
          currentFolder: navigation.currentFolder,
          cached: isCacheValid,
        });

        // ✅ Toast de succès uniquement pour les opérations manuelles
        if (force && !silent) {
          toast.success("Données actualisées", {
            description: `${validatedFiles.length} fichier(s) chargé(s)`,
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("❌ Erreur lors du chargement des fichiers:", error);
        
        if (!silent) {
          setError(errorMessage);
          toast.error("Erreur de chargement", {
            description: errorMessage,
            action: {
              label: "Réessayer",
              onClick: () => fetchFiles({ force: true }),
            },
          });
        }

        // ✅ Réinitialisation propre en cas d'erreur
        setFiles([]);
        setFilteredFiles([]);
        setPagination({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      } finally {
        if (showLoadingState) {
          setIsLoading(false);
        }
        setIsRefreshing(false);
      }
    },
    [projectId, isStoreHydrated, currentFolder, filtersString, page, limit, lastFetch]
  );

  // ✅ Chargement initial avec gestion de l'hydratation optimisée
  useEffect(() => {
    if (!isStoreHydrated) {
      console.log("⏳ En attente de l'hydratation du store...");
      return;
    }

    if (!selectedProjectId) {
      console.log("⚠️ Aucun projet sélectionné");
      setError("Aucun projet sélectionné");
      setIsLoading(false);
      return;
    }

    console.log("🔄 Initialisation de la page Files:", {
      projectId: selectedProjectId,
      projectName: projectData?.name || "Non chargé",
      isDataFresh: isDataFresh(),
    });

    // ✅ Charger les données du projet si nécessaire
    if (!projectData && selectedProjectId) {
      loadProjectData(selectedProjectId);
    }

    // ✅ Charger les fichiers avec cache intelligent
    fetchFiles({ showLoadingState: true });
  }, [
    isStoreHydrated,
    selectedProjectId,
    fetchFiles,
    projectData,
    loadProjectData,
    isDataFresh,
  ]);

  // ✅ Filtrage local optimisé avec debounce via useMemo
  const applyLocalFilters = useMemo(() => {
    if (!files.length) return [];

    let filtered = [...files];

    // ✅ Filtrage par recherche textuelle étendue et optimisée
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      const searchTerms = searchLower.split(/\s+/);

      filtered = filtered.filter((file) => {
        const searchableText = [
          file.name,
          file.description,
          file.import,
          file.export,
          file.use,
          file.script,
          ...file.tags,
          ...(file.author?.map(a => `${a.firstName} ${a.lastName} ${a.name} ${a.email}`) || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // ✅ Filtrage par type avec gestion des cas spéciaux
    if (filters.type !== "ALL") {
      filtered = filtered.filter((file) => {
        if (filters.type === "DOSSIER") return file.isFolder;
        if (filters.type === "FILE") return !file.isFolder;
        return file.type === filters.type;
      });
    }

    // ✅ Tri optimisé avec gestion des types
    filtered.sort((a, b) => {
      // ✅ Dossiers toujours en premier sauf si tri par type
      if (filters.sortBy !== "type") {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
      }

      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.isFolder ? "000_FOLDER" : a.type;
          bValue = b.isFolder ? "000_FOLDER" : b.type;
          break;
        case "date":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "size":
          aValue = a.isFolder ? -1 : (a.script?.length || 0);
          bValue = b.isFolder ? -1 : (b.script?.length || 0);
          break;
        case "author":
          const aAuthor = a.author?.[0];
          const bAuthor = b.author?.[0];
          aValue = aAuthor 
            ? `${aAuthor.lastName || ""} ${aAuthor.firstName || ""}`.trim() || aAuthor.name || aAuthor.email || ""
            : "";
          bValue = bAuthor 
            ? `${bAuthor.lastName || ""} ${bAuthor.firstName || ""}`.trim() || bAuthor.name || bAuthor.email || ""
            : "";
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue, "fr", { numeric: true });
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue), "fr", { numeric: true });
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [files, filters]);

  // ✅ Application des filtres optimisée
  useEffect(() => {
    setFilteredFiles(applyLocalFilters);
  }, [applyLocalFilters]);

  // ✅ Navigation dans l'arborescence avec historique
  const handleFolderNavigate = useCallback(
    (folderId: string | null, folderName?: string) => {
      // ✅ Éviter la navigation vers le même dossier
      if (navigation.currentFolder === folderId) return;

      const newBreadcrumb = [...navigation.breadcrumb];

      if (folderId) {
        // ✅ Navigation vers un sous-dossier
        const existingIndex = newBreadcrumb.findIndex(crumb => crumb.id === folderId);
        if (existingIndex >= 0) {
          // ✅ Navigation vers un dossier déjà dans le breadcrumb
          newBreadcrumb.splice(existingIndex + 1);
        } else {
          // ✅ Navigation vers un nouveau dossier
          newBreadcrumb.push({
            id: folderId,
            name: folderName || "Dossier",
          });
        }
      } else {
        // ✅ Retour à la racine
        newBreadcrumb.splice(1);
      }

      setNavigation({
        currentFolder: folderId,
        folderName: folderName || "Racine",
        breadcrumb: newBreadcrumb,
      });

      // ✅ Réinitialisation des états dépendants
      setSelectedFiles([]);
      setPagination(prev => ({
        ...prev,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }));

      // ✅ Rafraîchissement des données pour le nouveau dossier
      setTimeout(() => {
        fetchFiles({ force: true, silent: true });
      }, 100);

      toast.success("Navigation", {
        description: `${folderId ? "Entrée dans" : "Retour à"} ${folderName || "la racine"}`,
      });
    },
    [navigation, fetchFiles]
  );

  // ✅ Navigation breadcrumb optimisée
  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      if (index === navigation.breadcrumb.length - 1) return; // Déjà sur cette page

      const targetBreadcrumb = navigation.breadcrumb[index];
      const newBreadcrumb = navigation.breadcrumb.slice(0, index + 1);

      setNavigation({
        currentFolder: targetBreadcrumb.id,
        folderName: targetBreadcrumb.name,
        breadcrumb: newBreadcrumb,
      });

      setSelectedFiles([]);
      setPagination(prev => ({
        ...prev,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }));

      // ✅ Rafraîchissement avec délai pour éviter les conflits
      setTimeout(() => {
        fetchFiles({ force: true, silent: true });
      }, 100);
    },
    [navigation.breadcrumb, fetchFiles]
  );

  // ✅ Gestion du formulaire - création
  const handleCreateNew = useCallback(() => {
    setEditingFile(null);
    setIsFormOpen(true);
  }, []);

  // ✅ Gestion du formulaire - édition
  const handleEdit = useCallback((file: FileWithRelations) => {
    setEditingFile(file);
    setIsFormOpen(true);
  }, []);

  // ✅ Suppression avec confirmation et feedback
  const handleDelete = useCallback(
    async (file: FileWithRelations) => {
      const itemType = file.isFolder ? "dossier" : "référence";
      const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${itemType} "${file.name}" ?`;

      if (!window.confirm(confirmMessage)) return;

      setOperationInProgress(true);

      try {
        const response = await fetch(`/api/files/${file.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur ${response.status}: ${response.statusText}\n${errorText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la suppression");
        }

        toast.success("Suppression réussie", {
          description: `${itemType} "${file.name}" supprimé avec succès`,
        });

        // ✅ Mise à jour locale optimisée
        setFiles(prev => prev.filter(f => f.id !== file.id));
        setSelectedFiles(prev => prev.filter(id => id !== file.id));

        // ✅ Rafraîchissement en arrière-plan
        setTimeout(() => {
          fetchFiles({ force: true, silent: true });
        }, 500);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("❌ Erreur lors de la suppression:", error);
        toast.error("Erreur de suppression", {
          description: errorMessage,
        });
      } finally {
        setOperationInProgress(false);
      }
    },
    [fetchFiles]
  );

  // ✅ Gestion de la sélection multiple optimisée
  const handleToggleSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const isSelected = prev.includes(fileId);
      if (isSelected) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }, []);

  // ✅ Sélection/désélection globale
  const handleSelectAll = useCallback(() => {
    const allSelected = selectedFiles.length === filteredFiles.length && filteredFiles.length > 0;
    if (allSelected) {
      setSelectedFiles([]);
      toast.info("Tout désélectionné");
    } else {
      const newSelection = filteredFiles.map(file => file.id);
      setSelectedFiles(newSelection);
      toast.success(`${newSelection.length} élément(s) sélectionné(s)`);
    }
  }, [selectedFiles.length, filteredFiles]);

  // ✅ Suppression en lot avec progress
  const handleDeleteSelected = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedFiles.length} élément(s) sélectionné(s) ?`;
    if (!window.confirm(confirmMessage)) return;

    setOperationInProgress(true);
    const toastId = toast.loading(`Suppression en cours...`, {
      description: `0/${selectedFiles.length} éléments supprimés`,
    });

    try {
      let successCount = 0;
      let errorCount = 0;

      // ✅ Suppression par batch pour éviter la surcharge
      const batchSize = 5;
      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, i + batchSize);
        const deletePromises = batch.map(async (fileId) => {
          try {
            const response = await fetch(`/api/files/${fileId}`, {
              method: "DELETE",
            });
            if (response.ok) {
              const result = await response.json();
              return result.success ? "success" : "error";
            }
            return "error";
          } catch {
            return "error";
          }
        });

        const results = await Promise.all(deletePromises);
        successCount += results.filter(r => r === "success").length;
        errorCount += results.filter(r => r === "error").length;

        // ✅ Mise à jour du progress
        toast.loading(`Suppression en cours...`, {
          id: toastId,
          description: `${successCount + errorCount}/${selectedFiles.length} éléments traités`,
        });
      }

      // ✅ Résultat final
      if (errorCount > 0) {
        toast.error("Suppression partielle", {
          id: toastId,
          description: `${successCount} supprimés, ${errorCount} erreurs`,
        });
      } else {
        toast.success("Suppression réussie", {
          id: toastId,
          description: `${successCount} élément(s) supprimé(s) avec succès`,
        });
      }

      // ✅ Mise à jour locale et rafraîchissement
      setSelectedFiles([]);
      setTimeout(() => {
        fetchFiles({ force: true });
      }, 500);

    } catch (error) {
      console.error("❌ Erreur lors de la suppression en lot:", error);
      toast.error("Erreur lors de la suppression en lot", { id: toastId });
    } finally {
      setOperationInProgress(false);
    }
  }, [selectedFiles, fetchFiles]);

  // ✅ Fermeture du formulaire avec succès
  const handleFormSuccess = useCallback((updatedFile?: FileWithRelations) => {
    setIsFormOpen(false);
    setEditingFile(null);

    if (updatedFile) {
      // ✅ Mise à jour locale immédiate
      setFiles(prev => {
        const index = prev.findIndex(f => f.id === updatedFile.id);
        if (index >= 0) {
          const newFiles = [...prev];
          newFiles[index] = updatedFile;
          return newFiles;
        } else {
          return [...prev, updatedFile];
        }
      });
    }

    toast.success("Opération réussie", {
      description: "Les métadonnées ont été mises à jour",
    });

    // ✅ Rafraîchissement en arrière-plan
    setTimeout(() => {
      fetchFiles({ force: true, silent: true });
    }, 1000);
  }, [fetchFiles]);

  // ✅ Annulation du formulaire
  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
  }, []);

  // ✅ Changement de page avec validation
  const handlePageChange = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, pagination.totalPages));
      if (validPage === pagination.page) return;

      setPagination(prev => ({
        ...prev,
        page: validPage,
        hasNextPage: validPage < prev.totalPages,
        hasPreviousPage: validPage > 1,
      }));

      // ✅ Scroll vers le haut lors du changement de page
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [pagination.page, pagination.totalPages]
  );

  // ✅ Changement de taille de page
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPagination(prev => ({
      ...prev,
      limit: newSize,
      page: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    }));
  }, []);

  // ✅ Rafraîchissement manuel
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFiles({ force: true, showLoadingState: false });
  }, [fetchFiles]);

  // ✅ Statistiques calculées et mémorisées
  const stats: FileStats = useMemo(() => {
    const byType: Record<string, number> = {};

    filteredFiles.forEach(file => {
      const type = file.isFolder ? "DOSSIER" : file.type;
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total: filteredFiles.length,
      folders: filteredFiles.filter(f => f.isFolder).length,
      files: filteredFiles.filter(f => !f.isFolder).length,
      selected: selectedFiles.length,
      byType,
    };
  }, [filteredFiles, selectedFiles]);

  // ✅ États de chargement consolidés
  const isAnyLoading = isLoading || isProjectLoading || isRefreshing || operationInProgress;

  // ✅ Rendu conditionnel - Hydratation
  if (!isStoreHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Initialisation...
            </h1>
            <p className="text-gray-600 mb-6">
              Chargement de la configuration du projet.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Rendu conditionnel - Pas de projet
  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aucun projet sélectionné
            </h1>
            <p className="text-gray-600 mb-6">
              Veuillez sélectionner un projet pour accéder à la gestion des fichiers.
            </p>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => window.history.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la sélection
              </Button>
              <Button onClick={() => window.location.href = "/projects"}>
                Voir les projets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Rendu conditionnel - Erreur projet
  if (projectError && !projectData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur de chargement du projet
            </h1>
            <p className="text-gray-600 mb-6">{projectError}</p>
            <div className="flex justify-center space-x-2">
              <Button onClick={() => refreshProject()} variant="outline" disabled={isProjectLoading}>
                {isProjectLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Réessayer
              </Button>
              <Button onClick={() => window.history.back()} variant="ghost">
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Rendu principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ En-tête principal avec informations du projet depuis le store */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Informations du projet depuis le store */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-6 w-6 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {projectData?.name || "Chargement..."}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Gestion des métadonnées de fichiers
                  </p>
                </div>
              </div>

              {projectData?.status && (
                <Badge
                  variant={
                    projectData.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {projectData.status}
                </Badge>
              )}

              {/* Indicateur de statut du store */}
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {isAnyLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Sync...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Prêt</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isAnyLoading}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">Actualiser</span>
              </Button>

              <Button onClick={handleCreateNew} size="sm" disabled={operationInProgress}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* ✅ Navigation et statistiques */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                {/* Breadcrumb navigation */}
                <nav className="flex items-center space-x-1 text-sm">
                  {navigation.breadcrumb.map((crumb, index) => (
                    <React.Fragment key={crumb.id || "root"}>
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        disabled={index === navigation.breadcrumb.length - 1}
                        className={`flex items-center transition-colors px-2 py-1 rounded ${
                          index === navigation.breadcrumb.length - 1
                            ? "text-gray-900 font-medium"
                            : "hover:text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {index === 0 ? (
                          <Home className="h-4 w-4" />
                        ) : (
                          <span className="font-medium">{crumb.name}</span>
                        )}
                      </button>
                      {index < navigation.breadcrumb.length - 1 && (
                        <span className="text-gray-400">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>

                {/* Statistiques rapides */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{stats.total} élément(s)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FolderOpen className="h-4 w-4" />
                    <span>{stats.folders} dossier(s)</span>
                  </div>
                  {stats.selected > 0 && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{stats.selected} sélectionné(s)</span>
                    </div>
                  )}
                  {lastFetch && (
                    <div className="text-xs text-gray-400">
                      MAJ: {new Date(lastFetch).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* ✅ Barre d'outils avec composants spécialisés */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
                {/* Mode d'affichage */}
                <FilesDisplay
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Actions sur sélection */}
                {selectedFiles.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={operationInProgress}
                    >
                      {selectedFiles.length === filteredFiles.length
                        ? "Tout désélectionner"
                        : "Tout sélectionner"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={operationInProgress}
                    >
                      {operationInProgress ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        `Supprimer (${selectedFiles.length})`
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* ✅ Filtres avancés */}
              <FilesFilter
                value={filters.search}
                onChange={(search) =>
                  setFilters((prev) => ({ ...prev, search }))
                }
                selectedType={filters.type}
                onTypeChange={(type) =>
                  setFilters((prev) => ({ ...prev, type }))
                }
                sortBy={filters.sortBy}
                onSortByChange={(sortBy) =>
                  setFilters((prev) => ({ ...prev, sortBy }))
                }
                sortOrder={filters.sortOrder}
                onSortOrderChange={(sortOrder) =>
                  setFilters((prev) => ({ ...prev, sortOrder }))
                }
              />
            </CardContent>
          </Card>

          {/* ✅ Liste principale des fichiers */}
          <Card>
            <CardContent className="p-0">
              {error ? (
                <div className="text-center p-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-semibold mb-2 text-red-600">
                    Erreur de chargement
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <div className="flex justify-center space-x-2">
                    <Button 
                      onClick={() => fetchFiles({ force: true })} 
                      variant="outline"
                      disabled={isAnyLoading}
                    >
                      {isAnyLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Réessayer
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="ghost"
                    >
                      Recharger la page
                    </Button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">
                      Chargement des fichiers...
                    </span>
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <FilesList
                  files={filteredFiles}
                  viewMode={viewMode}
                  currentFolder={navigation.currentFolder}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onRefresh={handleRefresh}
                  onFolderNavigate={handleFolderNavigate}
                  selectedFiles={selectedFiles}
                  onToggleSelection={handleToggleSelection}
                  onCreateNew={handleCreateNew}
                  isLoading={isAnyLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* ✅ Pagination avec contrôles étendus */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} éléments au total)
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Sélecteur de taille de page */}
                  <select
                    value={pagination.limit}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    disabled={isAnyLoading}
                  >
                    {PAGE_SIZES.map(size => (
                      <option key={size} value={size}>{size} par page</option>
                    ))}
                  </select>

                  {/* Contrôles de navigation */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPreviousPage || isAnyLoading}
                    onClick={() => handlePageChange(1)}
                  >
                    Premier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPreviousPage || isAnyLoading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isAnyLoading}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Suivant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isAnyLoading}
                    onClick={() => handlePageChange(pagination.totalPages)}
                  >
                    Dernier
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ✅ Formulaire modal avec projectId depuis le store */}
      <FilesForm
        file={editingFile}
        currentFolder={navigation.currentFolder} 
        projectId={selectedProjectId}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />
    </div>
  );
}