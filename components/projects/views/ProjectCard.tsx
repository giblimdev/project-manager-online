// components/projects/views/ProjectCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Calendar,
  Users,
  MoreHorizontal,
  Globe,
  Lock,
  Building,
  TrendingUp,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { moveItemUp, moveItemDown } from "@/utils/order";
import { deleteItemUtil } from "@/utils/delete-item";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Interface basée exactement sur votre schéma Prisma complet
interface ProjectWithRelations {
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
  settings: any;
  metadata: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations selon votre schéma Prisma User complet
  user: Array<{
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean; // Champ obligatoire du schéma
    image: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    timezone?: string | null;
    preferences?: any;
    isActive: boolean;
    lastLoginAt?: Date | null;
    twoFactorEnabled?: boolean;
  }>;

  // Relations ProjectMember selon le schéma
  members: Array<{
    id: string;
    role:
      | "ADMIN"
      | "PRODUCT_OWNER"
      | "SCRUM_MASTER"
      | "DEVELOPER"
      | "STAKEHOLDER"
      | "VIEWER";
    joinedAt: Date;
    isActive: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      emailVerified: boolean; // Champ obligatoire du schéma
      image: string | null;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      bio?: string | null;
      timezone?: string | null;
      preferences?: any;
      isActive: boolean;
    };
  }>;

  _count?: {
    user?: number;
    members?: number;
    initiatives?: number;
    features?: number;
    sprints?: number;
    files?: number;
    channels?: number;
    templates?: number;
  };
}

export interface ProjectCardProps {
  project: ProjectWithRelations;
  onEdit: (project: ProjectWithRelations) => void;
  onRefresh: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onRefresh,
}) => {
  const handleMoveUp = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await moveItemUp("projects", project.id);
      onRefresh();
      toast.success("Projet déplacé vers le haut");
    } catch (error) {
      toast.error("Impossible de déplacer le projet");
    }
  };

  const handleMoveDown = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await moveItemDown("projects", project.id);
      onRefresh();
      toast.success("Projet déplacé vers le bas");
    } catch (error) {
      toast.error("Impossible de déplacer le projet");
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(project);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
      )
    )
      return;

    try {
      await deleteItemUtil("projects", project.id);
      onRefresh();
      toast.success("Projet supprimé avec succès");
    } catch (error) {
      toast.error("Impossible de supprimer le projet");
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Actif",
          icon: <TrendingUp className="h-3 w-3" />,
        };
      case "COMPLETED":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Terminé",
          icon: <Clock className="h-3 w-3" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Annulé",
          icon: <AlertCircle className="h-3 w-3" />,
        };
      case "ON_HOLD":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "En pause",
          icon: <Clock className="h-3 w-3" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: status,
          icon: <AlertCircle className="h-3 w-3" />,
        };
    }
  };

  const getVisibilityConfig = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return {
          icon: <Globe className="h-4 w-4" />,
          label: "Public",
          color: "text-blue-600",
        };
      case "PRIVATE":
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Privé",
          color: "text-gray-600",
        };
      case "INTERNAL":
        return {
          icon: <Building className="h-4 w-4" />,
          label: "Interne",
          color: "text-orange-600",
        };
      default:
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Privé",
          color: "text-gray-600",
        };
    }
  };

  const getRoleLabel = (
    role:
      | "ADMIN"
      | "PRODUCT_OWNER"
      | "SCRUM_MASTER"
      | "DEVELOPER"
      | "STAKEHOLDER"
      | "VIEWER"
  ) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "PRODUCT_OWNER":
        return "Product Owner";
      case "SCRUM_MASTER":
        return "Scrum Master";
      case "DEVELOPER":
        return "Développeur";
      case "STAKEHOLDER":
        return "Partie prenante";
      case "VIEWER":
        return "Observateur";
      default:
        return role;
    }
  };

  const getUserDisplayName = (user: {
    name: string | null;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const statusConfig = getStatusConfig(project.status);
  const visibilityConfig = getVisibilityConfig(project.visibility);

  // Filtrage des membres et propriétaires actifs
  const activeMembers = (project.members || []).filter(
    (member) => member.isActive
  );
  const activeOwners = (project.user || []).filter((owner) => owner.isActive);

  return (
    <TooltipProvider>
      <Link href={`/projects/${project.id}`} className="block group">
        <Card className="hover:shadow-lg transition-all duration-200 border-slate-200/60 hover:border-slate-300 cursor-pointer relative">
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-blue-500 text-white p-1 rounded-full">
              <ExternalLink className="h-3 w-3" />
            </div>
          </div>

          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                    {project.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-xs font-mono shrink-0 bg-slate-50 border-slate-200"
                  >
                    {project.key}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {project.description || "Aucune description disponible"}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {/* Affichage des propriétaires actifs */}
                  {activeOwners.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {activeOwners.length === 1
                          ? getUserDisplayName(activeOwners[0])
                          : `${activeOwners.length} propriétaires`}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex items-center space-x-1 ${visibilityConfig.color}`}
                  >
                    {visibilityConfig.icon}
                    <span>{visibilityConfig.label}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 ml-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 relative z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMoveUp}>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Monter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMoveDown}>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Descendre
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Badge
                  className={cn(
                    statusConfig.color,
                    "text-xs flex items-center gap-1"
                  )}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
                {!project.isActive && (
                  <Badge
                    variant="outline"
                    className="text-xs text-red-600 border-red-200"
                  >
                    Inactif
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Affichage des dates du projet */}
              {(project.startDate || project.endDate) && (
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {project.startDate && project.endDate ? (
                      <>
                        {new Date(project.startDate).toLocaleDateString(
                          "fr-FR"
                        )}
                        {" → "}
                        {new Date(project.endDate).toLocaleDateString("fr-FR")}
                      </>
                    ) : project.startDate ? (
                      <>
                        Début:{" "}
                        {new Date(project.startDate).toLocaleDateString(
                          "fr-FR"
                        )}
                      </>
                    ) : (
                      <>
                        Fin:{" "}
                        {new Date(project.endDate!).toLocaleDateString("fr-FR")}
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Statistiques du projet */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-blue-50 rounded-lg p-3 cursor-help hover:bg-blue-100 transition-colors">
                      <div className="text-blue-700 font-medium mb-1">
                        Initiatives
                      </div>
                      <div className="text-blue-900 text-lg font-semibold">
                        {project._count?.initiatives || 0}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nombre d'initiatives dans ce projet</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-green-50 rounded-lg p-3 cursor-help hover:bg-green-100 transition-colors">
                      <div className="text-green-700 font-medium mb-1">
                        Features
                      </div>
                      <div className="text-green-900 text-lg font-semibold">
                        {project._count?.features || 0}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nombre de fonctionnalités dans ce projet</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-purple-50 rounded-lg p-3 cursor-help hover:bg-purple-100 transition-colors">
                      <div className="text-purple-700 font-medium mb-1">
                        Sprints
                      </div>
                      <div className="text-purple-900 text-lg font-semibold">
                        {project._count?.sprints || 0}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nombre de sprints planifiés</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-orange-50 rounded-lg p-3 cursor-help hover:bg-orange-100 transition-colors">
                      <div className="text-orange-700 font-medium mb-1">
                        Fichiers
                      </div>
                      <div className="text-orange-900 text-lg font-semibold">
                        {project._count?.files || 0}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nombre de fichiers attachés</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Membres de l'équipe */}
              {activeMembers.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Membres de l'équipe ({activeMembers.length})
                    </div>
                    <div className="flex -space-x-2">
                      {activeMembers.slice(0, 5).map((member) => (
                        <Tooltip key={member.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm cursor-help">
                              <AvatarImage
                                src={member.user.image || undefined}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs">
                                {member.user.name?.charAt(0) ||
                                  member.user.firstName?.charAt(0) ||
                                  member.user.email?.charAt(0) ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {getUserDisplayName(member.user)}
                              <br />
                              <span className="text-xs opacity-80">
                                {getRoleLabel(member.role)}
                              </span>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {activeMembers.length > 5 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="h-8 w-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center shadow-sm cursor-help">
                              <span className="text-xs font-medium text-gray-600">
                                +{activeMembers.length - 5}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Et {activeMembers.length - 5} autres membres</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </TooltipProvider>
  );
};
