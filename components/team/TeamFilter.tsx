// components/team/TeamFilter.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { TeamFilter } from "@/types/team";

// Rôle et responsabilités du composant:
// - Gestion du filtrage et de la recherche des équipes
// - Interface utilisateur pour les filtres avancés
// - État local pour les champs de recherche et filtres
// - Communication avec le composant parent via callbacks
// - Composants utilisés: React hooks (useState, useEffect)
// - Types utilisés: TeamFilter depuis @/types/team

type FilterTeamProps = {
  onFilterChange: (filterValue: string) => void;
  filter: TeamFilter;
  onFilterUpdate: (newFilter: Partial<TeamFilter>) => void;
};

export default function FilterTeam({
  onFilterChange,
  filter,
  onFilterUpdate,
}: FilterTeamProps) {
  const [searchTerm, setSearchTerm] = useState<string>(filter?.search || "");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [localFilter, setLocalFilter] = useState<TeamFilter>(filter);

  // Synchroniser avec les props externes
  useEffect(() => {
    setLocalFilter(filter);
    setSearchTerm(filter?.search || "");
  }, [filter]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange(value);

    const updatedFilter: Partial<TeamFilter> = {
      ...localFilter,
      search: value || undefined,
    };
    onFilterUpdate(updatedFilter);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onFilterChange("");

    const updatedFilter: Partial<TeamFilter> = {
      ...localFilter,
      search: undefined,
    };
    setLocalFilter(updatedFilter);
    onFilterUpdate(updatedFilter);
  };

  const handleActiveFilter = (isActive: boolean | undefined) => {
    const updatedFilter: Partial<TeamFilter> = {
      ...localFilter,
      isActive,
    };
    setLocalFilter(updatedFilter);
    onFilterUpdate(updatedFilter);
  };

  const handleParentTeamFilter = (hasParent: boolean | undefined) => {
    let parentTeamId: string | null | undefined;

    if (hasParent === true) {
      parentTeamId = undefined; // Équipes avec parent
    } else if (hasParent === false) {
      parentTeamId = null; // Équipes sans parent (racines)
    } else {
      parentTeamId = undefined; // Toutes les équipes
    }

    const updatedFilter: Partial<TeamFilter> = {
      ...localFilter,
      parentTeamId,
    };
    setLocalFilter(updatedFilter);
    onFilterUpdate(updatedFilter);
  };

  const handleChildrenFilter = (hasChildren: boolean | undefined) => {
    const updatedFilter: Partial<TeamFilter> = {
      ...localFilter,
      hasChildren,
    };
    setLocalFilter(updatedFilter);
    onFilterUpdate(updatedFilter);
  };

  const clearAllFilters = () => {
    const emptyFilter: TeamFilter = {};
    setSearchTerm("");
    setLocalFilter(emptyFilter);
    onFilterChange("");
    onFilterUpdate(emptyFilter);
  };

  const hasActiveFilters =
    searchTerm ||
    localFilter.isActive !== undefined ||
    localFilter.parentTeamId !== undefined ||
    localFilter.hasChildren !== undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher une équipe..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Bouton filtres avancés */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center px-4 py-2 border rounded-lg font-medium transition-colors ${
              showAdvanced || hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtres
            <ChevronDown
              className={`h-4 w-4 ml-2 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded-full">
                Actifs
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={
                  localFilter.isActive === undefined
                    ? "all"
                    : localFilter.isActive
                    ? "active"
                    : "inactive"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  handleActiveFilter(
                    value === "all" ? undefined : value === "active"
                  );
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="all">Toutes</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>

            {/* Filtre Hiérarchie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hiérarchie
              </label>
              <select
                value={
                  localFilter.parentTeamId === null
                    ? "root"
                    : localFilter.parentTeamId === undefined
                    ? "all"
                    : "children"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  handleParentTeamFilter(
                    value === "all" ? undefined : value !== "root"
                  );
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="all">Toutes</option>
                <option value="root">Équipes racines</option>
                <option value="children">Sous-équipes</option>
              </select>
            </div>

            {/* Filtre Enfants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sous-équipes
              </label>
              <select
                value={
                  localFilter.hasChildren === undefined
                    ? "all"
                    : localFilter.hasChildren
                    ? "with"
                    : "without"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  handleChildrenFilter(
                    value === "all" ? undefined : value === "with"
                  );
                }}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="all">Toutes</option>
                <option value="with">Avec sous-équipes</option>
                <option value="without">Sans sous-équipes</option>
              </select>
            </div>
          </div>

          {/* Résumé des filtres actifs */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Filtres actifs:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {searchTerm && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 text-xs rounded-full">
                      Recherche: "{searchTerm}"
                    </span>
                  )}
                  {localFilter.isActive !== undefined && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 text-xs rounded-full">
                      {localFilter.isActive ? "Actives" : "Inactives"}
                    </span>
                  )}
                  {localFilter.parentTeamId === null && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200 text-xs rounded-full">
                      Équipes racines
                    </span>
                  )}
                  {localFilter.hasChildren !== undefined && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200 text-xs rounded-full">
                      {localFilter.hasChildren
                        ? "Avec sous-équipes"
                        : "Sans sous-équipes"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
