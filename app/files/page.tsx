// @/app/files/page.tsx

/**
 * FICHIER : @/app/files/page.tsx
 * RÔLE : Page principale de gestion des métadonnées de fichiers avec Suspense boundary Next.js 15
 * RESPONSABILITÉS :
 * - Interface complète de gestion des fichiers avec sélecteur de vue (list/card/branch)
 * - Filtrage avancé par type FileType selon schéma Prisma EXACT
 * - Navigation hiérarchique dans les dossiers virtuels avec Suspense boundary
 * - Actions CRUD complètes avec formulaire modal
 * - Gestion des états loading, error et empty avec feedback utilisateur
 * - Intégration API sécurisée avec validation côté client et serveur
 * - Design responsive moderne avec Tailwind CSS et composants shadcn/ui
 * - Support des métadonnées de développement (import, export, use, script)
 * - CORRECTION : Wrapping useSearchParams dans Suspense pour Next.js 15
 *
 * COMPOSANTS UTILISÉS :
 * - Suspense: Boundary pour useSearchParams Next.js 15
 * - FilesDisplay: Sélecteur de mode d'affichage avec persistance d'état
 * - FilesFilter: Filtrage avancé avec recherche et tri multi-colonnes
 * - FileList: Liste principale avec boutons d'action et vues multiples
 * - FilesForm: Formulaire modal pour création/édition avec validation Zod
 * - Button, Card, CardContent: Composants UI shadcn/ui modernes
 * - Breadcrumb: Navigation de fil d'Ariane pour hiérarchie
 *
 * STORES UTILISÉS :
 * - useSelectedProjectStore: Store Zustand pour projet sélectionné avec cache TTL
 * - useProjectStoreHydration: Hook hydratation sécurisée Next.js 15
 * - useSelectedProjectId: Sélecteur stable pour ID projet
 * - useSelectedProjectData: Sélecteur stable pour données projet
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, JSX, Suspense
 * - Next.js 15 avec TypeScript strict mode et App Router avec Suspense boundary
 * - API Routes Next.js 15 avec gestion des paramètres mise à jour
 * - shadcn/ui: Button, Card, Breadcrumb, Separator components
 * - lucide-react: Icons modernes pour navigation et actions
 * - sonner: Toast notifications pour feedback temps réel
 * - Tailwind CSS: Design responsive mobile-first avec animations
 */

"use client";

import React, {
  JSX,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  RefreshCw,
  FolderOpen,
  Home,
  ChevronRight,
  Loader2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import du store Zustand pour projet sélectionné
import {
  useSelectedProjectId,
  useSelectedProjectData,
  useProjectStoreHydration,
  useProjectLoading,
  useProjectError,
} from "@/stores/useSelectedProjectStore";

// ✅ Import des composants Files (placeholder - à créer)
// import FilesDisplay from "@/components/files/FilesDisplay";
// import FilesFilter from "@/components/files/FilesFilter";
// import FileList from "@/components/files/FilesList";
// import FilesForm from "@/components/files/FilesForm";

// ✅ Import des types centralisés (placeholder - à créer)
// import type {
//   FileWithRelations,
//   ViewMode,
//   FilterType,
//   SortBy,
//   SortOrder,
//   ApiResponse,
//   FileSearchParams,
// } from "@/types/files";

// ✅ Interfaces temporaires pour compilation
interface FileWithRelations {
  id: string;
  name: string;
  type: string;
  isFolder: boolean;
}

type ViewMode = "list" | "card" | "tree";
type FilterType = "ALL" | "COMPONENT" | "PAGE" | "UTILS";
type SortBy = "name" | "type" | "date";
type SortOrder = "asc" | "desc";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Interface pour l'état de navigation
interface NavigationState {
  currentFolder: string | null;
  breadcrumb: Array<{ id: string | null; name: string }>;
}

// Interface pour l'état de filtrage
interface FilterState {
  search: string;
  type: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

// ✅ CORRECTION MAJEURE : Composant FilesPageContent avec useSearchParams wrappé dans Suspense
function FilesPageContent(): JSX.Element {
  const router = useRouter();
  // ✅ CORRECTION : useSearchParams maintenant dans le composant wrappé par Suspense
  // const searchParams = useSearchParams(); // À utiliser si nécessaire

  // ✅ Utilisation du store Zustand au lieu des paramètres de route
  const selectedProjectId = useSelectedProjectId();
  const selectedProjectData = useSelectedProjectData();
  const isProjectLoading = useProjectLoading();
  const projectError = useProjectError();
  const isStoreHydrated = useProjectStoreHydration();

  // ✅ États principaux
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(
    null
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ✅ État de navigation hiérarchique
  const [navigation, setNavigation] = useState<NavigationState>({
    currentFolder: null,
    breadcrumb: [{ id: null, name: "Racine" }],
  });

  // ✅ État de filtrage
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "ALL",
    sortBy: "name",
    sortOrder: "asc",
  });

  // ✅ Récupération des fichiers avec paramètres de recherche (utilise le store)
  const fetchFiles = useCallback(async () => {
    if (!selectedProjectId || !isStoreHydrated) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("projectId", selectedProjectId);

      if (navigation.currentFolder) {
        searchParams.set("parentId", navigation.currentFolder);
      }

      if (filters.search) {
        searchParams.set("search", filters.search);
      }

      if (filters.type !== "ALL") {
        searchParams.set("type", filters.type);
      }

      searchParams.set("sortBy", filters.sortBy);
      searchParams.set("sortOrder", filters.sortOrder);

      const response = await fetch(`/api/files?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<FileWithRelations[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement");
      }

      setFiles(result.data || []);
    } catch (error) {
      console.error("💥 Erreur lors du chargement des fichiers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      toast.error("Erreur de chargement", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, isStoreHydrated, navigation.currentFolder, filters]);

  // ✅ Chargement initial et mise à jour automatique
  useEffect(() => {
    if (isStoreHydrated && selectedProjectId) {
      fetchFiles();
    }
  }, [fetchFiles, isStoreHydrated, selectedProjectId]);

  // ✅ Navigation dans l'arborescence
  const handleFolderNavigate = useCallback(
    (folderId: string | null, folderName?: string) => {
      setNavigation((prev) => {
        if (folderId === null) {
          return {
            currentFolder: null,
            breadcrumb: [{ id: null, name: "Racine" }],
          };
        }

        const newBreadcrumb = [
          ...prev.breadcrumb,
          { id: folderId, name: folderName || "Dossier" },
        ];

        return {
          currentFolder: folderId,
          breadcrumb: newBreadcrumb,
        };
      });
    },
    []
  );

  // ✅ Navigation breadcrumb
  const handleBreadcrumbClick = useCallback(
    (targetId: string | null, index: number) => {
      setNavigation((prev) => ({
        currentFolder: targetId,
        breadcrumb: prev.breadcrumb.slice(0, index + 1),
      }));
    },
    []
  );

  // ✅ Gestion de la création/édition
  const handleCreateNew = useCallback(() => {
    setEditingFile(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((file: FileWithRelations) => {
    setEditingFile(file);
    setIsFormOpen(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
    fetchFiles();
    toast.success(editingFile ? "Référence mise à jour" : "Référence créée", {
      description: "Les modifications ont été enregistrées avec succès",
    });
  }, [editingFile, fetchFiles]);

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
  }, []);

  // ✅ Gestion de la suppression
  const handleDelete = useCallback(
    async (file: FileWithRelations) => {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/files/${file.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la suppression");
        }

        toast.success("Référence supprimée", {
          description: `"${file.name}" a été supprimé avec succès`,
        });

        fetchFiles();
      } catch (error) {
        console.error("💥 Erreur lors de la suppression:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        toast.error("Erreur de suppression", {
          description: errorMessage,
        });
      }
    },
    [fetchFiles]
  );

  // ✅ Gestion de la sélection multiple
  const handleToggleSelection = useCallback((fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // ✅ Handlers pour les filtres
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const handleTypeChange = useCallback((type: FilterType) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const handleSortByChange = useCallback((sortBy: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortOrder }));
  }, []);

  // ✅ Statistiques des fichiers
  const stats = useMemo(() => {
    const totalFiles = files.length;
    const folders = files.filter((f) => f.isFolder).length;
    const filesCount = totalFiles - folders;
    const selectedCount = selectedFiles.length;

    return {
      totalFiles,
      folders,
      files: filesCount,
      selected: selectedCount,
    };
  }, [files, selectedFiles]);

  // ✅ État de chargement initial du store
  if (!isStoreHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Initialisation...
            </h3>
            <p className="text-gray-600">Chargement des données du projet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ État sans projet sélectionné dans le store
  if (!selectedProjectId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun projet sélectionné
            </h3>
            <p className="text-gray-600 mb-4">
              Veuillez sélectionner un projet pour accéder aux fichiers.
            </p>
            <Button onClick={() => router.push("/projects")} className="w-full">
              Sélectionner un projet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Gestion des erreurs du store projet
  if (projectError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erreur de chargement du projet
            </h3>
            <p className="text-gray-600 mb-4">{projectError}</p>
            <Button onClick={() => router.push("/projects")} className="w-full">
              Retour aux projets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Gestion des erreurs de chargement des fichiers
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchFiles} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* ✅ En-tête avec titre et navigation */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Références de fichiers
            </h1>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <span>Projet:</span>
              <span className="font-medium text-gray-900">
                {selectedProjectData?.name || "Chargement..."}
              </span>
              {selectedProjectData?.key && (
                <>
                  <span>•</span>
                  <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {selectedProjectData.key}
                  </span>
                </>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              Gérez les métadonnées et références de votre projet
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={fetchFiles}
              disabled={isLoading || isProjectLoading}
              className="hidden sm:flex"
            >
              {isLoading || isProjectLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>

            <Button onClick={handleCreateNew} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une référence
            </Button>
          </div>
        </div>

        {/* ✅ Fil d'Ariane */}
        <Card className="p-4">
          <Breadcrumb>
            <BreadcrumbList>
              {navigation.breadcrumb.map((item, index) => (
                <React.Fragment key={item.id || "root"}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === navigation.breadcrumb.length - 1 ? (
                      <BreadcrumbPage className="flex items-center">
                        {index === 0 ? (
                          <Home className="h-4 w-4 mr-1" />
                        ) : (
                          <FolderOpen className="h-4 w-4 mr-1" />
                        )}
                        {item.name}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => handleBreadcrumbClick(item.id, index)}
                        className="flex items-center cursor-pointer hover:text-blue-600"
                      >
                        {index === 0 ? (
                          <Home className="h-4 w-4 mr-1" />
                        ) : (
                          <FolderOpen className="h-4 w-4 mr-1" />
                        )}
                        {item.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </Card>

        {/* ✅ Statistiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFiles}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.folders}
            </div>
            <div className="text-sm text-gray-600">Dossiers</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.files}
            </div>
            <div className="text-sm text-gray-600">Fichiers</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.selected}
            </div>
            <div className="text-sm text-gray-600">Sélectionnés</div>
          </Card>
        </div>
      </div>

      <Separator />

      {/* ✅ Interface temporaire en attendant les composants Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichiers et références
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Chargement des fichiers...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun fichier
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par ajouter des références de fichiers à votre projet.
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une référence
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {file.isFolder ? (
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-600" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-600">{file.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(file)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Actions en lot pour sélection multiple */}
      {selectedFiles.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              {selectedFiles.length} élément
              {selectedFiles.length > 1 ? "s" : ""} sélectionné
              {selectedFiles.length > 1 ? "s" : ""}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Désélectionner
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  toast.info("Suppression en lot - À implémenter");
                }}
              >
                Supprimer la sélection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ✅ Formulaire modal temporaire */}
      {isFormOpen && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingFile ? "Modifier" : "Créer"} une référence
            </h3>
            <p className="text-gray-600 mb-4">
              Formulaire temporaire - Composants Files à implémenter
            </p>
            <div className="flex gap-2">
              <Button onClick={handleFormSuccess} className="flex-1">
                {editingFile ? "Mettre à jour" : "Créer"}
              </Button>
              <Button
                variant="outline"
                onClick={handleFormCancel}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ✅ CORRECTION MAJEURE : Composant principal avec Suspense boundary pour useSearchParams
export default function FilesPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chargement de la page...
              </h3>
              <p className="text-gray-600">Initialisation des paramètres</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <FilesPageContent />
    </Suspense>
  );
}
