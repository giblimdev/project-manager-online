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
import { Search, X } from "lucide-react";
import { SprintStatus } from "@/lib/generated/prisma/client";

interface SprintFilterProps {
  value: {
    search: string;
    status: string;
    priority?: string;
  };
  onChange: (filter: {
    search: string;
    status: string;
    priority?: string;
  }) => void;
  disabled?: boolean;
}

export default function SprintFilter({
  value,
  onChange,
  disabled = false,
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
      status,
    });
  };

  const handlePriorityChange = (priority: string) => {
    onChange({
      ...value,
      priority,
    });
  };

  const resetFilters = () => {
    onChange({
      search: "",
      status: "",
      priority: "",
    });
  };

  const hasFilters = value.search || value.status || value.priority;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un sprint..."
          className="pl-9 pr-9"
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

      <Select
        value={value.status}
        onValueChange={handleStatusChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les statuts</SelectItem>
          {Object.values(SprintStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status === "PLANNED" && "Planifié"}
              {status === "ACTIVE" && "Actif"}
              {status === "COMPLETED" && "Terminé"}
              {status === "CANCELLED" && "Annulé"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.priority || ""}
        onValueChange={handlePriorityChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Toutes priorités</SelectItem>
          <SelectItem value="CRITICAL">Critique</SelectItem>
          <SelectItem value="HIGH">Haute</SelectItem>
          <SelectItem value="MEDIUM">Moyenne</SelectItem>
          <SelectItem value="LOW">Basse</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={resetFilters}
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <X className="h-4 w-4" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
