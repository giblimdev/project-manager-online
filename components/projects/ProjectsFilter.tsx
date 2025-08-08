// components/projects/ProjectsFilter.tsx

"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, X, Grid3X3, List, MoreHorizontal } from "lucide-react";

// Type pour les filtres
export interface ProjectFilters {
  status?: string;
  priority?: string;
  owner?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

// Type pour le mode d'affichage
export type ViewMode = "list" | "card" | "grid";

// Interface complète pour les props
interface ProjectsFilterProps {
  onFilterChange?: (filters: ProjectFilters) => void;
  onViewModeChange?: (mode: ViewMode) => void;
  onSearch?: (query: string) => void;
  viewMode?: ViewMode;
  totalCount?: number;
  filteredCount?: number;
  value?: string;
  onChange?: React.Dispatch<React.SetStateAction<string>>;
  placeholder?: string;
}

// Composant principal avec export nommé
export const ProjectsFilter: React.FC<ProjectsFilterProps> = ({
  onFilterChange,
  onViewModeChange,
  onSearch,
  viewMode = "card",
  totalCount = 0,
  filteredCount = 0,
  value,
  onChange,
  placeholder = "Rechercher des projets...",
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(value || "");
  const [activeFilters, setActiveFilters] = useState<ProjectFilters>({});

  const handleSearch = (searchValue: string): void => {
    setSearchQuery(searchValue);
    onChange?.(searchValue);
    onSearch?.(searchValue);
  };

  const handleFilterChange = (
    key: keyof ProjectFilters,
    filterValue: string
  ): void => {
    const newFilters = { ...activeFilters };

    // CORRECTION: Gérer correctement la valeur "all" pour reset
    if (filterValue === "all" || filterValue === "") {
      delete newFilters[key];
    } else {
      newFilters[key] = filterValue;
    }

    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilter = (key: keyof ProjectFilters): void => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearAllFilters = (): void => {
    setActiveFilters({});
    setSearchQuery("");
    onChange?.("");
    onFilterChange?.({});
    onSearch?.("");
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    (key) => activeFilters[key as keyof ProjectFilters] !== undefined
  ).length;

  return (
    <div className="flex flex-col gap-4 p-4 bg-background border rounded-lg">
      {/* Ligne principale avec recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Actions et modes d'affichage */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Compteur de résultats */}
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {searchQuery || activeFilterCount > 0
              ? `${filteredCount} sur ${totalCount} projets`
              : `${totalCount} projets`}
          </span>

          {/* Sélecteur de mode d'affichage */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange?.("list")}
              className="rounded-r-none h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange?.("card")}
              className="rounded-none h-8 px-2"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange?.("grid")}
              className="rounded-l-none h-8 px-2"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu de filtres */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Filtre par statut */}
              <div className="p-2">
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={activeFilters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger className="w-full mt-1" size="sm">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                    <SelectItem value="ON_HOLD">En pause</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre par priorité */}
              <div className="p-2">
                <label className="text-sm font-medium">Priorité</label>
                <Select
                  value={activeFilters.priority || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("priority", value)
                  }
                >
                  <SelectTrigger className="w-full mt-1" size="sm">
                    <SelectValue placeholder="Toutes les priorités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="HIGH">Haute</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="LOW">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenuSeparator />

              {/* Bouton pour effacer tous les filtres */}
              {activeFilterCount > 0 && (
                <DropdownMenuItem onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Effacer tous les filtres
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filtres actifs */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.status && (
            <Badge variant="secondary" className="flex items-center gap-1 h-6">
              <span className="text-xs">Statut: {activeFilters.status}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                onClick={() => clearFilter("status")}
              />
            </Badge>
          )}
          {activeFilters.priority && (
            <Badge variant="secondary" className="flex items-center gap-1 h-6">
              <span className="text-xs">
                Priorité: {activeFilters.priority}
              </span>
              <X
                className="h-3 w-3 cursor-pointer hover:bg-secondary-foreground/20 rounded-full"
                onClick={() => clearFilter("priority")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsFilter;
