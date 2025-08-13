// @/components/epics/EpicsDisplay.tsx

/**
 * RÔLE : Composant pour sélectionner le mode d'affichage des épics (liste ou carte)
 * RESPONSABILITÉS :
 * - Afficher des boutons pour sélectionner le mode d'affichage (list ou card)
 * - Transmettre le mode sélectionné au composant parent via callback
 * - Interface simple avec icônes Lucide pour une UI moderne
 * - Gestion d'état synchronisée avec le parent
 * - Design responsive avec masquage conditionnel des labels
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useEffect, JSX
 * - TypeScript strict mode avec interfaces
 * - lucide-react: Icônes List et Grid3X3 pour les boutons de mode
 * - shadcn/ui: Button pour une UI cohérente
 * - Tailwind CSS: Classes pour le design responsive
 *
 * PROPS :
 * - viewMode: "list" | "card" - Mode d'affichage actuel (contrôlé par le parent)
 * - onViewModeChange: (mode: "list" | "card") => void - Callback pour transmettre le mode au parent
 */

"use client";

import React, { JSX, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List, Eye } from "lucide-react";

// ✅ Types pour les modes d'affichage (cohérent avec la page)
type ViewMode = "list" | "card";

// ✅ Interface pour les props du composant
interface EpicsDisplayProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export default function EpicsDisplay({
  viewMode,
  onViewModeChange,
}: EpicsDisplayProps): JSX.Element {
  // ✅ Handler pour changer le mode et informer le parent
  const handleViewModeChange = (mode: ViewMode): void => {
    // Éviter les re-renders inutiles si le mode n'a pas changé
    if (viewMode !== mode) {
      onViewModeChange(mode);
    }
  };

  return (
    <div className="space-y-3">
      {/* ✅ En-tête du composant */}
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">
          Mode d'affichage
        </h3>
      </div>

      {/* ✅ Boutons de sélection du mode */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 border rounded-lg">
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleViewModeChange("list")}
          className={`
            flex items-center gap-2 flex-1 justify-center transition-all
            ${
              viewMode === "list"
                ? "bg-background shadow-sm text-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }
          `}
          aria-label="Affichage en liste"
          aria-pressed={viewMode === "list"}
        >
          <List className="h-4 w-4" />
          <span className="text-xs font-medium">Liste</span>
        </Button>

        <Button
          variant={viewMode === "card" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleViewModeChange("card")}
          className={`
            flex items-center gap-2 flex-1 justify-center transition-all
            ${
              viewMode === "card"
                ? "bg-background shadow-sm text-foreground"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }
          `}
          aria-label="Affichage en cartes"
          aria-pressed={viewMode === "card"}
        >
          <Grid3X3 className="h-4 w-4" />
          <span className="text-xs font-medium">Cartes</span>
        </Button>
      </div>

      {/* ✅ Indicateur de mode actuel (optionnel) */}
      <div className="text-xs text-muted-foreground text-center">
        Mode actuel :{" "}
        <span className="font-medium text-foreground">
          {viewMode === "list" ? "Liste" : "Cartes"}
        </span>
      </div>
    </div>
  );
}
