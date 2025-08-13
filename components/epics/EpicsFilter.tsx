// @/components/epics/EpicsFilter.tsx

/**
 * RÔLE : Composant de filtrage pour les épics par nom et priorité
 * RESPONSABILITÉS :
 * - Filtrage par recherche textuelle sur le nom des épics
 * - Filtrage par priorité (ALL, CRITICAL, HIGH, MEDIUM, LOW)
 * - Interface responsive avec icônes Lucide et design moderne
 * - Callbacks pour transmettre les filtres au composant parent
 * - Gestion d'état synchronisée avec les props du parent
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: JSX
 * - TypeScript strict mode avec interfaces
 * - lucide-react: Icônes Search, Filter, X pour l'interface
 * - shadcn/ui: Input, Select, Button pour une UI cohérente
 * - Tailwind CSS: Classes pour le design responsive
 *
 * PROPS :
 * - search: string - Terme de recherche actuel
 * - priority: FilterPriority - Priorité sélectionnée ("ALL" | Priority)
 * - onSearchChange: (search: string) => void - Callback pour changement de recherche
 * - onPriorityChange: (priority: FilterPriority) => void - Callback pour changement de priorité
 */

"use client";

import React, { JSX } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, Target } from "lucide-react";

// ✅ Types cohérents avec la page épics
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type FilterPriority = Priority | "ALL";

// ✅ Interface pour les props du composant
interface EpicsFilterProps {
  search: string;
  priority: FilterPriority;
  onSearchChange: (search: string) => void;
  onPriorityChange: (priority: FilterPriority) => void;
}

// ✅ Configuration des priorités avec couleurs
const PRIORITY_OPTIONS: Array<{
  value: FilterPriority;
  label: string;
  color: string;
  bgColor: string;
}> = [
  {
    value: "ALL",
    label: "Toutes priorités",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  {
    value: "CRITICAL",
    label: "Critique",
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
  {
    value: "HIGH",
    label: "Haute",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
  },
  {
    value: "MEDIUM",
    label: "Moyenne",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  {
    value: "LOW",
    label: "Basse",
    color: "text-green-700",
    bgColor: "bg-green-50",
  },
];

export default function EpicsFilter({
  search,
  priority,
  onSearchChange,
  onPriorityChange,
}: EpicsFilterProps): JSX.Element {
  // ✅ Handler pour réinitialiser tous les filtres
  const handleResetFilters = (): void => {
    onSearchChange("");
    onPriorityChange("ALL");
  };

  // ✅ Vérifier si des filtres sont actifs
  const hasActiveFilters = search.trim() !== "" || priority !== "ALL";

  // ✅ Obtenir les données de la priorité sélectionnée
  const selectedPriorityData = PRIORITY_OPTIONS.find(
    (opt) => opt.value === priority
  );

  return (
    <div className="space-y-4">
      {/* ✅ En-tête du composant */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Filtres</h3>
        </div>

        {/* ✅ Bouton de réinitialisation (affiché seulement si filtres actifs) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* ✅ Conteneur des filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ✅ Filtre de recherche par nom */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Rechercher par nom
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nom de l'épic..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-9"
            />
            {/* ✅ Bouton pour effacer la recherche */}
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* ✅ Filtre par priorité */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Filtrer par priorité
          </label>
          <Select
            value={priority}
            onValueChange={(value: FilterPriority) => onPriorityChange(value)}
          >
            <SelectTrigger className="h-9">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <SelectValue>
                  {selectedPriorityData && (
                    <span className={selectedPriorityData.color}>
                      {selectedPriorityData.label}
                    </span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        option.bgColor
                      } ${
                        option.value !== "ALL"
                          ? "border-current"
                          : "border-muted"
                      }`}
                    />
                    <span className={option.color}>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ✅ Indicateurs de filtres actifs */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            {search.trim() && (
              <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                <Search className="h-3 w-3 mr-1" />
                Recherche: "{search}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchChange("")}
                  className="ml-1 h-4 w-4 p-0 hover:bg-blue-100"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}

            {priority !== "ALL" && selectedPriorityData && (
              <div
                className={`inline-flex items-center px-2 py-1 rounded-md ${selectedPriorityData.bgColor} ${selectedPriorityData.color} text-xs`}
              >
                <Target className="h-3 w-3 mr-1" />
                Priorité: {selectedPriorityData.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPriorityChange("ALL")}
                  className="ml-1 h-4 w-4 p-0 hover:bg-current hover:bg-opacity-20"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Résumé des résultats (optionnel) */}
      <div className="text-xs text-muted-foreground">
        {hasActiveFilters ? (
          <span>Filtres actifs appliqués</span>
        ) : (
          <span>Aucun filtre appliqué</span>
        )}
      </div>
    </div>
  );
}
