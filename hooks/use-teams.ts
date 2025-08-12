// @/hooks/use-teams.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { Team, TeamFilter, TeamFormData } from "@/types/team";

// Rôle : Hook personnalisé pour la gestion des équipes
// Responsabilités : CRUD des équipes, filtrage, état global
// API utilisées : /api/teams (GET, POST, PUT, DELETE)
// Types utilisés : Team, TeamFilter, TeamFormData depuis @/types/team
// Next.js 15 : Compatible avec les nouvelles API routes

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [parentTeams, setParentTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TeamFilter>({});

  // Charger les équipes
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filter.search) params.append("search", filter.search);
      if (filter.isActive !== undefined)
        params.append("isActive", filter.isActive.toString());
      if (filter.parentTeamId !== undefined) {
        if (filter.parentTeamId === null) {
          params.append("parentTeamId", "null");
        } else {
          params.append("parentTeamId", filter.parentTeamId);
        }
      }
      if (filter.hasChildren !== undefined)
        params.append("hasChildren", filter.hasChildren.toString());

      const response = await fetch(`/api/teams?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur lors du chargement des équipes");
      }

      // ✅ S'assurer que les données sont bien typées
      const teamsData: Team[] = data.data.teams || [];
      const parentTeamsData: Team[] = data.data.parentTeams || [];

      setTeams(teamsData);
      setParentTeams(parentTeamsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      console.error("Erreur lors du chargement des équipes:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Créer une équipe
  const handleCreateTeam = useCallback(
    async (teamData: TeamFormData): Promise<void> => {
      try {
        const response = await fetch("/api/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(teamData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "Erreur lors de la création de l'équipe"
          );
        }

        // Recharger les équipes après création
        await fetchTeams();
      } catch (error) {
        console.error("Erreur lors de la création de l'équipe:", error);
        throw error;
      }
    },
    [fetchTeams]
  );

  // Mettre à jour une équipe
  const handleUpdateTeam = useCallback(
    async (teamData: TeamFormData & { id: string }): Promise<void> => {
      try {
        const { id, ...updateData } = teamData;

        const response = await fetch(`/api/teams/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "Erreur lors de la mise à jour de l'équipe"
          );
        }

        // Recharger les équipes après mise à jour
        await fetchTeams();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'équipe:", error);
        throw error;
      }
    },
    [fetchTeams]
  );

  // Supprimer une équipe
  const handleDeleteTeam = useCallback(
    async (teamId: string): Promise<void> => {
      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erreur ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "Erreur lors de la suppression de l'équipe"
          );
        }

        // Recharger les équipes après suppression
        await fetchTeams();
      } catch (error) {
        console.error("Erreur lors de la suppression de l'équipe:", error);
        throw error;
      }
    },
    [fetchTeams]
  );

  // Mettre à jour le filtre
  const updateFilter = useCallback((newFilter: Partial<TeamFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // Charger les équipes au montage et lors des changements de filtre
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams,
    parentTeams,
    loading,
    error,
    filter,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    updateFilter,
    refreshTeams: fetchTeams,
  };
}
