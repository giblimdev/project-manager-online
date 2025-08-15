// components/epics/EpicsList.tsx
/**
 * RÔLE : Composant d'affichage de la liste des épics avec navigation vers la page des features d'un epic.
 * RESPONSABILITÉS :
 * - Affichage responsive des épics (mode card ou liste moderne) avec actions CRUD
 * - Changement d'ordre via flèches up/down (API 'epics/[id]/reorder')
 * - Mise à jour du store useSelectedEpicStore quand on clique sur un epic
 * - Redirection vers /features/page (ou /features) avec Link après clic
 * - Gestion des états : loading / empty / présentations avec badges
 */

"use client";

import React, { JSX } from "react";
import Link from "next/link";
import { useSelectedEpicStore } from "@/stores/useSelectedEpicStore";
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
  ArrowUp,
  ArrowDown,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type ViewMode = "list" | "card";

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

interface EpicsListProps {
  epics: Epic[];
  viewMode: ViewMode;
  onEpicClick?: (epic: Epic) => void;
  onEdit: (epic: Epic) => void;
  onDelete: (epic: Epic) => void;
  onOrderChange: (epicId: string, direction: "up" | "down") => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bgColor: string; icon: React.ComponentType }
> = {
  CRITICAL: {
    label: "Critique",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: AlertCircle,
  },
  HIGH: {
    label: "Haute",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    icon: TrendingUp,
  },
  MEDIUM: {
    label: "Moyenne",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Target,
  },
  LOW: {
    label: "Basse",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
    icon: Clock,
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType; color: string }
> = {
  ACTIVE: { label: "Actif", icon: PlayCircle, color: "text-blue-600" },
  COMPLETED: { label: "Terminé", icon: CheckCircle2, color: "text-green-600" },
  ON_HOLD: { label: "En pause", icon: PauseCircle, color: "text-orange-600" },
  CANCELLED: { label: "Annulé", icon: AlertCircle, color: "text-red-600" },
};

export default function EpicsList({
  epics = [],
  viewMode,
  onEpicClick,
  onEdit,
  onDelete,
  onOrderChange,
  onCreateNew,
  isLoading,
}: EpicsListProps): JSX.Element {
  const { setSelectedEpicId } = useSelectedEpicStore();

  const handleEpicLinkClick = (epic: Epic) => {
    setSelectedEpicId(epic.id);
    if (onEpicClick) onEpicClick(epic);
  };

  const formatDate = (date: Date | null): string =>
    date
      ? new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(date)
      : "Non définie";

  const handleMoveUp = (epic: Epic) => {
    onOrderChange(epic.id, "up");
  };

  const handleMoveDown = (epic: Epic) => {
    onOrderChange(epic.id, "down");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (epics.length === 0) {
    return (
      <div className="text-center space-y-4">
        <p>Aucun épic trouvé</p>
        <p className="text-sm text-muted-foreground">
          Commencez par créer votre premier épic pour structurer votre initiative
        </p>
        <Button onClick={onCreateNew} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Créer le premier épic
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel épic
        </Button>
      </div>

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {epics.map((epic) => {
            const priority = PRIORITY_CONFIG[epic.priority];
            const status = STATUS_CONFIG[epic.status] || STATUS_CONFIG.ACTIVE;
            const PriorityIcon = priority.icon;
            const StatusIcon = status.icon;

            return (
              <Card key={epic.id} className="hover:shadow-md transition">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <Link
                      href="/projects/${projectId}/features"
                      onClick={() => handleEpicLinkClick(epic)}
                      className="hover:text-blue-600 transition-colors font-medium"
                    >
                      {epic.name}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Plus d'actions">
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(epic)}>
                          <Edit2 className="mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoveUp(epic)}>
                          <ArrowUp className="mr-2" /> Monter
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMoveDown(epic)}>
                          <ArrowDown className="mr-2" /> Descendre
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(epic)}
                        >
                          <Trash2 className="mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={`${priority.bgColor} ${priority.color}`}>
                      <PriorityIcon  />
                      {priority.label}
                    </Badge>
                    <Badge className={status.color}>
                      <StatusIcon />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {epic.description && (
                    <p className="text-sm mb-2">{epic.description}</p>
                  )}
                  <Progress value={epic.progress} className="mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Début: {formatDate(epic.startDate)}</span>
                    <span>Fin: {formatDate(epic.endDate)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {epics.map((epic) => (
            <div
              key={epic.id}
              className="flex items-center justify-between border p-3 rounded hover:bg-gray-50 transition"
            >
              <Link
                href="/projects/${projectId}/features"
                onClick={() => handleEpicLinkClick(epic)}
                className="font-medium hover:text-blue-600"
              >
                {epic.name}
              </Link>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleMoveUp(epic)} aria-label="Monter">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleMoveDown(epic)} aria-label="Descendre">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => onEdit(epic)}>
                  Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(epic)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
