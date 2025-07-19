// components/projects/ProjectsDisplayView.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectsDisplayViewProps {
  viewMode: "list" | "card";
  onViewModeChange: (mode: "list" | "card") => void;
  className?: string;
}

export const ProjectsDisplayView: React.FC<ProjectsDisplayViewProps> = ({
  viewMode,
  onViewModeChange,
  className,
}) => {
  const views = [
    {
      mode: "list" as const,
      icon: List,
      label: "Liste",
      description: "Affichage compact en liste",
    },
    {
      mode: "card" as const,
      icon: LayoutGrid,
      label: "Cartes",
      description: "Affichage détaillé en cartes",
    },
  ];

  return (
    <div
      className={cn("flex rounded-lg border bg-white p-1 shadow-sm", className)}
    >
      {views.map(({ mode, icon: Icon, label, description }) => (
        <Button
          key={mode}
          variant={viewMode === mode ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange(mode)}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 text-sm transition-all duration-200",
            viewMode === mode
              ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
          title={description}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
};
