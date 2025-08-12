// components/projects/views/ProjectGrid.tsx

/**
 * RÔLE : Composant grille pour afficher les projets
 * RESPONSABILITÉS :
 * - Affichage en grille des projets avec informations détaillées
 * - Actions sur les projets (modifier, voir, supprimer)
 * - Calcul et affichage de la progression
 * - Design responsive avec cartes modernes
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Card, Badge, Button, Avatar, Progress, DropdownMenu
 * - lucide-react: Icons pour les actions et statuts
 * - date-fns: Formatage des dates
 * - Types: ProjectWithRelations
 */

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
  MessageCircle,
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
  }): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle2 className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "ON_HOLD":
        return <PauseCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const calculateProgress = (project: ProjectWithRelations): number => {
    // Calculer la progression basée sur les données disponibles
    const totalInitiatives = project._count?.initiatives || 0;
    const totalFeatures = project._count?.features || 0;
    const totalSprints = project._count?.sprints || 0;

    const total = totalInitiatives + totalFeatures + totalSprints;

    if (total === 0) return 0;

    // Logique de progression basée sur le statut
    if (project.status === "COMPLETED") return 100;
    if (project.status === "CANCELLED") return 0;
    if (project.status === "ON_HOLD") return 25;

    // Pour les projets actifs, calculer une progression estimée
    // Ici vous pourriez implémenter une vraie logique basée sur les tâches terminées
    const baseProgress = Math.min(total * 10, 80); // Max 80% sans logique métier
    return Math.max(baseProgress, 10); // Minimum 10% pour les projets actifs
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return "Actif";
      case "COMPLETED":
        return "Terminé";
      case "ON_HOLD":
        return "En pause";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => {
        const activeMembers =
          project.members?.filter((member) => member.isActive) || [];

        const progress = calculateProgress(project);

        return (
          <Card
            key={project.id}
            className="group hover:shadow-lg transition-all duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold truncate">
                    {project.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.key}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(project.status)} text-xs`}
                  >
                    {getStatusIcon(project.status)}
                    <span className="ml-1">
                      {getStatusLabel(project.status)}
                    </span>
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {project.description || "Aucune description disponible"}
              </p>

              {/* Progression */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Statistiques des éléments de travail */}
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-lg font-semibold">
                      {project._count?.initiatives || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Initiatives</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Layers className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-lg font-semibold">
                      {project._count?.features || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Features</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Activity className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-lg font-semibold">
                      {project._count?.sprints || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sprints</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <MessageCircle className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-lg font-semibold">
                      {project._count?.channels || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Channels</p>
                </div>
              </div>

              {/* Fichiers */}
              {(project._count?.files || 0) > 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <span>
                    {project._count?.files} fichier
                    {(project._count?.files || 0) > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Dates */}
              {(project.startDate || project.endDate) && (
                <div className="space-y-1">
                  {project.startDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Début:{" "}
                        {format(project.startDate, "dd/MM/yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Fin:{" "}
                        {format(project.endDate, "dd/MM/yyyy", { locale: fr })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Équipe */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Équipe ({activeMembers.length})
                  </span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex -space-x-2">
                  {activeMembers.slice(0, 4).map((member) => (
                    <Avatar
                      key={member.id}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {getUserDisplayName(member.user)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {activeMembers.length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-medium">
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
