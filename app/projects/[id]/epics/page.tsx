// app/projects/[id]/epic/page.tsx

/**
 * RÔLE : Page de gestion des épics d'un projet sélectionné avec architecture séparée
 * RESPONSABILITÉS :
 * - Affichage des épics du projet sélectionné via le store Zustand
 * - Gestion des filtres par nom et priorité (LOW, MEDIUM, HIGH, CRITICAL) via EpicsFilter
 * - Basculement entre les modes d'affichage (list, card, tree) via EpicsDisplay
 * - EpicsDisplay sélectionne le mode et transmet à EpicsList qui affiche selon le mode
 * - EpicsList gère l'affichage des épics + boutons actions (edit, delete, up, down) + bouton ajouter
 * - EpicsForm en modal pour création/édition d'épics
 * - Vérification de la sélection du projet avec gestion d'erreur
 * - Interface responsive et moderne avec design cards et transitions
 * - Intégration avec le store useSelectedProjectStore pour la persistance
 * - Gestion des états de chargement et d'hydratation du store
 * - Protection contre les boucles infinies d'appels API
 *
 * COMPOSANTS UTILISÉS :
 * - EpicsDisplay: Composant qui sélectionne le mode d'affichage et transmet à EpicsList
 * - EpicsList: Affiche les épics selon le mode sélectionné + boutons d'actions + bouton ajouter
 * - EpicsFilter: Composant de filtrage par nom et priorité
 * - EpicsForm: Formulaire de création/édition d'épics
 * - useSelectedProjectStore: Store Zustand pour le projet sélectionné
 * - useProjectStoreHydration: Hook d'hydratation sécurisée du store
 * - Card, CardContent, Button: Composants UI shadcn/ui
 * - Skeleton: Composant de loading state
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, useRef, JSX
 * - Next.js 15 client component
 * - Zustand: Store management avec persistance localStorage
 * - TypeScript strict mode avec interfaces complètes
 * - Tailwind CSS: Design moderne responsive avec gradient et shadows
 * - lucide-react: Icons (RefreshCw, AlertTriangle, Folder, PlusCircle, Target)
 * - shadcn/ui: Card, Button, Skeleton components
 * - sonner: Toast notifications pour les actions utilisateur
 *
 * API :
 * - GET /api/epics?projectId=[id] (liste des épics d'un projet)
 * - POST /api/epics (création d'un nouvel épic)
 * - PUT /api/epics/[id] (mise à jour d'un épic)
 * - DELETE /api/epics/[id] (suppression d'un épic)
 * - Utilise les données du store chargées par /api/projects/[id]
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
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSelectedProjectStore,
  useProjectStoreHydration,
} from "@/stores/useSelectedProjectStore";
import EpicsDisplay from "@/components/epics/EpicsDisplay";
import EpicsFilter from "@/components/epics/EpicsFilter";
import EpicsForm from "@/components/epics/EpicsForm";

// Interface pour l'état des filtres selon les enums Priority du schéma Prisma
interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Types pour les modes d'affichage
type ViewMode = "list" | "card" | "tree";

// Interface Epic selon le schéma Prisma pour la gestion locale
interface Epic {
  id: string;
  name: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  initiativeId: string;
  createdAt: Date;
  updatedAt: Date;
  features?: Array<{
    id: string;
    name: string;
    progress: number;
  }>;
}

// Interface pour l'état de la page
interface PageState {
  epics: Epic[];
  isLoadingEpics: boolean;
  epicsError: string | null;
  isFormOpen: boolean;
  editingEpic: Epic | null;
  lastLoadedProjectId: string | null;
}

export default function EpicsPage(): JSX.Element {
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
  const isHydrated = useProjectStoreHydration();

  // État local pour la page
  const [filters, setFilters] = useState<FilterState>({
    name: "",
    priority: "ALL",
  });
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // État simplifié pour la gestion des épics
  const [pageState, setPageState] = useState<PageState>({
    epics: [],
    isLoadingEpics: false,
    epicsError: null,
    isFormOpen: false,
    editingEpic: null,
    lastLoadedProjectId: null,
  });

  // useRef pour éviter les dépendances circulaires
  const loadEpicsRef = useRef<((projectId: string) => Promise<void>) | null>(
    null
  );
  const isLoadingRef = useRef(false);

  // Console.log pour diagnostiquer l'état du store
  useEffect(() => {
    console.log("🔍 DEBUG EpicsPage - État du store:");
    console.log("- selectedProjectId:", selectedProjectId);
    console.log("- projectData:", projectData);
    console.log("- isLoading:", isLoading);
    console.log("- error:", error);
    console.log("- isHydrated:", isHydrated);
    console.log(
      "- pageState.lastLoadedProjectId:",
      pageState.lastLoadedProjectId
    );
    console.log("- isLoadingRef.current:", isLoadingRef.current);

    if (projectData) {
      console.log("- Project name:", projectData.name);
      console.log("- Project key:", projectData.key);
      console.log("- Page epics count:", pageState.epics.length);
      console.log("- Project _count:", projectData._count);
    }
  }, [
    selectedProjectId,
    projectData,
    isLoading,
    error,
    isHydrated,
    pageState.lastLoadedProjectId,
  ]);

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
        "🔄 EpicsPage - Chargement automatique des données du projet"
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

  // Fonction de chargement des épics avec protection anti-boucle
  const loadEpics = useCallback(async (projectId: string) => {
    // Protection contre les appels multiples simultanés
    if (isLoadingRef.current) {
      console.log("⚠️ Chargement déjà en cours, ignorer");
      return;
    }

    // Vérifier si on a déjà chargé les données pour ce projet
    if (
      pageState.lastLoadedProjectId === projectId &&
      pageState.epics.length > 0
    ) {
      console.log("✅ Épics déjà chargés pour ce projet");
      return;
    }

    console.log("🔄 Chargement des épics pour le projet:", projectId);

    isLoadingRef.current = true;
    setPageState((prev) => ({
      ...prev,
      isLoadingEpics: true,
      epicsError: null,
    }));

    try {
      const response = await fetch(`/api/epics?projectId=${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      let epics: Epic[];

      // Gérer les différents formats de réponse API
      if (result.success !== undefined) {
        if (!result.success) {
          throw new Error(result.error || "Erreur lors du chargement");
        }
        epics = result.data || [];
      } else if (Array.isArray(result)) {
        epics = result;
      } else {
        epics = result.epics || [];
      }

      console.log("✅ Épics chargés:", epics.length);

      setPageState((prev) => ({
        ...prev,
        epics,
        isLoadingEpics: false,
        epicsError: null,
        lastLoadedProjectId: projectId,
      }));

      toast.success(`${epics.length} épic(s) chargé(s)`);
    } catch (error) {
      console.error("💥 Erreur chargement épics:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      setPageState((prev) => ({
        ...prev,
        epics: [],
        isLoadingEpics: false,
        epicsError: errorMessage,
        lastLoadedProjectId: null,
      }));

      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  // Stocker la référence pour éviter les dépendances circulaires
  loadEpicsRef.current = loadEpics;

  // Chargement automatique avec protection contre les boucles
  useEffect(() => {
    let mounted = true;

    const shouldLoad =
      projectData?.id &&
      isHydrated &&
      !pageState.isLoadingEpics &&
      pageState.lastLoadedProjectId !== projectData.id &&
      !isLoadingRef.current;

    if (shouldLoad && mounted && loadEpicsRef.current) {
      console.log("🚀 Déclenchement chargement épics");
      loadEpicsRef.current(projectData.id);
    }

    return () => {
      mounted = false;
    };
  }, [
    projectData?.id,
    isHydrated,
    pageState.isLoadingEpics,
    pageState.lastLoadedProjectId,
  ]);

  // Reset des épics quand le projet change
  useEffect(() => {
    if (
      selectedProjectId !== pageState.lastLoadedProjectId &&
      pageState.epics.length > 0
    ) {
      console.log("🔄 Changement de projet - Reset des épics");
      setPageState((prev) => ({
        ...prev,
        epics: [],
        lastLoadedProjectId: null,
        epicsError: null,
      }));
    }
  }, [
    selectedProjectId,
    pageState.lastLoadedProjectId,
    pageState.epics.length,
  ]);

  // Handlers pour le formulaire
  const handleCreateEpic = useCallback(() => {
    console.log("➕ Ouverture formulaire création épic");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: true,
      editingEpic: null,
    }));
  }, []);

  const handleEditEpic = useCallback((epic: Epic) => {
    console.log("✏️ Ouverture formulaire édition épic:", epic.name);
    setPageState((prev) => ({
      ...prev,
      isFormOpen: true,
      editingEpic: epic,
    }));
  }, []);

  const handleDeleteEpic = useCallback(
    async (epicId: string) => {
      const epic = pageState.epics.find((e) => e.id === epicId);
      if (!epic) {
        toast.error("Épic non trouvé");
        return;
      }

      const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'épic "${epic.name}" ?\n\nCette action est irréversible.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log("🗑️ Suppression épic:", epic.name);
      const deletingToast = toast.loading(`Suppression de ${epic.name}...`);

      try {
        const response = await fetch(`/api/epics/${epicId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        // Mettre à jour la liste locale
        setPageState((prev) => ({
          ...prev,
          epics: prev.epics.filter((e) => e.id !== epicId),
        }));

        console.log("✅ Épic supprimé avec succès");
        toast.success(`Épic "${epic.name}" supprimé`, {
          id: deletingToast,
        });
      } catch (error) {
        console.error("💥 Erreur suppression:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        toast.error(`Erreur: ${errorMessage}`, {
          id: deletingToast,
        });
      }
    },
    [pageState.epics]
  );

  // Handlers pour réorganisation (up/down)
  const handleMoveEpic = useCallback(
    async (epicId: string, direction: "up" | "down") => {
      const currentIndex = pageState.epics.findIndex((e) => e.id === epicId);
      const epic = pageState.epics[currentIndex];

      if (!epic) return;

      let newIndex: number;
      if (direction === "up" && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (
        direction === "down" &&
        currentIndex < pageState.epics.length - 1
      ) {
        newIndex = currentIndex + 1;
      } else {
        return; // Pas de mouvement possible
      }

      console.log(
        `🔄 Déplacement ${direction}:`,
        epic.name,
        "index:",
        currentIndex,
        "→",
        newIndex
      );

      // Mise à jour optimiste de l'UI
      const newEpics = [...pageState.epics];
      newEpics.splice(currentIndex, 1);
      newEpics.splice(newIndex, 0, epic);

      setPageState((prev) => ({
        ...prev,
        epics: newEpics,
      }));

      toast.success(`Épic "${epic.name}" déplacé`);
    },
    [pageState.epics]
  );

  // Handler de succès avec rechargement forcé
  const handleFormSuccess = useCallback(() => {
    console.log("✅ Succès formulaire - Rechargement des épics");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: false,
      editingEpic: null,
      lastLoadedProjectId: null, // Force le rechargement
    }));

    // Recharger la liste des épics si on a un projet
    if (projectData?.id && loadEpicsRef.current) {
      loadEpicsRef.current(projectData.id);
    }

    toast.success(
      pageState.editingEpic
        ? "Épic mis à jour avec succès"
        : "Épic créé avec succès"
    );
  }, [projectData?.id, pageState.editingEpic]);

  const handleFormCancel = useCallback(() => {
    console.log("❌ Annulation formulaire");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: false,
      editingEpic: null,
    }));
  }, []);

  // Handler de retry avec reset du cache
  const handleRetryLoadEpics = useCallback(() => {
    if (projectData?.id) {
      console.log("🔄 Retry chargement épics");
      setPageState((prev) => ({
        ...prev,
        lastLoadedProjectId: null, // Reset pour forcer rechargement
        epicsError: null,
      }));

      if (loadEpicsRef.current) {
        loadEpicsRef.current(projectData.id);
      }
    }
  }, [projectData?.id]);

  // Affichage pendant l'hydratation ou le chargement initial
  if (!isHydrated || (isLoading && !projectData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {!isHydrated ? "Initialisation..." : "Chargement du projet..."}
              </h3>
              <p className="text-gray-600 mt-2">
                {!isHydrated
                  ? "Hydratation du store en cours"
                  : "Récupération des données du projet"}
              </p>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <div>Hydraté: {isHydrated ? "✅" : "⏳"}</div>
                <div>ID Projet: {selectedProjectId || "❌"}</div>
                <div>Données: {projectData ? "✅" : "❌"}</div>
                <div>Chargement: {isLoading ? "⏳" : "✅"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage d'erreur avec possibilité de retry
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Erreur de chargement
              </h3>
              <p className="text-gray-600 mt-2">{error}</p>
            </div>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérification de l'existence des données du projet
  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Folder className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun projet sélectionné
              </h2>
              <p className="text-gray-600">
                Veuillez sélectionner un projet pour voir les épics.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2">
                  État du store:
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>• ID sélectionné: {selectedProjectId || "Aucun"}</div>
                  <div>
                    • Données projet: {projectData ? "Présentes" : "Absentes"}
                  </div>
                  <div>
                    • Hydratation: {isHydrated ? "Complète" : "En cours"}
                  </div>
                  <div>• Chargement: {isLoading ? "En cours" : "Terminé"}</div>
                  {error && (
                    <div className="text-red-600">• Erreur: {error}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Retournez à la page des projets pour en sélectionner un
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcul des statistiques des épics
  const epicsStats = useMemo(() => {
    const epics = pageState.epics;
    return {
      total: epics.length,
      active: epics.filter((e) => e.status === "ACTIVE").length,
      planning: epics.filter((e) => e.status === "PLANNING").length,
      completed: epics.filter((e) => e.status === "COMPLETED").length,
      onHold: epics.filter((e) => e.status === "ON_HOLD").length,
      cancelled: epics.filter((e) => e.status === "CANCELLED").length,
      critical: epics.filter((e) => e.priority === "CRITICAL").length,
      high: epics.filter((e) => e.priority === "HIGH").length,
      medium: epics.filter((e) => e.priority === "MEDIUM").length,
      low: epics.filter((e) => e.priority === "LOW").length,
    };
  }, [pageState.epics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header avec informations détaillées */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Épics</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {epicsStats.total} total
                </span>
                {pageState.isLoadingEpics && (
                  <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Folder className="h-4 w-4" />
                <span>Projet: </span>
                <span className="font-medium text-gray-900">
                  {projectData.name}
                </span>
                {projectData.key && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                    {projectData.key}
                  </span>
                )}
              </div>

              {/* Statistiques en ligne */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {epicsStats.planning} planifiés
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-600" />
                  {epicsStats.active} actifs
                </span>
                <span>✅ {epicsStats.completed} terminés</span>
                <span>⏸️ {epicsStats.onHold} en pause</span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  {epicsStats.critical} critiques
                </span>
              </div>

              {/* Description des épics */}
              <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Qu'est-ce qu'un Épic ?
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Un Épic est un conteneur de fonctionnalités qui :
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>
                    • Regroupe plusieurs Features liées à un objectif commun
                  </li>
                  <li>
                    • Fait partie d'une Initiative plus large pour structurer le
                    backlog
                  </li>
                  <li>
                    • S'étend généralement sur 1 à 3 Sprints selon la complexité
                  </li>
                  <li>
                    • Apporte une valeur métier mesurable aux utilisateurs
                    finaux
                  </li>
                </ul>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-xl p-2 shadow-sm border border-gray-200">
              {(["list", "card", "tree"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === mode
                      ? "bg-blue-600 text-white shadow-md transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  title={`Mode ${mode}`}
                >
                  <span className="mr-2">
                    {mode === "list" && "📋"}
                    {mode === "card" && "🗂️"}
                    {mode === "tree" && "🌳"}
                  </span>
                  <span className="capitalize hidden sm:inline">{mode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <EpicsFilter filters={filters} onFiltersChange={setFilters} />
            </CardContent>
          </Card>
        </div>

        {/* Affichage des erreurs */}
        {pageState.epicsError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Erreur de chargement</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                {pageState.epicsError}
              </p>
              <Button
                onClick={handleRetryLoadEpics}
                variant="outline"
                size="sm"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Affichage des épics avec EpicsDisplay */}
        {pageState.isLoadingEpics && pageState.epics.length === 0 ? (
          // Skeleton pendant le chargement initial
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // EpicsDisplay gère le mode et transmet à EpicsList
          <EpicsDisplay
            projectId={projectData.id}
            filters={filters}
            viewMode={viewMode}
            epics={pageState.epics}
            onCreateEpic={handleCreateEpic}
            onEditEpic={handleEditEpic}
            onDeleteEpic={handleDeleteEpic}
            onMoveEpic={handleMoveEpic}
            loading={pageState.isLoadingEpics}
          />
        )}

        {/* Formulaire EpicsForm en modal */}
        {pageState.isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {pageState.editingEpic ? "Modifier l'épic" : "Nouvel épic"}
                </h2>
                <Button
                  onClick={handleFormCancel}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <div className="p-6">
                <EpicsForm
                  projectId={projectData.id}
                  epic={pageState.editingEpic}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Debug info (développement uniquement) */}
        {process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-sm">
            <div className="font-bold mb-1">Debug Info:</div>
            <div>Projet ID: {selectedProjectId || "null"}</div>
            <div>Projet Data: {projectData ? "✅" : "❌"}</div>
            <div>Hydrated: {isHydrated ? "✅" : "❌"}</div>
            <div>Loading Store: {isLoading ? "⏳" : "✅"}</div>
            <div>Loading Epics: {pageState.isLoadingEpics ? "⏳" : "✅"}</div>
            <div>Epics: {pageState.epics.length}</div>
            <div>
              Last Loaded Project: {pageState.lastLoadedProjectId || "null"}
            </div>
            <div>Form Open: {pageState.isFormOpen ? "✅" : "❌"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
