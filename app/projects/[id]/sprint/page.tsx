//@/app/projects/[id]/sprint/page.tsx
/**
 * RÔLE : Page de gestion des sprint d'un projet sélectionné avec architecture séparée
 * RESPONSABILITÉS :
 * - Affichage des sprint du projet sélectionné via le store Zustand
 * - Gestion des filtres par nom et priorité (LOW, MEDIUM, HIGH, CRITICAL) via sprintFilter si applicable.
 * - Basculement entre les modes d'affichage (list, card, tree) via EpicsDisplay
 * - SprintDisplay sélectionne le mode et transmet à EpicsList qui affiche selon le mode
 * - SprintList gère l'affichage des Sprint + boutons actions (edit, delete, up, down) + bouton ajouter
 * - SprintForm en modal pour création/édition de Sprint
 * - Vérification de la sélection du projet avec gestion d'erreur
 * - Interface responsive et moderne avec design cards et transitions
 * - Intégration avec le store useSelectedProjectStore pour la persistance
 * - Gestion des états de chargement et d'hydratation du store
 * - Protection contre les boucles infinies d'appels API
 *
 * COMPOSANTS UTILISÉS :
 * - SprintDisplay: Composant qui sélectionne le mode d'affichage et transmet à EpicsList
 * - SprintList: Affiche les épics selon le mode sélectionné + boutons d'actions + bouton ajouter
 * - SprintFilter: Composant de filtrage par nom et priorité
 * - SprintForm: Formulaire de création/édition de Sprint modale avec fond transparent et desingn moderne t coloré et professionnel.
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
 * - GET /api/sprint?projectId=[id] (liste des sprint d'un projet)
 * - POST /api/sprint (création d'un nouvel sprint)
 * - PUT /api/sprint/[id] (mise à jour d'un sprint)
 * - DELETE /api/sprint/[id] (suppression d'un sprint)
 * - Utilise les données du store chargées par /api/projects/[id]
 */

// @/app/projects/[id]/sprint/page.tsx
"use client";

import React, { useEffect, useMemo } from "react";
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

export default function SprintPage() {
  // Hydratation du store
  const isHydrated = useProjectStoreHydration();
  const {
    selectedProjectId,
    projectData,
    isLoading: isProjectLoading,
    error: projectError,
    loadProjectData,
    refreshProject,
  } = useProjectStore();

  // Récupération des paramètres d'URL
  const searchParams = useSearchParams();
  const viewMode =
    (searchParams.get("view") as "list" | "card" | null) || "list";
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingSprint, setEditingSprint] = React.useState<string | null>(null);

  // États pour les sprints
  const [sprints, setSprints] = React.useState<any[]>([]);
  const [isLoadingSprints, setIsLoadingSprints] = React.useState(true);
  const [filter, setFilter] = React.useState({
    search: "",
    status: "",
    priority: "",
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
        setSprints(data.data.sprints);
      } else {
        throw new Error(data.error || "Erreur lors du chargement des sprints");
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
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
            .includes(filter.search.toLowerCase())
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

  const handleEditSprint = (sprintId: string) => {
    setEditingSprint(sprintId);
    setIsFormOpen(true);
  };

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      const res = await fetch(`/api/sprints?id=${sprintId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Sprint supprimé avec succès");
        fetchSprints();
      } else {
        throw new Error("Échec de la suppression");
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
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
            onClick={() => fetchSprints()} 
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
        />

        <SprintDisplay
          viewMode={viewMode}
          onChange={(mode) => {
            const params = new URLSearchParams(searchParams);
            params.set("view", mode);
            window.history.replaceState(null, "", `?${params.toString()}`);
          }}
        />
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
        sprintId={editingSprint}
        onSuccess={() => {
          fetchSprints();
          setIsFormOpen(false);
        }}
      />
    </div>
  );
}
