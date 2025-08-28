// components/projects/views/ProjectViewGrid.tsx

/**
 * RÔLE : Composant d'affichage d'une carte projet en mode grille
 * RESPONSABILITÉS :
 * - Visuel moderne, responsive avec animations et hover effects
 * - Affiche principal (nom, clé, description, statut, visibilité, dates)
 * - Actions CRUD (Edit, Delete, Select, Reorder) déléguées via callbacks typés
 * - Design cohérent shadcn/ui avec cards et badges
 * - Gestion des états (sélection, chargement, réorganisation)
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Card, CardContent, Badge, Button
 * - lucide-react: Edit, Trash2, ChevronUp, ChevronDown, BarChart3, Calendar, Settings...
 * - React hooks: JSX
 *
 * PROPS :
 * - project: ProjectSimple (schéma strict)
 * - index: number
 * - isSelected: boolean
 * - isReordering: boolean
 * - loading: boolean
 * - total: number (total projets - pour désactiver boutons)
 * - onEdit: (event, project) => Promise<void>
 * - onDelete: (event, projectId) => Promise<void>
 * - onSelect: (project) => void
 * - onReorder: (event, projectId, direction) => Promise<void>
 * - getStatusConfig: (status, isActive) => StatusConfig
 * - getVisibilityConfig: (visibility) => VisibilityConfig
 * - formatDate: (date) => string
 */


import React, { JSX } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Loader2,
  BarChart3,
  Calendar,
  Settings,
} from "lucide-react";
import { ProjectSimple, StatusConfig, VisibilityConfig } from "@/components/projects/ProjectsList";

interface ProjectsGridViewItemProps {
  project: ProjectSimple;
  index: number;
  isSelected: boolean;
  isReordering: boolean;
  loading: boolean;
  total: number;
  onEdit: (event: React.MouseEvent, project: ProjectSimple) => Promise<void>;
  onDelete: (event: React.MouseEvent, projectId: string) => Promise<void>;
  onSelect: (project: ProjectSimple) => void;
  onReorder: (
    event: React.MouseEvent,
    projectId: string,
    direction: "up" | "down"
  ) => Promise<void>;
  getStatusConfig: (status: string, isActive: boolean) => StatusConfig;
  getVisibilityConfig: (visibility: string) => VisibilityConfig;
  formatDate: (date: Date | null) => string;
}

export const ProjectsGridViewItem: React.FC<ProjectsGridViewItemProps> = ({
  project,
  index,
  isSelected,
  isReordering,
  loading,
  total,
  onEdit,
  onDelete,
  onSelect,
  onReorder,
  getStatusConfig,
  getVisibilityConfig,
  formatDate,
}): JSX.Element => {
  const statusConfig = getStatusConfig(project.status, project.isActive);
  const visibilityConfig = getVisibilityConfig(project.visibility);
  const StatusIcon = statusConfig.icon;
  const VisibilityIcon = visibilityConfig.icon;

  return (
    <Card
      className={`
        group relative transition-all duration-300 cursor-pointer transform hover:scale-[1.02]
        ${
          isSelected
            ? "border-2 border-blue-500/80 shadow-lg shadow-blue-200/50 bg-gradient-to-br from-blue-50/90 via-white to-blue-100/90 ring-2 ring-blue-300/50"
            : "border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/90 to-blue-50/80 hover:shadow-xl hover:border-blue-400"
        }
        ${
          loading || isReordering
            ? "opacity-60 cursor-not-allowed grayscale"
            : "hover:shadow-2xl"
        }
        ${isReordering ? "ring-4 ring-blue-500/70 shadow-2xl shadow-blue-300/40 animate-pulse" : ""}
        rounded-2xl overflow-hidden backdrop-blur-md
      `}
      onClick={() => !loading && !isReordering && onSelect(project)}
    >

      <CardContent className="p-3 sm:p-2 bg-gradient-to-br from-white/95 via-gray-50/90 to-blue-50/80">
        <div className="space-y-1">
          {/* Header avec badges colorés */}
          <div className="bg-emerald-300 p-2 mflex items-start justify-between">
            <div className="flex items-center
             space-x-3 min-w-0 flex-1">
              <div className={`
                p-2.5 rounded-xl shadow-sm transition-all duration-300
                ${isSelected 
                  ? "bg-blue-100/90 shadow-blue-300/40" 
                  : "bg-gradient-to-br from-gray-100/90 to-blue-100/80 group-hover:from-blue-100/90 group-hover:to-blue-200/80"
                }
              `}>
                <VisibilityIcon
                  className={`h-4 w-4 flex-shrink-0 transition-colors duration-300 ${
                    isSelected ? "text-blue-700" : visibilityConfig.className
                  }`}
                />
              </div>
              <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base group-hover:text-blue-900 transition-colors duration-300">
                {project.name}
              </h3>
            </div>

            <Badge
              variant={statusConfig.variant}
              className={`${statusConfig.className} flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 flex-shrink-0 shadow-md bg-gradient-to-r ${statusConfig.variant === "default" ? "from-emerald-100 to-teal-100" : statusConfig.variant === "secondary" ? "from-amber-100 to-orange-100" : statusConfig.variant === "destructive" ? "from-red-100 to-rose-100" : "from-indigo-100 to-blue-100"} border-0`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{statusConfig.label}</span>
              <span className="sm:hidden">{statusConfig.label.substring(0, 3)}</span>
            </Badge>
          </div>

          {/* Clé et description avec couleurs */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 px-3 py-1.5 rounded-lg border border-indigo-200/70">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600" />
                <span className="font-mono font-semibold text-xs text-indigo-800">
                  {project.key}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-50/90 to-blue-100/80 p-3 rounded-lg border-l-4 border-blue-500/70">
              <p className="text-xs sm:text-sm text-gray-700 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                {project.description || (
                  <span className="italic text-gray-500">Aucune description fournie</span>
                )}
              </p>
            </div>
          </div>

          {/* Métadonnées colorées */}
          <div className="space-y-2 pt-3 border-t border-gradient-to-r from-gray-200/70 to-blue-200/70">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 px-2.5 py-1.5 rounded-md border border-emerald-200/70">
                <Settings className="h-3 w-3 text-emerald-600" />
                <span className="font-semibold text-emerald-700">#{project.order}</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50/90 to-orange-50/90 px-2.5 py-1.5 rounded-md border border-amber-200/70">
                <Calendar className="h-3 w-3 text-amber-600" />
                <span className="truncate font-medium text-amber-700">{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Actions avec couleurs vibrantes */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-gradient-to-r from-gray-100/70 to-blue-100/70">
            {/* Contrôles de réorganisation colorés */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(e, project.id, "up");
                }}
                disabled={loading || !!isReordering || index === 0}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-100/90 hover:to-indigo-100/90 hover:shadow-md rounded-lg border border-blue-200/70"
                title="Monter"
              >
                {isReordering ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5 text-blue-600 hover:text-blue-800" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReorder(e, project.id, "down");
                }}
                disabled={loading || !!isReordering || index === total - 1}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-100/90 hover:to-indigo-100/90 hover:shadow-md rounded-lg border border-blue-200/70"
                title="Descendre"
              >
                {isReordering ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-blue-600 hover:text-blue-800" />
                )}
              </Button>
            </div>

            {/* Actions principales colorées */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(e, project);
                }}
                disabled={loading || !!isReordering}
                className="h-7 px-3 sm:h-8 sm:px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-100/90 hover:to-blue-200/90 hover:text-blue-800 hover:shadow-lg border border-blue-200/70 rounded-lg font-medium"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Éditer</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e, project.id);
                }}
                disabled={loading || !!isReordering}
                className="h-7 px-3 sm:h-8 sm:px-3 text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gradient-to-r hover:from-red-100/90 hover:to-red-200/90 hover:text-red-800 hover:shadow-lg border border-red-200/70 rounded-lg font-medium"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Suppr.</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Overlay subtil au hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/20 to-blue-100/30 opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none rounded-2xl" />
    </Card>
  );
};