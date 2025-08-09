// components/projects/ProjectsFilter.tsx

/**
 * RÔLE : Composant de filtrage et recherche des projets
 * RESPONSABILITÉS :
 * - Capture et traitement des termes de recherche avec debouncing
 * - Filtrage par statut des projets (ACTIVE, INACTIVE, ARCHIVED)
 * - Interface responsive et accessible avec design moderne
 * - Optimisation des performances avec useDebounce
 * - Synchronisation avec l'état parent via callbacks
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem
 * - lucide-react: Search, X, Filter icons
 * - Hook personnalisé: useDebounce (@/hooks/useDebounce)
 * - React hooks: useState, useEffect, JSX
 *
 * LIBS UTILISÉS :
 * - React (useState, useEffect, JSX)
 * - Next.js 15 client component
 * - TypeScript strict mode
 * - Tailwind CSS pour le styling responsive
 * - Custom hook useDebounce pour l'optimisation
 *
 * PROPS de @/app/projects/page.tsx :
 * - onFilter: (searchTerm: string) => void - Callback pour la recherche
 * - onStatusFilter: (status: string) => void - Callback pour le filtre de statut
 * - searchTerm: string - Terme de recherche actuel
 * - statusFilter: string - Filtre de statut actuel
 */

"use client";

import React, { JSX, useEffect, useState, useCallback } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

// Types basés sur le schéma Prisma Project
export type ViewMode = "grid" | "list" | "card";

// Interface pour les props du composant selon app/projects/page.tsx
interface ProjectsFilterProps {
  onFilter: (searchTerm: string) => void;
  onStatusFilter?: (status: string) => void;
  searchTerm?: string;
  statusFilter?: string;
}

// Options de statut selon le schéma Prisma Project
const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts", count: null },
  { value: "ACTIVE", label: "Actifs", count: null },
  { value: "INACTIVE", label: "Inactifs", count: null },
  { value: "ARCHIVED", label: "Archivés", count: null },
] as const;

export default function ProjectsFilter({
  onFilter,
  onStatusFilter,
  searchTerm: initialSearchTerm = "",
  statusFilter: initialStatusFilter = "all",
}: ProjectsFilterProps): JSX.Element {
  // État local pour la recherche avec valeur initiale
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);

  // Debouncing pour optimiser les performances (300ms de délai)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  /**
   * Synchronisation avec les props externes quand elles changent
   */
  useEffect(() => {
    if (initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    if (initialStatusFilter !== statusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  /**
   * Effet pour déclencher la recherche avec debouncing
   */
  useEffect(() => {
    console.log(
      "🔍 ProjectsFilter - Recherche debounced:",
      debouncedSearchTerm
    );
    onFilter(debouncedSearchTerm);
  }, [debouncedSearchTerm, onFilter]);

  /**
   * Gestion du changement de terme de recherche
   */
  const handleSearchChange = useCallback((value: string): void => {
    console.log("📝 ProjectsFilter - Changement de recherche:", value);
    setSearchTerm(value);
  }, []);

  /**
   * Gestion du changement de filtre de statut
   */
  const handleStatusChange = useCallback(
    (status: string): void => {
      console.log("📊 ProjectsFilter - Changement de statut:", status);
      setStatusFilter(status);

      // Appeler le callback si fourni
      if (onStatusFilter) {
        onStatusFilter(status);
      }
    },
    [onStatusFilter]
  );

  /**
   * Nettoyage de la recherche
   */
  const handleClearSearch = useCallback((): void => {
    console.log("🗑️ ProjectsFilter - Nettoyage de la recherche");
    setSearchTerm("");
    onFilter("");
  }, [onFilter]);

  /**
   * Reset de tous les filtres
   */
  const handleResetFilters = useCallback((): void => {
    console.log("🔄 ProjectsFilter - Reset de tous les filtres");
    setSearchTerm("");
    setStatusFilter("all");
    onFilter("");
    if (onStatusFilter) {
      onStatusFilter("all");
    }
  }, [onFilter, onStatusFilter]);

  // Indicateur de filtres actifs
  const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Ligne principale avec recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Champ de recherche avec icônes */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            type="text"
            placeholder="Rechercher par nom, clé, slug ou description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            aria-label="Recherche de projets"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
            >
              <X className="h-3 w-3 text-gray-500" />
            </Button>
          )}
        </div>

        {/* Filtre par statut */}
        {onStatusFilter && (
          <div className="flex flex-col sm:flex-row gap-2 min-w-0 sm:min-w-[200px]">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-10 min-w-[160px] border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Statut" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.value !== "all" && (
                        <div className="flex items-center ml-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              option.value === "ACTIVE"
                                ? "bg-green-500"
                                : option.value === "INACTIVE"
                                ? "bg-gray-400"
                                : "bg-orange-500"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bouton de reset des filtres (visible si filtres actifs) */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="px-4 h-10 border-gray-300 text-gray-600 hover:bg-gray-50 whitespace-nowrap"
            title="Réinitialiser les filtres"
          >
            <X className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Réinitialiser</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        )}
      </div>

      {/* Indicateurs de filtres actifs (responsive) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Filtres actifs :</span>

          {searchTerm.trim() && (
            <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              <Search className="h-3 w-3" />
              <span className="truncate max-w-32">{searchTerm}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          )}

          {statusFilter !== "all" && (
            <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              <Filter className="h-3 w-3" />
              <span>
                {STATUS_OPTIONS.find((opt) => opt.value === statusFilter)
                  ?.label || statusFilter}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange("all")}
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
