// components/projects/views/ProjectCard.tsx

/**
 * RÔLE : Composant carte pour afficher un projet
 * RESPONSABILITÉS :
 * - Affichage des informations de projet
 * - Actions rapides (voir, éditer, supprimer)
 * - Design responsive et moderne
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Card, Button, Badge
 * - lucide-react: Icons
 * - Types: ProjectWithRelations, ViewMode
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Users, Calendar, Activity } from "lucide-react";
import { ProjectWithRelations, ViewMode } from "@/types/project";
import { format } from "date-fns";

interface ProjectCardProps {
  project: ProjectWithRelations;
  viewMode: ViewMode;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onManageTeam?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode,
  onView,
  onEdit,
  onDelete,
  onManageTeam,
}) => {
  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "ARCHIVED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getVisibilityColor = (visibility: string): string => {
    switch (visibility.toUpperCase()) {
      case "PUBLIC":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PRIVATE":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "INTERNAL":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge
                variant="outline"
                className={getStatusColor(project.status)}
              >
                {project.status}
              </Badge>
              <Badge
                variant="outline"
                className={getVisibilityColor(project.visibility)}
              >
                {project.visibility}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {project.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project._count?.members || 0} members
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {project.key}
              </span>
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(project.startDate), "MMM dd, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            {onManageTeam && (
              <Button variant="outline" size="sm" onClick={onManageTeam}>
                <Users className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
            {project.name}
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
        </div>
        <Badge
          variant="outline"
          className={getVisibilityColor(project.visibility)}
          style={{ width: "fit-content" }}
        >
          {project.visibility}
        </Badge>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {project.description || "No description provided"}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{project._count?.members || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span>{project.key}</span>
          </div>
          {project.startDate && (
            <div className="flex items-center gap-1 col-span-2">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(project.startDate), "MMM dd, yyyy")}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          {onManageTeam && (
            <Button variant="outline" size="sm" onClick={onManageTeam}>
              <Users className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
