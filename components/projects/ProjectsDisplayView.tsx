// components/projects/ProjectsDisplayView.tsx

/**
 * RÔLE : Composant de sélection d'affichage des projets dans différents modes de vue
 * RESPONSABILITÉS :
 * - Proposer un sélecteur de mode vue : LIST | CARD
 * - Interface moderne et responsive pour changer le mode d'affichage
 * - Gestion des états actifs/inactifs des boutons de vue
 * - Design cohérent avec l'écosystème shadcn/ui
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Button, Card, CardContent, Separator
 * - lucide-react: Grid3X3, List, LayoutGrid, ListTree
 *
 * LIBS UTILISÉS :
 * - React hooks: JSX, useCallback, useMemo
 * - TypeScript strict mode avec Next.js 15
 * - Tailwind CSS pour le styling responsive
 * - shadcn/ui pour les composants UI modernes
 *
 * PROPS de @/app/projects/page.tsx :
 * <ProjectsDisplayView
 *   projects={state.filteredProjects}
 *   viewMode={state.viewMode}
 *   onProjectSelect={handleProjectSelect}
 *   onProjectEdit={handleEdit}
 *   onProjectDelete={handleDelete}
 *   onProjectReorder={handleReorder}
 *   isLoading={isLoadingState}
 * />
 */

"use client";

import React, { JSX, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Grid3X3,
  List,
  LayoutGrid,
  ListTree,
  Eye,
  Filter,
  SortAsc,
  MoreHorizontal,
} from "lucide-react";

// Types basés sur le schéma Prisma Project
interface ProjectSimple {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les modes de vue
type ViewMode = "grid" | "list";

// Props du composant
interface ProjectsDisplayViewProps {
  projects: ProjectSimple[];
  viewMode: ViewMode;
  onProjectSelect: (project: ProjectSimple) => void;
  onProjectEdit: (project: ProjectSimple) => void;
  onProjectDelete: (projectId: string) => void;
  onProjectReorder: (projectId: string, direction: "up" | "down") => void;
  isLoading: boolean;
  onViewModeChange?: (mode: ViewMode) => void;
  className?: string;
}

// Options de vue avec métadonnées
interface ViewOption {
  mode: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  shortcut?: string;
}

export default function ProjectsDisplayView({
  projects,
  viewMode,
  onProjectSelect,
  onProjectEdit,
  onProjectDelete,
  onProjectReorder,
  isLoading,
  onViewModeChange,
  className = "",
}: ProjectsDisplayViewProps): JSX.Element {
  /**
   * Configuration des options de vue avec icons et métadonnées
   */
  const viewOptions = useMemo(
    (): ViewOption[] => [
      {
        mode: "grid",
        label: "Grille",
        icon: Grid3X3,
        description: "Affichage en cartes avec aperçu détaillé",
        shortcut: "G",
      },
      {
        mode: "list",
        label: "Liste",
        icon: List,
        description: "Affichage compact en lignes",
        shortcut: "L",
      },
    ],
    []
  );

  /**
   * Gestion du changement de mode de vue
   */
  const handleViewModeChange = useCallback(
    (mode: ViewMode): void => {
      if (mode !== viewMode && onViewModeChange) {
        console.log(`🔄 Changement de mode vue: ${viewMode} → ${mode}`);
        onViewModeChange(mode);
      }
    },
    [viewMode, onViewModeChange]
  );

  /**
   * Statistiques dérivées pour l'affichage
   */
  const stats = useMemo(
    () => ({
      total: projects.length,
      visible: projects.length,
      selected: 0, // À implémenter si nécessaire
    }),
    [projects.length]
  );

  /**
   * État de l'interface selon le mode de vue
   */
  const viewState = useMemo(
    () => ({
      isGridMode: viewMode === "grid",
      isListMode: viewMode === "list",
      hasProjects: projects.length > 0,
      isEmpty: projects.length === 0,
    }),
    [viewMode, projects.length]
  );

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* En-tête avec informations et contrôles */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Informations sur les projets */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                <span>
                  {stats.visible} projet{stats.visible !== 1 ? "s" : ""}
                  {stats.total !== stats.visible && ` sur ${stats.total}`}
                </span>
              </div>

              {isLoading && (
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Chargement...</span>
                </div>
              )}
            </div>

            {/* Sélecteur de mode de vue principal */}
            <div className="flex items-center space-x-2">
              {/* Groupe de boutons pour le mode de vue */}
              <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
                {viewOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = viewMode === option.mode;

                  return (
                    <Button
                      key={option.mode}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewModeChange(option.mode)}
                      disabled={isLoading}
                      className={`
                        relative px-3 py-2 transition-all duration-200
                        ${
                          isActive
                            ? "bg-white shadow-sm text-gray-900 font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      title={`${option.description} (${option.shortcut})`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{option.label}</span>

                      {/* Indicateur visuel pour le mode actif */}
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Boutons d'actions supplémentaires */}
              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || viewState.isEmpty}
                  className="text-gray-500 hover:text-gray-700"
                  title="Options de tri"
                >
                  <SortAsc className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || viewState.isEmpty}
                  className="text-gray-500 hover:text-gray-700"
                  title="Filtres avancés"
                >
                  <Filter className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-gray-500 hover:text-gray-700"
                  title="Plus d'options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Séparateur visuel */}
          <Separator />

          {/* Zone d'informations sur le mode de vue actuel */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                {viewState.isGridMode ? (
                  <LayoutGrid className="h-3 w-3" />
                ) : (
                  <ListTree className="h-3 w-3" />
                )}
                <span>
                  Mode {viewState.isGridMode ? "grille" : "liste"} actif
                </span>
              </span>

              {viewState.hasProjects && (
                <span>
                  • Tri par ordre ({projects[0]?.order || "N/A"} -{" "}
                  {projects[projects.length - 1]?.order || "N/A"})
                </span>
              )}
            </div>

            {/* Raccourcis clavier */}
            <div className="hidden md:flex items-center space-x-2 text-gray-400">
              <span>Raccourcis:</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">G</kbd>
              <span className="text-gray-300">•</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">L</kbd>
            </div>
          </div>

          {/* Message d'état conditionnel */}
          {viewState.isEmpty && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  {viewState.isGridMode ? (
                    <Grid3X3 className="h-8 w-8 text-gray-300" />
                  ) : (
                    <List className="h-8 w-8 text-gray-300" />
                  )}
                  <span className="text-lg">Aucun projet à afficher</span>
                </div>
                <p className="text-sm">
                  Les projets s'afficheront ici en mode{" "}
                  {viewState.isGridMode ? "grille" : "liste"}
                </p>
              </div>
            </div>
          )}

          {/* Placeholder pour les données de développement */}
          {process.env.NODE_ENV === "development" && viewState.hasProjects && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              <div className="font-medium mb-1">
                🔧 Mode Développement - Informations de debug:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  Mode vue:{" "}
                  <code className="bg-blue-100 px-1 rounded">{viewMode}</code>
                </div>
                <div>
                  Projets:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    {projects.length}
                  </code>
                </div>
                <div>
                  État:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    {isLoading ? "Chargement" : "Prêt"}
                  </code>
                </div>
                <div>
                  Callbacks:{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    {
                      [
                        onProjectSelect,
                        onProjectEdit,
                        onProjectDelete,
                        onProjectReorder,
                      ].filter(Boolean).length
                    }
                    /4
                  </code>
                </div>
              </div>
              <div className="mt-2 text-blue-600">
                💡 Ce composant ne gère que la sélection du mode d'affichage.
                L'affichage des projets doit être implémenté dans un composant
                séparé.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook personnalisé pour gérer les raccourcis clavier (optionnel)
 */
export const useViewModeShortcuts = (
  onViewModeChange: (mode: ViewMode) => void,
  enabled: boolean = true
) => {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "g":
          event.preventDefault();
          onViewModeChange("grid");
          break;
        case "l":
          event.preventDefault();
          onViewModeChange("list");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [onViewModeChange, enabled]);
};

/**
 * Types exportés pour l'utilisation dans d'autres composants
 */
export type { ViewMode, ProjectsDisplayViewProps, ProjectSimple };
