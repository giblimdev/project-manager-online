// @/components/epics/EpicsList.tsx

/**
 * RÔLE : Composant d'affichage de la liste des épics avec filtrage et gestion des vues
 * RESPONSABILITÉS :
 * - Affichage des épics en grid/list responsive moderne
 * - Actions CRUD sur les épics via callbacks (onEdit, onDelete, onOrderChange)
 * - Gestion des modes de vue (grid, list)
 * - Interface responsive avec Tailwind CSS et design moderne
 * - Gestion des états de chargement avec loading prop
 * - Navigation via Link vers /features avec mise à jour du store SelectedEpic
 *
 * COMPOSANTS UTILISÉS :
 * - Link (Next.js) pour navigation native
 * - Button, Badge, Card, CardContent, CardHeader, Progress : shadcn/ui
 * - Icons : lucide-react (Plus, Edit2, Trash2, Calendar, Target, Users, etc.)
 * - Skeleton pour les états de chargement
 * - DropdownMenu pour les actions
 */

"use client";

import React, { JSX } from "react";
import Link from "next/link"; // ✅ AJOUT: Import de Link
import { useParams } from "next/navigation"; // ✅ AJOUT: Pour récupérer projectId
import { useSelectedEpicStore } from "@/stores/useSelectedEpicStore"; // ✅ AJOUT: Store Epic
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Target,
  Users,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Clock,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

// ✅ Types cohérents avec la page et le schéma Prisma
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ViewMode = "list" | "card";

// Interface Epic (cohérente avec la page épics)
interface Epic {
  id: string;
  name: string;
  order: number;
  description: string | null;
  priority: Priority;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  initiativeId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations optionnelles
  features?: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
  userstories?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
  _count?: {
    features: number;
    userstories: number;
  };
}

// ✅ Props du composant (onEpicClick optionnel maintenant)
interface EpicsListProps {
  epics: Epic[];
  viewMode: ViewMode;
  onEpicClick?: (epic: Epic) => void; // ✅ Optionnel maintenant
  onEdit: (epic: Epic) => void;
  onDelete: (epic: Epic) => void;
  onOrderChange: (epicId: string, newOrder: number) => void;
  isLoading: boolean;
}

// ✅ Configuration des priorités avec couleurs et icônes
const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
    bgColor: string;
    icon: React.ComponentType<any>;
  }
> = {
  CRITICAL: {
    label: "Critique",
    variant: "destructive",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: AlertCircle,
  },
  HIGH: {
    label: "Haute",
    variant: "default",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    icon: TrendingUp,
  },
  MEDIUM: {
    label: "Moyenne",
    variant: "secondary",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Target,
  },
  LOW: {
    label: "Basse",
    variant: "outline",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
    icon: Clock,
  },
};

// ✅ Configuration des statuts
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<any>;
    color: string;
  }
> = {
  ACTIVE: { label: "Actif", icon: PlayCircle, color: "text-blue-600" },
  COMPLETED: { label: "Terminé", icon: CheckCircle2, color: "text-green-600" },
  ON_HOLD: { label: "En pause", icon: PauseCircle, color: "text-orange-600" },
  CANCELLED: { label: "Annulé", icon: AlertCircle, color: "text-red-600" },
};

export default function EpicsList({
  epics,
  viewMode,
  onEpicClick, // ✅ Gardé pour compatibilité mais optionnel
  onEdit,
  onDelete,
  onOrderChange,
  isLoading,
}: EpicsListProps): JSX.Element {
  // ✅ AJOUT: Récupération du projectId et du store Epic
  const params = useParams();
  const projectId = params.id as string;
  const { setSelectedEpicId } = useSelectedEpicStore();

  // ✅ AJOUT: Handler pour mise à jour du store au clic sur Link
  const handleEpicLinkClick = (epic: Epic) => {
    setSelectedEpicId(epic.id);

    // ✅ Appeler onEpicClick si fourni (pour compatibilité)
    if (onEpicClick) {
      onEpicClick(epic);
    }
  };

  // ✅ Fonction pour formater les dates
  const formatDate = (date: Date | null): string => {
    if (!date) return "Non définie";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // ✅ Handlers pour les changements d'ordre
  const handleMoveUp = (epic: Epic) => {
    if (epic.order > 1) {
      onOrderChange(epic.id, epic.order - 1);
    }
  };

  const handleMoveDown = (epic: Epic) => {
    const maxOrder = Math.max(...epics.map((e) => e.order));
    if (epic.order < maxOrder) {
      onOrderChange(epic.id, epic.order + 1);
    }
  };

  // ✅ État de chargement avec skeletons
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div
          className={
            viewMode === "card"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={
                viewMode === "card" ? "" : "flex items-center space-x-4"
              }
            >
              <Skeleton
                className={
                  viewMode === "card"
                    ? "h-48 w-full rounded-lg"
                    : "h-16 w-16 rounded-lg"
                }
              />
              {viewMode === "list" && (
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ État vide
  if (epics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Aucun épic trouvé</h3>
          <p className="text-muted-foreground max-w-md">
            Commencez par créer votre premier épic pour structurer votre
            initiative
          </p>
        </div>
        <Button onClick={() => onEdit({} as Epic)} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Créer le premier épic
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ En-tête avec statistiques et bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">
            {epics.length} épic{epics.length > 1 ? "s" : ""}
          </h3>
          <p className="text-sm text-muted-foreground">
            Mode d'affichage : {viewMode === "card" ? "Cartes" : "Liste"}
          </p>
        </div>
        <Button
          onClick={() => onEdit({} as Epic)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel épic
        </Button>
      </div>

      {/* ✅ Affichage conditionnel selon le mode */}
      {viewMode === "card" ? (
        // ✅ Mode Cartes avec Link
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {epics.map((epic) => {
            const priorityConfig = PRIORITY_CONFIG[epic.priority];
            const statusConfig =
              STATUS_CONFIG[epic.status] || STATUS_CONFIG.ACTIVE;
            const PriorityIcon = priorityConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={epic.id}
                href={`/projects/${projectId}/features`}
                onClick={() => handleEpicLinkClick(epic)}
                className="block"
              >
                <Card
                  className={`
                    group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1
                    ${priorityConfig.bgColor}
                  `}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={priorityConfig.variant}
                            className="text-xs"
                          >
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {priorityConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <StatusIcon
                              className={`w-3 h-3 mr-1 ${statusConfig.color}`}
                            />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {epic.name}
                        </CardTitle>
                      </div>

                      {/* Menu d'actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit(epic);
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMoveUp(epic);
                            }}
                          >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            Monter
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMoveDown(epic);
                            }}
                          >
                            <ArrowDown className="mr-2 h-4 w-4" />
                            Descendre
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDelete(epic);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    {epic.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {epic.description}
                      </p>
                    )}

                    {/* Progression */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Progression
                        </span>
                        <span className="font-medium">{epic.progress}%</span>
                      </div>
                      <Progress value={epic.progress} className="h-2" />
                    </div>

                    {/* Dates */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Début: {formatDate(epic.startDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Fin: {formatDate(epic.endDate)}</span>
                      </div>
                    </div>

                    {/* Compteurs */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>
                          {epic._count?.features || 0} fonctionnalités
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {epic._count?.userstories || 0} user stories
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        // ✅ Mode Liste avec Link
        <div className="space-y-3">
          {epics.map((epic) => {
            const priorityConfig = PRIORITY_CONFIG[epic.priority];
            const statusConfig =
              STATUS_CONFIG[epic.status] || STATUS_CONFIG.ACTIVE;
            const PriorityIcon = priorityConfig.icon;
            const StatusIcon = statusConfig.icon;

            return (
              <Link
                key={epic.id}
                href={`/projects/${projectId}/features`}
                onClick={() => handleEpicLinkClick(epic)}
                className="block"
              >
                <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/30">
                  <CardContent className="py-4">
                    <div className="flex items-center space-x-4">
                      {/* Icône de priorité */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${priorityConfig.bgColor}`}
                      >
                        <PriorityIcon
                          className={`h-5 w-5 ${priorityConfig.color}`}
                        />
                      </div>

                      {/* Contenu principal */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-semibold truncate group-hover:text-blue-600 transition-colors">
                            {epic.name}
                          </h4>
                          <Badge
                            variant={priorityConfig.variant}
                            className="text-xs"
                          >
                            {priorityConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <StatusIcon
                              className={`w-3 h-3 mr-1 ${statusConfig.color}`}
                            />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {epic.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {epic.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(epic.startDate)} →{" "}
                              {formatDate(epic.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{epic._count?.features || 0} features</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{epic._count?.userstories || 0} stories</span>
                          </div>
                        </div>
                      </div>

                      {/* Progression */}
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {epic.progress}%
                          </div>
                          <Progress
                            value={epic.progress}
                            className="w-20 h-2"
                          />
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit(epic);
                              }}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMoveUp(epic);
                              }}
                            >
                              <ArrowUp className="mr-2 h-4 w-4" />
                              Monter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMoveDown(epic);
                              }}
                            >
                              <ArrowDown className="mr-2 h-4 w-4" />
                              Descendre
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(epic);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
