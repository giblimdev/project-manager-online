// components/projects/views/ProjectViewList.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Globe,
  Lock,
  Building,
  TrendingUp,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
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

  // Compteurs des relations
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

export interface ProjectViewListProps {
  projects: ProjectWithRelations[];
  onEdit: (project: ProjectWithRelations) => void;
  onRefresh: () => void;
}

export const ProjectViewList: React.FC<ProjectViewListProps> = ({
  projects,
  onEdit,
  onRefresh,
}) => {
  const handleMoveUp = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await moveItemUp("projects", projectId);
      onRefresh();
      toast.success("Projet déplacé vers le haut");
    } catch (error) {
      toast.error("Impossible de déplacer le projet");
    }
  };

  const handleMoveDown = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await moveItemDown("projects", projectId);
      onRefresh();
      toast.success("Projet déplacé vers le bas");
    } catch (error) {
      toast.error("Impossible de déplacer le projet");
    }
  };

  const handleEdit = (e: React.MouseEvent, project: ProjectWithRelations) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(project);
  };

  const handleDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
      )
    )
      return;

    try {
      await deleteItemUtil("projects", projectId);
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

  return (
    <TooltipProvider>
      <div className="space-y-2 p-4">
        {projects.map((project) => {
          const visibilityConfig = getVisibilityConfig(project.visibility);
          const statusConfig = getStatusConfig(project.status);

          const activeMembers = (project.members || []).filter(
            (member) => member.isActive
          );
          const activeOwners = (project.user || []).filter(
            (owner) => owner.isActive
          );

          return (
            <div key={project.id} className="relative group">
              <Link href={`/projects/${project.id}`} className="block">
                <div
                  className={cn(
                    "flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer relative",
                    !project.isActive && "opacity-75 bg-gray-50"
                  )}
                >
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-blue-500 text-white p-1 rounded-full">
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                          {project.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="text-xs font-mono shrink-0 bg-slate-50 border-slate-200"
                        >
                          {project.key}
                        </Badge>
                        <Badge
                          className={cn(
                            statusConfig.color,
                            "text-xs shrink-0 flex items-center gap-1"
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

                      <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                        {project.description || "Aucune description"}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{activeMembers.length} membres</span>
                        </div>

                        {activeOwners.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
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

                        {project.startDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(project.startDate).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {project._count && (
                      <div className="hidden lg:flex items-center space-x-6 text-sm text-gray-500">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                {project._count.initiatives || 0}
                              </div>
                              <div className="text-xs">Initiatives</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Nombre d'initiatives</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <Building className="h-4 w-4 text-green-600" />
                                {project._count.features || 0}
                              </div>
                              <div className="text-xs">Features</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Nombre de fonctionnalités</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-center cursor-help">
                              <div className="font-medium text-gray-900 flex items-center gap-1">
                                <Clock className="h-4 w-4 text-purple-600" />
                                {project._count.sprints || 0}
                              </div>
                              <div className="text-xs">Sprints</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Nombre de sprints</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}

                    {activeMembers.length > 0 && (
                      <div className="flex -space-x-2">
                        {activeMembers.slice(0, 3).map((member) => (
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
                        {activeMembers.length > 3 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-8 w-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center shadow-sm cursor-help">
                                <span className="text-xs font-medium text-gray-600">
                                  +{activeMembers.length - 3}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Et {activeMembers.length - 3} autres membres
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={(e) => handleEdit(e, project)}
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modifier le projet</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={(e) => handleMoveUp(e, project.id)}
                    >
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Déplacer vers le haut</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={(e) => handleMoveDown(e, project.id)}
                    >
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Déplacer vers le bas</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                      onClick={(e) => handleDelete(e, project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer le projet</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
