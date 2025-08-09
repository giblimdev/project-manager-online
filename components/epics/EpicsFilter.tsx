// components/epics/EpicsFilter.tsx

/**
 * RÔLE : Composant de filtrage des épics par nom et priorité avec interface moderne
 * RESPONSABILITÉS :
 * - Filtrage par nom avec recherche en temps réel (nom et description)
 * - Filtrage par priorité avec sélection multiple (ALL, LOW, MEDIUM, HIGH, CRITICAL)
 * - Interface utilisateur moderne et responsive avec shadcn/ui
 * - Gestion des états de filtrage avec callbacks vers le composant parent
 * - Indicateurs visuels pour les filtres actifs et le nombre de résultats
 * - Reset rapide des filtres avec bouton dédié
 * - Persistance des filtres pendant la session utilisateur
 *
 * COMPOSANTS UTILISÉS :
 * - Input: Composant de saisie shadcn/ui pour la recherche par nom
 * - Select: Composant de sélection shadcn/ui pour la priorité
 * - Button: Composant bouton shadcn/ui pour le reset
 * - Badge: Composant badge pour les indicateurs de filtres actifs
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useCallback, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - Tailwind CSS: Design moderne responsive avec spacing et colors
 * - lucide-react: Icons pour Search, Filter, X pour l'interface
 * - shadcn/ui: Input, Select, Button, Badge components
 *
 * PROPS reçues de la page parent :
 * - filters: FilterState - État actuel des filtres
 * - onFiltersChange: (filters: FilterState) => void - Callback de mise à jour des filtres
 */

"use client";

import React, { JSX, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

// Interface pour l'état des filtres
interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Interface pour les props du composant
interface EpicsFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function EpicsFilter({
  filters,
  onFiltersChange,
}: EpicsFilterProps): JSX.Element {
  // Handler pour la mise à jour du filtre par nom
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFilters = {
        ...filters,
        name: e.target.value,
      };
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Handler pour la mise à jour du filtre par priorité
  const handlePriorityChange = useCallback(
    (value: string) => {
      const newFilters = {
        ...filters,
        priority: value as FilterState["priority"],
      };
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  // Handler pour reset tous les filtres
  const handleResetFilters = useCallback(() => {
    const resetFilters: FilterState = {
      name: "",
      priority: "ALL",
    };
    onFiltersChange(resetFilters);
  }, [onFiltersChange]);

  // Fonction utilitaire pour obtenir l'icône de priorité
  const getPriorityIcon = useCallback((priority: string): string => {
    switch (priority) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🟠";
      case "CRITICAL":
        return "🔴";
      default:
        return "";
    }
  }, []);

  // Calcul du nombre de filtres actifs
  const activeFiltersCount = [
    filters.name.trim() !== "",
    filters.priority !== "ALL",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header avec titre et indicateur de filtres actifs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""}{" "}
              actif{activeFiltersCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Bouton reset (visible seulement si des filtres sont actifs) */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Ligne de filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtre par nom */}
        <div className="space-y-2">
          <label
            htmlFor="name-filter"
            className="text-sm font-medium text-gray-700"
          >
            Rechercher par nom
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="name-filter"
              type="text"
              placeholder="Nom ou description de l'épic..."
              value={filters.name}
              onChange={handleNameChange}
              className="pl-10"
            />
          </div>
          {filters.name.trim() && (
            <p className="text-xs text-gray-500">
              Recherche active : "{filters.name}"
            </p>
          )}
        </div>

        {/* Filtre par priorité */}
        <div className="space-y-2">
          <label
            htmlFor="priority-filter"
            className="text-sm font-medium text-gray-700"
          >
            Filtrer par priorité
          </label>
          <Select value={filters.priority} onValueChange={handlePriorityChange}>
            <SelectTrigger id="priority-filter">
              <SelectValue placeholder="Sélectionner une priorité">
                {filters.priority === "ALL" ? (
                  "Toutes les priorités"
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{getPriorityIcon(filters.priority)}</span>
                    <span>
                      {filters.priority === "LOW" && "Faible"}
                      {filters.priority === "MEDIUM" && "Moyenne"}
                      {filters.priority === "HIGH" && "Élevée"}
                      {filters.priority === "CRITICAL" && "Critique"}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <div className="flex items-center gap-2">
                  <span className="w-4"></span>
                  <span>Toutes les priorités</span>
                </div>
              </SelectItem>
              <SelectItem value="CRITICAL">
                <div className="flex items-center gap-2">
                  <span>🔴</span>
                  <span>Critique</span>
                </div>
              </SelectItem>
              <SelectItem value="HIGH">
                <div className="flex items-center gap-2">
                  <span>🟠</span>
                  <span>Élevée</span>
                </div>
              </SelectItem>
              <SelectItem value="MEDIUM">
                <div className="flex items-center gap-2">
                  <span>🟡</span>
                  <span>Moyenne</span>
                </div>
              </SelectItem>
              <SelectItem value="LOW">
                <div className="flex items-center gap-2">
                  <span>🟢</span>
                  <span>Faible</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {filters.priority !== "ALL" && (
            <p className="text-xs text-gray-500">
              Priorité : {getPriorityIcon(filters.priority)} {filters.priority}
            </p>
          )}
        </div>
      </div>

      {/* Résumé des filtres actifs */}
      {activeFiltersCount > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtres actifs :</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {filters.name.trim() && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Nom : "{filters.name}"
              </Badge>
            )}
            {filters.priority !== "ALL" && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {getPriorityIcon(filters.priority)} {filters.priority}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
