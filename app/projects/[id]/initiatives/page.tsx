// app/projects/[Id]/initiatives/page.tsx

/**
 * RÔLE : Page de gestion des initiatives d'un projet sélectionné avec architecture séparée
 * RESPONSABILITÉS :
 * - Affichage des initiatives du projet sélectionné via le store Zustand
 * - Gestion des filtres par nom et priorité (LOW, MEDIUM, HIGH, CRITICAL) via InitiativesFilter
 * - Basculement entre les modes d'affichage (list, card, tree) via InitiativesDisplay
 * - InitiativesDisplay sélectionne le mode et transmet à InitiativesList qui affiche selon le mode
 * - InitiativesList gère l'affichage des initiatives + boutons actions (edit, delete, up, down) + bouton ajouter
 * - InitiativesForm en modal pour création/édition d'initiatives
 * - Vérification de la sélection du projet avec gestion d'erreur
 * - Interface responsive et moderne avec design cards et transitions
 * - Intégration avec le store useSelectedProjectStore pour la persistance
 * - Gestion des états de chargement et d'hydratation du store
 * - CORRECTION: Protection contre les boucles infinies d'appels API
 *
 * COMPOSANTS UTILISÉS :
 * - InitiativesDisplay: Composant qui sélectionne le mode d'affichage et transmet à InitiativesList
 * - InitiativesList: Affiche les initiatives selon le mode sélectionné + boutons d'actions + bouton ajouter
 * - InitiativesFilter: Composant de filtrage par nom et priorité
 * - InitiativesForm: Formulaire de création/édition d'initiatives
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
 * - GET /api/initiatives?projectId=[id] (liste des initiatives d'un projet)
 * - POST /api/initiatives (création d'une nouvelle initiative)
 * - PUT /api/initiatives/[id] (mise à jour d'une initiative)
 * - DELETE /api/initiatives/[id] (suppression d'une initiative)
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
import InitiativesDisplay from "@/components/initiatives/InitiativesDisplay";
import InitiativesFilter from "@/components/initiatives/InitiativesFilter";
import InitiativesForm from "@/components/initiatives/InitiativesForm";

// Interface pour l'état des filtres selon les enums Priority de votre schéma Prisma
interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Types pour les modes d'affichage
type ViewMode = "list" | "card" | "tree";

// Interface Initiative selon votre schéma Prisma pour la gestion locale
interface Initiative {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  budget: number | null;
  roi: number | null;
  projectId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour l'état de la page
interface PageState {
  initiatives: Initiative[];
  isLoadingInitiatives: boolean;
  initiativesError: string | null;
  isFormOpen: boolean;
  editingInitiative: Initiative | null;
  lastLoadedProjectId: string | null;
}

export default function InitiativesPage(): JSX.Element {
  // ✅ Store Zustand pour le projet sélectionné
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

  // ✅ CORRECTION: État simplifié avec contrôle des rechargements
  const [pageState, setPageState] = useState<PageState>({
    initiatives: [],
    isLoadingInitiatives: false,
    initiativesError: null,
    isFormOpen: false,
    editingInitiative: null,
    lastLoadedProjectId: null, // ✅ Track du dernier projet chargé
  });

  // ✅ CORRECTION: useRef pour éviter les dépendances circulaires
  const loadInitiativesRef = useRef<
    ((projectId: string) => Promise<void>) | null
  >(null);
  const isLoadingRef = useRef(false); // ✅ Protection contre les appels multiples

  // ✅ Console.log pour diagnostiquer l'état du store
  useEffect(() => {
    console.log("🔍 DEBUG InitiativesPage - État du store:");
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
      console.log("- Page initiatives count:", pageState.initiatives.length);
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

  // ✅ CORRECTION: Chargement automatique des données avec protection contre boucles
  useEffect(() => {
    if (
      isHydrated &&
      selectedProjectId &&
      !projectData &&
      !isLoading &&
      !error
    ) {
      console.log(
        "🔄 InitiativesPage - Chargement automatique des données du projet"
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

  // ✅ CORRECTION: Fonction de chargement des initiatives avec protection anti-boucle
  const loadInitiatives = useCallback(async (projectId: string) => {
    // Protection contre les appels multiples simultanés
    if (isLoadingRef.current) {
      console.log("⚠️ Chargement déjà en cours, ignorer");
      return;
    }

    // Vérifier si on a déjà chargé les données pour ce projet
    if (
      pageState.lastLoadedProjectId === projectId &&
      pageState.initiatives.length > 0
    ) {
      console.log("✅ Initiatives déjà chargées pour ce projet");
      return;
    }

    console.log("🔄 Chargement des initiatives pour le projet:", projectId);

    isLoadingRef.current = true;
    setPageState((prev) => ({
      ...prev,
      isLoadingInitiatives: true,
      initiativesError: null,
    }));

    try {
      const response = await fetch(`/api/initiatives?projectId=${projectId}`, {
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
      let initiatives: Initiative[];

      // Gérer les différents formats de réponse API
      if (result.success !== undefined) {
        if (!result.success) {
          throw new Error(result.error || "Erreur lors du chargement");
        }
        initiatives = result.data || [];
      } else if (Array.isArray(result)) {
        initiatives = result;
      } else {
        initiatives = result.initiatives || [];
      }

      console.log("✅ Initiatives chargées:", initiatives.length);

      setPageState((prev) => ({
        ...prev,
        initiatives,
        isLoadingInitiatives: false,
        initiativesError: null,
        lastLoadedProjectId: projectId, // ✅ Marquer comme chargé
      }));

      toast.success(`${initiatives.length} initiative(s) chargée(s)`);
    } catch (error) {
      console.error("💥 Erreur chargement initiatives:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      setPageState((prev) => ({
        ...prev,
        initiatives: [],
        isLoadingInitiatives: false,
        initiativesError: errorMessage,
        lastLoadedProjectId: null, // ✅ Reset en cas d'erreur
      }));

      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      isLoadingRef.current = false; // ✅ Libérer le verrou
    }
  }, []); // ✅ Pas de dépendances pour éviter les re-créations

  // ✅ CORRECTION: Stocker la référence pour éviter les dépendances circulaires
  loadInitiativesRef.current = loadInitiatives;

  // ✅ CORRECTION: Chargement automatique avec protection contre les boucles
  useEffect(() => {
    let mounted = true;

    const shouldLoad =
      projectData?.id &&
      isHydrated &&
      !pageState.isLoadingInitiatives &&
      pageState.lastLoadedProjectId !== projectData.id &&
      !isLoadingRef.current;

    if (shouldLoad && mounted && loadInitiativesRef.current) {
      console.log("🚀 Déclenchement chargement initiatives");
      loadInitiativesRef.current(projectData.id);
    }

    return () => {
      mounted = false;
    };
  }, [
    projectData?.id, // ✅ Seulement l'ID du projet
    isHydrated,
    pageState.isLoadingInitiatives,
    pageState.lastLoadedProjectId, // ✅ Éviter rechargement si déjà fait
  ]);

  // ✅ CORRECTION: Reset des initiatives quand le projet change
  useEffect(() => {
    if (
      selectedProjectId !== pageState.lastLoadedProjectId &&
      pageState.initiatives.length > 0
    ) {
      console.log("🔄 Changement de projet - Reset des initiatives");
      setPageState((prev) => ({
        ...prev,
        initiatives: [],
        lastLoadedProjectId: null,
        initiativesError: null,
      }));
    }
  }, [
    selectedProjectId,
    pageState.lastLoadedProjectId,
    pageState.initiatives.length,
  ]);

  // ✅ Handlers pour le formulaire (inchangés)
  const handleCreateInitiative = useCallback(() => {
    console.log("➕ Ouverture formulaire création initiative");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: true,
      editingInitiative: null,
    }));
  }, []);

  const handleEditInitiative = useCallback((initiative: Initiative) => {
    console.log("✏️ Ouverture formulaire édition initiative:", initiative.name);
    setPageState((prev) => ({
      ...prev,
      isFormOpen: true,
      editingInitiative: initiative,
    }));
  }, []);

  const handleDeleteInitiative = useCallback(
    async (initiativeId: string) => {
      const initiative = pageState.initiatives.find(
        (i) => i.id === initiativeId
      );
      if (!initiative) {
        toast.error("Initiative non trouvée");
        return;
      }

      const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'initiative "${initiative.name}" ?\n\nCette action est irréversible.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log("🗑️ Suppression initiative:", initiative.name);
      const deletingToast = toast.loading(
        `Suppression de ${initiative.name}...`
      );

      try {
        const response = await fetch(`/api/initiatives/${initiativeId}`, {
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
          initiatives: prev.initiatives.filter((i) => i.id !== initiativeId),
        }));

        console.log("✅ Initiative supprimée avec succès");
        toast.success(`Initiative "${initiative.name}" supprimée`, {
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
    [pageState.initiatives]
  );

  // ✅ Handlers pour réorganisation (inchangés)
  const handleMoveInitiative = useCallback(
    async (initiativeId: string, direction: "up" | "down") => {
      const currentIndex = pageState.initiatives.findIndex(
        (i) => i.id === initiativeId
      );
      const initiative = pageState.initiatives[currentIndex];

      if (!initiative) return;

      let newIndex: number;
      if (direction === "up" && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (
        direction === "down" &&
        currentIndex < pageState.initiatives.length - 1
      ) {
        newIndex = currentIndex + 1;
      } else {
        return; // Pas de mouvement possible
      }

      console.log(
        `🔄 Déplacement ${direction}:`,
        initiative.name,
        "index:",
        currentIndex,
        "→",
        newIndex
      );

      // Mise à jour optimiste de l'UI
      const newInitiatives = [...pageState.initiatives];
      newInitiatives.splice(currentIndex, 1);
      newInitiatives.splice(newIndex, 0, initiative);

      setPageState((prev) => ({
        ...prev,
        initiatives: newInitiatives,
      }));

      toast.success(`Initiative "${initiative.name}" déplacée`);
    },
    [pageState.initiatives]
  );

  // ✅ CORRECTION: Handler de succès avec rechargement forcé
  const handleFormSuccess = useCallback(() => {
    console.log("✅ Succès formulaire - Rechargement des initiatives");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: false,
      editingInitiative: null,
      lastLoadedProjectId: null, // ✅ Force le rechargement
    }));

    // Recharger la liste des initiatives si on a un projet
    if (projectData?.id && loadInitiativesRef.current) {
      loadInitiativesRef.current(projectData.id);
    }

    toast.success(
      pageState.editingInitiative
        ? "Initiative mise à jour avec succès"
        : "Initiative créée avec succès"
    );
  }, [projectData?.id, pageState.editingInitiative]);

  const handleFormCancel = useCallback(() => {
    console.log("❌ Annulation formulaire");
    setPageState((prev) => ({
      ...prev,
      isFormOpen: false,
      editingInitiative: null,
    }));
  }, []);

  // ✅ CORRECTION: Handler de retry avec reset du cache
  const handleRetryLoadInitiatives = useCallback(() => {
    if (projectData?.id) {
      console.log("🔄 Retry chargement initiatives");
      setPageState((prev) => ({
        ...prev,
        lastLoadedProjectId: null, // ✅ Reset pour forcer rechargement
        initiativesError: null,
      }));

      if (loadInitiativesRef.current) {
        loadInitiativesRef.current(projectData.id);
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
                Veuillez sélectionner un projet pour voir les initiatives.
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

  // Calcul des statistiques des initiatives
  const initiativesStats = useMemo(() => {
    const initiatives = pageState.initiatives;
    return {
      total: initiatives.length,
      active: initiatives.filter((i) => i.status === "ACTIVE").length,
      planning: initiatives.filter((i) => i.status === "PLANNING").length,
      completed: initiatives.filter((i) => i.status === "COMPLETED").length,
      onHold: initiatives.filter((i) => i.status === "ON_HOLD").length,
      cancelled: initiatives.filter((i) => i.status === "CANCELLED").length,
      critical: initiatives.filter((i) => i.priority === "CRITICAL").length,
      high: initiatives.filter((i) => i.priority === "HIGH").length,
      medium: initiatives.filter((i) => i.priority === "MEDIUM").length,
      low: initiatives.filter((i) => i.priority === "LOW").length,
    };
  }, [pageState.initiatives]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header avec informations détaillées */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  Initiatives
                </h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {initiativesStats.total} total
                </span>
                {pageState.isLoadingInitiatives && (
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
                  {initiativesStats.planning} planifiées
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-600" />
                  {initiativesStats.active} actives
                </span>
                <span>✅ {initiativesStats.completed} terminées</span>
                <span>⏸️ {initiativesStats.onHold} en pause</span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  {initiativesStats.critical} critiques
                </span>
              </div>

              {/* Description des initiatives */}
              <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Qu'est-ce qu'une Initiative ?
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Une Initiative est un conteneur de grande envergure qui :
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Aligne les équipes sur un objectif commun</li>
                  <li>
                    • Décompose une vision produit en éléments réalisables
                    (Épics → Features → User Stories)
                  </li>
                  <li>• Impacte plusieurs Sprints (3 à 6 mois généralement)</li>
                  <li>
                    • A un ROI mesurable (revenus, coûts, expérience
                    utilisateur)
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
              <InitiativesFilter
                filters={filters}
                onFiltersChange={setFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* Affichage des erreurs */}
        {pageState.initiativesError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Erreur de chargement</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                {pageState.initiativesError}
              </p>
              <Button
                onClick={handleRetryLoadInitiatives}
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

        {/* ✅ Affichage des initiatives avec InitiativesDisplay */}
        {pageState.isLoadingInitiatives &&
        pageState.initiatives.length === 0 ? (
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
          // ✅ InitiativesDisplay gère le mode et transmet à InitiativesList
          <InitiativesDisplay
            projectId={projectData.id}
            filters={filters}
            viewMode={viewMode}
            initiatives={pageState.initiatives}
            onCreateInitiative={handleCreateInitiative}
            onEditInitiative={handleEditInitiative}
            onDeleteInitiative={handleDeleteInitiative}
            onMoveInitiative={handleMoveInitiative}
            loading={pageState.isLoadingInitiatives}
          />
        )}

        {/* ✅ Formulaire InitiativesForm en modal */}
        {pageState.isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {pageState.editingInitiative
                    ? "Modifier l'initiative"
                    : "Nouvelle initiative"}
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
                <InitiativesForm
                  projectId={projectData.id}
                  initiative={pageState.editingInitiative}
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
            <div>
              Loading Initiatives:{" "}
              {pageState.isLoadingInitiatives ? "⏳" : "✅"}
            </div>
            <div>Initiatives: {pageState.initiatives.length}</div>
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
