// components/team/TeamList.tsx

"use client";

import React, { useState } from "react";
import { Team, ViewMode, TeamFilter, TeamFormData } from "@/types/team";
import TeamForm from "./TeamForm";
import {
  Users,
  Building2,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  MoreVertical,
} from "lucide-react";

type TeamListProps = {
  teams: Team[];
  parentTeams: Team[];
  viewMode: ViewMode;
  loading: boolean;
  filter: TeamFilter;
  onCreateTeam: (teamData: TeamFormData) => Promise<void>;
  onUpdateTeam: (teamData: TeamFormData & { id: string }) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
};

export default function TeamList({
  teams,
  parentTeams,
  viewMode,
  loading,
  filter,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
}: TeamListProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState<string | null>(null);

  // États pour le formulaire d'équipe
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Filtrer les équipes selon les critères
  const filteredTeams = teams.filter((team) => {
    if (
      filter.search &&
      !team.name.toLowerCase().includes(filter.search.toLowerCase())
    ) {
      return false;
    }

    if (filter.isActive !== undefined && team.isActive !== filter.isActive) {
      return false;
    }

    if (filter.parentTeamId !== undefined) {
      if (filter.parentTeamId === null && team.parentTeamId !== null) {
        return false;
      }
    }

    return true;
  });

  // Organiser les équipes hiérarchiquement
  const organizeTeams = (teams: Team[]): Team[] => {
    if (viewMode !== "branch") {
      return teams.sort(
        (a, b) => a.order - b.order || a.name.localeCompare(b.name)
      );
    }

    const rootTeams = teams.filter((team) => !team.parentTeamId);
    const childTeams = teams.filter((team) => team.parentTeamId);

    const addChildren = (parent: Team): Team => {
      const children = childTeams
        .filter((child) => child.parentTeamId === parent.id)
        .map(addChildren)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

      return { ...parent, children };
    };

    return rootTeams
      .map(addChildren)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  };

  const organizedTeams = organizeTeams(filteredTeams);

  const toggleExpanded = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
    setShowActions(null);
  };

  const handleFormSubmit = async (teamData: TeamFormData): Promise<void> => {
    setIsFormSubmitting(true);
    try {
      if (selectedTeam) {
        await onUpdateTeam({ ...teamData, id: selectedTeam.id });
      } else {
        await onCreateTeam(teamData);
      }
      setIsFormOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      throw error; // Laisser l'erreur remonter pour que TeamForm puisse la gérer
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`
      )
    ) {
      try {
        await onDeleteTeam(team.id);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de l'équipe");
      }
    }
    setShowActions(null);
  };

  const TeamCard = ({ team, level = 0 }: { team: Team; level?: number }) => {
    const hasChildren = team.children && team.children.length > 0;
    const isExpanded = expandedTeams.has(team.id);

    return (
      <div
        className={`${
          level > 0
            ? "ml-6 border-l border-gray-200 dark:border-gray-700 pl-4"
            : ""
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {viewMode === "branch" && hasChildren && (
                <button
                  onClick={() => toggleExpanded(team.id)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="flex-shrink-0">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={`Logo ${team.name}`}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </h3>
                  {!team.isActive && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {team.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Slug: {team.slug}</span>
                  {team.members && (
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {team.members.length} membre
                      {team.members.length > 1 ? "s" : ""}
                    </span>
                  )}
                  <span>Ordre: {team.order}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(showActions === team.id ? null : team.id);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showActions === team.id && (
                <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[150px]">
                  <button
                    onClick={() => handleEditTeam(team)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTeam(team)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {viewMode === "branch" && hasChildren && isExpanded && (
          <div className="ml-4">
            {team.children?.map((childTeam) => (
              <TeamCard key={childTeam.id} team={childTeam} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {organizedTeams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-2">
      {organizedTeams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );

  const BranchView = () => (
    <div className="space-y-2">
      {organizedTeams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );

  // Fermer le menu d'actions si on clique ailleurs
  React.useEffect(() => {
    const handleClickOutside = () => setShowActions(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Chargement...
        </span>
      </div>
    );
  }

  if (organizedTeams.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucune équipe trouvée
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {filter.search || filter.isActive !== undefined
            ? "Aucune équipe ne correspond aux critères de recherche."
            : "Commencez par créer votre première équipe."}
        </p>
        <button
          onClick={handleCreateTeam}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une équipe
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {organizedTeams.length} équipe{organizedTeams.length > 1 ? "s" : ""}
          {filter.search &&
            ` trouvée${organizedTeams.length > 1 ? "s" : ""} pour "${
              filter.search
            }"`}
        </div>

        <button
          onClick={handleCreateTeam}
          className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouvelle équipe
        </button>
      </div>

      {viewMode === "list" && <ListView />}
      {viewMode === "card" && <GridView />}
      {viewMode === "branch" && <BranchView />}

      <TeamForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTeam(null);
        }}
        onSubmit={handleFormSubmit}
        parentTeams={parentTeams}
        initialData={selectedTeam}
        loading={isFormSubmitting}
      />
    </div>
  );
}   
