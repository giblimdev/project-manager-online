// components/projects/ProjectsList.tsx

/**
 * RÔLE : Composant de liste des projets avec actions CRUD et navigation
 * RESPONSABILITÉS :
 * - Afficher la liste des projets selon différents modes de vue (grid, list, card)
 * - Gérer toutes les actions CRUD (création, édition, suppression, réorganisation)
 * - Navigation vers les détails de projet avec Next.js 15 Link
 * - Intégration avec le store Zustand optimisé pour la sélection de projet
 * - Interface responsive et moderne avec design cohérent
 * - Gestion des états de chargement et d'erreur
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Button, Card, Badge, Skeleton
 * - lucide-react: PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, ExternalLink
 * - Next.js: useRouter pour la navigation programmatique
 * - Store: useSelectedProjectStore pour la gestion d'état
 * - React hooks: JSX, useCallback, useMemo
 *
 * LIBS UTILISÉS :
 * - React (JSX, useCallback, useMemo)
 * - Next.js 15 client component avec router
 * - TypeScript strict mode
 * - Tailwind CSS pour le styling responsive
 * - Zustand store pour l'état global
 *
 * PROPS de @/app/projects/page.tsx :
 * - projects: ProjectSimple[] - Liste des projets filtrés
 * - viewMode: "grid" | "list" - Mode d'affichage
 * - onEdit: (project: ProjectSimple) => Promise<void> - Callback d'édition
 * - onDelete: (projectId: string) => Promise<void> - Callback de suppression
 * - onSelect: (project: ProjectSimple) => void - Callback de sélection/navigation
 * - onReorder: (projectId: string, direction: "up" | "down") => Promise<void> - Callback de réorganisation
 * - onCreate: () => void - Callback de création
 * - loading: boolean - État de chargement global
 */

"use client";

import React, { JSX, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import useSelectedProjectStore from "@/stores/useSelectedProjectStore";

// Types basés sur le schéma Prisma Project (sans relations pour optimiser)
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

// Type pour le mode d'affichage
type ViewMode = "grid" | "list";

// Interface pour les props du composant selon app/projects/page.tsx
interface ProjectsListProps {
  projects: ProjectSimple[];
  viewMode: ViewMode;
  onEdit: (project: ProjectSimple) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
  onSelect: (project: ProjectSimple) => void;
  onReorder: (projectId: string, direction: "up" | "down") => Promise<void>;
  onCreate: () => void;
  loading?: boolean;
}

export default function ProjectsList({
  projects,
  viewMode,
  onEdit,
  onDelete,
  onSelect,
  onReorder,
  onCreate,
  loading = false,
}: ProjectsListProps): JSX.Element {
  const router = useRouter();

  // Store Zustand pour la gestion de la sélection de projet
  const setSelectedProjectId = useSelectedProjectStore(
    (state) => state.setSelectedProjectId
  );

  /**
   * Utilitaire pour obtenir la couleur du badge de statut selon le schéma Prisma
   */
  const getStatusBadge = useCallback((status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        variant: "secondary" as const,
        className: "bg-gray-100 text-gray-600 border-gray-200",
        icon: Archive,
        label: "Archivé",
      };
    }

    switch (status) {
      case "ACTIVE":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          icon: Activity,
          label: "Actif",
        };
      case "INACTIVE":
        return {
          variant: "secondary" as const,
          className: "bg-orange-100 text-orange-800 border-orange-200",
          icon: Pause,
          label: "Inactif",
        };
      case "ARCHIVED":
        return {
          variant: "outline" as const,
          className: "bg-gray-100 text-gray-600 border-gray-300",
          icon: Archive,
          label: "Archivé",
        };
      default:
        return {
          variant: "outline" as const,
          className: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Settings,
          label: status,
        };
    }
  }, []);

  /**
   * Utilitaire pour obtenir l'icône de visibilité selon le schéma Prisma
   */
  const getVisibilityIcon = useCallback((visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return { icon: Globe, className: "text-blue-500", label: "Public" };
      case "PRIVATE":
        return { icon: Lock, className: "text-purple-500", label: "Privé" };
      case "INTERNAL":
        return { icon: Users, className: "text-orange-500", label: "Interne" };
      default:
        return { icon: Eye, className: "text-gray-500", label: visibility };
    }
  }, []);

  /**
   * Gestion de la sélection de projet avec navigation
   */
  const handleProjectSelect = useCallback(
    (project: ProjectSimple): void => {
      if (loading) return;

      console.log(
        "📍 ProjectsList - Sélection projet:",
        project.name,
        project.id
      );

      // Mise à jour du store avec l'ID du projet sélectionné
      setSelectedProjectId(project.id);

      // Appel du callback parent
      onSelect(project);
    },
    [loading, setSelectedProjectId, onSelect]
  );

  /**
   * Gestion des actions avec loading states
   */
  const handleEdit = useCallback(
    async (project: ProjectSimple): Promise<void> => {
      if (loading) return;
      console.log("✏️ ProjectsList - Édition projet:", project.name);
      await onEdit(project);
    },
    [onEdit, loading]
  );

  const handleDelete = useCallback(
    async (projectId: string): Promise<void> => {
      if (loading) return;
      console.log("🗑️ ProjectsList - Suppression projet:", projectId);
      await onDelete(projectId);
    },
    [onDelete, loading]
  );

  const handleReorder = useCallback(
    async (projectId: string, direction: "up" | "down"): Promise<void> => {
      if (loading) return;
      console.log(
        "📊 ProjectsList - Réorganisation projet:",
        projectId,
        direction
      );
      await onReorder(projectId, direction);
    },
    [onReorder, loading]
  );

  /**
   * Formatage des dates
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
   * Classes CSS pour la grille responsive selon le mode d'affichage
   */
  const getGridClass = useCallback((): string => {
    switch (viewMode) {
      case "list":
        return "flex flex-col gap-3 sm:gap-4";
      case "grid":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";
    }
  }, [viewMode]);

  // Tri des projets par ordre pour affichage
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.order - b.order);
  }, [projects]);

  // Affichage du skeleton pendant le chargement
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header avec bouton de création */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Grille de skeleton */}
        <div className={getGridClass()}>
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de création et informations */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            Liste des projets
          </h2>
          <p className="text-gray-600 mt-1">
            {sortedProjects.length} projet(s) • Mode{" "}
            {viewMode === "grid" ? "grille" : "liste"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* État vide */}
      {sortedProjects.length === 0 && (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FolderOpen className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-500 mt-1">
                Commencez par créer votre premier projet
              </p>
            </div>
            <Button
              onClick={onCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Créer un projet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des projets */}
      {sortedProjects.length > 0 && (
        <div className={getGridClass()}>
          {sortedProjects.map((project, index) => {
            const statusBadge = getStatusBadge(
              project.status,
              project.isActive
            );
            const visibilityIcon = getVisibilityIcon(project.visibility);
            const StatusIcon = statusBadge.icon;
            const VisibilityIcon = visibilityIcon.icon;

            return (
              <Card
                key={project.id}
                className={`group hover:shadow-lg transition-all duration-200 border-l-4 ${
                  project.isActive
                    ? project.status === "ACTIVE"
                      ? "border-l-green-500 hover:border-l-green-600"
                      : "border-l-orange-500 hover:border-l-orange-600"
                    : "border-l-gray-400 hover:border-l-gray-500"
                } ${loading ? "opacity-50" : ""}`}
              >
                {viewMode === "grid" ? (
                  // Mode grille - Compact
                  <>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                            <button
                              onClick={() => handleProjectSelect(project)}
                              className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                              disabled={loading}
                            >
                              {project.name}
                            </button>
                          </CardTitle>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {project.key}
                            </span>
                            <VisibilityIcon
                              className={`h-3 w-3 ${visibilityIcon.className}`}
                            />
                          </div>
                        </div>

                        <Badge
                          variant={statusBadge.variant}
                          className={`${statusBadge.className} flex items-center gap-1 text-xs`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="min-h-[60px]">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {project.description || "Aucune description fournie"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Ordre:</span>
                          <span className="font-medium">{project.order}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500">Créé:</span>
                          <span className="font-medium">
                            {formatDate(project.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between items-center pt-3">
                      {/* Actions de réorganisation */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(project.id, "up")}
                          disabled={loading || index === 0}
                          className="h-8 w-8 p-0"
                          title="Monter"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(project.id, "down")}
                          disabled={
                            loading || index === sortedProjects.length - 1
                          }
                          className="h-8 w-8 p-0"
                          title="Descendre"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Actions principales */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          disabled={loading}
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                          title="Éditer"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>

                        <Link
                          href={`/projects/${project.id}`}
                          className="inline-block"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            title="Voir les détails"
                            disabled={loading}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          disabled={loading}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardFooter>
                  </>
                ) : (
                  // Mode liste - Étendu
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                            <button
                              onClick={() => handleProjectSelect(project)}
                              className="text-left hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                              disabled={loading}
                            >
                              {project.name}
                            </button>
                          </CardTitle>

                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {project.key}
                            </span>

                            <div className="flex items-center gap-1">
                              <VisibilityIcon
                                className={`h-3 w-3 ${visibilityIcon.className}`}
                              />
                              <span className="text-xs text-gray-500">
                                {visibilityIcon.label}
                              </span>
                            </div>

                            <Badge
                              variant={statusBadge.variant}
                              className={`${statusBadge.className} flex items-center gap-1 text-xs`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusBadge.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {project.description ||
                              "Aucune description fournie"}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>Ordre: {project.order}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Créé: {formatDate(project.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {/* Actions de réorganisation */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(project.id, "up")}
                          disabled={loading || index === 0}
                          className="h-6 w-6 p-0"
                          title="Monter"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(project.id, "down")}
                          disabled={
                            loading || index === sortedProjects.length - 1
                          }
                          className="h-6 w-6 p-0"
                          title="Descendre"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Actions principales */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          disabled={loading}
                          className="hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Éditer
                        </Button>

                        <Link href={`/projects/${project.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-green-50 hover:border-green-300"
                            disabled={loading}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          disabled={loading}
                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
