// app/projects/page.tsx

/**
 * RÔLE : Page principale de gestion des projets utilisant les composants existants
 * RESPONSABILITÉS :
 * - Vérifier l'authentification avec Better Auth useSession (@/lib/auth/auth-client)
 * - Afficher la liste des projets avec filtrage et recherche
 * - Gérer les opérations CRUD des projets via les composants existants
 * - Navigation vers la page détail du projet sélectionné (/projects/[id])
 * - Interface responsive et moderne avec gestion d'états
 * - Utiliser le store optimisé avec la table Project
 * - Protection contre les boucles infinies d'hydratation et d'authentification
 *
 * COMPOSANTS UTILISÉS :
 * - ProjectForm: Formulaire de création/édition (@/components/projects/ProjectForm)
 * - ProjectsList: Affichage de la liste des projets (@/components/projects/ProjectsList)
 * - ProjectsFilter: Filtrage et recherche (@/components/projects/ProjectsFilter)
 * - useSelectedProjectStore: Store Zustand optimisé (@/stores/useSelectedProjectStore)
 * - useProjectStoreHydration: Hook d'hydratation sécurisée
 *
 * LIBS UTILISÉS :
 * - React hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 client component avec Link navigation
 * - Better Auth: useSession pour l'authentification
 * - shadcn/ui: Card, Button, Alert, Skeleton
 * - Sonner: Toast notifications
 * - lucide-react: Icons
 * - TypeScript strict mode avec Next.js 15
 * - Zustand: Store management avec persistance
 *
 * API :
 * - GET /api/projects (liste des projets selon userId)
 * - POST /api/projects (création avec userId)
 * - GET /api/projects/[id] (fetch d'un projet)
 * - PUT /api/projects/[id] (édition de projet)
 * - DELETE /api/projects/[id] (suppression de projet)
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo, JSX } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  Grid3X3,
  List,
  RefreshCw,
  Activity,
  User,
  LogOut,
  Settings,
  Home,
  ArrowLeft,
  BarChart3,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  TrendingUp,
  Archive,
  Lock,
  Globe,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { toast } from "sonner";

// Composants existants
import ProjectForm from "@/components/projects/ProjectForm";
import ProjectsList from "@/components/projects/ProjectsList";
import ProjectsFilter from "@/components/projects/ProjectsFilter";

import {
  useSelectedProjectStore,
  useProjectStoreHydration,
  useSelectedProjectId,
  useSelectedProjectData,
  useProjectLoading,
  useProjectError,
  useProjectActions,
} from "@/stores/useSelectedProjectStore";
 
// Types basés sur le schéma Prisma Project 
interface ProjectSimple {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Types pour l'état de la page
type LoadingState = "idle" | "loading" | "success" | "error";
type ViewMode = "grid" | "list";

interface PageState {
  projects: ProjectSimple[];
  filteredProjects: ProjectSimple[];
  loadingState: LoadingState;
  error: string | null;
  isFormOpen: boolean;
  viewMode: ViewMode;
  searchTerm: string;
  statusFilter: string;
}

export default function ProjectsPage(): JSX.Element {
  const router = useRouter();

  // ✅ CORRECTION: Authentification Better Auth avec gestion d'erreur
  const {
    data: session,
    isPending: isAuthLoading,
    error: authError,
  } = useSession();

  // ✅ CORRECTION: État de la page avec initialisation stable
  const [state, setState] = useState<PageState>(() => ({
    projects: [],
    filteredProjects: [],
    loadingState: "idle",
    error: null,
    isFormOpen: false,
    viewMode: "grid",
    searchTerm: "",
    statusFilter: "all",
  }));

  // ✅ CORRECTION: Store avec hooks spécialisés pour éviter les re-renders
  const selectedProjectId = useSelectedProjectId();
  const projectData = useSelectedProjectData();
  const isLoading = useProjectLoading();
  const projectError = useProjectError();
  const {
    setSelectedProjectId,
    loadProjectData,
    clearProject,
    updateProjectData,
    refreshProject,
  } = useProjectActions();

  // ✅ CORRECTION: Hydratation avec hook séparé
  const isHydrated = useProjectStoreHydration();

  /**
   * ✅ CORRECTION: Mise à jour d'état optimisée
   */
  const updateState = useCallback((updates: Partial<PageState>): void => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  /**
   * ✅ CORRECTION: Vérification d'authentification stable avec gestion d'erreur
   */
  const authState = useMemo(() => {
    const isAuthenticated = Boolean(
      session?.user && !isAuthLoading && !authError
    );
    const currentUserId = session?.user?.id;

    return {
      isAuthenticated,
      currentUserId,
      isLoading: isAuthLoading,
      hasError: Boolean(authError),
      error: authError?.message || null,
    };
  }, [session, isAuthLoading, authError]);

  /**
   * ✅ CORRECTION: Chargement des projets avec protection contre les boucles
   */
  const loadProjects = useCallback(async (): Promise<void> => {
    if (!authState.isAuthenticated || !authState.currentUserId) {
      console.log("🔒 Utilisateur non authentifié, arrêt du chargement");
      return;
    }

    if (state.loadingState === "loading") {
      console.log("🔄 Chargement déjà en cours, ignorer");
      return;
    }

    console.log(
      "🔄 Chargement des projets pour l'utilisateur:",
      authState.currentUserId
    );

    updateState({
      loadingState: "loading",
      error: null,
    });

    try {
      // Construction des paramètres de requête
      const params = new URLSearchParams({
        userId: authState.currentUserId,
      });

      if (state.searchTerm.trim()) {
        params.append("search", state.searchTerm.trim());
      }

      if (state.statusFilter && state.statusFilter !== "all") {
        params.append("status", state.statusFilter);
      }

      const response = await fetch(`/api/projects?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      console.log("📡 Réponse API:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée, veuillez vous reconnecter");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<ProjectSimple[]> = await response.json();
      console.log("📦 Données reçues:", data);

      if (!data.success) {
        throw new Error(data.error || data.message || "Erreur serveur");
      }

      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Format de données invalide");
      }

      // Tri des projets par ordre selon le schéma Prisma
      const sortedProjects = [...data.data].sort((a, b) => a.order - b.order);

      console.log("✅ Projets chargés:", sortedProjects.length);

      updateState({
        projects: sortedProjects,
        filteredProjects: sortedProjects,
        loadingState: "success",
        error: null,
      });

      // Toast de succès discret
      if (sortedProjects.length > 0) {
        toast.success(`${sortedProjects.length} projet(s) chargé(s)`, {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("💥 Erreur chargement:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      updateState({
        error: errorMessage,
        loadingState: "error",
      });

      toast.error(`Erreur: ${errorMessage}`, {
        duration: 5000,
      });

      if (errorMessage.includes("Session expirée")) {
        setTimeout(() => router.push("/auth/signin"), 2000);
      }
    }
  }, [
    authState.isAuthenticated,
    authState.currentUserId,
    state.searchTerm,
    state.statusFilter,
    state.loadingState,
    updateState,
    router,
  ]);

  /**
   * ✅ CORRECTION: Effet de chargement avec protection contre les boucles infinies
   */
  useEffect(() => {
    let mounted = true;

    const shouldLoad =
      state.loadingState === "idle" &&
      isHydrated &&
      authState.isAuthenticated &&
      !authState.isLoading &&
      !authState.hasError;

    if (shouldLoad && mounted) {
      console.log("🚀 Initialisation du chargement des projets");
      loadProjects();
    }

    return () => {
      mounted = false;
    };
  }, [
    state.loadingState,
    isHydrated,
    authState.isAuthenticated,
    authState.isLoading,
    authState.hasError,
  ]); // ✅ Dépendances fixes

  /**
   * ✅ CORRECTION: Filtrage sans dépendance circulaire
   */
  useEffect(() => {
    if (state.projects.length === 0) return;

    let filtered = [...state.projects];

    // Filtrage par terme de recherche
    if (state.searchTerm.trim()) {
      const lowerSearchTerm = state.searchTerm.toLowerCase();
      filtered = filtered.filter((project) => {
        const matchesName = project.name
          .toLowerCase()
          .includes(lowerSearchTerm);
        const matchesKey = project.key.toLowerCase().includes(lowerSearchTerm);
        const matchesDescription =
          project.description?.toLowerCase().includes(lowerSearchTerm) ?? false;
        const matchesSlug = project.slug
          .toLowerCase()
          .includes(lowerSearchTerm);

        return matchesName || matchesKey || matchesDescription || matchesSlug;
      });
    }

    // Filtrage par statut
    if (state.statusFilter && state.statusFilter !== "all") {
      filtered = filtered.filter(
        (project) => project.status === state.statusFilter
      );
    }

    console.log(
      "🎯 Projets filtrés:",
      filtered.length,
      "/",
      state.projects.length
    );
    updateState({ filteredProjects: filtered });
  }, [state.searchTerm, state.statusFilter, state.projects]);

  /**
   * Gestion de la recherche via ProjectsFilter
   */
  const handleFilter = useCallback(
    (searchTerm: string): void => {
      console.log("🔍 Recherche:", searchTerm);
      updateState({ searchTerm });
    },
    [updateState]
  );

  /**
   * Gestion du filtrage par statut
   */
  const handleStatusFilter = useCallback(
    (status: string): void => {
      console.log("📊 Filtrage par statut:", status);
      updateState({ statusFilter: status });
    },
    [updateState]
  );

  /**
   * Navigation vers la page détail du projet
   */
  const handleProjectSelect = useCallback(
    (project: ProjectSimple): void => {
      console.log("🔍 Navigation vers le projet:", project.name, project.id);

      // Mise à jour du store avec l'ID du projet sélectionné
      setSelectedProjectId(project.id);

      // Toast de navigation
      toast.success(`Ouverture de ${project.name}`, {
        duration: 2000,
      });

      // Navigation vers la page détail avec Next.js 15
      router.push(`/projects/${project.id}`);
    },
    [setSelectedProjectId, router]
  );

  /**
   * Gère l'édition d'un projet
   */
  const handleEdit = useCallback(
    async (project: ProjectSimple): Promise<void> => {
      console.log("✏️ Édition du projet:", project.name, project.id);

      setSelectedProjectId(project.id);

      if (!projectData || projectData.id !== project.id) {
        await loadProjectData(project.id);
      }

      updateState({ isFormOpen: true });
    },
    [setSelectedProjectId, projectData, loadProjectData, updateState]
  );

  /**
   * Gère la suppression d'un projet
   */
  const handleDelete = useCallback(
    async (projectId: string): Promise<void> => {
      const project = state.projects.find((p) => p.id === projectId);

      if (!project) {
        toast.error("Projet non trouvé");
        return;
      }

      const confirmMessage = `Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log("🗑️ Suppression du projet:", projectId);

      const deletingToast = toast.loading(`Suppression de ${project.name}...`);

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Échec suppression: ${response.status}`);
        }

        const result: ApiResponse<null> = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || result.message || "Suppression échouée"
          );
        }

        const updatedProjects = state.projects.filter(
          (p) => p.id !== projectId
        );
        const updatedFilteredProjects = state.filteredProjects.filter(
          (p) => p.id !== projectId
        );

        updateState({
          projects: updatedProjects,
          filteredProjects: updatedFilteredProjects,
        });

        if (selectedProjectId === projectId) {
          clearProject();
        }

        console.log("✅ Projet supprimé avec succès");

        toast.success(`Projet "${project.name}" supprimé`, {
          id: deletingToast,
          duration: 3000,
        });
      } catch (error) {
        console.error("💥 Erreur suppression:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression";

        toast.error(`Erreur: ${errorMessage}`, {
          id: deletingToast,
          duration: 5000,
        });
      }
    },
    [
      state.projects,
      state.filteredProjects,
      selectedProjectId,
      clearProject,
      updateState,
    ]
  );

  /**
   * Gère le changement d'ordre des projets
   */
  const handleReorder = useCallback(
    async (projectId: string, direction: "up" | "down"): Promise<void> => {
      const currentIndex = state.projects.findIndex((p) => p.id === projectId);
      const currentProject = state.projects[currentIndex];

      if (!currentProject) return;

      let newOrder: number;
      if (direction === "up" && currentIndex > 0) {
        newOrder = state.projects[currentIndex - 1].order - 1;
      } else if (
        direction === "down" &&
        currentIndex < state.projects.length - 1
      ) {
        newOrder = state.projects[currentIndex + 1].order + 1;
      } else {
        return;
      }

      console.log(
        `📊 Réorganisation ${direction}:`,
        currentProject.name,
        "ordre:",
        currentProject.order,
        "→",
        newOrder
      );

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order: newOrder }),
        });

        if (!response.ok) {
          throw new Error(`Échec mise à jour: ${response.status}`);
        }

        const result: ApiResponse<ProjectSimple> = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || "Mise à jour échouée");
        }

        const updatedProjects = state.projects
          .map((p) => (p.id === projectId ? { ...p, order: newOrder } : p))
          .sort((a, b) => a.order - b.order);

        const updatedFilteredProjects = state.filteredProjects
          .map((p) => (p.id === projectId ? { ...p, order: newOrder } : p))
          .sort((a, b) => a.order - b.order);

        updateState({
          projects: updatedProjects,
          filteredProjects: updatedFilteredProjects,
        });

        toast.success(`Ordre de ${currentProject.name} mis à jour`);
      } catch (error) {
        console.error("💥 Erreur réorganisation:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erreur lors de la réorganisation";
        toast.error(`Erreur: ${errorMessage}`);
      }
    },
    [state.projects, state.filteredProjects, updateState]
  );

  /**
   * Gère le succès du formulaire ProjectForm
   */
  const handleFormSuccess = useCallback(
    (result: ApiResponse<ProjectSimple>): void => {
      console.log("📝 Succès du formulaire:", result);

      if (result.success && result.data) {
        if (selectedProjectId) {
          const updateProjectInArray = (projects: ProjectSimple[]) =>
            projects.map((p) => (p.id === result.data!.id ? result.data! : p));

          updateState({
            projects: updateProjectInArray(state.projects),
            filteredProjects: updateProjectInArray(state.filteredProjects),
          });

          toast.success("Projet mis à jour");
          console.log("✅ Projet mis à jour dans la liste");
        } else {
          const addProjectToArray = (projects: ProjectSimple[]) =>
            [...projects, result.data!].sort((a, b) => a.order - b.order);

          updateState({
            projects: addProjectToArray(state.projects),
            filteredProjects: addProjectToArray(state.filteredProjects),
          });

          toast.success("Projet créé");
          console.log("✅ Nouveau projet ajouté à la liste");
        }

        updateState({ isFormOpen: false });
        clearProject();
      }
    },
    [
      selectedProjectId,
      clearProject,
      updateState,
      state.projects,
      state.filteredProjects,
    ]
  );

  /**
   * Gère le changement de mode d'affichage
   */
  const handleViewModeChange = useCallback(
    (mode: ViewMode): void => {
      console.log("👀 Changement de vue:", mode);
      updateState({ viewMode: mode });
    },
    [updateState]
  );

  /**
   * Gère le rafraîchissement des données
   */
  const handleRefresh = useCallback((): void => {
    console.log("🔄 Rafraîchissement demandé");
    updateState({
      loadingState: "idle",
      searchTerm: "",
      statusFilter: "all",
    });
  }, [updateState]);

  /**
   * Gère l'ouverture/fermeture du formulaire
   */
  const handleFormToggle = useCallback(
    (open: boolean): void => {
      console.log("📋 Toggle formulaire:", open);
      updateState({ isFormOpen: open });
      if (!open) {
        clearProject();
      }
    },
    [updateState, clearProject]
  );

  /**
   * Gère la création d'un nouveau projet
   */
  const handleCreate = useCallback((): void => {
    console.log("➕ Création nouveau projet");
    clearProject(); // S'assurer qu'aucun projet n'est sélectionné
    updateState({ isFormOpen: true });
  }, [clearProject, updateState]);

  /**
   * Gestion de la déconnexion Better Auth
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      console.log("🚪 Déconnexion utilisateur");
      // Implémentation selon Better Auth
      // await signOut();
      toast.success("Déconnexion réussie");
      router.push("/auth/signin");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  }, [router]);

  // États dérivés avec useMemo pour optimisation des performances
  const isLoadingState = useMemo(
    () => state.loadingState === "loading",
    [state.loadingState]
  );
  const isError = useMemo(
    () => state.loadingState === "error",
    [state.loadingState]
  );
  const isEmpty = useMemo(
    () =>
      state.loadingState === "success" && state.filteredProjects.length === 0,
    [state.loadingState, state.filteredProjects.length]
  );
  const hasProjects = useMemo(
    () => state.projects.length > 0,
    [state.projects.length]
  );

  // Statistiques dérivées selon le schéma Prisma
  const stats = useMemo(() => {
    if (!hasProjects)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        archived: 0,
        private: 0,
        public: 0,
      };

    return {
      total: state.projects.length,
      active: state.projects.filter((p) => p.status === "ACTIVE").length,
      inactive: state.projects.filter((p) => p.status === "INACTIVE").length,
      archived: state.projects.filter((p) => p.status === "ARCHIVED").length,
      private: state.projects.filter((p) => p.visibility === "PRIVATE").length,
      public: state.projects.filter((p) => p.visibility === "PUBLIC").length,
    };
  }, [hasProjects, state.projects]);

  // ✅ CORRECTION: Affichage de loading avec diagnostic amélioré
  if (authState.isLoading || !isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="text-lg font-medium">Initialisation</h3>
              <p className="text-gray-600">
                {!isHydrated
                  ? "Hydratation du store..."
                  : "Vérification de l'authentification..."}
              </p>
              {/* ✅ DIAGNOSTIC: Affichage des états pour debug */}
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <div>Hydraté: {isHydrated ? "✅" : "⳿"}</div>
                <div>Auth Loading: {authState.isLoading ? "⳿" : "✅"}</div>
                <div>Session: {session ? "✅" : "❌"}</div>
                {authState.hasError && (
                  <div className="text-red-500">Erreur: {authState.error}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authState.hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Erreur d'authentification
              </h3>
              <p className="text-gray-600 mt-2">{authState.error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Se reconnecter
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirection si non authentifié
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <User className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Connexion requise
              </h3>
              <p className="text-gray-600 mt-2">
                Vous devez être connecté pour accéder à vos projets
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/auth/signin" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <User className="h-4 w-4 mr-2" />
                  Se connecter
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Accueil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 space-y-6">
        {/* En-tête de la page avec navigation et informations utilisateur */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Mes Projets
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                  {session?.user?.name && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {session.user.name}
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {hasProjects
                      ? `${stats.total} projet(s) • ${stats.active} actif(s)`
                      : "Aucun projet"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              {/* Boutons de vue responsive */}
              <div className="flex rounded-lg border border-gray-200 p-1 bg-white">
                <Button
                  variant={state.viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("grid")}
                  className="flex-1 sm:flex-initial"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Grille
                </Button>
                <Button
                  variant={state.viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("list")}
                  className="flex-1 sm:flex-initial"
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
              </div>

              {/* Actions principales */}
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingState}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isLoadingState ? "animate-spin" : ""
                    }`}
                  />
                  Actualiser
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </div>
            </div>
          </div>

          {/* Statistiques rapides en cards responsive */}
          {hasProjects && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    Total
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.active}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Activity className="h-3 w-3" />
                    Actifs
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.inactive}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Inactifs
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {stats.archived}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Archive className="h-3 w-3" />
                    Archivés
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.private}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Privés
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.public}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    <Globe className="h-3 w-3" />
                    Publics
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Zone de filtrage avec composant ProjectsFilter */}
        <Card>
          <CardContent className="p-4">
            <ProjectsFilter
              searchTerm={state.searchTerm}
              statusFilter={state.statusFilter}
              onSearchChange={handleFilter}
              onStatusFilterChange={handleStatusFilter}
              totalCount={state.projects.length}
              filteredCount={state.filteredProjects.length}
            />
          </CardContent>
        </Card>

        {/* Contenu principal avec ProjectsList */}
        {isLoadingState ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3 py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Chargement des projets...</span>
              </div>
              {/* Skeleton des projets */}
              <div className="space-y-4 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="p-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      Erreur lors du chargement des projets
                    </p>
                    <p className="text-sm">{state.error}</p>
                    <Button
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réessayer
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : isEmpty ? (
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              {state.searchTerm || state.statusFilter !== "all" ? (
                <>
                  <Search className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Aucun résultat trouvé
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Essayez de modifier vos critères de recherche ou de
                      filtrage
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={() =>
                        updateState({ searchTerm: "", statusFilter: "all" })
                      }
                      variant="outline"
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Aucun projet trouvé
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Commencez par créer votre premier projet pour organiser
                      votre travail
                    </p>
                  </div>
                  <Button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer mon premier projet
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          // ✅ UTILISATION DU COMPOSANT ProjectsList
          <ProjectsList
            projects={state.filteredProjects}
            viewMode={state.viewMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={handleProjectSelect}
            onReorder={handleReorder}
            onCreate={handleCreate}
            loading={isLoadingState}
          />
        )}

        {/* Modal de formulaire avec ProjectForm */}
        {state.isFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    {selectedProjectId
                      ? "Modifier le projet"
                      : "Nouveau projet"}
                  </h2>
                  <Button
                    onClick={() => handleFormToggle(false)}
                    variant="ghost"
                    size="sm"
                  >
                    ×
                  </Button>
                </div>
                <ProjectForm
                  projectId={selectedProjectId}
                  onSuccess={handleFormSuccess}
                  onCancel={() => handleFormToggle(false)}
                />
              </div> 
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
