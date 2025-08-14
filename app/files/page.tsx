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
 * - FilesList : Orchestrateur principal des vues
 * - FilesViewList : Vue tableau détaillée avec colonnes triables
 * - FilesViewCard : Vue grille moderne avec cartes visuelles
 * - FilesViewBranch : Vue arborescente hiérarchique avec navigation
 * - Card, Button, Skeleton : Composants UI shadcn/ui
 *
 * LIBS UTILISÉS :
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
  Info,
  Plus,
  Settings,
  Search,
  Filter,
  LayoutGrid,
  List,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import du store Project (similaire au pattern Initiative)
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
} from "@/types/files";

// ✅ Interface pour l'état de navigation hiérarchique
interface NavigationState {
  currentFolder: string | null;
  folderName: string;
  breadcrumb: Array<{
    id: string | null;
    name: string;
    path?: string;
  }>;
}

// ✅ Interface pour l'état des filtres
interface FilterState {
  search: string;
  type: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

// ✅ Interface stricte pour l'état de la pagination avec valeurs par défaut
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ✅ Interface pour les statistiques calculées
interface FileStats {
  total: number;
  folders: number;
  files: number;
  selected: number;
  byType: Record<string, number>;
}

export default function FilesPage(): JSX.Element {
  // ✅ Utilisation du store Project avec pattern optimisé
  const {
    selectedProjectId,
    projectData,
    isLoading: isProjectLoading,
    error: projectError,
    isHydrated,
    loadProjectData,
    refreshProject,
  } = useProjectStore();

  // ✅ Hydratation sécurisée du store
  const isStoreHydrated = useProjectStoreHydration();

  // ✅ États principaux
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ États de navigation
  const [navigation, setNavigation] = useState<NavigationState>({
    currentFolder: null,
    folderName: "Racine",
    breadcrumb: [{ id: null, name: "Racine" }],
  });

  // ✅ États d'interface
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(
    null
  );

  // ✅ États de filtrage
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "ALL",
    sortBy: "name",
    sortOrder: "asc",
  });

  // ✅ État de pagination avec valeurs par défaut strictes
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // ✅ Fonction de récupération des fichiers avec gestion stricte de la pagination
  const fetchFiles = useCallback(
    async (showLoadingState = true) => {
      if (!selectedProjectId || !isStoreHydrated) {
        console.log(
          "⏳ Attente de l'hydratation du store ou projectId manquant:",
          {
            selectedProjectId,
            isStoreHydrated,
          }
        );
        setIsLoading(false);
        return;
      }

      try {
        if (showLoadingState) {
          setIsLoading(true);
        }
        setError(null);

        const searchParams = new URLSearchParams({
          projectId: selectedProjectId,
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...(navigation.currentFolder && {
            parentId: navigation.currentFolder,
          }),
          ...(filters.type !== "ALL" && { type: filters.type }),
          ...(filters.search && { search: filters.search }),
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        console.log("📡 Récupération des fichiers:", {
          projectId: selectedProjectId,
          params: Object.fromEntries(searchParams.entries()),
        });

        const response = await fetch(`/api/files?${searchParams}`);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result: ApiResponse<FileWithRelations[]> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors du chargement");
        }

        const filesData = result.data || [];
        setFiles(filesData);
        setFilteredFiles(filesData);

        // Gestion stricte de la pagination avec vérification de nullabilité
        if (result.pagination) {
          const paginationData: PaginationState = {
            page: result.pagination.page,
            limit: result.pagination.limit,
            total: result.pagination.total,
            totalPages: result.pagination.totalPages,
            hasNextPage: result.pagination.page < result.pagination.totalPages,
            hasPreviousPage: result.pagination.page > 1,
          };
          setPagination(paginationData);
        } else {
          // Valeurs par défaut si pagination absente
          setPagination({
            page: 1,
            limit: 50,
            total: filesData.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }

        console.log("✅ Fichiers chargés:", {
          count: filesData.length,
          total: result.pagination?.total || filesData.length,
          currentFolder: navigation.currentFolder,
          filters,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error("❌ Erreur lors du chargement des fichiers:", error);
        setError(errorMessage);
        toast.error("Erreur de chargement", {
          description: errorMessage,
        });
        setFiles([]);
        setFilteredFiles([]);

        // Réinitialiser la pagination en cas d'erreur
        setPagination({
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedProjectId,
      isStoreHydrated,
      navigation.currentFolder,
      filters,
      pagination.page,
      pagination.limit,
    ]
  );

  // ✅ Chargement initial avec gestion de l'hydratation
  useEffect(() => {
    if (isStoreHydrated && selectedProjectId) {
      console.log("🔄 Store hydraté, chargement des données:", {
        projectId: selectedProjectId,
        projectData: projectData?.name || "Non chargé",
      });

      // Charger les données du projet si nécessaire
      if (!projectData && selectedProjectId) {
        loadProjectData(selectedProjectId);
      }

      // Charger les fichiers
      fetchFiles();
    } else if (isStoreHydrated && !selectedProjectId) {
      console.log("⚠️ Store hydraté mais pas de projet sélectionné");
      setError("Aucun projet sélectionné");
      setIsLoading(false);
    }
  }, [
    isStoreHydrated,
    selectedProjectId,
    projectData,
    loadProjectData,
    fetchFiles,
  ]);

  // ✅ Filtrage local en temps réel
  const applyLocalFilters = useCallback(() => {
    let filtered = [...files];

    // Filtrage par recherche textuelle étendue
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchLower) ||
          file.description?.toLowerCase().includes(searchLower) ||
          file.import?.toLowerCase().includes(searchLower) ||
          file.export?.toLowerCase().includes(searchLower) ||
          file.use?.toLowerCase().includes(searchLower) ||
          file.script?.toLowerCase().includes(searchLower) ||
          file.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Tri local optimisé
    filtered.sort((a, b) => {
      // Dossiers toujours en premier
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "date":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "size":
          aValue = a.script?.length || 0;
          bValue = b.script?.length || 0;
          break;
        case "author":
          aValue = a.author?.[0]?.name?.toLowerCase() || "";
          bValue = b.author?.[0]?.name?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    setFilteredFiles(filtered);
  }, [files, filters]);

  // ✅ Application des filtres à chaque changement
  useEffect(() => {
    applyLocalFilters();
  }, [applyLocalFilters]);

  // ✅ Navigation dans l'arborescence
  const handleFolderNavigate = useCallback(
    (folderId: string | null, folderName?: string) => {
      const newBreadcrumb = [...navigation.breadcrumb];

      if (folderId) {
        // Navigation vers un sous-dossier
        newBreadcrumb.push({
          id: folderId,
          name: folderName || "Dossier",
        });
      } else {
        // Retour à la racine
        newBreadcrumb.splice(1); // Garde seulement la racine
      }

      setNavigation({
        currentFolder: folderId,
        folderName: folderName || "Racine",
        breadcrumb: newBreadcrumb,
      });

      // Réinitialiser la sélection et la pagination
      setSelectedFiles([]);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }));

      toast.success("Navigation", {
        description: `${folderId ? "Entrée dans" : "Retour à"} ${
          folderName || "la racine"
        }`,
      });
    },
    [navigation]
  );

  // ✅ Navigation vers un niveau spécifique du breadcrumb
  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      const targetBreadcrumb = navigation.breadcrumb[index];
      const newBreadcrumb = navigation.breadcrumb.slice(0, index + 1);

      setNavigation({
        currentFolder: targetBreadcrumb.id,
        folderName: targetBreadcrumb.name,
        breadcrumb: newBreadcrumb,
      });

      setSelectedFiles([]);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }));
    },
    [navigation.breadcrumb]
  );

  // ✅ Ouverture du formulaire pour création
  const handleCreateNew = useCallback(() => {
    setEditingFile(null);
    setIsFormOpen(true);
  }, []);

  // ✅ Ouverture du formulaire pour édition
  const handleEdit = useCallback((file: FileWithRelations) => {
    setEditingFile(file);
    setIsFormOpen(true);
  }, []);

  // ✅ Suppression avec confirmation
  const handleDelete = useCallback(
    async (file: FileWithRelations) => {
      const confirmMessage = file.isFolder
        ? `Êtes-vous sûr de vouloir supprimer le dossier "${file.name}" ?`
        : `Êtes-vous sûr de vouloir supprimer la référence "${file.name}" ?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      try {
        const response = await fetch(`/api/files/${file.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la suppression");
        }

        toast.success("Suppression réussie", {
          description: `"${file.name}" a été supprimé avec succès`,
        });

        // Rafraîchir la liste
        fetchFiles(false);

        // Retirer de la sélection si nécessaire
        setSelectedFiles((prev) => prev.filter((id) => id !== file.id));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        console.error("❌ Erreur lors de la suppression:", error);
        toast.error("Erreur de suppression", {
          description: errorMessage,
        });
      }
    },
    [fetchFiles]
  );

  // ✅ Gestion de la sélection multiple
  const handleToggleSelection = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }, []);

  // ✅ Sélection/désélection globale
  const handleSelectAll = useCallback(() => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map((file) => file.id));
    }
  }, [selectedFiles.length, filteredFiles]);

  // ✅ Suppression en lot
  const handleDeleteSelected = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedFiles.length} élément(s) sélectionné(s) ?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const deletePromises = selectedFiles.map((fileId) =>
        fetch(`/api/files/${fileId}`, { method: "DELETE" })
      );

      const responses = await Promise.all(deletePromises);
      const results = await Promise.all(
        responses.map((response) => response.json())
      );

      const failures = results.filter((result) => !result.success);

      if (failures.length > 0) {
        toast.error("Suppression partielle", {
          description: `${failures.length} élément(s) n'ont pas pu être supprimés`,
        });
      } else {
        toast.success("Suppression réussie", {
          description: `${selectedFiles.length} élément(s) supprimé(s) avec succès`,
        });
      }

      // Rafraîchir et réinitialiser la sélection
      fetchFiles(false);
      setSelectedFiles([]);
    } catch (error) {
      console.error("❌ Erreur lors de la suppression en lot:", error);
      toast.error("Erreur lors de la suppression en lot");
    }
  }, [selectedFiles, fetchFiles]);

  // ✅ Fermeture du formulaire avec succès
  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
    fetchFiles(false);
    toast.success("Opération réussie", {
      description: "Les métadonnées ont été mises à jour",
    });
  }, [fetchFiles]);

  // ✅ Annulation du formulaire
  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
  }, []);

  // ✅ Changement de page avec gestion stricte
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        setPagination((prev) => ({
          ...prev,
          page: newPage,
          hasNextPage: newPage < prev.totalPages,
          hasPreviousPage: newPage > 1,
        }));
      }
    },
    [pagination.totalPages]
  );

  // ✅ Statistiques calculées
  const stats: FileStats = useMemo(() => {
    const byType: Record<string, number> = {};

    filteredFiles.forEach((file) => {
      byType[file.type] = (byType[file.type] || 0) + 1;
    });

    return {
      total: filteredFiles.length,
      folders: filteredFiles.filter((f) => f.isFolder).length,
      files: filteredFiles.filter((f) => !f.isFolder).length,
      selected: selectedFiles.length,
      byType,
    };
  }, [filteredFiles, selectedFiles]);

  // ✅ Validation de l'état de chargement avec gestion du store
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
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Veuillez sélectionner un projet pour accéder à la gestion des
              fichiers.
            </p>
            <Button onClick={() => window.history.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la sélection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Button onClick={() => refreshProject()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
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
                {isProjectLoading ? (
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
                onClick={() => fetchFiles()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">Actualiser</span>
              </Button>

              <Button onClick={handleCreateNew} size="sm">
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
                        className="flex items-center hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-blue-50"
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
                    >
                      {selectedFiles.length === filteredFiles.length
                        ? "Tout désélectionner"
                        : "Tout sélectionner"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                    >
                      Supprimer ({selectedFiles.length})
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
                    <Button onClick={() => fetchFiles()} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
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
                  onRefresh={() => fetchFiles(false)}
                  onFolderNavigate={handleFolderNavigate}
                  selectedFiles={selectedFiles}
                  onToggleSelection={handleToggleSelection}
                  onCreateNew={handleCreateNew}
                  isLoading={isLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* ✅ Pagination avec vérification stricte et gestion d'erreur */}
          {pagination.totalPages > 1 && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.totalPages}(
                  {pagination.total} éléments au total)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPreviousPage || isLoading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Suivant
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
        projectId={selectedProjectId} // ✅ ID depuis le store Zustand
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />
    </div>
  );
}
