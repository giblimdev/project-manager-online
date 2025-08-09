// components/projects/ProjectsDisplayView.tsx

/**
 * RÔLE : Composant de séléction  d'affichage des projets dans différents modes de vue !!! NE DOIT PAS LES AFFICHER !!
 * RESPONSABILITÉS :
 * - Afficher les projets en mode grille ou liste selon le schéma Prisma Project
 * - Gérer toutes les interactions utilisateur (sélection, édition, suppression, réorganisation)
 * - Fournir une interface responsive et accessible avec design moderne
 * - Afficher les statistiques et métadonnées des projets
 * - Gérer les états de chargement et les actions async
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Card, CardContent, CardHeader, CardTitle, CardFooter, Button, Badge
 * - lucide-react: Edit, Trash2, ChevronUp, ChevronDown, ExternalLink, Eye, EyeOff, Calendar, Users, BarChart3
 * - Next.js Link pour la navigation vers /projects/[id]
 * - React hooks: JSX, useCallback, useMemo
 *
 * LIBS UTILISÉS :
 * - React (JSX, useCallback, useMemo)
 * - Next.js 15 client component avec Link navigation
 * - TypeScript strict mode
 * - Tailwind CSS pour le styling responsive
 * - shadcn/ui pour les composants UI modernes
 *
 * PROPS de @/app/projects/page.tsx :
 * - projects: ProjectSimple[] - Liste des projets filtrés
 * - viewMode: "grid" | "list" - Mode d'affichage
 * - onEdit: (project: ProjectSimple) => Promise<void> - Callback d'édition
 * - onDelete: (projectId: string) => Promise<void> - Callback de suppression
 * - onSelect: (project: ProjectSimple) => void - Callback de sélection/navigation
 * - onReorder: (projectId: string, direction: "up" | "down") => Promise<void> - Callback de réorganisation
 * - loading: boolean - État de chargement global
 */

"use client";

import React, { JSX, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
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
} from "lucide-react";

// Types basés sur le schéma Prisma Project (sans relations pour l'affichage)
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

// Interface pour les props du composant selon app/projects/page.tsx
interface ProjectsDisplayViewProps {
  projects: ProjectSimple[];
  viewMode: "grid" | "list";
  onEdit: (project: ProjectSimple) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
  onSelect: (project: ProjectSimple) => void;
  onReorder: (projectId: string, direction: "up" | "down") => Promise<void>;
  loading?: boolean;
}

export default function ProjectsDisplayView({
  projects,
  viewMode,
  onEdit,
  onDelete,
  onSelect,
  onReorder,
  loading = false,
}: ProjectsDisplayViewProps): JSX.Element {
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
   * Gestion des actions avec loading states
   */
  const handleEdit = useCallback(
    async (project: ProjectSimple): Promise<void> => {
      if (loading) return;
      await onEdit(project);
    },
    [onEdit, loading]
  );

  const handleDelete = useCallback(
    async (projectId: string): Promise<void> => {
      if (loading) return;
      await onDelete(projectId);
    },
    [onDelete, loading]
  );

  const handleReorder = useCallback(
    async (projectId: string, direction: "up" | "down"): Promise<void> => {
      if (loading) return;
      await onReorder(projectId, direction);
    },
    [onReorder, loading]
  );

  const handleSelect = useCallback(
    (project: ProjectSimple): void => {
      if (loading) return;
      onSelect(project);
    },
    [onSelect, loading]
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
   * Calcul de la durée du projet
   */
  const getProjectDuration = useCallback(
    (startDate: Date | null, endDate: Date | null): string => {
      if (!startDate || !endDate) return "";

      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) return `${diffDays} jour(s)`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)} mois`;
      return `${Math.ceil(diffDays / 365)} an(s)`;
    },
    []
  );

  // Tri des projets par ordre pour affichage
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.order - b.order);
  }, [projects]);

  // Affichage en mode grille
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProjects.map((project, index) => {
          const statusBadge = getStatusBadge(project.status, project.isActive);
          const visibilityIcon = getVisibilityIcon(project.visibility);
          const StatusIcon = statusBadge.icon;
          const VisibilityIcon = visibilityIcon.icon;
          const projectDuration = getProjectDuration(
            project.startDate,
            project.endDate
          );

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
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                      <button
                        onClick={() => handleSelect(project)}
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

              <CardContent className="space-y-4">
                {/* Description */}
                <div className="min-h-[60px]">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {project.description || "Aucune description fournie"}
                  </p>
                </div>

                {/* Informations temporelles */}
                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <div className="flex flex-col">
                      {project.startDate && (
                        <span>Début: {formatDate(project.startDate)}</span>
                      )}
                      {project.endDate && (
                        <span>Fin: {formatDate(project.endDate)}</span>
                      )}
                      {projectDuration && (
                        <span className="text-blue-600 font-medium">
                          Durée: {projectDuration}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Métadonnées */}
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
                    disabled={loading || index === sortedProjects.length - 1}
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
            </Card>
          );
        })}
      </div>
    );
  }

  // Affichage en mode liste
  return (
    <div className="space-y-3">
      {sortedProjects.map((project, index) => {
        const statusBadge = getStatusBadge(project.status, project.isActive);
        const visibilityIcon = getVisibilityIcon(project.visibility);
        const StatusIcon = statusBadge.icon;
        const VisibilityIcon = visibilityIcon.icon;
        const projectDuration = getProjectDuration(
          project.startDate,
          project.endDate
        );

        return (
          <Card
            key={project.id}
            className={`group hover:shadow-md transition-all duration-200 border-l-4 ${
              project.isActive
                ? project.status === "ACTIVE"
                  ? "border-l-green-500 hover:border-l-green-600"
                  : "border-l-orange-500 hover:border-l-orange-600"
                : "border-l-gray-400 hover:border-l-gray-500"
            } ${loading ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between p-4">
              {/* Informations principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                      <button
                        onClick={() => handleSelect(project)}
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
                  {/* Description */}
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description || "Aucune description fournie"}
                    </p>
                  </div>

                  {/* Informations temporelles et métadonnées */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      <span>Ordre: {project.order}</span>
                    </div>

                    {project.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Début: {formatDate(project.startDate)}</span>
                      </div>
                    )}

                    {project.endDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Fin: {formatDate(project.endDate)}</span>
                      </div>
                    )}

                    {projectDuration && (
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 text-blue-500" />
                        <span className="text-blue-600 font-medium">
                          Durée: {projectDuration}
                        </span>
                      </div>
                    )}
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
                    disabled={loading || index === sortedProjects.length - 1}
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
          </Card>
        );
      })}
    </div>
  );
}
