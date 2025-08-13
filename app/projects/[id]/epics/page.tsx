// @/app/projects/[id]/epic/page.tsx

/**
 * RÔLE : Page de gestion des épics d'une initiative sélectionnée avec architecture séparée
 * RESPONSABILITÉS :
 * - Affichage des épics de l'initiative sélectionnée via le store useSelectedInitiativeStore
 * - Vérification de la sélection d'initiative avec redirection si nécessaire
 * - Gestion des filtres par nom et priorité (LOW, MEDIUM, HIGH, CRITICAL) via EpicsFilter
 * - Sélection des modes d'affichage (list, card) via EpicsDisplay
 * - EpicsList gère l'affichage des épics + boutons actions (edit, delete, up, down) + bouton ajouter
 * - EpicsForm en modal pour création/édition d'épics
 * - Interface responsive et moderne avec design cards et transitions
 * - Intégration avec useSelectedInitiativeStore pour obtenir l'initiative contexte
 *
 * COMPOSANTS UTILISÉS :
 * - EpicsDisplay: Composant qui propose les modes d'affichage (list, card)
 * - EpicsList: Affiche les épics selon le mode sélectionné + boutons d'actions + bouton ajouter
 * - EpicsFilter: Composant de filtrage par nom et priorité
 * - EpicsForm: Formulaire de création/édition d'épics en modal
 * - useSelectedInitiativeStore: Store Zustand pour l'initiative sélectionnée (contexte principal)
 * - useSelectedProjectStore: Store Zustand pour le projet sélectionné (contexte secondaire)
 * - Card, CardContent, Button: Composants UI shadcn/ui
 * - Skeleton: Composant de loading state
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, useRef, JSX
 * - Next.js 15 client component avec useRouter pour navigation
 * - Zustand: Store management avec persistance localStorage
 * - TypeScript strict mode avec interfaces complètes
 * - Tailwind CSS: Design moderne responsive avec gradient et shadows
 * - lucide-react: Icons (RefreshCw, AlertTriangle, Folder, ArrowLeft, Target, Layers)
 * - shadcn/ui: Card, Button, Skeleton components
 * - sonner: Toast notifications pour les actions utilisateur
 *
 * API :
 * - GET /api/epics?initiativeId=[id] (liste des épics d'une initiative)
 * - POST /api/epics (création d'un nouvel épic)
 * - PUT /api/epics/[id] (mise à jour d'un épic)
 * - DELETE /api/epics/[id] (suppression d'un épic)
 * - Utilise les données du store chargées par /api/initiatives/[id]
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  AlertTriangle,
  Target,
  Layers,
  ArrowLeft,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Import des stores Zustand
import {
  useSelectedInitiativeId,
  useSelectedInitiativeData,
  useInitiativeStoreHydration,
} from "@/stores/useSelectedInitiativeStore";
import {
  useSelectedProjectId,
  useProjectStoreHydration,
} from "@/stores/useSelectedProjectStore";
import { useSelectedEpicStore } from "@/stores/useSelectedEpicStore";

// ✅ Import des composants épics
import EpicsDisplay from "@/components/epics/EpicsDisplay";
import EpicsFilter from "@/components/epics/EpicsFilter";
import EpicsList from "@/components/epics/EpicsList";
import { EpicsForm } from "@/components/epics/EpicsForm";

// ✅ Types pour les épics
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ViewMode = "list" | "card";
type FilterPriority = Priority | "ALL";

// Interface Epic basée sur le schéma Prisma
interface Epic {
  id: string;
  name: string;
  order: number;
  description: string | null;
  priority: Priority;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  initiativeId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations optionnelles
  features?: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
  userstories?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  _count?: {
    features: number;
    userstories: number;
  };
}

// Interface pour les filtres
interface FilterState {
  search: string;
  priority: FilterPriority;
}

// Interface pour l'API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export default function EpicsPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();

  // ✅ Stores Zustand
  const projectId = useSelectedProjectId();
  const isProjectHydrated = useProjectStoreHydration();

  const initiativeId = useSelectedInitiativeId();
  const initiativeData = useSelectedInitiativeData();
  const isInitiativeHydrated = useInitiativeStoreHydration();

  const { setSelectedEpicId } = useSelectedEpicStore();

  // ✅ États locaux
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // ✅ État du formulaire
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);

  // ✅ État des filtres
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: "ALL",
  });

  // ✅ Fonction de chargement des épics avec logs de diagnostic
  const fetchEpics = useCallback(async () => {
    console.log("🔧 DIAGNOSTIC fetchEpics - Début");
    console.log("📊 Store Hydration Status:", {
      isInitiativeHydrated,
      isProjectHydrated,
    });
    console.log("📋 Store Values:", {
      initiativeId,
      initiativeData: initiativeData
        ? {
            id: initiativeData.id,
            name: initiativeData.name,
            projectId: initiativeData.projectId,
          }
        : null,
      projectId,
    });

    if (!isInitiativeHydrated || !initiativeId) {
      console.log(
        "❌ ARRÊT: Store non hydraté ou aucune initiative sélectionnée"
      );
      console.log("Details:", {
        isInitiativeHydrated,
        initiativeId,
        raison: !isInitiativeHydrated
          ? "Store non hydraté"
          : "Aucune initiative sélectionnée",
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("initiativeId", initiativeId);

      if (filters.search) {
        searchParams.set("search", filters.search);
      }

      if (filters.priority !== "ALL") {
        searchParams.set("priority", filters.priority);
      }

      const apiUrl = `/api/epics?${searchParams.toString()}`;
      console.log("🌐 URL API construite:", apiUrl);
      console.log("📤 Paramètres envoyés:", {
        initiativeId,
        search: filters.search || "none",
        priority: filters.priority,
      });

      console.log("🚀 Envoi de la requête fetch...");
      const response = await fetch(apiUrl);

      console.log("📥 Réponse reçue:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<Epic[]> = await response.json();
      console.log("📋 Données reçues de l'API:", {
        success: result.success,
        dataLength: result.data?.length || 0,
        error: result.error,
        message: result.message,
        fullResult: result,
      });

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des épics");
      }

      // ✅ Normalisation des dates
      const normalizedEpics = (result.data || []).map((epic) => ({
        ...epic,
        startDate: epic.startDate ? new Date(epic.startDate) : null,
        endDate: epic.endDate ? new Date(epic.endDate) : null,
        createdAt: new Date(epic.createdAt),
        updatedAt: new Date(epic.updatedAt),
      }));

      console.log("✅ Épics normalisés:", {
        count: normalizedEpics.length,
        epics: normalizedEpics.map((e) => ({
          id: e.id,
          name: e.name,
          initiativeId: e.initiativeId,
        })),
      });

      setEpics(normalizedEpics);
    } catch (error) {
      console.error("💥 Erreur lors du chargement des épics:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.log("🔴 Détails de l'erreur:", {
        type: error?.constructor?.name,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : "No stack",
      });
      setError(errorMessage);
      toast.error("Erreur de chargement", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      console.log("🏁 fetchEpics terminé");
    }
  }, [initiativeId, isInitiativeHydrated, filters]);

  // ✅ Chargement initial
  useEffect(() => {
    if (isInitiativeHydrated && isProjectHydrated) {
      fetchEpics();
    }
  }, [fetchEpics, isInitiativeHydrated, isProjectHydrated]);

  // ✅ Gestion du clic sur un épic (sélection + navigation)
  const handleEpicClick = useCallback(
    (epic: Epic) => {
      // Mise à jour du store Epic sélectionné
      setSelectedEpicId(epic.id);

      // Navigation vers la page des features
      router.push(`/projects/${projectId}/features`);

      toast.success("Épic sélectionné", {
        description: `Navigation vers les fonctionnalités de "${epic.name}"`,
      });
    },
    [setSelectedEpicId, router, projectId]
  );

  // ✅ Handlers pour le formulaire
  const handleCreateNew = useCallback(() => {
    setEditingEpic(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((epic: Epic) => {
    setEditingEpic(epic);
    setIsFormOpen(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setEditingEpic(null);
    fetchEpics();
    toast.success(editingEpic ? "Épic mis à jour" : "Épic créé", {
      description: "Les modifications ont été enregistrées avec succès",
    });
  }, [editingEpic, fetchEpics]);

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingEpic(null);
  }, []);

  // ✅ Gestion de la suppression
  const handleDelete = useCallback(
    async (epic: Epic) => {
      if (
        !confirm(`Êtes-vous sûr de vouloir supprimer l'épic "${epic.name}" ?`)
      ) {
        return;
      }

      try {
        const response = await fetch(`/api/epics/${epic.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la suppression");
        }

        toast.success("Épic supprimé", {
          description: `"${epic.name}" a été supprimé avec succès`,
        });

        fetchEpics();
      } catch (error) {
        console.error("💥 Erreur lors de la suppression:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        toast.error("Erreur de suppression", {
          description: errorMessage,
        });
      }
    },
    [fetchEpics]
  );

  // ✅ Gestion du changement d'ordre
  const handleOrderChange = useCallback(
    async (epicId: string, newOrder: number) => {
      try {
        const response = await fetch(`/api/epics/${epicId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order: newOrder }),
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result: ApiResponse<Epic> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la mise à jour");
        }

        fetchEpics();
      } catch (error) {
        console.error("💥 Erreur lors du changement d'ordre:", error);
        toast.error("Erreur de mise à jour", {
          description: "Impossible de modifier l'ordre de l'épic",
        });
      }
    },
    [fetchEpics]
  );

  // ✅ Handlers pour les filtres
  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const handlePriorityChange = useCallback((priority: FilterPriority) => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  // ✅ Statistiques calculées
  const stats = useMemo(() => {
    const totalEpics = epics.length;
    const completedEpics = epics.filter((e) => e.progress >= 100).length;
    const inProgressEpics = epics.filter(
      (e) => e.progress > 0 && e.progress < 100
    ).length;
    const notStartedEpics = epics.filter((e) => e.progress === 0).length;

    return {
      total: totalEpics,
      completed: completedEpics,
      inProgress: inProgressEpics,
      notStarted: notStartedEpics,
    };
  }, [epics]);

  // ✅ Navigation de retour
  const handleBackToInitiatives = useCallback(() => {
    router.push(`/projects/${projectId}/initiatives`);
  }, [router, projectId]);

  // ✅ Gestion des états de chargement et d'erreur
  if (!isInitiativeHydrated || !isProjectHydrated) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Chargement des stores...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Aucun projet sélectionné
                </h3>
                <p className="text-muted-foreground">
                  Veuillez sélectionner un projet pour accéder aux épics
                </p>
              </div>
              <Button onClick={() => router.push("/projects")}>
                Sélectionner un projet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!initiativeId || !initiativeData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Target className="h-8 w-8 text-blue-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Aucune initiative sélectionnée
                </h3>
                <p className="text-muted-foreground">
                  Veuillez sélectionner une initiative pour gérer ses épics
                </p>
              </div>
              <Button
                onClick={() =>
                  router.push(`/projects/${projectId}/initiatives`)
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux initiatives
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Erreur de chargement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={fetchEpics} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Button variant="outline" onClick={handleBackToInitiatives}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ✅ En-tête avec navigation */}
      <Card className="border-gradient bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToInitiatives}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Initiatives
                </Button>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium text-muted-foreground">
                  {initiativeData.name}
                </span>
              </div>
              <CardTitle className="flex items-center text-2xl">
                <Layers className="mr-3 h-6 w-6 text-blue-600" />
                Épics de l'initiative
              </CardTitle>
              <p className="text-muted-foreground">
                Gérez les épics de "{initiativeData.name}"
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <Button
                variant="outline"
                onClick={fetchEpics}
                disabled={isLoading}
              >
                Actualiser
              </Button>
              <Button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvel épic
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ✅ Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-700">
              {stats.total}
            </div>
            <p className="text-xs text-blue-600">Total épics</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-700">
              {stats.completed}
            </div>
            <p className="text-xs text-green-600">Terminés</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-700">
              {stats.inProgress}
            </div>
            <p className="text-xs text-orange-600">En cours</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-700">
              {stats.notStarted}
            </div>
            <p className="text-xs text-gray-600">Non commencés</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Contrôles d'affichage et filtrage */}
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="lg:w-1/3">
          <CardContent className="pt-4">
            <EpicsDisplay viewMode={viewMode} onViewModeChange={setViewMode} />
          </CardContent>
        </Card>

        <Card className="lg:w-2/3">
          <CardContent className="pt-4">
            <EpicsFilter
              search={filters.search}
              priority={filters.priority}
              onSearchChange={handleSearchChange}
              onPriorityChange={handlePriorityChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* ✅ Liste des épics */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EpicsList
              epics={epics}
              viewMode={viewMode}
              onEpicClick={handleEpicClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOrderChange={handleOrderChange}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>

      {/* ✅ Formulaire modal */}
      <EpicsForm
        isOpen={isFormOpen}
        epic={editingEpic}
        initiativeId={initiativeId}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    </div>
  );
}
