// components/team/views/TeamViewBranch.tsx

"use client";

import { useState } from "react";
import { Team } from "@/types/team";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Users,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";

// Rôle : Vue hiérarchique en arbre des équipes
// Responsabilités : Affichage récursif des équipes, gestion expand/collapse
// Composants utilisés : React hooks (useState), Lucide icons
// Types utilisés : Team depuis @/types/team
// Fonctionnalités : Navigation hiérarchique, actions CRUD, responsive design

type TeamNodeProps = {
  team: Team;
  allTeams: Team[];
  level?: number;
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
};

function TeamNode({
  team,
  allTeams,
  level = 0,
  onEdit,
  onDelete,
}: TeamNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showActions, setShowActions] = useState(false);

  // ✅ Correction : utiliser parentTeamId au lieu de parentId
  const children = allTeams.filter((t) => t.parentTeamId === team.id);
  const hasChildren = children.length > 0;

  const handleDelete = () => {
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}" ?`
      )
    ) {
      onDelete(team.id);
    }
    setShowActions(false);
  };

  return (
    <div className="w-full">
      {/* Nœud de l'équipe */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          level > 0
            ? "ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4"
            : ""
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Bouton expand/collapse */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown
                  size={16}
                  className="text-gray-600 dark:text-gray-400"
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-gray-600 dark:text-gray-400"
                />
              )}
            </button>
          )}

          {/* Icône et nom de l'équipe */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={`Logo ${team.name}`}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {team.name}
                </h3>
                {!team.isActive && (
                  <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {team.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {team.description}
                </p>
              )}

              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  #{team.slug}
                </span>
                {team.members && team.members.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users size={12} className="text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {team.members.length}
                    </span>
                  </div>
                )}
                {hasChildren && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {children.length} sous-équipe
                    {children.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical
              size={16}
              className="text-gray-500 dark:text-gray-400"
            />
          </button>

          {showActions && (
            <>
              {/* Overlay pour fermer le menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />

              {/* Menu d'actions */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onEdit(team);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
                >
                  <Edit2 size={14} />
                  <span>Modifier</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 rounded-b-lg"
                >
                  <Trash2 size={14} />
                  <span>Supprimer</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Enfants (sous-équipes) */}
      {hasChildren && isExpanded && (
        <div className="mt-2">
          {children
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
            .map((childTeam) => (
              <TeamNode
                key={childTeam.id}
                team={childTeam}
                allTeams={allTeams}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
    </div>
  );
}

type TeamViewBranchProps = {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
};

export default function TeamViewBranch({
  teams,
  onEdit,
  onDelete,
}: TeamViewBranchProps) {
  // Filtrer les équipes racines (sans parent)
  const rootTeams = teams
    .filter((team) => !team.parentTeamId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aucune équipe à afficher
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rootTeams.map((team) => (
        <TeamNode
          key={team.id}
          team={team}
          allTeams={teams}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
