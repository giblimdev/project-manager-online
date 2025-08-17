// app/projects/[id]/epic/page.tsx
/**
 * RÔLE : Page Next.js 15 listant les épics d’une initiative dans un projet
 * RESPONSABILITÉS :
 * - Récupération et affichage des épics via API
 * - Tri des épics par ordre ascendant
 * - Gestion des filtres (recherche et priorité)
 * - Gestion du mode de vue (liste ou carte)
 * - Actions CRUD (édition, suppression, création)
 * - Modification de l’ordre des épics via appel API reorder
 * - Navigation entre projets, initiatives, fonctionnalités
 * - Interface responsive moderne avec Tailwind CSS
 * - Strictement typé TypeScript strict mode
 */
/*
* - doit maintenant utiliser me store useSelectedProject 
* - doit permetre d'ajouter l'id de l'epic
* -
* -
*/
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import EpicsDisplay from "@/components/epics/EpicsDisplay";
import EpicsFilter from "@/components/epics/EpicsFilter";
import EpicsList from "@/components/epics/EpicsList";
import { EpicsForm } from "@/components/epics/EpicsForm";

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
import { Button } from "@/components/ui/button";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ViewMode = "list" | "card";
type FilterPriority = Priority | "ALL";

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
  features?: Array<{ id: string; name: string; status: string; progress: number }>;
  userstories?: Array<{ id: string; title: string; status: string }>;
  _count?: {
    features: number;
    userstories: number;
  };
}

interface FilterState {
  search: string;
  priority: FilterPriority;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export default function EpicsPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = useSelectedProjectId();
  const isProjectHydrated = useProjectStoreHydration();
  const initiativeId = useSelectedInitiativeId();
  const initiativeData = useSelectedInitiativeData();
  const isInitiativeHydrated = useInitiativeStoreHydration();
  const { setSelectedEpicId } = useSelectedEpicStore();

  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priority: "ALL",
  });

  const fetchEpics = useCallback(async () => {
    if (!isInitiativeHydrated || !initiativeId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("initiativeId", initiativeId);

      if (filters.search) searchParams.set("search", filters.search);
      if (filters.priority !== "ALL") searchParams.set("priority", filters.priority);

      const response = await fetch(`/api/epics?${searchParams.toString()}`);

      if (!response.ok) throw new Error(`Erreur ${response.status}: ${response.statusText}`);

      const result: ApiResponse<Epic[]> = await response.json();

      if (!result.success) throw new Error(result.error || "Erreur lors du chargement des épics");

      const normalizedEpics = (result.data || []).map((epic) => ({
        ...epic,
        startDate: epic.startDate ? new Date(epic.startDate) : null,
        endDate: epic.endDate ? new Date(epic.endDate) : null,
        createdAt: new Date(epic.createdAt),
        updatedAt: new Date(epic.updatedAt),
      }));

      setEpics(normalizedEpics);
    } catch (error) {
      console.error("Erreur lors du chargement des épics:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      toast.error("Erreur de chargement", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [initiativeId, isInitiativeHydrated, filters]);

  useEffect(() => {
    if (isInitiativeHydrated && isProjectHydrated) {
      fetchEpics();
    }
  }, [fetchEpics, isInitiativeHydrated, isProjectHydrated]);

  const handleDelete = useCallback(
    async (epic: Epic) => {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer l'épic "${epic.name}" ?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/epics/${epic.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Erreur ${response.status}: ${response.statusText}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Erreur lors de la suppression");

        toast.success("Épic supprimé", { description: `"${epic.name}" a été supprimé avec succès` });
        fetchEpics();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        toast.error("Erreur de suppression", { description: errorMessage });
      }
    },
    [fetchEpics]
  );

  const handleEpicClick = useCallback(
    (epic: Epic) => {
      setSelectedEpicId(epic.id);
      router.push(`/projects/${projectId}/features`);
      toast.success("Épic sélectionné", { description: `Navigation vers les fonctionnalités de "${epic.name}"` });
    },
    [setSelectedEpicId, router, projectId]
  );

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
    toast.success(editingEpic ? "Épic modifié" : "Épic créé", {
      description: "Les modifications ont été enregistrées avec succès",
    });
  }, [editingEpic, fetchEpics]);

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingEpic(null);
  }, []);

  const handleOrderChange = useCallback(
    async (epicId: string, direction: "up" | "down") => {
      try {
        const response = await fetch(`/api/epics/${epicId}/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        });
        if (!response.ok) throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Erreur lors de la mise à jour de l’ordre");
        fetchEpics();
      } catch (error) {
        toast.error("Erreur de mise à jour", {
          description: "Impossible de modifier l'ordre de l'épic",
        });
      }
    },
    [fetchEpics]
  );

  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const handlePriorityChange = useCallback((priority: FilterPriority) => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  const stats = useMemo(() => {
    const totalEpics = epics.length;
    const completedEpics = epics.filter((e) => e.progress >= 100).length;
    const inProgressEpics = epics.filter((e) => e.progress > 0 && e.progress < 100).length;
    const notStartedEpics = epics.filter((e) => e.progress === 0).length;

    return {
      total: totalEpics,
      completed: completedEpics,
      inProgress: inProgressEpics,
      notStarted: notStartedEpics,
    };
  }, [epics]);

  const sortedEpics = useMemo(() => {
    return [...epics].sort((a, b) => a.order - b.order);
  }, [epics]);

  const handleBackToInitiatives = useCallback(() => {
    router.push(`/projects/${projectId}/initiatives`);
  }, [router, projectId]);

  if (!isInitiativeHydrated || !isProjectHydrated) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border border-blue-500 rounded-full border-t-transparent" />
            <span>Chargement des stores...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <svg className="h-8 w-8 text-amber-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Aucun projet sélectionné</h3>
            <p className="text-muted-foreground">Veuillez sélectionner un projet pour accéder aux épics</p>
            <button onClick={() => router.push("/projects")} className="btn btn-primary mt-4">
              Sélectionner un projet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!initiativeId || !initiativeData) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <svg className="h-8 w-8 text-blue-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Aucune initiative sélectionnée</h3>
            <p className="text-muted-foreground">Veuillez sélectionner une initiative pour gérer ses épics</p>
            <button onClick={() => router.push(`/projects/${projectId}/initiatives`)} className="btn btn-outline mt-4">
              Retour aux initiatives
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="alert alert-error space-y-4">
          <h3 className="flex items-center text-destructive text-xl font-semibold">
            Erreur de chargement
          </h3>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex space-x-2">
            <button onClick={fetchEpics} className="btn btn-primary flex-1">
              Réessayer
            </button>
            <button onClick={handleBackToInitiatives} className="btn btn-outline">
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="border-b pb-4 flex items-center justify-between">
        <div>
          <button onClick={handleBackToInitiatives} className="btn btn-ghost">
            &larr; Initiatives
          </button>
          <h1 className="text-2xl font-bold text-blue-600 mt-2">
            Épics de l&apos;initiative {initiativeData.name}
          </h1>
          <p className="text-muted-foreground">Gérez les épics de "{initiativeData.name}"</p>
        </div>
        <div className="flex space-x-2 items-center">
          {isLoading && (
            <div className="animate-spin text-blue-600">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          )}
          <button
            onClick={fetchEpics}
            disabled={isLoading}
            className="btn btn-outline"
            title="Actualiser"
          >
            &#x21bb; Actualiser
          </button>
         
        </div>
      </header>

      {/* Stats (exemple simplifié) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded text-center">
          <strong>{sortedEpics.length}</strong>
          <p>Total épics</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded text-center">
          <strong>{sortedEpics.filter((e) => e.progress >= 100).length}</strong>
          <p>Terminés</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-4 rounded text-center">
          <strong>{sortedEpics.filter((e) => e.progress > 0 && e.progress < 100).length}</strong>
          <p>En cours</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4 rounded text-center">
          <strong>{sortedEpics.filter((e) => e.progress === 0).length}</strong>
          <p>Non commencés</p>
        </div>
      </section>

      {/* Display + Filter */}
      <section className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/3">
          <EpicsDisplay viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
        <div className="lg:w-2/3">
          <EpicsFilter
            search={filters.search}
            priority={filters.priority}
            onSearchChange={handleSearchChange}
            onPriorityChange={handlePriorityChange}
          />
        </div>
      </section>

      {/* Epics List */}
      <section>
        <EpicsList
          epics={sortedEpics}
          viewMode={viewMode}
          onEpicClick={handleEpicClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOrderChange={handleOrderChange}
          onCreateNew={handleCreateNew}
          isLoading={isLoading}
        />
      </section>

      {/* Epics Form Modal */}
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
