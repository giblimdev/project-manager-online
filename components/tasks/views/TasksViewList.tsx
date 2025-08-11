// 📄 /components/tasks/views/TasksViewList.tsx
// 🎯 Rôle : Template de vue liste
// 📦 Responsabilités : Définit uniquement l'apparence d'un item dans une liste - Composant de présentation pure (pas de logique métier)
// 🔧 Composants utilisés : Card, Badge, Button, Table de shadcn/ui, icônes Lucide React

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Star,
  Tag,
  Calendar,
  Loader2,
} from "lucide-react";

// 🔧 Interface pour les props reçues
interface UserStory {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "CODE_REVIEW"
    | "TESTING"
    | "DONE"
    | "BLOCKED"
    | "CANCELLED";
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  featureId: string;
  creatorId: string;
}

interface TasksViewListProps {
  stories: UserStory[];
  onView: (story: UserStory) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (story: UserStory) => void;
  onMoveUp: (story: UserStory) => void;
  onMoveDown: (story: UserStory) => void;
  operationInProgress: string | null;
}

// 🎨 Configuration des couleurs
const PRIORITY_COLORS = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_COLORS = {
  TODO: "bg-gray-100 text-gray-800 border-gray-200",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  CODE_REVIEW: "bg-purple-100 text-purple-800 border-purple-200",
  TESTING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DONE: "bg-green-100 text-green-800 border-green-200",
  BLOCKED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function TasksViewList({
  stories,
  onView,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  operationInProgress,
}: TasksViewListProps) {
  // 🎯 Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // 🎯 Fonction pour tronquer le texte
  const truncateText = (text: string | undefined, maxLength: number = 60) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="min-w-[300px]">Titre</TableHead>
              <TableHead className="w-32">Statut</TableHead>
              <TableHead className="w-28">Priorité</TableHead>
              <TableHead className="w-24 text-center">Points</TableHead>
              <TableHead className="w-24 text-center">Heures</TableHead>
              <TableHead className="w-32">Tags</TableHead>
              <TableHead className="w-28">Créé le</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {stories.map((story, index) => {
              const isLoading = operationInProgress?.includes(story.id);

              return (
                <TableRow
                  key={story.id}
                  className={`
                    transition-all duration-200 hover:bg-muted/50
                    ${isLoading ? "opacity-60" : ""}
                  `}
                >
                  {/* Position */}
                  <TableCell className="text-center text-sm text-muted-foreground font-mono">
                    {index + 1}
                  </TableCell>

                  {/* Titre et description */}
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div
                        className="cursor-pointer hover:text-primary transition-colors line-clamp-2"
                        onClick={() => onView(story)}
                        title={story.title}
                      >
                        {story.title}
                      </div>
                      {story.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {truncateText(story.description, 80)}
                        </p>
                      )}
                      {story.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {story.labels.slice(0, 2).map((label) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="text-xs"
                            >
                              {label}
                            </Badge>
                          ))}
                          {story.labels.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{story.labels.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Statut */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[story.status]}`}
                    >
                      {story.status.replace("_", " ")}
                    </Badge>
                  </TableCell>

                  {/* Priorité */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${PRIORITY_COLORS[story.priority]}`}
                    >
                      {story.priority}
                    </Badge>
                  </TableCell>

                  {/* Story Points */}
                  <TableCell className="text-center">
                    {story.storyPoints ? (
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                        {story.storyPoints}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Heures estimées */}
                  <TableCell className="text-center">
                    {story.estimatedHours ? (
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {story.estimatedHours}h
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Tags */}
                  <TableCell>
                    {story.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {story.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {story.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{story.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Date de création */}
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(story.createdAt)}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* Visualiser */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(story)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                        title="Visualiser"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Modifier */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(story)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* Déplacer vers le haut */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveUp(story)}
                        disabled={isLoading || index === 0}
                        className="h-8 w-8 p-0"
                        title="Déplacer vers le haut"
                      >
                        {isLoading && operationInProgress?.includes("move") ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Déplacer vers le bas */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveDown(story)}
                        disabled={isLoading || index === stories.length - 1}
                        className="h-8 w-8 p-0"
                        title="Déplacer vers le bas"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>

                      {/* Supprimer */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(story)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Message si aucune story */}
      {stories.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune user story à afficher</p>
        </div>
      )}
    </Card>
  );
}
