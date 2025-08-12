// components/team/TeamsDisplay.tsx
"use client";

import { ViewMode } from "@/types/team";
import { List, Grid3X3, GitBranch, Check } from "lucide-react";

type TeamsDisplayProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export default function TeamsDisplay({
  viewMode,
  onViewModeChange,
}: TeamsDisplayProps) {
  const viewModes = [
    {
      mode: "list" as ViewMode,
      icon: List,
      label: "Liste",
      description: "Affichage en liste détaillée",
    },
    {
      mode: "card" as ViewMode,
      icon: Grid3X3,
      label: "Cartes",
      description: "Affichage en grille de cartes",
    },
    {
      mode: "branch" as ViewMode,
      icon: GitBranch,
      label: "Hiérarchie",
      description: "Affichage hiérarchique en arbre",
    },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {viewModes.map(({ mode, icon: Icon, label, description }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
            ${
              viewMode === mode
                ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
            }
          `}
          title={description}
        >
          <Icon size={18} />
          <span className="text-sm font-medium hidden sm:inline">{label}</span>
          {viewMode === mode && <Check size={14} className="text-current" />}
        </button>
      ))}
    </div>
  );
}
