// app/projects/[id]/files/page.tsx

/**
 * RÔLE : Page principale de gestion des métadonnées de fichiers par projet
 * RESPONSABILITÉS :
 * - Interface complète de gestion des fichiers avec sélecteur de vue (list/card/branch)
 * - Filtrage avancé par type FileType selon schéma Prisma EXACT
 * - Navigation hiérarchique dans les dossiers virtuels
 * - Actions CRUD complètes avec formulaire modal
 * - Gestion des états loading, error et empty avec feedback utilisateur
 * - Intégration API sécurisée avec validation côté client et serveur
 * - Design responsive moderne avec Tailwind CSS et composants shadcn/ui
 * - Support des métadonnées de développement (import, export, use, script)
 *
 * COMPOSANTS UTILISÉS :
 * - FilesDisplay: Sélecteur de mode d'affichage avec persistance d'état
 * - FilesFilter: Filtrage avancé avec recherche et tri multi-colonnes
 * - FileList: Liste principale avec boutons d'action et vues multiples
 * - FilesForm: Formulaire modal pour création/édition avec validation Zod
 * - Button, Card, CardContent: Composants UI shadcn/ui modernes
 * - Breadcrumb: Navigation de fil d'Ariane pour hiérarchie
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 avec TypeScript strict mode et App Router
 * - API Routes Next.js 15 avec gestion des paramètres mise à jour
 * - shadcn/ui: Button, Card, Breadcrumb, Separator components
 * - lucide-react: Icons modernes pour navigation et actions
 * - sonner: Toast notifications pour feedback temps réel
 * - Tailwind CSS: Design responsive mobile-first avec animations
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import des composants Files
import FilesDisplay from "@/components/files/FilesDisplay";
import FilesFilter from "@/components/files/FilesFilter";
import FileList from "@/components/files/FilesList";
import FilesForm from "@/components/files/FilesForm";

// ✅ Import des types centralisés
import type {
  FileWithRelations,
  ViewMode,
  FilterType,
  SortBy,
  SortOrder,
  ApiResponse,
  FileSearchParams,
} from "@/types/files";

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

export default function ProjectFilesPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ ID du projet depuis les paramètres de route
  const projectId = params.id as string;

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

  // ✅ Récupération des fichiers avec paramètres de recherche
  const fetchFiles = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("projectId", projectId);

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
  }, [projectId, navigation.currentFolder, filters]);

  // ✅ Chargement initial et mise à jour automatique
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ✅ Navigation dans l'arborescence
  const handleFolderNavigate = useCallback(
    (folderId: string | null, folderName?: string) => {
      setNavigation((prev) => {
        if (folderId === null) {
          // Retour à la racine
          return {
            currentFolder: null,
            breadcrumb: [{ id: null, name: "Racine" }],
          };
        }

        // Navigation vers un sous-dossier
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

  // ✅ Gestion des erreurs et états vides
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
            <p className="text-gray-600 mt-1">
              Gérez les métadonnées et références de votre projet
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={fetchFiles}
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

      {/* ✅ Contrôles d'affichage et filtrage */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mode d'affichage */}
        <div className="lg:col-span-1">
          <FilesDisplay viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Filtres */}
        <div className="lg:col-span-2">
          <FilesFilter
            value={filters.search}
            onChange={handleSearchChange}
            selectedType={filters.type}
            onTypeChange={handleTypeChange}
            sortBy={filters.sortBy}
            onSortByChange={handleSortByChange}
            sortOrder={filters.sortOrder}
            onSortOrderChange={handleSortOrderChange}
            placeholder="Rechercher par nom, description, import, export, use, script, tags..."
          />
        </div>
      </div>

      <Separator />

      {/* ✅ Liste principale des fichiers */}
      <FileList
        files={files}
        viewMode={viewMode}
        currentFolder={navigation.currentFolder}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={fetchFiles}
        onFolderNavigate={handleFolderNavigate}
        selectedFiles={selectedFiles}
        onToggleSelection={handleToggleSelection}
        isLoading={isLoading}
      />

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
                  // TODO: Implémenter la suppression en lot
                  toast.info("Suppression en lot - À implémenter");
                }}
              >
                Supprimer la sélection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ✅ Formulaire modal */}
      <FilesForm
        file={editingFile}
        currentFolder={navigation.currentFolder}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />
    </div>
  );
}
