// @/components/sprints/SprintList.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader, 
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Calendar, Target, Clock } from "lucide-react";
import { Sprint, SprintStatus } from "@/lib/generated/prisma/client";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";

interface SprintWithStats extends Sprint {
  _count?: {
    tasks?: number;
    userStories?: number;
  };
}

interface SprintListProps {
  sprints: SprintWithStats[];
  viewMode: "list" | "card";
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
}

export default function SprintList({
  sprints,
  viewMode,
  onEdit,
  onDelete,
}: SprintListProps) {
  const getStatusColor = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.PLANNED:
        return "bg-blue-100 text-blue-800 border-blue-200";
      case SprintStatus.ACTIVE:
        return "bg-green-100 text-green-800 border-green-200";
      case SprintStatus.COMPLETED:
        return "bg-gray-100 text-gray-800 border-gray-200";
      case SprintStatus.CANCELLED:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.PLANNED:
        return "Planifié";
      case SprintStatus.ACTIVE:
        return "Actif";
      case SprintStatus.COMPLETED:
        return "Terminé";
      case SprintStatus.CANCELLED:
        return "Annulé";
      default:
        return status;
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj)
      ? format(dateObj, "dd/MM/yyyy", { locale: fr })
      : "Non défini";
  };

  const formatShortDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return isValid(dateObj)
      ? format(dateObj, "dd/MM", { locale: fr })
      : "Non défini";
  };

  if (viewMode === "card") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sprints.map((sprint) => (
          <Card key={sprint.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-1">
                  {sprint.name}
                </CardTitle>
                <Badge className={getStatusColor(sprint.status)}>
                  {getStatusLabel(sprint.status)}
                </Badge>
              </div>
              {sprint.goal && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  🎯 {sprint.goal}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {sprint.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {sprint.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatShortDate(sprint.startDate)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatShortDate(sprint.endDate)}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {sprint._count?.userStories || 0} user stories
                </div>
                {sprint.capacity && (
                  <div className="flex items-center gap-1">
                    Capacité: {sprint.capacity}h
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(sprint)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(sprint.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de début</TableHead>
            <TableHead>Date de fin</TableHead>
            <TableHead>User Stories</TableHead>
            <TableHead>Capacité</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sprints.map((sprint) => (
            <TableRow key={sprint.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{sprint.name}</div>
                  {sprint.goal && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      🎯 {sprint.goal}
                    </div>
                  )}
                  {sprint.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {sprint.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(sprint.status)}>
                  {getStatusLabel(sprint.status)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(sprint.startDate)}</TableCell>
              <TableCell>{formatDate(sprint.endDate)}</TableCell>
              <TableCell>{sprint._count?.userStories || 0}</TableCell>
              <TableCell>
                {sprint.capacity ? `${sprint.capacity}h` : "Non défini"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(sprint)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(sprint.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
