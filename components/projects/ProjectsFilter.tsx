// components/projects/ProjectsFilter.tsx

/**
 * RÔLE : Composant de filtrage et recherche des projets
 * RESPONSABILITÉS :
 * - Capture et traitement des termes de recherche avec debouncing
 * - Filtrage par nom ou statut des projets (ACTIVE, INACTIVE, ARCHIVED)
 * - Interface responsive et accessible avec design moderne
 * - Optimisation des performances avec useDebounce
 * - Synchronisation avec l'état parent via callbacks
 * - Affichage des statistiques de filtrage en temps réel
 * - Réinitialisation rapide des filtres
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Badge, Card, CardContent
 * - lucide-react: Search, X, Filter, RotateCcw, TrendingUp, Eye, EyeOff, Archive, Activity
 * - Hook personnalisé: useDebounce (@/hooks/useDebounce)
 * - React hooks: useState, useEffect, useCallback, useMemo, JSX
 *
 * LIBS UTILISÉS :
 * - React (useState, useEffect, useCallback, useMemo, JSX)
 * - Next.js 15 client component
 * - TypeScript strict mode avec interfaces strictes
 * - Tailwind CSS pour le styling responsive
 * - Custom hook useDebounce pour l'optimisation des performances
 * - Gestion d'état locale synchronisée avec le parent
 *
 * PROPS de @/app/projects/page.tsx :
 * <ProjectsFilter
 *   searchTerm={state.searchTerm}
 *   statusFilter={state.statusFilter}
 *   onSearchChange={handleFilter}
 *   onStatusFilterChange={handleStatusFilter}
 *   totalCount={state.projects.length}
 *   filteredCount={state.filteredProjects.length}
 * />
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo, JSX } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  Filter,
  RotateCcw,
  TrendingUp,
  Eye,
  EyeOff,
  Archive,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

// Types pour les options de filtre
type StatusFilter =
  | "all"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED"
  | "PRIVATE"
  | "PUBLIC";

// Configuration des statuts avec métadonnées
interface StatusOption {
  value: StatusFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}

// Props du composant
interface ProjectsFilterProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (searchTerm: string) => void;
  onStatusFilterChange: (status: string) => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
  placeholder?: string;
  debounceDelay?: number;
  showStats?: boolean;
  showResetButton?: boolean;
}

// État local du composant
interface FilterState {
  localSearchTerm: string;
  isSearching: boolean;
  hasActiveFilters: boolean;
}

export default function ProjectsFilter({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  totalCount,
  filteredCount,
  className = "",
  placeholder = "Rechercher par nom, clé ou description...",
  debounceDelay = 300,
  showStats = true,
  showResetButton = true,
}: ProjectsFilterProps): JSX.Element {
  // État local pour la synchronisation
  const [state, setState] = useState<FilterState>(() => ({
    localSearchTerm: searchTerm,
    isSearching: false,
    hasActiveFilters: Boolean(
      searchTerm || (statusFilter && statusFilter !== "all")
    ),
  }));

  // Debouncing de la recherche pour optimiser les performances
  const debouncedSearchTerm = useDebounce(state.localSearchTerm, debounceDelay);

  /**
   * Configuration des options de statut avec design moderne
   */
  const statusOptions = useMemo(
    (): StatusOption[] => [
      {
        value: "all",
        label: "Tous les projets",
        icon: TrendingUp,
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        description: "Afficher tous les projets sans distinction",
      },
      {
        value: "ACTIVE",
        label: "Actifs",
        icon: Activity,
        color: "text-green-700",
        bgColor: "bg-green-100",
        description: "Projets en cours de développement",
      },
      {
        value: "INACTIVE",
        label: "Inactifs",
        icon: EyeOff,
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        description: "Projets temporairement suspendus",
      },
      {
        value: "ARCHIVED",
        label: "Archivés",
        icon: Archive,
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        description: "Projets terminés ou abandonnés",
      },
      {
        value: "PRIVATE",
        label: "Privés",
        icon: Eye,
        color: "text-red-700",
        bgColor: "bg-red-100",
        description: "Projets à accès restreint",
      },
      {
        value: "PUBLIC",
        label: "Publics",
        icon: CheckCircle2,
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        description: "Projets accessibles publiquement",
      },
    ],
    []
  );

  /**
   * Synchronisation avec les props parentes
   */
  useEffect(() => {
    if (searchTerm !== state.localSearchTerm) {
      setState((prev) => ({
        ...prev,
        localSearchTerm: searchTerm,
      }));
    }
  }, [searchTerm, state.localSearchTerm]);

  /**
   * Gestion du terme de recherche debouncé
   */
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      console.log("🔍 Recherche debouncée:", debouncedSearchTerm);
      onSearchChange(debouncedSearchTerm);
      setState((prev) => ({
        ...prev,
        isSearching: false,
      }));
    }
  }, [debouncedSearchTerm, searchTerm, onSearchChange]);

  /**
   * Mise à jour de l'état des filtres actifs
   */
  useEffect(() => {
    const hasFilters = Boolean(
      state.localSearchTerm.trim() || (statusFilter && statusFilter !== "all")
    );

    setState((prev) => ({
      ...prev,
      hasActiveFilters: hasFilters,
    }));
  }, [state.localSearchTerm, statusFilter]);

  /**
   * Gestion du changement de terme de recherche
   */
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const value = event.target.value;
      console.log("✏️ Saisie recherche:", value);

      setState((prev) => ({
        ...prev,
        localSearchTerm: value,
        isSearching: value !== debouncedSearchTerm,
      }));
    },
    [debouncedSearchTerm]
  );

  /**
   * Effacement du terme de recherche
   */
  const handleClearSearch = useCallback((): void => {
    console.log("🧹 Effacement recherche");
    setState((prev) => ({
      ...prev,
      localSearchTerm: "",
      isSearching: false,
    }));
    onSearchChange("");
  }, [onSearchChange]);

  /**
   * Gestion du changement de filtre de statut
   */
  const handleStatusFilterChange = useCallback(
    (value: string): void => {
      console.log("📊 Changement filtre statut:", value);
      onStatusFilterChange(value);
    },
    [onStatusFilterChange]
  );

  /**
   * Réinitialisation de tous les filtres
   */
  const handleResetFilters = useCallback((): void => {
    console.log("🔄 Réinitialisation filtres");
    setState((prev) => ({
      ...prev,
      localSearchTerm: "",
      isSearching: false,
      hasActiveFilters: false,
    }));
    onSearchChange("");
    onStatusFilterChange("all");
  }, [onSearchChange, onStatusFilterChange]);

  /**
   * Récupération de l'option de statut actuelle
   */
  const currentStatusOption = useMemo(() => {
    return (
      statusOptions.find((option) => option.value === statusFilter) ||
      statusOptions[0]
    );
  }, [statusOptions, statusFilter]);

  /**
   * Calcul des statistiques de filtrage
   */
  const filterStats = useMemo(() => {
    const percentage =
      totalCount > 0 ? Math.round((filteredCount / totalCount) * 100) : 0;
    const isFiltered = filteredCount !== totalCount;

    return {
      percentage,
      isFiltered,
      hiddenCount: totalCount - filteredCount,
      showingText: isFiltered
        ? `${filteredCount} sur ${totalCount} projets`
        : `${totalCount} projet${totalCount !== 1 ? "s" : ""}`,
    };
  }, [totalCount, filteredCount]);

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Ligne principale de filtrage */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Champ de recherche avec icônes */}
          <div className="relative flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={placeholder}
                value={state.localSearchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-10 h-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />

              {/* Indicateur de recherche en cours */}
              {state.isSearching && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Bouton d'effacement */}
              {state.localSearchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  title="Effacer la recherche"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Sélecteur de statut avec design moderne */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                <div className="flex items-center gap-2">
                  <currentStatusOption.icon
                    className={`h-4 w-4 ${currentStatusOption.color}`}
                  />
                  <SelectValue placeholder="Filtrer par statut" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Bouton de réinitialisation */}
            {showResetButton && state.hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-3 border-gray-200 hover:bg-gray-50 transition-colors"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Ligne des statistiques et badges */}
        {showStats && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-gray-100">
            {/* Statistiques de filtrage */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>{filterStats.showingText}</span>
              </div>

              {filterStats.isFiltered && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Filter className="h-4 w-4" />
                  <span>{filterStats.percentage}% visible</span>
                </div>
              )}

              {state.isSearching && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Clock className="h-4 w-4" />
                  <span>Recherche...</span>
                </div>
              )}
            </div>

            {/* Badges des filtres actifs */}
            <div className="flex items-center gap-2 flex-wrap">
              {state.localSearchTerm.trim() && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  <Search className="h-3 w-3 mr-1" />"{state.localSearchTerm}"
                  <button
                    onClick={handleClearSearch}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}

              {statusFilter && statusFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className={`${currentStatusOption.bgColor} ${currentStatusOption.color} hover:opacity-80 transition-opacity`}
                >
                  <currentStatusOption.icon className="h-3 w-3 mr-1" />
                  {currentStatusOption.label}
                  <button
                    onClick={() => handleStatusFilterChange("all")}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Message d'aide contextuel */}
        {state.hasActiveFilters && filteredCount === 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="text-amber-700">
              <span className="font-medium">Aucun résultat trouvé.</span>
              <span className="ml-1">
                Essayez de modifier vos critères de recherche ou
                <button
                  onClick={handleResetFilters}
                  className="ml-1 text-amber-800 underline hover:no-underline"
                >
                  réinitialisez les filtres
                </button>
                .
              </span>
            </div>
          </div>
        )}

        {/* Indicateur de performance (mode développement) */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-gray-400 flex items-center gap-2 pt-2 border-t border-gray-50">
            <Zap className="h-3 w-3" />
            <span>
              Debounce: {debounceDelay}ms • Filtres:{" "}
              {state.hasActiveFilters ? "Actifs" : "Inactifs"} • État:{" "}
              {state.isSearching ? "Recherche" : "Stable"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook personnalisé pour gérer les raccourcis clavier du filtre
 */
export const useFilterShortcuts = (
  onFocusSearch: () => void,
  onResetFilters: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "/":
          event.preventDefault();
          onFocusSearch();
          break;
        case "Escape":
          event.preventDefault();
          onResetFilters();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [onFocusSearch, onResetFilters, enabled]);
};

/**
 * Types exportés pour réutilisation
 */
export type { ProjectsFilterProps, StatusFilter };
