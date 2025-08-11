// 📄 /components/tasks/TasksFilter.tsx
// 🎯 Rôle : Composant de filtrage
// 📦 Responsabilités : Filtrage par nom uniquement (recherche textuelle), retourne les user stories filtrées
// 🔧 Composants utilisés : Input, Button, Badge de shadcn/ui, icônes Lucide React

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, FileSearch } from "lucide-react";

interface TasksFilterProps {
  filter: string;
  onFilterChange: (filter: string) => void;
  storiesCount?: number;
}

export default function TasksFilter({
  filter,
  onFilterChange,
  storiesCount = 0,
}: TasksFilterProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const clearFilter = () => {
    onFilterChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange(e.target.value);
  };

  return (
    <div className="space-y-3">
      {/* 🔍 Barre de recherche principale */}
      <div className="relative flex items-center gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileSearch className="h-4 w-4" />
          <span className="text-sm font-medium hidden sm:inline">
            Recherche:
          </span>
        </div>

        <div
          className={`
          relative flex-1 transition-all duration-200
          ${isFocused ? "scale-105" : ""}
        `}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une user story par titre..."
            value={filter}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {filter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 📊 Indicateurs de filtrage */}
      <div className="flex items-center gap-2 text-sm">
        {filter && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Recherche active:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />"{filter}"
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilter}
                className="h-4 w-4 p-0 hover:bg-muted-foreground/20 ml-1"
                aria-label="Supprimer le filtre"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        )}

        {storiesCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>
              {storiesCount} résultat{storiesCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* 💡 Conseils de recherche */}
      {!filter && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          💡 <strong>Astuce:</strong> Tapez le nom d'une user story pour filtrer
          instantanément les résultats
        </div>
      )}
    </div>
  );
}
