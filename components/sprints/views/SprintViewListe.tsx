// @/components/sprints/views/SprintViewListe.tsx

/**
 * RÔLE : Afficher les sprints sous forme de liste visuelle (non tabulaire)
 *
 * RESPONSABILITÉS :
 * - Présenter les sprints dans une liste verticale selon le schéma Prisma
 * - Afficher les informations clés de manière compacte (goal, capacité, vélocité)
 * - Intégrer les actions utilisateur (édition/suppression)
 * - Gérer les états vides et les loading states
 * - Design cohérent avec le système shadcn/ui
 *
 * PROPS :
 * @param {SprintWithStats[]} sprints - Tableau des sprints à afficher avec stats
 * @param {(sprint: Sprint) => void} onEdit - Handler pour l'édition avec objet complet
 * @param {(sprintId: string) => void} onDelete - Handler pour la suppression
 *
 * STYLES : 
 * - Liste verticale avec séparateurs
 * - Cartes avec ombres légères
 * - Badges colorés pour les statuts selon SprintStatus
 * - Transitions hover fluides
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  Trash2,
  Calendar,
  Target,
  Clock,
  Zap,
  ChevronRight,
  CircleCheck,
  CirclePause,
  CirclePlay,
  CircleX,
  Users,
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

interface SprintViewListeProps {
  sprints: SprintWithStats[];
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
}

// ✅ Icons pour les statuts selon votre schéma SprintStatus
const statusIcons: Record<SprintStatus, React.ReactNode> = {
  [SprintStatus.PLANNED]: <CirclePlay className="h-4 w-4 text-blue-500" />,
  [SprintStatus.ACTIVE]: (
    <Zap className="h-4 w-4 text-green-500 animate-pulse" />
  ),
  [SprintStatus.COMPLETED]: <CircleCheck className="h-4 w-4 text-gray-500" />,
  [SprintStatus.CANCELLED]: <CircleX className="h-4 w-4 text-red-500" />,
};

// ✅ Couleurs pour les statuts selon votre schéma
const statusColors: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  [SprintStatus.ACTIVE]: "bg-green-100 text-green-800 hover:bg-green-200",
  [SprintStatus.COMPLETED]: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  [SprintStatus.CANCELLED]: "bg-red-100 text-red-800 hover:bg-red-200",
};

// ✅ Labels en français pour les statuts
const statusLabels: Record<SprintStatus, string> = {
  [SprintStatus.PLANNED]: "Planifié",
  [SprintStatus.ACTIVE]: "Actif",
  [SprintStatus.COMPLETED]: "Terminé",
  [SprintStatus.CANCELLED]: "Annulé",
};

export default function SprintViewListe({
  sprints,
  onEdit,
  onDelete,
}: SprintViewListeProps) {
  // Fonction pour formater les dates de manière sécurisée
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "Non défini";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj)
      ? format(dateObj, "dd MMM yyyy", { locale: fr })
      : "Date invalide";
  };

  const formatShortDate = (date: Date | string | null | undefined): string => {
    if (!date) return "Non défini";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj)
      ? format(dateObj, "dd MMM", { locale: fr })
      : "Non défini";
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
    return `${diffDays}j`;
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
    <div className="space-y-3">
      {sprints.map((sprint) => (
        <Card
          key={sprint.id}
          className="hover:shadow-md transition-all duration-200 hover:border-primary/20 border-l-4 border-l-primary/30"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Partie gauche - Informations principales */}
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {statusIcons[sprint.status]}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  {/* Titre et statut */}
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium leading-none truncate">
                      {sprint.name}
                    </h3>
                    <Badge
                      className={`${statusColors[sprint.status]} flex-shrink-0`}
                    >
                      {statusLabels[sprint.status]}
                    </Badge>
                  </div>

                  {/* Objectif du sprint */}
                  {sprint.goal && (
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {sprint.goal}
                      </p>
                    </div>
                  )}

                  {/* Informations secondaires */}
                  <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                    {/* Dates */}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {formatShortDate(sprint.startDate)} -{" "}
                        {formatShortDate(sprint.endDate)}
                      </span>
                      <span className="text-xs">
                        ({getSprintDuration(sprint.startDate, sprint.endDate)})
                      </span>
                    </div>

                    {/* Capacité */}
                    {sprint.capacity && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{sprint.capacity}h</span>
                      </div>
                    )}

                    {/* Vélocité */}
                    {sprint.velocity && (
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span>{sprint.velocity} pts</span>
                      </div>
                    )}

                    {/* Statistiques */}
                    {sprint._count && (
                      <div className="flex items-center gap-3">
                        {typeof sprint._count.userStories === "number" && (
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{sprint._count.userStories} stories</span>
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
                  </div>
                </div>
              </div>

              {/* Partie droite - Actions et indicateur */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  onClick={() => onEdit(sprint)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Modifier {sprint.name}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                  onClick={() => onDelete(sprint.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Supprimer {sprint.name}</span>
                </Button>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Description (optionnelle) */}
            {sprint.description && (
              <div className="mt-3 pl-8">
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {sprint.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
