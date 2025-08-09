// components/files/FilesDisplay.tsx

/**
 * RÔLE : Composant sélecteur de mode d'affichage pour les fichiers avec design moderne
 * RESPONSABILITÉS :
 * - Basculement entre les modes d'affichage (list, card, branch) avec état persistant
 * - Interface utilisateur moderne avec boutons toggle et feedback visuel
 * - Transmission du mode sélectionné vers les composants d'affichage parents
 * - Design responsive avec icons lucide-react et animation de transition
 * - Gestion des états actifs avec styling différencié et hover effects
 *
 * COMPOSANTS UTILISÉS :
 * - Button: Composant bouton shadcn/ui avec variants pour les états actifs/inactifs
 * - lucide-react: Icons modernes pour chaque mode (List, Grid3X3, GitBranch)
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: JSX pour l'affichage sans état interne
 * - Next.js 15 client component avec TypeScript strict mode
 * - Tailwind CSS: Design responsive avec hover effects et transitions
 * - lucide-react: Icons modernes cohérentes avec le design system
 * - shadcn/ui: Button component avec variants et styling cohérent
 *
 * PROPS reçues du parent :
 * - viewMode: Mode d'affichage actuel ("list" | "card" | "branch")
 * - onViewModeChange: Callback de changement de mode avec type strict
 */

"use client";

import React, { JSX } from "react";
import { Button } from "@/components/ui/button";
import { List, Grid3X3, GitBranch } from "lucide-react";

// Types pour les modes d'affichage
type ViewMode = "list" | "card" | "branch";

// Interface pour les props du composant
interface FilesDisplayProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function FilesDisplay({
  viewMode,
  onViewModeChange,
}: FilesDisplayProps): JSX.Element {
  return (
    <div className="flex bg-white rounded-xl p-2 shadow-sm border border-gray-200">
      {/* Mode Liste */}
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          viewMode === "list"
            ? "bg-blue-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
        title="Mode liste"
      >
        <List className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Liste</span>
      </Button>

      {/* Mode Cartes */}
      <Button
        variant={viewMode === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("card")}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-1 ${
          viewMode === "card"
            ? "bg-blue-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
        title="Mode cartes"
      >
        <Grid3X3 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Cartes</span>
      </Button>

      {/* Mode Arbre */}
      <Button
        variant={viewMode === "branch" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("branch")}
        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ml-1 ${
          viewMode === "branch"
            ? "bg-blue-600 text-white shadow-md transform scale-105"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
        title="Mode arbre"
      >
        <GitBranch className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Arbre</span>
      </Button>
    </div>
  );
}
