// components/projects/ProjectsFilter.tsx
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ProjectsFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const ProjectsFilter: React.FC<ProjectsFilterProps> = ({
  value,
  onChange,
  placeholder = "Rechercher...",
  className,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleClear = () => {
    onChange("");
  };

  const filterCount = value ? 1 : 0;

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10 transition-colors duration-200"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2 px-3 h-10 border-gray-200 hover:bg-gray-50",
              filterCount > 0 && "border-blue-200 bg-blue-50 text-blue-700"
            )}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
            {filterCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                {filterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtres avancés</h4>
              {filterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Effacer tout
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Recherche globale
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Nom, description, clé ou propriétaire..."
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recherche dans le nom, la description, la clé du projet et les
                  propriétaires
                </p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 italic">
                  Filtres par statut, visibilité et équipe à venir...
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="text-xs text-gray-500">
                {filterCount === 0
                  ? "Aucun filtre actif"
                  : `${filterCount} filtre actif`}
              </div>
              <Button
                size="sm"
                onClick={() => setIsFilterOpen(false)}
                className="h-8 px-3 text-xs"
              >
                Appliquer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
