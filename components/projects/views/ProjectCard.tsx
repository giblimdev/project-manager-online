// components/projects/views/ProjectCard.tsx

"use client";

import React, { JSX } from "react";
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
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProjectWithRelations } from "@/types/project";
import type { User, UserRole } from "@/lib/generated/prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectCardProps {
  project: ProjectWithRelations;
  onEdit: (project: ProjectWithRelations) => void;
  onRefresh: () => void;
  onView?: (project: ProjectWithRelations) => void;
  onDelete?: (project: ProjectWithRelations) => void;
  onManageTeam?: (project: ProjectWithRelations) => void;
  onProjectClick?: (project: ProjectWithRelations) => Promise<void>; // Nouvelle prop
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onRefresh,
  onView,
  onDelete,
  onManageTeam,
  onProjectClick,
}) => {
  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email || "Utilisateur";
  };

  const getRoleLabel = (role: UserRole): string => {
    const roleLabels: Record<UserRole, string> = {
      ADMIN: "Admin",
      PRODUCT_OWNER: "Product Owner",
      SCRUM_MASTER: "Scrum Master",
      DEVELOPER: "Développeur",
      STAKEHOLDER: "Stakeholder",
      VIEWER: "Observateur",
    };
    return roleLabels[role] || role;
  };

  const getStatusIcon = (status: string): JSX.Element => {
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

  const getStatusColor = (status: string): string => {
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

  const calculateProgress = (): number => {
    const total =
      (project._count?.initiatives || 0) +
      (project._count?.epics || 0) +
      (project._count?.features || 0) +
      (project._count?.userStories || 0) +
      (project._count?.tasks || 0);

    if (total === 0) return 0;
    if (project.status === "COMPLETED") return 100;
    if (project.status === "CANCELLED") return 0;
    if (project.status === "ON_HOLD") return 25;

    return Math.min(Math.floor((total / 50) * 100), 85);
  };

  const activeMembers =
    project.members?.filter((member) => member.isActive) || [];
  const progress = calculateProgress();

  // Handler pour le clic sur la carte
  const handleCardClick = async (
    e: React.MouseEvent<HTMLDivElement>
  ): Promise<void> => {
    // Éviter la navigation si on clique sur un bouton ou menu
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="menuitem"]') ||
      target.closest("[data-radix-popper-content-wrapper]")
    ) {
      return;
    }

    if (onProjectClick) {
      await onProjectClick(project);
    }
  };

  const handleView = async (): Promise<void> => {
    if (onView) {
      await onView(project);
    } else if (onProjectClick) {
      await onProjectClick(project);
    }
  };

  const handleDelete = (): void => {
    if (onDelete) {
      onDelete(project);
    }
  };

  const handleManageTeam = (): void => {
    if (onManageTeam) {
      onManageTeam(project);
    }
  };

  return (
    <Card
      className="group hover:shadow-xl transition-all duration-300 border border-gray-200/60 bg-white/90 backdrop-blur-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
                {project.name}
              </CardTitle>
              <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs font-mono bg-gray-50 font-semibold"
                >
                  {project.key}
                </Badge>
                <Badge
                  className={`text-xs font-medium ${getStatusColor(
                    project.status
                  )}`}
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
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleView();
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-2 sm:mt-3 leading-relaxed">
          {project.description || "Aucune description disponible"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Progression */}
        <div>
          <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600 font-medium">Progression</span>
            <span className="text-gray-900 font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 sm:h-3" />
        </div>

        {/* Statistiques des éléments de travail */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="text-center p-2 sm:p-3 bg-purple-50/80 rounded-lg sm:rounded-xl border border-purple-100">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm sm:text-base lg:text-lg font-bold text-purple-900">
              {project._count?.initiatives || 0}
            </div>
            <div className="text-xs text-purple-600 font-medium">
              Initiatives
            </div>
            <div className="text-xs text-purple-500 opacity-70 hidden sm:block">
              Objectifs stratégiques
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-green-50/80 rounded-lg sm:rounded-xl border border-green-100">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm sm:text-base lg:text-lg font-bold text-green-900">
              {(project._count?.epics || 0) + (project._count?.features || 0)}
            </div>
            <div className="text-xs text-green-600 font-medium">
              Epics & Features
            </div>
            <div className="text-xs text-green-500 opacity-70 hidden sm:block">
              Fonctionnalités métier
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-orange-50/80 rounded-lg sm:rounded-xl border border-orange-100">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mx-auto mb-1" />
            <div className="text-sm sm:text-base lg:text-lg font-bold text-orange-900">
              {(project._count?.userStories || 0) +
                (project._count?.tasks || 0)}
            </div>
            <div className="text-xs text-orange-600 font-medium">
              Stories & Tasks
            </div>
            <div className="text-xs text-orange-500 opacity-70 hidden sm:block">
              Éléments de développement
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 bg-blue-50/80 rounded-lg sm:rounded-xl border border-blue-100">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm sm:text-base lg:text-lg font-bold text-blue-900">
              {project._count?.sprints || 0}
            </div>
            <div className="text-xs text-blue-600 font-medium">Sprints</div>
            <div className="text-xs text-blue-500 opacity-70 hidden sm:block">
              Cycles de développement
            </div>
          </div>
        </div>

        {/* Fichiers */}
        {(project._count?.files || 0) > 0 && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50/50 rounded-lg">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <span className="text-xs sm:text-sm text-gray-600 font-medium">
              {project._count?.files} fichier
              {(project._count?.files || 0) > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-500 bg-gray-50/50 rounded-lg p-2">
            {project.startDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span className="font-medium">
                  Début:{" "}
                  {format(new Date(project.startDate), "dd/MM/yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span className="font-medium">
                  Fin:{" "}
                  {format(new Date(project.endDate), "dd/MM/yyyy", {
                    locale: fr,
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Équipe */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700 font-medium">
              <Users className="w-4 h-4" />
              <span>Équipe ({activeMembers.length})</span>
            </div>
            {onManageTeam && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManageTeam();
                }}
                className="h-6 sm:h-7 px-2 text-xs hover:bg-blue-50 hover:border-blue-200"
              >
                <Zap className="w-3 h-3 mr-1" />
                Gérer
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-1 sm:-space-x-2">
              {activeMembers.slice(0, 5).map((member, index) => (
                <Avatar
                  key={`${member.userId}-${index}`}
                  className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white shadow-md hover:z-10 transition-transform hover:scale-110"
                  title={`${getUserDisplayName(member.user)} - ${getRoleLabel(
                    member.role
                  )}`}
                >
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                    {getUserDisplayName(member.user)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              ))}

              {activeMembers.length > 5 && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                  <span className="text-xs text-gray-600 font-bold">
                    +{activeMembers.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Rôles de l'équipe */}
          {activeMembers.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="font-medium">
                Rôles:{" "}
                {Array.from(
                  new Set(activeMembers.map((m) => getRoleLabel(m.role)))
                ).join(", ")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
