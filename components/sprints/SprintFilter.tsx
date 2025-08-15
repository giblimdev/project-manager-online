// @/components/sprints/SprintFilter.tsx
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { SprintStatus } from "@/lib/generated/prisma/client"; 

interface SprintFilterProps {
  value: {
    search: string;
    status: SprintStatus | "";
  };
  onChange: (filter: { search: string; status: SprintStatus | "" }) => void;
  disabled?: boolean;
  resultCount?: number;
}

export default function SprintFilter({
  value,
  onChange,
  disabled = false,
  resultCount,
}: SprintFilterProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      search: e.target.value,
    });
  };

  const handleStatusChange = (status: string) => {
    onChange({
      ...value,
      status: status as SprintStatus | "",
    });
  };

  const resetFilters = () => {
    onChange({
      search: "",
      status: "",
    });
  };

  const hasFilters = value.search || value.status;

  // Fonction pour traduire les statuts
  const getStatusLabel = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.PLANNED:
        return "📋 Planifié";
      case SprintStatus.ACTIVE:
        return "🚀 Actif";
      case SprintStatus.COMPLETED:
        return "✅ Terminé";
      case SprintStatus.CANCELLED:
        return "❌ Annulé";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche principale */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un sprint par nom, description ou objectif..."
          className="w-80 pl-9 pr-9"
          value={value.search}
          onChange={handleSearchChange}
          disabled={disabled}
        />
        {value.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
            onClick={() => onChange({ ...value, search: "" })}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filtres avancés */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtres :
        </div>

        {/* Filtre par statut */}
        <Select
          value={value.status}
          onValueChange={handleStatusChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            {Object.values(SprintStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {getStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Bouton de réinitialisation */}
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Réinitialiser
          </Button>
        )}

        {/* Compteur de résultats */}
        {typeof resultCount === "number" && (
          <div className="ml-auto text-sm text-muted-foreground">
            {resultCount} sprint{resultCount > 1 ? "s" : ""}
            {hasFilters && " trouvé" + (resultCount > 1 ? "s" : "")}
          </div>
        )}
      </div>
    </div>
  );
}
