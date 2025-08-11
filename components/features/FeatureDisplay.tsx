// @/components/features/FeaturesDisplay.tsx
// Composant pour sélectionner le mode d'affichage des features (list, card, tree)
// Rôle : Interface de sélection du mode d'affichage
// Composants : Boutons de sélection avec icônes Lucide
// État : Gère le mode d'affichage sélectionné

"use client";

import { JSX, useState } from "react";
import { List, Grid, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type ViewMode = "list" | "card" | "tree";

interface FeaturesDisplayProps {
  onViewModeChange?: (mode: ViewMode) => void;
}

export function FeaturesDisplay({
  onViewModeChange,
}: FeaturesDisplayProps): JSX.Element {
  const [selectedMode, setSelectedMode] = useState<ViewMode>("list");

  const handleModeChange = (mode: ViewMode): void => {
    setSelectedMode(mode);
    onViewModeChange?.(mode);
  };

  const viewModes = [
    {
      mode: "list" as const,
      icon: List,
      label: "List View",
      description: "Display features in a detailed list format",
    },
    {
      mode: "card" as const,
      icon: Grid,
      label: "Card View",
      description: "Display features as cards with visual previews",
    },
    {
      mode: "tree" as const,
      icon: GitBranch,
      label: "Tree View",
      description: "Display features in a hierarchical tree structure",
    },
  ];

  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Display Options</h2>
            <p className="text-sm text-muted-foreground">
              Choose how you want to view your features
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {viewModes.map(({ mode, icon: Icon, label, description }) => (
              <Button
                key={mode}
                variant={selectedMode === mode ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start space-y-2 text-left"
                onClick={() => handleModeChange(mode)}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {description}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
