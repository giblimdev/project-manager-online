// components/projects/ProjectsList.tsx

/**
 * RÔLE : Composant d'affichage de la liste des projets avec actions CRUD intégrées
 * RESPONSABILITÉS :
 * - Afficher la liste des projets selon différents modes de vue (grid, list)
 * - Gérer les actions visuelles (boutons edit, delete, select, reorder)
 * - Interface responsive et moderne avec design cohérent shadcn/ui
 * - Callbacks remontants vers la page parente pour toutes les actions
 * - Optimisation des performances avec React.memo et useCallback
 * - États de chargement et animations fluides
 * - Navigation vers les détails avec indication visuelle
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton
 * - lucide-react: PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, Eye, Globe, Lock, Activity, Archive
 * - Store: useSelectedProjectStore pour la cohérence d'état
 * - React hooks: JSX, useCallback, useMemo, memo
 *
 * LIBS UTILISÉS :
 * - React (JSX, useCallback, useMemo, memo)
 * - Next.js 15 client component compatible
 * - TypeScript strict mode avec interfaces strictes
 * - Tailwind CSS pour le styling responsive et moderne
 * - Zustand store pour l'état partagé
 *
 * PROPS de @/app/projects/page.tsx :
 * - projects: ProjectSimple[] - Liste des projets filtrés depuis la page
 * - viewMode: "grid" | "list" - Mode d'affichage contrôlé par la page
 * - onEdit: (project) => Promise<void> - Callback d'édition vers la page
 * - onDelete: (projectId) => Promise<void> - Callback de suppression vers la page
 * - onSelect: (project) => void - Callback de sélection/navigation vers la page
 * - onReorder: (projectId, direction) => Promise<void> - Callback de réorganisation
 * - onCreate: () => void - Callback de création vers la page
 * - loading: boolean - État de chargement global de la page
 */

"use client";

import React, { JSX, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Globe,
  Lock,
  Activity,
  Archive,
  Pause,
  FolderOpen,
  Grid3X3,
  List,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// ✅ CORRECTION: Import du store cohérent avec la page
import {
  useSelectedProjectId,
  useProjectActions,
} from "@/stores/useSelectedProjectStore";

// Types basés sur le schéma Prisma Project cohérents avec app/projects/page.tsx
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

// Type pour le mode d'affichage cohérent avec la page
type ViewMode = "grid" | "list";

// Interface pour les props du composant strictement typée
interface ProjectsListProps {
  projects: ProjectSimple[];
  viewMode: ViewMode;
  onEdit: (project: ProjectSimple) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
  onSelect: (project: ProjectSimple) => void;
  onReorder: (projectId: string, direction: "up" | "down") => Promise<void>;
  onCreate: () => void;
  loading?: boolean;
  className?: string;
}

// Configuration des badges de statut moderne
interface StatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

// Configuration des icônes de visibilité
interface VisibilityConfig {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  label: string;
}

export default React.memo(function ProjectsList({
  projects,
  viewMode,
  onEdit,
  onDelete,
  onSelect,
  onReorder,
  onCreate,
  loading = false,
  className = "",
}: ProjectsListProps): JSX.Element {
  // ✅ CORRECTION: Store cohérent avec la page
  const selectedProjectId = useSelectedProjectId();
  const { setSelectedProjectId } = useProjectActions();

  /**
   * Configuration des badges de statut selon le schéma Prisma
   */
  const getStatusConfig = useCallback(
    (status: string, isActive: boolean): StatusConfig => {
      if (!isActive) {
        return {
          variant: "secondary",
          className:
            "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
          icon: Archive,
          label: "Archivé",
        };
      }

      switch (status.toUpperCase()) {
        case "ACTIVE":
          return {
            variant: "default",
            className:
              "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
            icon: Activity,
            label: "Actif",
          };
        case "INACTIVE":
          return {
            variant: "secondary",
            className:
              "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
            icon: Pause,
            label: "Inactif",
          };
        case "ARCHIVED":
          return {
            variant: "outline",
            className:
              "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
            icon: Archive,
            label: "Archivé",
          };
        default:
          return {
            variant: "outline",
            className:
              "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
            icon: Settings,
            label: status,
          };
      }
    },
    []
  );

  /**
   * Configuration des icônes de visibilité selon le schéma Prisma
   */
  const getVisibilityConfig = useCallback(
    (visibility: string): VisibilityConfig => {
      switch (visibility.toUpperCase()) {
        case "PUBLIC":
          return {
            icon: Globe,
            className: "text-blue-600",
            label: "Public",
          };
        case "PRIVATE":
          return {
            icon: Lock,
            className: "text-purple-600",
            label: "Privé",
          };
        case "INTERNAL":
          return {
            icon: Users,
            className: "text-orange-600",
            label: "Interne",
          };
        default:
          return {
            icon: Eye,
            className: "text-gray-500",
            label: visibility,
          };
      }
    },
    []
  );

  /**
   * Gestion de la sélection de projet avec store synchronisé
   */
  const handleProjectSelect = useCallback(
    (project: ProjectSimple): void => {
      if (loading) return;

      console.log(
        "📍 ProjectsList - Sélection projet:",
        project.name,
        project.id
      );

      // Synchronisation avec le store de la page
      setSelectedProjectId(project.id);

      // Callback vers la page parente
      onSelect(project);
    },
    [loading, setSelectedProjectId, onSelect]
  );

  /**
   * Gestion des actions avec protection contre les appels multiples
   */
  const handleEdit = useCallback(
    async (event: React.MouseEvent, project: ProjectSimple): Promise<void> => {
      event.stopPropagation();
      if (loading) return;

      console.log("✏️ ProjectsList - Édition projet:", project.name);

      try {
        await onEdit(project);
      } catch (error) {
        console.error("Erreur lors de l'édition:", error);
      }
    },
    [onEdit, loading]
  );

  const handleDelete = useCallback(
    async (event: React.MouseEvent, projectId: string): Promise<void> => {
      event.stopPropagation();
      if (loading) return;

      console.log("🗑️ ProjectsList - Suppression projet:", projectId);

      try {
        await onDelete(projectId);
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    },
    [onDelete, loading]
  );

  const handleReorder = useCallback(
    async (
      event: React.MouseEvent,
      projectId: string,
      direction: "up" | "down"
    ): Promise<void> => {
      event.stopPropagation();
      if (loading) return;

      console.log(
        "📊 ProjectsList - Réorganisation projet:",
        projectId,
        direction
      );

      try {
        await onReorder(projectId, direction);
      } catch (error) {
        console.error("Erreur lors de la réorganisation:", error);
      }
    },
    [onReorder, loading]
  );

  /**
   * Formatage des dates optimisé
   */
  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "Non définie";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }, []);

  /**
   * Classes CSS pour la grille responsive moderne
   */
  const containerClasses = useMemo(() => {
    const baseClasses = "w-full space-y-4";

    switch (viewMode) {
      case "grid":
        return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 space-y-0`;
      case "list":
        return `${baseClasses} flex flex-col gap-3 sm:gap-4`;
      default:
        return baseClasses;
    }
  }, [viewMode]);

  // Tri des projets par ordre avec mémorisation
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.order - b.order);
  }, [projects]);

  // ✅ SKELETON DE CHARGEMENT MODERNE
  if (loading) {
    return (
      <div className={`${className}`}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>

          <CardContent>
            <div className={containerClasses}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border border-gray-100">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2 pt-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <Card className="border-0 shadow-sm bg-white">
        {/* En-tête moderne */}
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {viewMode === "grid" ? (
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                ) : (
                  <List className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Liste des projets
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {sortedProjects.length} projet
                  {sortedProjects.length !== 1 ? "s" : ""} • Mode{" "}
                  {viewMode === "grid" ? "grille" : "liste"}
                </p>
              </div>
            </div>

            <Button
              onClick={onCreate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              size="default"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* État vide moderne */}
          {sortedProjects.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <FolderOpen className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun projet trouvé
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Commencez par créer votre premier projet pour organiser votre
                  travail et suivre vos objectifs.
                </p>
              </div>
              <Button
                onClick={onCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            </div>
          )}

          {/* Liste des projets */}
          {sortedProjects.length > 0 && (
            <div className={containerClasses}>
              {sortedProjects.map((project, index) => {
                const statusConfig = getStatusConfig(
                  project.status,
                  project.isActive
                );
                const visibilityConfig = getVisibilityConfig(
                  project.visibility
                );
                const StatusIcon = statusConfig.icon;
                const VisibilityIcon = visibilityConfig.icon;
                const isSelected = selectedProjectId === project.id;

                return (
                  <Card
                    key={project.id}
                    className={`
                      group relative border transition-all duration-200 cursor-pointer hover:shadow-md
                      ${
                        isSelected
                          ? "border-blue-300 shadow-blue-100 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }
                      ${
                        loading
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:shadow-lg"
                      }
                    `}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      {viewMode === "grid" ? (
                        // ✅ MODE GRILLE - DESIGN MODERNE
                        <div className="space-y-4">
                          {/* Header avec badges */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <VisibilityIcon
                                className={`h-4 w-4 flex-shrink-0 ${visibilityConfig.className}`}
                              />
                              <h3 className="font-semibold text-gray-900 truncate">
                                {project.name}
                              </h3>
                            </div>

                            <Badge
                              variant={statusConfig.variant}
                              className={`${statusConfig.className} flex items-center gap-1 text-xs font-medium px-2 py-1`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Clé et description */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BarChart3 className="h-4 w-4" />
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                {project.key}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                              {project.description ||
                                "Aucune description fournie"}
                            </p>
                          </div>

                          {/* Métadonnées */}
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Settings className="h-3 w-3" />
                                <span>#{project.order}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(project.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions avec animations */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleReorder(e, project.id, "up")
                                }
                                disabled={loading || index === 0}
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                                title="Monter"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleReorder(e, project.id, "down")
                                }
                                disabled={
                                  loading || index === sortedProjects.length - 1
                                }
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                                title="Descendre"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEdit(e, project)}
                                disabled={loading}
                                className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Éditer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDelete(e, project.id)}
                                disabled={loading}
                                className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Suppr.
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // ✅ MODE LISTE - LAYOUT ÉTENDU
                        <div className="flex items-center space-x-4">
                          {/* Icône et info principale */}
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div
                                className={`
                                w-10 h-10 rounded-lg flex items-center justify-center
                                ${isSelected ? "bg-blue-200" : "bg-gray-100"}
                              `}
                              >
                                <VisibilityIcon
                                  className={`h-5 w-5 ${
                                    isSelected
                                      ? "text-blue-700"
                                      : visibilityConfig.className
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {project.name}
                                </h3>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                  {project.key}
                                </span>
                                <Badge
                                  variant={statusConfig.variant}
                                  className={`${statusConfig.className} flex items-center gap-1 text-xs`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                              </div>

                              <p className="text-sm text-gray-600 line-clamp-1">
                                {project.description ||
                                  "Aucune description fournie"}
                              </p>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Ordre: {project.order}</span>
                                <span>
                                  Créé: {formatDate(project.createdAt)}
                                </span>
                                <span>{visibilityConfig.label}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions liste */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {/* Réorganisation */}
                            <div className="flex flex-col space-y-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleReorder(e, project.id, "up")
                                }
                                disabled={loading || index === 0}
                                className="h-5 w-6 p-0 hover:bg-blue-100"
                                title="Monter"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) =>
                                  handleReorder(e, project.id, "down")
                                }
                                disabled={
                                  loading || index === sortedProjects.length - 1
                                }
                                className="h-5 w-6 p-0 hover:bg-blue-100"
                                title="Descendre"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Actions principales */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleEdit(e, project)}
                              disabled={loading}
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Éditer
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProjectSelect(project)}
                              disabled={loading}
                              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Détails
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDelete(e, project.id)}
                              disabled={loading}
                              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer avec statistiques */}
        {sortedProjects.length > 0 && (
          <CardFooter className="border-t bg-gray-50 text-sm text-gray-600">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <span>Total: {sortedProjects.length} projets</span>
                <span>•</span>
                <span>
                  Actifs:{" "}
                  {
                    sortedProjects.filter(
                      (p) => p.status === "ACTIVE" && p.isActive
                    ).length
                  }
                </span>
                <span>•</span>
                <span>Mode: {viewMode === "grid" ? "Grille" : "Liste"}</span>
              </div>
              <div className="text-xs text-gray-500">
                Dernière mise à jour: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
});

// Export des types pour la réutilisabilité
export type { ProjectsListProps, ProjectSimple, ViewMode };
