// components/team/views/TeamViewCard.tsx
"use client";

import { Team } from "@/types/team";
import {
  Edit2,
  Trash2,
  Users,
  Calendar,
  Building2,
  ChevronRight,
} from "lucide-react";

type TeamViewCardProps = {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
};

export default function TeamViewCard({
  teams,
  onEdit,
  onDelete,
}: TeamViewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getParentTeamName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = teams.find((t) => t.id === parentId);
    return parent?.name || "Équipe inconnue";
  };

  const getChildrenCount = (teamId: string) => {
    return teams.filter((t) => t.parentTeamId === teamId).length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team) => {
        const parentName = getParentTeamName(team.parentTeamId);
        const childrenCount = getChildrenCount(team.id);

        return (
          <div
            key={team.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            {/* Header avec logo et actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={`Logo ${team.name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {team.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      #{team.slug}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(team)}
                    className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Modifier l'équipe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(team.id)}
                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Supprimer l'équipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Statut */}
              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    team.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  {team.isActive ? "Active" : "Inactive"}
                </span>

                {!parentName && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    Principale
                  </span>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4">
              {/* Description */}
              {team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {team.description}
                </p>
              )}

              {/* Hiérarchie */}
              {parentName && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>{parentName}</span>
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                </div>
              )}

              {/* Sous-équipes */}
              {childrenCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-3">
                  <Users className="w-4 h-4" />
                  <span>
                    {childrenCount} sous-équipe{childrenCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Date de création */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Créée le {formatDate(team.createdAt)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Ordre: {team.order}</span>
                <span>MAJ: {formatDate(team.updatedAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
