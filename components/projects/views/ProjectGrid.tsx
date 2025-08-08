// components/projects/views/ProjectGrid.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Calendar,
  Users,
  Target,
  Layers,
  FileText,
  FolderOpen,
  Activity,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProjectWithRelations } from "@/types/project";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectGridProps {
  projects: ProjectWithRelations[];
  onEdit: (project: ProjectWithRelations) => void;
  onRefresh: () => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  onEdit,
  onRefresh,
}) => {
  const getUserDisplayName = (user: {
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Activity className="w-4 h-4 text-green-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case "ON_HOLD":
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 border-green-200";
      case "COMPLETED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ON_HOLD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const calculateProgress = (project: ProjectWithRelations): number => {
    const total =
      (project._count?.initiatives || 0) +
      (project._count?.epics || 0) +
      (project._count?.features || 0) +
      (project._count?.userStories || 0) +
      (project._count?.tasks || 0);

    if (total === 0) return 0;

    // Simulation de progression basée sur le statut
    if (project.status === "COMPLETED") return 100;
    if (project.status === "CANCELLED") return 0;
    if (project.status === "ON_HOLD") return 25;

    // Progression aléatoire pour les projets actifs (à remplacer par une vraie logique)
    return Math.floor(Math.random() * 70) + 10;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
      {projects.map((project) => {
        const activeMembers = project.members.filter(
          (member) => member.isActive
        );
        const progress = calculateProgress(project);

        return (
          <Card
            key={project.id}
            className="group hover:shadow-xl transition-all duration-300 border border-gray-200/60 bg-white/80 backdrop-blur-sm"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-gray-900 truncate">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono bg-gray-50"
                      >
                        {project.key}
                      </Badge>
                      <Badge
                        className={`text-xs ${getStatusColor(project.status)}`}
                      >
                        {getStatusIcon(project.status)}
                        <span className="ml-1">
                          {project.status === "ACTIVE" && "Actif"}
                          {project.status === "COMPLETED" && "Terminé"}
                          {project.status === "ON_HOLD" && "En pause"}
                          {project.status === "CANCELLED" && "Annulé"}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                {project.description || "Aucune description disponible"}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Progression */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Progression</span>
                  <span className="text-gray-900 font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Statistiques des éléments de travail */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Target className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-900">
                    {project._count?.initiatives || 0}
                  </div>
                  <div className="text-xs text-purple-600">Initiatives</div>
                </div>

                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <Layers className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-green-900">
                    {(project._count?.epics || 0) +
                      (project._count?.features || 0)}
                  </div>
                  <div className="text-xs text-green-600">Epics & Features</div>
                </div>

                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <FileText className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-orange-900">
                    {(project._count?.userStories || 0) +
                      (project._count?.tasks || 0)}
                  </div>
                  <div className="text-xs text-orange-600">Stories & Tasks</div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-blue-900">
                    {project._count?.sprints || 0}
                  </div>
                  <div className="text-xs text-blue-600">Sprints</div>
                </div>
              </div>

              {/* Fichiers */}
              {(project._count?.files || 0) > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FolderOpen className="w-4 h-4" />
                  <span>
                    {project._count?.files} fichier
                    {(project._count?.files || 0) > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Dates */}
              {(project.startDate || project.endDate) && (
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  {project.startDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Début:{" "}
                        {format(project.startDate, "dd/MM/yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Fin:{" "}
                        {format(project.endDate, "dd/MM/yyyy", { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Équipe */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Équipe ({activeMembers.length})</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {activeMembers.slice(0, 4).map((member) => (
                      <Avatar
                        key={member.id}
                        className="w-8 h-8 border-2 border-white shadow-sm"
                        title={getUserDisplayName(member.user)}
                      >
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {getUserDisplayName(member.user)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  {activeMembers.length > 4 && (
                    <div className="w-8 h-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-xs text-gray-600 font-medium">
                        +{activeMembers.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
