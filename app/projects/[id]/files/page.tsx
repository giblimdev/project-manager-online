// app/projects/[id]/files/page.tsx

/**
 * RÔLE : Page de gestion des fichiers d'un projet spécifique via route dynamique
 * RESPONSABILITÉS :
 * - Utilise correctement l'ID de l'URL via params (route dynamique Next.js 15)
 * - Affichage des fichiers avec modes de vue multiples (liste, card, arbre)
 * - Gestion des filtres par nom, type de fichier et date via FilesFilter avec nouveaux types
 * - Basculement entre les modes d'affichage via viewMode local
 * - FilesList pour affichage selon le mode avec toutes les props requises
 * - FilesForm en modal avec Dialog géré par isOpen pour création/édition de fichiers
 * - Gestion des permissions et authentification Better Auth
 * - Interface responsive moderne avec design cards et transitions
 * - Protection contre les boucles infinies d'appels API avec cache TTL
 * - Support de l'arborescence des fichiers avec hiérarchie parent/enfant
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 * - API avec projectId en paramètre d'URL (CORRIGÉ)
 * - Types unifiés via fichier central types/files.ts
 *
 * COMPOSANTS UTILISÉS :
 * - FilesList: Gestionnaire d'affichage selon viewMode avec toutes actions CRUD
 * - FilesFilter: Composant de filtrage avec props (value, onChange, etc.)
 * - FilesForm: Formulaire en Dialog modal avec prop isOpen et callbacks
 * - Card, CardContent, Button: Composants UI shadcn/ui
 * - Skeleton: Composant de loading state
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 avec route dynamique et nouvelles API routes
 * - Better Auth: Authentification et gestion des sessions utilisateur (isPending, data, error)
 * - TypeScript strict mode avec interfaces selon types/files.ts
 * - Tailwind CSS: Design moderne responsive avec gradient et shadows
 * - lucide-react: Icons modernes (RefreshCw, AlertTriangle, File, etc.)
 * - sonner: Toast notifications pour les actions utilisateur
 * - date-fns: Formatage des dates et tri chronologique
 *
 * API :
 * - GET /api/files?projectId=xxx : Récupération des fichiers d'un projet avec paramètres d'URL
 * - POST /api/files : Création/upload d'un nouveau fichier avec body JSON
 * - PUT /api/files/[id] : Mise à jour des métadonnées d'un fichier
 * - DELETE /api/files/[id] : Suppression d'un fichier
 */

"use client";

import React, {
  JSX,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  AlertTriangle,
  Folder,
  File,
  Upload,
  Download,
  Search,
  Filter,
  Grid,
  List,
  GitBranch,
  FileText,
  Package,
  Settings,
  Layers,
  Database,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/auth-client";
import {
  useSelectedProjectStore,
  useProjectStoreHydration,
} from "@/stores/useSelectedProjectStore";
import FilesFilter from "@/components/files/FilesFilter";
import FilesForm from "@/components/files/FilesForm";
import FilesList from "@/components/files/FilesList";

// ✅ Import des types centralisés
import type {
  FileWithRelations,
  FilterType,
  SortBy,
  SortOrder,
  ViewMode,
  ApiResponse,
} from "@/types/files";

// Interface pour l'état de la page
interface PageState {
  files: FileWithRelations[];
  isLoadingFiles: boolean;
  filesError: string | null;
  isFormOpen: boolean;
  editingFile: FileWithRelations | null;
  lastLoadedProjectId: string | null;
  currentFolderId: string | null;
  breadcrumbs: Array<{ id: string; name: string }>;
}

// Interface pour les états de filtre selon FilesFilter
interface FilterState {
  searchTerm: string;
  selectedType: FilterType;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

// Props de la page Next.js 15 avec params pour route projects/[id]/files
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FilesPage({ params }: PageProps): JSX.Element {
  // Récupération de l'ID depuis les paramètres d'URL (route projects/[id]/files)
  const [projectId, setProjectId] = useState<string | null>(null);

  // Résolution des paramètres Next.js 15 (Promise-based)
  useEffect(() => {
    params.then((resolvedParams) => {
      console.log("📋 FilesPage - ID du projet depuis URL:", resolvedParams.id);
      setProjectId(resolvedParams.id);
    });
  }, [params]);

  // Session Better Auth avec isPending au lieu de isLoading
  const {
    data: session,
    isPending: isPendingSession,
    error: sessionError,
  } = useSession();

  // Store Zustand pour le projet sélectionné
  const selectedProjectId = useSelectedProjectStore(
    (state) => state.selectedProjectId
  );
  const projectData = useSelectedProjectStore((state) => state.projectData);
  const isLoading = useSelectedProjectStore((state) => state.isLoading);
  const error = useSelectedProjectStore((state) => state.error);
  const loadProjectData = useSelectedProjectStore(
    (state) => state.loadProjectData
  );
  const setSelectedProjectId = useSelectedProjectStore(
    (state) => state.setSelectedProjectId
  );
  const isHydrated = useProjectStoreHydration();

  // États selon les interfaces des composants
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    selectedType: "ALL",
    sortBy: "name",
    sortOrder: "asc",
  });

  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // État pour la gestion des fichiers
  const [pageState, setPageState] = useState<PageState>({
    files: [],
    isLoadingFiles: false,
    filesError: null,
    isFormOpen: false,
    editingFile: null,
    lastLoadedProjectId: null,
    currentFolderId: null,
    breadcrumbs: [],
  });

  // useRef pour éviter les dépendances circulaires
  const loadFilesRef = useRef<
    ((projectId: string, folderId?: string | null) => Promise<void>) | null
  >(null);
  const isLoadingRef = useRef(false);

  // Synchronisation du projectId de l'URL avec le store
  useEffect(() => {
    if (projectId && projectId !== selectedProjectId && isHydrated) {
      console.log("🔄 FilesPage - Synchronisation store avec URL:", projectId);
      setSelectedProjectId(projectId);
    }
  }, [projectId, selectedProjectId, isHydrated, setSelectedProjectId]);

  // Chargement automatique des données avec protection contre boucles
  useEffect(() => {
    if (
      isHydrated &&
      selectedProjectId &&
      !projectData &&
      !isLoading &&
      !error
    ) {
      console.log(
        "🔄 FilesPage - Chargement automatique des données du projet"
      );
      loadProjectData(selectedProjectId);
    }
  }, [
    isHydrated,
    selectedProjectId,
    projectData,
    isLoading,
    error,
    loadProjectData,
  ]);

  // ✅ Fonction de normalisation des données API vers FileWithRelations avec mimeType nullable
  const normalizeFileData = useCallback((file: any): FileWithRelations => {
    return {
      id: file.id,
      name: file.name,
      originalName: file.originalName || null,
      type: file.type,
      mimeType: file.mimeType || null, // ✅ MimeType nullable unifié
      size: file.size || null,
      url: file.url,
      path: file.path || null,
      description: file.description || null,
      import: file.import,
      export: file.export,
      script: file.script || null,
      version: file.version || 1,
      isPublic: file.isPublic || false,
      isFolder: file.isFolder || false,
      metadata: file.metadata || {},
      tags: file.tags || [],
      createdAt: new Date(file.createdAt),
      updatedAt: new Date(file.updatedAt),
      // Normalisation de uploader avec tous les champs requis
      uploader: {
        id: file.uploader?.id || file.uploaderId || "",
        name: file.uploader?.name || null,
        email: file.uploader?.email || "",
        emailVerified: file.uploader?.emailVerified || false,
        image: file.uploader?.image || null,
        username: file.uploader?.username || null,
        firstName: file.uploader?.firstName || null,
        lastName: file.uploader?.lastName || null,
        bio: file.uploader?.bio || null,
        timezone: file.uploader?.timezone || null,
        preferences: file.uploader?.preferences || {},
        isActive: file.uploader?.isActive ?? true,
      },
      parent: file.parent
        ? {
            id: file.parent.id,
            name: file.parent.name,
            isFolder: file.parent.isFolder || false,
          }
        : null,
      children:
        file.children?.map((child: any) => normalizeFileData(child)) || [],
      project: file.project
        ? {
            id: file.project.id,
            name: file.project.name,
            key: file.project.key,
            slug: file.project.slug,
          }
        : null,
      feature: file.feature
        ? {
            id: file.feature.id,
            name: file.feature.name,
            description: file.feature.description || null,
            priority: file.feature.priority || "MEDIUM",
          }
        : null,
      userStory: file.userStory
        ? {
            id: file.userStory.id,
            title: file.userStory.title,
            description: file.userStory.description || null,
            priority: file.userStory.priority || "MEDIUM",
          }
        : null,
      task: file.task
        ? {
            id: file.task.id,
            title: file.task.title,
            description: file.task.description || null,
            priority: file.task.priority || "MEDIUM",
          }
        : null,
      sprint: file.sprint
        ? {
            id: file.sprint.id,
            name: file.sprint.name,
            goal: file.sprint.goal || null,
            status: file.sprint.status || "PLANNED",
          }
        : null,
      versions:
        file.versions?.map((version: any) => ({
          id: version.id,
          version: version.version,
          url: version.url,
          size: version.size,
          checksum: version.checksum || null,
          changelog: version.changelog || null,
          createdAt: new Date(version.createdAt),
          author: {
            id: version.author.id,
            name: version.author.name || null,
            email: version.author.email,
          },
        })) || [],
      comments:
        file.comments?.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          mentions: comment.mentions || [],
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt),
          author: {
            id: comment.author.id,
            name: comment.author.name || null,
            email: comment.author.email,
            image: comment.author.image || null,
          },
        })) || [],
      items:
        file.items?.map((item: any) => ({
          id: item.id,
          type: item.type,
          name: item.name,
          status: item.status || "ACTIVE",
        })) || [],
      _count: {
        children: file._count?.children || file.children?.length || 0,
        versions: file._count?.versions || file.versions?.length || 0,
        comments: file._count?.comments || file.comments?.length || 0,
        items: file._count?.items || file.items?.length || 0,
      },
    };
  }, []);

  // ✅ Fonction de chargement des fichiers CORRIGÉE avec gestion flexible des réponses
  const loadFiles = useCallback(
    async (projectId: string, folderId: string | null = null) => {
      if (isLoadingRef.current) {
        console.log("⚠️ Chargement déjà en cours, ignorer");
        return;
      }

      if (
        pageState.lastLoadedProjectId === projectId &&
        pageState.currentFolderId === folderId &&
        pageState.files.length > 0
      ) {
        console.log("✅ Fichiers déjà chargés pour ce projet/dossier");
        return;
      }

      console.log(
        "🔄 Chargement des fichiers pour le projet:",
        projectId,
        "dossier:",
        folderId
      );
      isLoadingRef.current = true;
      setPageState((prev) => ({
        ...prev,
        isLoadingFiles: true,
        filesError: null,
      }));

      try {
        // ✅ Construction de l'URL avec paramètres de requête
        const searchParams = new URLSearchParams({
          projectId,
          ...(folderId && { parentId: folderId }),
        });

        const url = `/api/files?${searchParams.toString()}`;

        console.log("📡 GET", url);

        // ✅ Requête GET sans body
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        // ✅ CORRECTION PRINCIPALE : Gestion flexible des formats de réponse
        const result: FilesApiResponse = await response.json();
        console.log("📡 FilesPage - Réponse API:", result);

        let files: any[] = [];

        // ✅ Gestion des différents formats de réponse possibles
        if (Array.isArray(result)) {
          // Format : FileWithRelations[] direct
          files = result;
        } else if (result && typeof result === "object") {
          // Vérification des différentes propriétés possibles
          if ("success" in result && result.success && result.data) {
            // Format : { success: true, data: FileWithRelations[] }
            files = result.data;
          } else if ("files" in result && result.files) {
            // Format : { files: FileWithRelations[], pagination?: ... }
            files = result.files;
          } else if ("data" in result && result.data) {
            // Format : { data: FileWithRelations[] }
            files = result.data;
          } else if ("success" in result && !result.success) {
            // Format d'erreur : { success: false, error: string }
            throw new Error(result.error || "Erreur lors du chargement");
          }
        }

        // ✅ Validation que nous avons bien un tableau
        if (!Array.isArray(files)) {
          console.warn("⚠️ Format de réponse inattendu:", result);
          files = [];
        }

        const normalizedFiles: FileWithRelations[] =
          files.map(normalizeFileData);

        console.log("✅ Fichiers chargés:", normalizedFiles.length);

        let breadcrumbs: Array<{ id: string; name: string }> = [];
        if (folderId && normalizedFiles.length > 0) {
          const currentFolder = normalizedFiles.find((f) => f.id === folderId);
          if (currentFolder) {
            breadcrumbs = [{ id: currentFolder.id, name: currentFolder.name }];
          }
        }

        setPageState((prev) => ({
          ...prev,
          files: normalizedFiles,
          isLoadingFiles: false,
          filesError: null,
          lastLoadedProjectId: projectId,
          currentFolderId: folderId,
          breadcrumbs,
        }));

        toast.success(`${normalizedFiles.length} fichier(s) chargé(s)`);
      } catch (error) {
        console.error("💥 Erreur chargement fichiers:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        setPageState((prev) => ({
          ...prev,
          files: [],
          isLoadingFiles: false,
          filesError: errorMessage,
          lastLoadedProjectId: null,
        }));
        toast.error(`Erreur: ${errorMessage}`);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [
      pageState.lastLoadedProjectId,
      pageState.currentFolderId,
      pageState.files.length,
      normalizeFileData,
    ]
  );

  // Chargement automatique avec protection contre les boucles
  useEffect(() => {
    let mounted = true;
    const shouldLoad =
      projectData?.id &&
      isHydrated &&
      !pageState.isLoadingFiles &&
      pageState.lastLoadedProjectId !== projectData.id &&
      !isLoadingRef.current;

    if (shouldLoad && mounted && loadFilesRef.current) {
      console.log("🚀 Déclenchement chargement fichiers");
      loadFilesRef.current(projectData.id, pageState.currentFolderId);
    }

    return () => {
      mounted = false;
    };
  }, [
    projectData?.id,
    isHydrated,
    pageState.isLoadingFiles,
    pageState.lastLoadedProjectId,
    pageState.currentFolderId,
  ]);

  // Reset des fichiers quand le projet change
  useEffect(() => {
    if (
      selectedProjectId !== pageState.lastLoadedProjectId &&
      pageState.files.length > 0
    ) {
      console.log("🔄 Changement de projet - Reset des fichiers");
      setPageState((prev) => ({
        ...prev,
        files: [],
        lastLoadedProjectId: null,
        filesError: null,
        currentFolderId: null,
        breadcrumbs: [],
      }));
    }
  }, [
    selectedProjectId,
    pageState.lastLoadedProjectId,
    pageState.files.length,
  ]);

  // ✅ Handlers pour le formulaire avec gestion de l'état isFormOpen
  const handleCreateFile = useCallback(() => {
    console.log("➕ Ouverture formulaire création fichier");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: true,
      editingFile: null,
    }));
  }, []);

  const handleEditFile = useCallback((file: FileWithRelations) => {
    console.log("✏️ Ouverture formulaire édition fichier:", file.name);
    setPageState((prev) => ({
      ...prev,
      isFormOpen: true,
      editingFile: file,
    }));
  }, []);

  const handleNavigateToFolder = useCallback(
    (folderId: string | null, folderName?: string) => {
      console.log("📁 Navigation vers dossier:", folderId);
      setPageState((prev) => ({
        ...prev,
        currentFolderId: folderId,
        lastLoadedProjectId: null,
        files: [],
      }));

      if (projectData?.id && loadFilesRef.current) {
        loadFilesRef.current(projectData.id, folderId);
      }
    },
    [projectData?.id]
  );

  const handleFormSuccess = useCallback(() => {
    console.log("✅ Succès formulaire - Rechargement des fichiers");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: false,
      editingFile: null,
      lastLoadedProjectId: null,
    }));

    if (projectData?.id && loadFilesRef.current) {
      loadFilesRef.current(projectData.id, pageState.currentFolderId);
    }

    toast.success(
      pageState.editingFile
        ? "Fichier mis à jour avec succès"
        : "Fichier créé avec succès"
    );
  }, [projectData?.id, pageState.currentFolderId, pageState.editingFile]);

  const handleFormCancel = useCallback(() => {
    console.log("❌ Annulation formulaire");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: false,
      editingFile: null,
    }));
  }, []);

  const handleRetryLoadFiles = useCallback(() => {
    if (projectData?.id) {
      console.log("🔄 Retry chargement fichiers");
      setPageState((prev) => ({
        ...prev,
        lastLoadedProjectId: null,
        filesError: null,
      }));
      if (loadFilesRef.current) {
        loadFilesRef.current(projectData.id, pageState.currentFolderId);
      }
    }
  }, [projectData?.id, pageState.currentFolderId]);

  // ✅ Fonction de filtrage avec gestion du mimeType et size nullable
  const filteredFiles = useMemo(() => {
    let filtered = pageState.files;

    if (filters.searchTerm) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          file.originalName
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          file.description
            ?.toLowerCase()
            .includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.selectedType !== "ALL") {
      filtered = filtered.filter((file) => file.type === filters.selectedType);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "size":
          const aSize = a.size ?? 0;
          const bSize = b.size ?? 0;
          comparison = aSize - bSize;
          break;
        case "date":
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case "uploader":
          const aName = a.uploader?.name || a.uploader?.email || "";
          const bName = b.uploader?.name || b.uploader?.email || "";
          comparison = aName.localeCompare(bName);
          break;
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [pageState.files, filters]);

  // Handlers pour FilesFilter
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  }, []);

  const handleTypeChange = useCallback((type: FilterType) => {
    setFilters((prev) => ({ ...prev, selectedType: type }));
  }, []);

  const handleSortByChange = useCallback((sortBy: SortBy) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: SortOrder) => {
    setFilters((prev) => ({ ...prev, sortOrder }));
  }, []);

  const handleRefresh = useCallback(() => {
    if (projectData?.id && loadFilesRef.current) {
      console.log("🔄 Refresh manuel des fichiers");
      setPageState((prev) => ({
        ...prev,
        lastLoadedProjectId: null,
      }));
      loadFilesRef.current(projectData.id, pageState.currentFolderId);
    }
  }, [projectData?.id, pageState.currentFolderId]);

  // Gestion des états de chargement et d'erreur
  if (
    !isHydrated ||
    (isLoading && !projectData) ||
    isPendingSession ||
    !projectId
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {!projectId
                ? "Chargement des paramètres..."
                : !isHydrated
                ? "Initialisation..."
                : isPendingSession
                ? "Vérification de la session..."
                : "Chargement du projet..."}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (!session || sessionError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                Authentification requise
              </h2>
              <p className="text-gray-600">
                {sessionError
                  ? `Erreur d'authentification: ${sessionError.message}`
                  : "Veuillez vous connecter pour accéder à la gestion des fichiers."}
              </p>
              <Button
                onClick={() => (window.location.href = "/auth/login")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-900">
                Erreur de chargement
              </h2>
              <p className="text-red-600 text-sm">{error}</p>
              <Button
                onClick={() =>
                  selectedProjectId && loadProjectData(selectedProjectId, true)
                }
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!selectedProjectId}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <Folder className="h-16 w-16 text-gray-400 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Projet non trouvé
                </h2>
                <p className="text-gray-600">
                  Le projet avec l'ID "{projectId}" n'existe pas ou vous n'y
                  avez pas accès.
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = "/projects")}
                variant="outline"
              >
                Retour aux projets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <File className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Fichiers
                <span className="ml-3 text-base sm:text-lg font-normal text-gray-500">
                  {filteredFiles.length} / {pageState.files.length}
                </span>
                {pageState.isLoadingFiles && (
                  <RefreshCw className="inline-block ml-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600" />
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="font-medium">Projet:</span>
                <span>{projectData.name}</span>
                {projectData.key && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-mono text-xs">
                    {projectData.key}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCreateFile}
          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
        >
          <Upload className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Ajouter</span>
          <span className="hidden sm:inline">Ajouter un fichier</span>
        </Button>
      </div>

      {/* Breadcrumb navigation */}
      {pageState.breadcrumbs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateToFolder(null)}
            className="text-xs sm:text-sm"
          >
            🏠 <span className="hidden sm:inline">Racine</span>
          </Button>
          {pageState.breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.id}>
              <span>/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigateToFolder(breadcrumb.id)}
                className={`text-xs sm:text-sm ${
                  index === pageState.breadcrumbs.length - 1
                    ? "font-medium"
                    : ""
                }`}
              >
                📁 {breadcrumb.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          {(["list", "card", "branch"] as const).map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              onClick={() => setViewMode(mode)}
              className={`flex items-center px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                viewMode === mode
                  ? "bg-blue-600 text-white shadow-md transform scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              title={`Mode ${mode}`}
            >
              {mode === "list" && (
                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              {mode === "card" && (
                <Grid className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              {mode === "branch" && (
                <GitBranch className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">
                {mode === "list" && "Liste"}
                {mode === "card" && "Cartes"}
                {mode === "branch" && "Arbre"}
              </span>
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            <span className="text-gray-600">
              {filteredFiles.length} / {pageState.files.length} fichiers
            </span>
          </div>
        </div>
      </div>

      <FilesFilter
        value={filters.searchTerm}
        onChange={handleSearchChange}
        selectedType={filters.selectedType}
        onTypeChange={handleTypeChange}
        sortBy={filters.sortBy}
        onSortByChange={handleSortByChange}
        sortOrder={filters.sortOrder}
        onSortOrderChange={handleSortOrderChange}
        placeholder="Rechercher des fichiers..."
      />

      {/* Affichage des erreurs */}
      {pageState.filesError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">
                    Erreur de chargement
                  </h3>
                  <p className="text-red-600 text-sm">{pageState.filesError}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryLoadFiles}
                className="text-red-600 border-red-300 hover:bg-red-100 w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FilesList avec types unifiés */}
      {pageState.isLoadingFiles && pageState.files.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <Skeleton className="h-3 sm:h-4 w-3/4" />
                  <Skeleton className="h-3 sm:h-4 w-1/2" />
                  <Skeleton className="h-6 sm:h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <FilesList
          files={filteredFiles} // ✅ Types maintenant unifiés via types/files.ts
          viewMode={viewMode}
          currentFolder={pageState.currentFolderId}
          onEdit={handleEditFile}
          onRefresh={handleRefresh}
          onFolderNavigate={handleNavigateToFolder}
        />
      )}

      <FilesForm
        file={pageState.editingFile}
        currentFolder={pageState.currentFolderId}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        isOpen={pageState.isFormOpen}
      />
    </div>
  );
}
