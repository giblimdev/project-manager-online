// components/items/item-filter.tsx
// Composant pour filtrer les items par nom et description
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ItemFilterProps {
  searchTerm: string;
  onFilterChange: (term: string) => void;
}

export const ItemFilter: React.FC<ItemFilterProps> = ({
  searchTerm,
  onFilterChange,
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
      <Input
        type="text"
        placeholder="Rechercher par nom ou description..."
        value={searchTerm}
        onChange={(e) => onFilterChange(e.target.value)}
        className="pl-10 w-full sm:w-80"
      />
    </div>
  );
};
