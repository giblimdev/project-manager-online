// @/components/sprints/views/SprintViewCard.tsx

/**
 * RÔLE : Afficher les sprints sous forme de cartes visuelles
 *
 * RESPONSABILITÉS :
 * - Présenter les sprints dans un layout grid responsive
 * - Afficher les informations clés sous forme visuelle
 * - Intégrer les actions utilisateur (édition/suppression)
 * - Gérer les états vides et les loading states
 * - Appliquer un design cohérent avec le système de design
 *
 * PROPS :
 * @param {Sprint[]} sprints - Tableau des sprints à afficher
 * @param {(sprintId: string) => void} onEdit - Handler pour l'édition
 * @param {(sprintId: string) => void} onDelete - Handler pour la suppression
 *
 * STYLES :
 * - Grid responsive (1 colonne mobile, 2 tablette, 3 desktop)
 * - Cartes avec ombres et transitions hover
 * - Badges colorés pour les statuts/priorités
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
  Flag,
  CircleCheck,
  CirclePause,
  CirclePlay,
  CircleX,
} from "lucide-react";
import { Sprint } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SprintViewCardProps {
  sprints: Sprint[];
  onEdit: (sprintId: string) => void;
  onDelete: (sprintId: string) => void;
}

const statusIcons = {
  planned: <CirclePlay className="h-4 w-4" />,
  in_progress: <CircleCheck className="h-4 w-4 text-yellow-500" />,
  completed: <CircleCheck className="h-4 w-4 text-green-500" />,
  cancelled: <CircleX className="h-4 w-4 text-red-500" />,
  paused: <CirclePause className="h-4 w-4 text-blue-500" />,
};

const priorityColors = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export default function SprintViewCard({
  sprints,
  onEdit,
  onDelete,
}: SprintViewCardProps) {
  if (sprints.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Aucun sprint à afficher</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sprints.map((sprint) => (
        <Card
          key={sprint.id}
          className="hover:shadow-lg transition-shadow duration-200"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg line-clamp-2">
                {sprint.name}
              </CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                {statusIcons[sprint.status]}
                {sprint.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(sprint.startDate), "dd MMM yyyy", {
                  locale: fr,
                })}{" "}
                -{" "}
                {format(new Date(sprint.endDate), "dd MMM yyyy", {
                  locale: fr,
                })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <Badge className={priorityColors[sprint.priority]}>
                {sprint.priority}
              </Badge>
            </div>

            {sprint.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {sprint.description}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(sprint.id)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(sprint.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
