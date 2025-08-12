// components/team/views/TeamViewList.tsx
"use client";

import { Team } from "@/types/team";
import {
  Edit2,
  Trash2,
  Users,
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

type TeamViewListProps = {
  teams: Team[];
  onEdit: (team: Team) => void;
  onDelete: (teamId: string) => void;
};

export default function TeamViewList({
  teams,
  onEdit,
  onDelete,
}: TeamViewListProps) {
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Équipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hiérarchie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Créée le
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {teams.map((team) => {
              const parentName = getParentTeamName(team.parentTeamId);
              const childrenCount = getChildrenCount(team.id);

              return (
                <tr
                  key={team.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Équipe */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {team.logoUrl && (
                        <img
                          src={team.logoUrl}
                          alt={`Logo ${team.name}`}
                          className="w-8 h-8 rounded-full mr-3 object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            #{team.slug}
                          </span>
                        </div>
                        {team.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {team.description}
                          </p>
                        )}
                        {childrenCount > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                            <Users className="w-3 h-3" />
                            <span>
                              {childrenCount} sous-équipe
                              {childrenCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Hiérarchie */}
                  <td className="px-6 py-4">
                    {parentName ? (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <span>{parentName}</span>
                        <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {team.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        Équipe principale
                      </span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        team.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                      }`}
                    >
                      {team.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Date de création */}
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(team.createdAt)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
