// @/app/projects/[projectId]/features/page.tsx

// Rôle : Page principale de gestion des features d'un projet avec Better Auth et store Zustand exclusif
// Responsabilités : Authentification utilisateur via Better Auth, récupération des features via le store Zustand EXCLUSIVEMENT
// Composants utilisés : FeaturesList, Button, Input, Select, Card, Badge, Skeleton de shadcn/ui
// API : Routes /api/projects/[projectId]/features avec gestion d'erreurs complète
// Hooks : useSession (Better Auth pour l'utilisateur), useShallow (Zustand v5), useState, useEffect, useMemo
// Auth : Better Auth avec useSession hook pour authentification centralisée (USER ID)
// Store : useSelectedProjectStore (Zustand v5) comme SOURCE UNIQUE pour l'ID du projet avec sélecteurs optimisés
// Route : ID du projet récupéré EXCLUSIVEMENT depuis le store Zustand, pas depuis l'URL
// Next.js 15 : Page optimisée sans gestion des paramètres URL, store-first architecture
// TypeScript : Mode strict avec interfaces complètes, typage des callbacks et gardes de type
// UI : Design responsive moderne avec mobile-first, toast notifications Sonner
// Sécurité : Vérification d'authentification Better Auth et permissions projet
// Performance : Prévention des boucles infinies avec shallow equality et mémoisation complète
// Architecture : Store-first pattern, le store est la source de vérité unique pour l'ID du projet

"use client";

import { JSX, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";
import { FeaturesList } from "@/components/features/FeatureList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Grid,
  List,
  TreePine,
  Filter,
  AlertCircle,
  Loader2,
  RefreshCcw,
  ArrowLeft,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { ViewMode, FeatureWithRelations, Priority } from "@/types/feature";
// ✅ Import de useShallow pour Zustand v5
import { useShallow } from "zustand/shallow";
// ✅ Import du store comme source unique de vérité
import { useSelectedProjectStore } from "@/stores/useSelectedProjectStore";

// Types Next.js 15 compatibles (params non utilisés)
interface PageParams {
  projectId: string;
}

interface ProjectFeaturesPageProps {
  params: Promise<PageParams>;
}

// Types pour les filtres étendus
type FilterStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "all";
type FilterPriority = Priority | "all";

// Types pour les statistiques
interface FeaturesStats {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  todo: number;
  averageProgress: number;
}

export default function ProjectFeaturesPage({
  params,
}: ProjectFeaturesPageProps): JSX.Element {
  const router = useRouter();

  // ✅ Better Auth - RÉCUPÈRE LES INFOS UTILISATEUR (USER ID)
  const {
    data: session,
    isPending: authLoading,
    error: authError,
  } = useSession();

  // ✅ STORE COMME SOURCE UNIQUE : Sélecteurs Zustand v5 avec useShallow pour éviter les boucles infinies
  const {
    selectedProjectId,
    projectData,
    isLoading: projectLoading,
    error: projectError,
    isHydrated,
  } = useSelectedProjectStore(
    useShallow((state) => ({
      selectedProjectId: state.selectedProjectId,
      projectData: state.projectData,
      isLoading: state.isLoading,
      error: state.error,
      isHydrated: state.isHydrated,
    }))
  );

  // ✅ Actions séparées avec mémoisation stable
  const setSelectedProjectId = useSelectedProjectStore(
    (state) => state.setSelectedProjectId
  );
  const loadProjectData = useSelectedProjectStore(
    (state) => state.loadProjectData
  );
  const refreshProject = useSelectedProjectStore(
    (state) => state.refreshProject
  );
  const setHydrated = useSelectedProjectStore((state) => state.setHydrated);

  // États pour les données features (seules données non gérées par le store)
  const [allFeatures, setAllFeatures] = useState<FeatureWithRelations[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState<boolean>(false);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [stats, setStats] = useState<FeaturesStats | null>(null);

  // États pour l'interface et filtres
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ✅ Hook d'hydratation sécurisé avec Zustand
  useEffect(() => {
    let mounted = true;

    const hydrateStore = async (): Promise<void> => {
      try {
        console.log("🔄 Store - Début de l'hydratation");
        await useSelectedProjectStore.persist.rehydrate();

        if (mounted) {
          console.log("✅ Store - Hydratation terminée");
          setHydrated(true);
        }
      } catch (error) {
        console.error("💥 Store - Erreur hydratation:", error);
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    hydrateStore();

    return () => {
      mounted = false;
    };
  }, []); // ✅ Dépendances vides pour éviter les boucles

  // ✅ RÉCUPÉRATION DES FEATURES : Basée EXCLUSIVEMENT sur le store
  const fetchFeatures = useCallback(
    async (showToast: boolean = true): Promise<void> => {
      // ✅ VÉRIFICATION : Project ID du STORE ET User ID doivent être disponibles
      if (!selectedProjectId || !session?.user?.id) {
        console.log("⚠️ Skip fetch features - missing data:", {
          selectedProjectId,
          userId: session?.user?.id,
        });
        return;
      }

      try {
        setFeaturesLoading(true);
        setFeaturesError(null);

        console.log(
          "🔄 Fetching features for project from STORE:",
          selectedProjectId
        );

        const response = await fetch(
          `/api/projects/${selectedProjectId}/features`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        console.log("📡 Features API response status:", response.status);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Features not found");
          }
          if (response.status === 403) {
            throw new Error("Access denied to project features");
          }
          throw new Error(
            `Failed to fetch features: ${response.status} ${response.statusText}`
          );
        }

        const data: FeatureWithRelations[] = await response.json();
        console.log("✅ Features loaded:", data.length);
        setAllFeatures(data);

        // Calcul des statistiques
        const statistics: FeaturesStats = {
          total: data.length,
          completed: data.filter((f) => f.status === "DONE").length,
          inProgress: data.filter((f) => f.status === "IN_PROGRESS").length,
          blocked: data.filter((f) => f.status === "BLOCKED").length,
          todo: data.filter((f) => f.status === "TODO").length,
          averageProgress:
            data.length > 0
              ? data.reduce((sum, f) => sum + f.progress, 0) / data.length
              : 0,
        };
        setStats(statistics);

        if (showToast) {
          toast.success("Features loaded successfully", {
            description: `Loaded ${data.length} feature${
              data.length !== 1 ? "s" : ""
            }`,
          });
        }
      } catch (error) {
        console.error("❌ Error fetching features:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load features";
        setFeaturesError(errorMessage);
        toast.error("Features Load Error", {
          description: errorMessage,
        });
      } finally {
        setFeaturesLoading(false);
      }
    },
    [selectedProjectId, session?.user?.id]
  );

  // ✅ CHARGEMENT INITIAL : Basé sur le store hydraté
  const initializeFeaturesLoad = useCallback(() => {
    if (
      isHydrated &&
      selectedProjectId &&
      session?.user?.id &&
      !authLoading &&
      !projectLoading
    ) {
      console.log("🚀 Initializing features fetch from STORE:", {
        selectedProjectId,
        userId: session.user.id,
        projectName: projectData?.name,
      });
      fetchFeatures(false);
    }
  }, [
    isHydrated,
    selectedProjectId,
    session?.user?.id,
    authLoading,
    projectLoading,
    projectData?.name,
    fetchFeatures,
  ]);

  useEffect(() => {
    initializeFeaturesLoad();
  }, [initializeFeaturesLoad]);

  // ✅ Fonction de rafraîchissement avec mémoisation stable
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!selectedProjectId) {
      toast.warning("No project selected", {
        description: "Please select a project first to refresh data",
      });
      return;
    }

    try {
      setRefreshing(true);
      console.log("🔄 Refresh complet - projet + features from STORE");

      await refreshProject();
      await fetchFeatures(false);

      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("❌ Error during refresh:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [selectedProjectId, refreshProject, fetchFeatures]);

  // ✅ Filtrage optimisé des features avec mémoisation
  const filteredFeatures = useMemo((): FeatureWithRelations[] => {
    return allFeatures.filter((feature) => {
      const matchesSearch =
        searchTerm === "" ||
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (feature.description &&
          feature.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (feature.acceptanceCriteria &&
          feature.acceptanceCriteria
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesPriority =
        priorityFilter === "all" || feature.priority === priorityFilter;
      const matchesStatus =
        statusFilter === "all" || feature.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [allFeatures, searchTerm, priorityFilter, statusFilter]);

  // ✅ Gestionnaire de mise à jour avec mémoisation
  const handleFeaturesUpdate = useCallback((): void => {
    fetchFeatures(false);
  }, [fetchFeatures]);

  // Fonctions utilitaires mémorisées
  const getPriorityVariant = useCallback(
    (
      priority: Priority
    ): "destructive" | "secondary" | "default" | "outline" => {
      switch (priority) {
        case "CRITICAL":
          return "destructive";
        case "HIGH":
          return "secondary";
        case "MEDIUM":
          return "default";
        case "LOW":
          return "outline";
        default:
          return "outline";
      }
    },
    []
  );

  const getStatusVariant = useCallback(
    (status: string): "destructive" | "secondary" | "default" | "outline" => {
      switch (status) {
        case "DONE":
          return "default";
        case "IN_PROGRESS":
          return "secondary";
        case "BLOCKED":
          return "destructive";
        case "TODO":
          return "outline";
        default:
          return "outline";
      }
    },
    []
  );

  // ✅ GARDE DE TYPE PRINCIPALE : Vérifier que selectedProjectId est défini via le STORE
  if (!selectedProjectId && isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              No Project Selected
            </CardTitle>
            <CardDescription>
              No project is currently selected in the store. Please navigate to
              a project from the projects list or select one manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push("/projects")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to Projects
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast.info("Project selection", {
                    description:
                      "Navigate to a project from the projects list to select it automatically",
                  });
                }}
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                How to select?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // États de chargement
  if (authLoading || !isHydrated || projectLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {!isHydrated
                      ? "Hydrating project store..."
                      : projectLoading
                      ? "Loading project data..."
                      : "Verifying your authentication..."}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait while we load your session and project data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // États d'erreur d'authentification
  if (authError || !session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              {authError
                ? "There was an error with your authentication. Please sign in again."
                : "Please log in to access this page and manage project features."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/auth/signin")}>
                Go to Sign In
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // États d'erreur du projet depuis le store
  if (projectError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error Loading Project
            </CardTitle>
            <CardDescription>{projectError}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Retrying..." : "Retry"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/projects")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // États d'erreur des features
  if (featuresError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error Loading Features
            </CardTitle>
            <CardDescription>{featuresError}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => fetchFeatures(true)}
                disabled={featuresLoading}
                className="flex items-center gap-2"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${featuresLoading ? "animate-spin" : ""}`}
                />
                Retry Loading Features
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/projects")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ CORRECTION MAJEURE : GARDE DE TYPE TYPESCRIPT pour éviter l'erreur 'string | null'
  // À ce point, nous sommes certains que selectedProjectId n'est pas null grâce aux vérifications précédentes
  if (!selectedProjectId) {
    // Cette condition ne devrait jamais être atteinte, mais TypeScript l'exige
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unexpected Error
            </CardTitle>
            <CardDescription>
              Project ID is unexpectedly null. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface principale - ✅ Maintenant TypeScript est certain que selectedProjectId est string
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* En-tête avec informations du projet et statistiques */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/projects")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Projects
              </Button>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {projectData?.name || "Project"} Features
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage project features and their implementation details
                {allFeatures.length > 0 && (
                  <span className="ml-2 font-medium">
                    ({filteredFeatures.length} of {allFeatures.length} features)
                  </span>
                )}
              </p>
              {/* ✅ Affichage de l'ID du projet depuis le STORE pour debug */}
              <p className="text-xs text-muted-foreground mt-1">
                Project ID: {selectedProjectId} (from store)
              </p>
            </div>

            {/* Statistiques rapides */}
            {stats && stats.total > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-700 dark:text-green-400">
                    {stats.completed} completed
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-blue-700 dark:text-blue-400">
                    {stats.inProgress} in progress
                  </span>
                </div>
                {stats.blocked > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-700 dark:text-red-400">
                      {stats.blocked} blocked
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span className="text-gray-700 dark:text-gray-400">
                    {stats.todo} todo
                  </span>
                </div>
                <span className="text-muted-foreground">
                  • Avg progress: {Math.round(stats.averageProgress)}%
                </span>
              </div>
            )}
          </div>

          {/* Contrôles de vue */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || featuresLoading}
              className="flex items-center gap-2"
            >
              <RefreshCcw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide" : "Show"} Filters
            </Button>

            <Select
              value={viewMode}
              onValueChange={(value: ViewMode) => setViewMode(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List View
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    Card View
                  </div>
                </SelectItem>
                <SelectItem value="tree">
                  <div className="flex items-center gap-2">
                    <TreePine className="h-4 w-4" />
                    Tree View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Panneau de filtres */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search features, descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtre par priorité */}
                <Select
                  value={priorityFilter}
                  onValueChange={(value: FilterPriority) =>
                    setPriorityFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="CRITICAL">
                      <Badge variant="destructive">Critical</Badge>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <Badge variant="secondary">High</Badge>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <Badge variant="default">Medium</Badge>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <Badge variant="outline">Low</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtre par statut */}
                <Select
                  value={statusFilter}
                  onValueChange={(value: FilterStatus) =>
                    setStatusFilter(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="TODO">
                      <Badge variant="outline">To Do</Badge>
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      <Badge variant="secondary">In Progress</Badge>
                    </SelectItem>
                    <SelectItem value="DONE">
                      <Badge variant="default">Done</Badge>
                    </SelectItem>
                    <SelectItem value="BLOCKED">
                      <Badge variant="destructive">Blocked</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Indicateurs de filtres actifs */}
              {(searchTerm ||
                priorityFilter !== "all" ||
                statusFilter !== "all") && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {searchTerm && (
                    <Badge variant="outline" className="gap-1">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {priorityFilter !== "all" && (
                    <Badge
                      variant={getPriorityVariant(priorityFilter as Priority)}
                      className="gap-1"
                    >
                      {priorityFilter}
                      <button
                        onClick={() => setPriorityFilter("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge
                      variant={getStatusVariant(statusFilter)}
                      className="gap-1"
                    >
                      {statusFilter.replace("_", " ")}
                      <button
                        onClick={() => setStatusFilter("all")}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setPriorityFilter("all");
                      setStatusFilter("all");
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Liste des features */}
        <div className="bg-card border rounded-xl p-4 sm:p-6">
          {featuresLoading && allFeatures.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
              <div className="text-center">
                <p className="text-muted-foreground">Loading features...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while we fetch your data
                </p>
              </div>
            </div>
          ) : allFeatures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <TreePine className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Features Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Start by creating your first feature to organize your project's
                development.
              </p>
              <Button
                onClick={() =>
                  toast.info("Feature creation will be available soon")
                }
              >
                Create First Feature
              </Button>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Features Match Your Filters
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Try adjusting your search terms or filters to find what you're
                looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setPriorityFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            // ✅ CORRECTION : Maintenant TypeScript est certain que selectedProjectId est string (pas null)
            <FeaturesList
              userId={session.user.id}
              projectId={selectedProjectId} // ✅ TypeScript sait maintenant que c'est string
              viewMode={viewMode}
              features={filteredFeatures}
              onUpdate={handleFeaturesUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
