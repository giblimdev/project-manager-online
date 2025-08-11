// @/components/userStories/UserStoriesFilter.tsx

/*
 * Composant de filtrage des User Stories (MISE À JOUR)
 * Rôle : Filtrage par recherche textuelle.
 * Responsabilités :
 * - Fournit une interface de saisie pour la recherche.
 * - Texte d'aide clarifié pour refléter la recherche étendue.
 */

"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";

interface UserStoriesFilterProps {
  searchQuery: string;
  onFilterChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const UserStoriesFilter: React.FC<UserStoriesFilterProps> = ({
  searchQuery,
  onFilterChange,
  totalCount,
  filteredCount,
  className = "",
  placeholder = "Rechercher par titre, feature, tag...", // Placeholder mis à jour
  disabled = false,
}) => {
  const handleClearSearch = () => {
    onFilterChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(e.target.value);
  };

  const isFiltering = searchQuery.trim().length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Champ de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10"
          disabled={disabled}
        />
        {isFiltering && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Résultats de filtrage */}
      {isFiltering && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          {filteredCount === 0 ? (
            <span className="text-orange-600 font-medium">
              Aucun résultat pour "{searchQuery}"
            </span>
          ) : (
            <span>
              {filteredCount} résultat{filteredCount > 1 ? "s" : ""} sur{" "}
              {totalCount}
            </span>
          )}
        </div>
      )}

      {/* Aide contextuelle mise à jour */}
      {!isFiltering && totalCount > 5 && (
        <div className="text-xs text-gray-500 flex items-center">
          <Filter className="mr-1 h-3 w-3" />
          Astuce : recherchez par titre, description, feature, tag, ou assigné.
        </div>
      )}
    </div>
  );
};

export default UserStoriesFilter;
