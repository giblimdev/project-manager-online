/**
 * RÔLE : Composant d'affichage d'une ligne projet en mode liste
 * RESPONSABILITÉS :
 * - Visuel moderne, responsive (flex, truncation, badges)
 * - Affiche principal (nom, clé, description, statut, visibilité, dates)
 * - Actions CRUD (Edit, Delete, Select, Reorder) déléguées via callbacks typés
 * - Design cohérent shadcn/ui et gestion des états
 * - Interface adaptative pour mobile, tablette et desktop
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Button, Badge
 * - lucide-react: Edit, Trash2, ChevronUp, ChevronDown, ExternalLink,...
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
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { ProjectSimple, StatusConfig, VisibilityConfig } from "@/components/projects/ProjectsList";

interface ProjectsListViewItemProps {
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

export const ProjectsListViewItem: React.FC<ProjectsListViewItemProps> = ({
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
    <div
      className={`group relative border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center cursor-pointer transition-all
        ${isSelected ? "border-blue-300 bg-blue-50 shadow-blue-100" : "border-gray-200 bg-white"}
        ${loading || isReordering ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}
        ${isReordering ? "ring-2 ring-blue-300 shadow-lg" : ""}
        `}
      onClick={() => !loading && !isReordering && onSelect(project)}
    >
      {/* Ligne principale - Mobile et Desktop */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
        {/* Icône principale */}
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
            ${isSelected ? "bg-blue-200" : "bg-gray-100"}
            ${isReordering ? "bg-blue-300" : ""}
          `}
          >
            {isReordering ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 animate-spin" />
            ) : (
              <VisibilityIcon
                className={`h-4 w-4 sm:h-5 sm:w-5 ${isSelected ? "text-blue-700" : visibilityConfig.className}`}
              />
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Nom et clé - responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                {project.key}
              </span>
              <Badge
                variant={statusConfig.variant}
                className={`${statusConfig.className} flex items-center gap-1 text-xs flex-shrink-0`}
              >
                <StatusIcon className="h-3 w-3" />
                <span className="hidden xs:inline">{statusConfig.label}</span>
                <span className="xs:hidden">{statusConfig.label.substring(0, 3)}</span>
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 sm:line-clamp-2">
            {project.description || "Aucune description fournie"}
          </p>

          {/* Métadonnées - responsive */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
            <span className="flex-shrink-0">#{project.order}</span>
            <span className="hidden sm:inline flex-shrink-0">
              Créé: {formatDate(project.createdAt)}
            </span>
            <span className="sm:hidden flex-shrink-0">
              {formatDate(project.createdAt)}
            </span>
            <span className="flex-shrink-0">{visibilityConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Actions - responsive layout */}
      <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
        {/* Actions principales - responsive */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Actions mobile (boutons compacts) */}
          <div className="flex sm:hidden space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e, project);
              }}
              disabled={loading || isReordering}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(project);
              }}
              disabled={loading || isReordering}
              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 px-2"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e, project.id);
              }}
              disabled={loading || isReordering}
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions desktop (avec texte) */}
          <div className="hidden sm:flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e, project);
              }}
              disabled={loading || isReordering}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            >
              <Edit className="h-4 w-4 mr-1" /> 
              <span className="hidden lg:inline">Éditer</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(project);
              }}
              disabled={loading || isReordering}
              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700"
            >
              <ExternalLink className="h-4 w-4 mr-1" /> 
              <span className="hidden lg:inline">Détails</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e, project.id);
              }}
              disabled={loading || isReordering}
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" /> 
              <span className="hidden lg:inline">Supprimer</span>
            </Button>
          </div>
        </div>

        {/* Contrôles de réorganisation */}
        <div className="flex flex-col space-y-0.5 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReorder(e, project.id, "up");
            }}
            disabled={loading || isReordering || index === 0}
            className="h-4 w-5 sm:h-5 sm:w-6 p-0 hover:bg-blue-100"
            title="Monter"
          >
            {isReordering ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReorder(e, project.id, "down");
            }}
            disabled={loading || isReordering || index === total - 1}
            className="h-4 w-5 sm:h-5 sm:w-6 p-0 hover:bg-blue-100"
            title="Descendre"
          >
            {isReordering ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
