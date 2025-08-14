// @/components/sprints/views/SprintViewListe.tsx

/**
 * RÔLE : Afficher les sprints sous forme de liste visuelle (non tabulaire)
 *
 * RESPONSABILITÉS :
 * - Présenter les sprints dans une liste verticale
 * - Afficher les informations clés de manière compacte
 * - Intégrer les actions utilisateur (édition/suppression)
 * - Gérer les états vides et les loading states
 * - Design cohérent avec le système shadcn/ui
 *
 * PROPS :
 * @param {Sprint[]} sprints - Tableau des sprints à afficher
 * @param {(sprintId: string) => void} onEdit - Handler pour l'édition
 * @param {(sprintId: string) => void} onDelete - Handler pour la suppression
 *
 * STYLES :
 * - Liste verticale avec séparateurs
 * - Cartes avec ombres légères
 * - Badges colorés pour les statuts/priorités
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
  Flag,
  ChevronRight,
  CircleCheck,
  CirclePause,
  CirclePlay,
  CircleX,
} from "lucide-react";
import { Sprint } from "@/lib/generated/prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SprintViewListeProps {
  sprints: Sprint[];
  onEdit: (sprintId: string) => void;
  onDelete: (sprintId: string) => void;
}

const statusIcons = {
  planned: <CirclePlay className="h-4 w-4 text-blue-500" />,
  in_progress: (
    <CircleCheck className="h-4 w-4 text-yellow-500 animate-pulse" />
  ),
  completed: <CircleCheck className="h-4 w-4 text-green-500" />,
  cancelled: <CircleX className="h-4 w-4 text-red-500" />,
  paused: <CirclePause className="h-4 w-4 text-orange-500" />,
};

const priorityColors = {
  LOW: "bg-green-100 text-green-800 hover:bg-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  CRITICAL: "bg-red-100 text-red-800 hover:bg-red-200",
};

export default function SprintViewListe({
  sprints,
  onEdit,
  onDelete,
}: SprintViewListeProps) {
  if (sprints.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Aucun sprint à afficher</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sprints.map((sprint) => (
        <Card key={sprint.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Partie gauche - Informations principales */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {statusIcons[sprint.status]}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-medium leading-none">
                    {sprint.name}
                  </h3>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {format(new Date(sprint.startDate), "dd MMM", {
                          locale: fr,
                        })}{" "}
                        -{" "}
                        {format(new Date(sprint.endDate), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className={priorityColors[sprint.priority]}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      {sprint.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Partie droite - Actions et indicateur */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onEdit(sprint.id)}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Modifier</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onDelete(sprint.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Supprimer</span>
                </Button>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Description (optionnelle) */}
            {sprint.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {sprint.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
