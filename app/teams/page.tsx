// app/teams/page.tsx

"use client";

import { useState, Suspense } from "react";
import { useTeams } from "@/hooks/use-teams";
import TeamsList from "@/components/team/TeamList";
import TeamsDisplay from "@/components/team/TeamsDisplay";
import FilterTeam from "@/components/team/TeamFilter";
import { ViewMode } from "@/types/team";
import { Loader2, AlertCircle } from "lucide-react";

// Rôle : Page principale de gestion des équipes
// Responsabilités : Orchestration des composants, gestion d'état global
// Composants utilisés : TeamsList, TeamsDisplay, FilterTeam
// Hooks utilisés : useTeams pour la logique métier
// Types utilisés : ViewMode depuis @/types/team
// Next.js 15 : Compatible avec les nouvelles API routes

function TeamsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const {
    teams,
    parentTeams,
    loading,
    error,
    filter,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    updateFilter,
  } = useTeams();

  const handleFilterChange = (filterValue: string) => {
    updateFilter({ search: filterValue || undefined });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestion des Équipes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organisez et gérez les équipes de votre organisation
          </p>
        </div>

        {/* Filtres et vue */}
        <div className="mb-6 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
          <div className="flex-1 max-w-lg">
            <FilterTeam
              onFilterChange={handleFilterChange}
              filter={filter}
              onFilterUpdate={updateFilter}
            />
          </div>

          <div className="flex-shrink-0">
            <TeamsDisplay viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </div>

        {/* Contenu principal */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Chargement des équipes...
            </span>
          </div>
        ) : (
          <TeamsList
            viewMode={viewMode}
            teams={teams}
            parentTeams={parentTeams}
            loading={loading}
            filter={filter}
            onCreateTeam={handleCreateTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      }
    >
      <TeamsContent />
    </Suspense>
  );
}
