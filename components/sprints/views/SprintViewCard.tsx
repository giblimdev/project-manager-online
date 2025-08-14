// @/components/sprints/views/SprintViewCard.tsx

/**
 * RÔLE : Afficher les sprints sous forme de cartes visuelles
 *
 * RESPONSABILITÉS :
 * - Présenter les sprints dans un layout grid responsive
 * - Afficher les informations clés sous forme visuelle selon le schéma Prisma
 * - Intégrer les actions utilisateur (édition/suppression)
 * - Gérer les états vides et les loading states
 * - Appliquer un design cohérent avec le système de design
 *
 * PROPS :
 * @param {SprintWithStats[]} sprints - Tableau des sprints à afficher
 * @param {(sprint: Sprint) => void} onEdit - Handler pour l'édition avec objet complet
 * @param {(sprintId: string) => void} onDelete - Handler pour la suppression
 *
 * STYLES :
 * - Grid responsive (1 colonne mobile, 2 tablette, 3 desktop)
 * - Cartes avec ombres et transitions hover
 * - Badges colorés pour les statuts selon SprintStatus
 * - Design cohérent avec shadcn/ui
 */

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  Trash2,
  Calendar,
  Target,
  Clock,
  CircleCheck,
  CirclePause,
  CirclePlay,
  CircleX,
  Zap,
} from "lucide-react";
import { Sprint, SprintStatus } from "@/lib/generated/prisma/client";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";

// Interface pour les sprints avec statistiques
interface SprintWithStats extends Sprint {
  _count?: {
    userStories?: number;
    tasks?: number;
  };
}

interface SprintViewCardProps {
  sprints: SprintWithStats[];
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
}

// ✅ Icons pour les statuts selon votre schéma SprintStatus
const statusIcons: Record<SprintStatus, React.ReactNode> = {
  [SprintStatus.PLANNED]: <CirclePlay className="h-4 w-4 text-blue-500" />,
  [SprintStatus.ACTIVE]: <Zap className="h-4 w-4 text-green-500" />,
  [SprintStatus.COMPLETED]: <CircleCheck className="h-4 w-4 text-gray-500" />,
  [SprintStatus.CANCELLED]: <CircleX className="h-4 w-4 text-red-500" />,
};

// ✅ Couleurs pour les statuts selon votre schéma
const statusColors: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: "bg-blue-100 text-blue-800 border-blue-200",
  [SprintStatus.ACTIVE]: "bg-green-100 text-green-800 border-green-200",
  [SprintStatus.COMPLETED]: "bg-gray-100 text-gray-800 border-gray-200",
  [SprintStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-200",
};

// ✅ Labels en français pour les statuts
const statusLabels: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: "Planifié",
  [SprintStatus.ACTIVE]: "Actif",
  [SprintStatus.COMPLETED]: "Terminé",
  [SprintStatus.CANCELLED]: "Annulé",
};

export default function SprintViewCard({
  sprints,
  onEdit,
  onDelete,
}: SprintViewCardProps) {
  // Fonction pour formater les dates de manière sécurisée
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "Non défini";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj)
      ? format(dateObj, "dd MMM yyyy", { locale: fr })
      : "Date invalide";
  };

  // Fonction pour calculer la durée du sprint
  const getSprintDuration = (
    startDate: Date | string,
    endDate: Date | string
  ): string => {
    const start =
      typeof startDate === "string" ? new Date(startDate) : startDate;
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;

    if (!isValid(start) || !isValid(end)) return "";

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  if (sprints.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-muted-foreground text-lg mb-2">📋</div>
          <p className="text-muted-foreground">Aucun sprint à afficher</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sprints.map((sprint) => (
        <Card
          key={sprint.id}
          className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-primary"
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg line-clamp-2 flex-1">
                {sprint.name}
              </CardTitle>
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${
                  statusColors[sprint.status]
                }`}
              >
                {statusIcons[sprint.status]}
                {statusLabels[sprint.status]}
              </Badge>
            </div>

            {/* Objectif du sprint */}
            {sprint.goal && (
              <div className="flex items-start gap-2 mt-2">
                <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {sprint.goal}
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Dates du sprint */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-medium">
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({getSprintDuration(sprint.startDate, sprint.endDate)})
                </span>
              </div>
            </div>

            {/* Capacité et vélocité */}
            <div className="flex items-center gap-4 text-sm">
              {sprint.capacity && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{sprint.capacity}h</span>
                </div>
              )}

              {sprint.velocity && (
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>{sprint.velocity} pts</span>
                </div>
              )}
            </div>

            {/* Statistiques */}
            {sprint._count && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {typeof sprint._count.userStories === "number" && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{sprint._count.userStories} user stories</span>
                  </div>
                )}

                {typeof sprint._count.tasks === "number" && (
                  <div className="flex items-center gap-1">
                    <CircleCheck className="h-4 w-4" />
                    <span>{sprint._count.tasks} tâches</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {sprint.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {sprint.description}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(sprint)}
              className="flex items-center gap-1"
            >
              <Edit2 className="h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(sprint.id)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
