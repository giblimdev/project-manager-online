// @/app/projects/[id]/sprint/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useProjectStore,
  useProjectStoreHydration,
} from "@/stores/useSelectedProjectStore";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import SprintDisplay from "@/components/sprints/SprintDisplay";
import SprintList from "@/components/sprints/SprintList";
import SprintFilter from "@/components/sprints/SprintFilter";
import SprintForm from "@/components/sprints/SprintForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sprint, SprintStatus } from "@/lib/generated/prisma/client";

// Interface pour les sprints avec stats
interface SprintWithStats extends Sprint {
  _count?: {
    tasks: number;
    userStories: number;
  };
}

// Interface pour les filtres
interface SprintFilter {
  search: string;
  status: SprintStatus | "";
}

export default function SprintPage() {
  // Hydratation du store
  const isHydrated = useProjectStoreHydration();
  const {
    selectedProjectId,
    projectData,
    isLoading: isProjectLoading,
    error: projectError,
    loadProjectData,
  } = useProjectStore();

  // Récupération des paramètres d'URL
  const searchParams = useSearchParams();
  const viewMode = (searchParams.get("view") as "list" | "card") || "list";

  // États locaux
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [sprints, setSprints] = useState<SprintWithStats[]>([]);
  const [isLoadingSprints, setIsLoadingSprints] = useState(true);
  const [filter, setFilter] = useState<SprintFilter>({
    search: "",
    status: "",
  });

  // Chargement initial des données
  useEffect(() => {
    if (isHydrated && selectedProjectId) {
      loadProjectData(selectedProjectId);
      fetchSprints();
    }
  }, [isHydrated, selectedProjectId]);

  // Gestion des erreurs
  useEffect(() => {
    if (projectError) {
      toast.error("Erreur de chargement du projet", {
        description: projectError,
      });
    }
  }, [projectError]);

  // Récupération des sprints depuis l'API
  const fetchSprints = async () => {
    if (!selectedProjectId) return;

    setIsLoadingSprints(true);
    try {
      const res = await fetch(`/api/sprints?projectId=${selectedProjectId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setSprints(data.data || []);
      } else {
        throw new Error(data.error || "Erreur lors du chargement des sprints");
      }
    } catch (error) {
      console.error("Erreur fetchSprints:", error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
      setSprints([]);
    } finally {
      setIsLoadingSprints(false);
    }
  };

  // Filtrage des sprints
  const filteredSprints = useMemo(() => {
    return sprints.filter((sprint) => {
      const matchesSearch = filter.search
        ? sprint.name.toLowerCase().includes(filter.search.toLowerCase()) ||
          sprint.description
            ?.toLowerCase()
            .includes(filter.search.toLowerCase()) ||
          sprint.goal?.toLowerCase().includes(filter.search.toLowerCase())
        : true;

      const matchesStatus = filter.status
        ? sprint.status === filter.status
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [sprints, filter]);

  // Gestion des actions
  const handleCreateSprint = () => {
    setEditingSprint(null);
    setIsFormOpen(true);
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setIsFormOpen(true);
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce sprint ?")) return;

    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Sprint supprimé avec succès");
        fetchSprints();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Échec de la suppression");
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  };

  // Changement de vue
  const handleViewModeChange = (mode: "list" | "card") => {
    const params = new URLSearchParams(searchParams);
    params.set("view", mode);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  // Affichage du chargement
  if (!isHydrated || isProjectLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (!selectedProjectId || !projectData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Projet non sélectionné
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Veuillez sélectionner un projet pour accéder à la gestion des
            sprints.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Sprints du projet</h1>
          <p className="text-muted-foreground">
            {projectData.name} - {filteredSprints.length} sprint(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSprints}
            disabled={isLoadingSprints}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isLoadingSprints ? "animate-spin" : ""
              }`}
            />
            Actualiser
          </Button>

          <Button size="sm" onClick={handleCreateSprint}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouveau sprint
          </Button>
        </div>
      </div>

      {/* Contrôles (filtres et vue) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <SprintFilter
          value={filter}
          onChange={setFilter}
          disabled={isLoadingSprints}
          resultCount={filteredSprints.length}
        />

        <SprintDisplay viewMode={viewMode} onChange={handleViewModeChange} />
      </div>

      {/* Liste des sprints */}
      {isLoadingSprints ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : filteredSprints.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-center">
            <div>
              <p className="text-muted-foreground">
                {sprints.length === 0
                  ? "Ce projet n'a pas encore de sprints"
                  : "Aucun sprint ne correspond aux filtres"}
              </p>
              {sprints.length === 0 && (
                <Button className="mt-4" onClick={handleCreateSprint}>
                  Créer un premier sprint
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <SprintList
          sprints={filteredSprints}
          viewMode={viewMode}
          onEdit={handleEditSprint}
          onDelete={handleDeleteSprint}
        />
      )}

      {/* Formulaire modal */}
      <SprintForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        projectId={selectedProjectId}
        sprint={editingSprint}
        onSuccess={() => {
          fetchSprints();
          setIsFormOpen(false);
          setEditingSprint(null);
        }}
      />
    </div>
  );
}
