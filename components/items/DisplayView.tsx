// components/items/display-view.tsx
// Composant pour changer le mode d'affichage des items
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { List, Grid, GitBranch, Kanban } from "lucide-react";
import type { ViewMode } from "@/types/item";

interface DisplayViewProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export const DisplayView: React.FC<DisplayViewProps> = ({
  currentView,
  onViewChange,
}) => {
  const views = [
    { mode: "list" as const, icon: List, label: "Liste" },
    { mode: "card" as const, icon: Grid, label: "Cartes" },
    { mode: "tree" as const, icon: GitBranch, label: "Arbre" },
    { mode: "kanban" as const, icon: Kanban, label: "Kanban" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
      {views.map(({ mode, icon: Icon, label }) => (
        <Button
          key={mode}
          variant={currentView === mode ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(mode)}
          className={`flex items-center gap-1 ${
            currentView === mode
              ? "bg-white shadow-sm text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
};
