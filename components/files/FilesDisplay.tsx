// components/files/FilesDisplay.tsx

/**
 * RÔLE : Composant sélecteur de mode d'affichage pour les métadonnées de fichiers
 * RESPONSABILITÉS :
 * - Basculement entre les modes d'affichage (list, card, branch) avec état persistant
 * - Interface utilisateur moderne avec boutons toggle et feedback visuel
 * - Transmission du mode sélectionné vers les composants d'affichage parents
 * - Design responsive avec icons lucide-react et animation de transition
 * - Gestion des états actifs avec styling différencié et hover effects
 * - Support des métadonnées de développement avec modes adaptés
 *
 * COMPOSANTS UTILISÉS :
 * - Button: Composant bouton shadcn/ui avec variants pour les états actifs/inactifs
 * - Card, CardContent: Conteneurs shadcn/ui pour structuration moderne
 * - lucide-react: Icons modernes pour chaque mode (List, Grid3X3, GitBranch)
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: JSX pour l'affichage sans état interne
 * - Next.js 15 client component avec TypeScript strict mode
 * - Tailwind CSS: Design responsive avec hover effects et transitions
 * - lucide-react: Icons modernes cohérentes avec le design system
 * - shadcn/ui: Button component avec variants et styling cohérent
 */

"use client";

import React, { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, Grid3X3, GitBranch, Eye, LayoutGrid } from "lucide-react";

// ✅ Import des types centralisés
import type { ViewMode } from "@/types/files";

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
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Label */}
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">Mode d'affichage</span>
          </div>

          {/* Boutons de sélection */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {/* Vue Liste */}
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={`
                flex items-center space-x-2 px-3 py-2 transition-all
                ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-blue-600"
                    : "hover:bg-gray-200 text-gray-600"
                }
              `}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Liste</span>
            </Button>

            {/* Vue Cartes */}
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("card")}
              className={`
                flex items-center space-x-2 px-3 py-2 transition-all
                ${
                  viewMode === "card"
                    ? "bg-white shadow-sm text-blue-600"
                    : "hover:bg-gray-200 text-gray-600"
                }
              `}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Cartes</span>
            </Button>

            {/* Vue Arborescence */}
            <Button
              variant={viewMode === "branch" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("branch")}
              className={`
                flex items-center space-x-2 px-3 py-2 transition-all
                ${
                  viewMode === "branch"
                    ? "bg-white shadow-sm text-blue-600"
                    : "hover:bg-gray-200 text-gray-600"
                }
              `}
            >
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Arbre</span>
            </Button>
          </div>
        </div>

        {/* Description du mode actuel */}
        <div className="mt-3 text-sm text-gray-500">
          {viewMode === "list" && (
            <div className="flex items-center space-x-2">
              <LayoutGrid className="h-4 w-4" />
              <span>
                Vue tableau détaillée avec colonnes triables et relations
              </span>
            </div>
          )}
          {viewMode === "card" && (
            <div className="flex items-center space-x-2">
              <LayoutGrid className="h-4 w-4" />
              <span>
                Vue grille moderne avec cartes visuelles et métadonnées
              </span>
            </div>
          )}
          {viewMode === "branch" && (
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span>
                Vue arborescente hiérarchique avec navigation par dossiers
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
