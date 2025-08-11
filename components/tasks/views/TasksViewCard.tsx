// 📄 /components/tasks/views/TasksViewCard.tsx
// 🎯 Rôle : Template de vue carte
// 📦 Responsabilités : Définit uniquement l'apparence d'une carte - Composant de présentation pure (pas de logique métier)
// 🔧 Composants utilisés : Card, Badge, Button de shadcn/ui, icônes Lucide React

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Target,
  TrendingUp,
} from "lucide-react";

// 🔧 Interface pour les props reçues (même que TasksViewList)
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

interface TasksViewCardProps {
  stories: UserStory[];
  onView: (story: UserStory) => void;
  onEdit: (story: UserStory) => void;
  onDelete: (story: UserStory) => void;
  onMoveUp: (story: UserStory) => void;
  onMoveDown: (story: UserStory) => void;
  operationInProgress: string | null;
}

// 🎨 Configuration des couleurs (même que TasksViewList)
const PRIORITY_COLORS = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_COLORS = {
  TODO: "bg-gray-100 text-gray-800 border-gray-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-300",
  CODE_REVIEW: "bg-purple-100 text-purple-800 border-purple-300",
  TESTING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  DONE: "bg-green-100 text-green-800 border-green-300",
  BLOCKED: "bg-red-100 text-red-800 border-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function TasksViewCard({
  stories,
  onView,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  operationInProgress,
}: TasksViewCardProps) {
  // 🎯 Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // 🎯 Fonction pour tronquer le texte
  const truncateText = (text: string | undefined, maxLength: number = 120) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <div className="space-y-4">
      {/* Grille responsive de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stories.map((story, index) => {
          const isLoading = operationInProgress?.includes(story.id);

          return (
            <Card
              key={story.id}
              className={`
                group transition-all duration-200 hover:shadow-md hover:scale-105
                ${isLoading ? "opacity-60" : ""}
                ${story.status === "DONE" ? "bg-green-50/50" : ""}
                ${story.status === "BLOCKED" ? "bg-red-50/50" : ""}
              `}
            >
              {/* En-tête de la carte */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium text-sm leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2"
                      onClick={() => onView(story)}
                      title={story.title}
                    >
                      {story.title}
                    </h3>
                  </div>

                  {/* Numéro de position */}
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                {story.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                    {truncateText(story.description, 100)}
                  </p>
                )}
              </CardHeader>

              {/* Contenu principal */}
              <CardContent className="py-3 space-y-3">
                {/* Statut et Priorité */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${STATUS_COLORS[story.status]}`}
                  >
                    {story.status.replace("_", " ")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${PRIORITY_COLORS[story.priority]}`}
                  >
                    {story.priority}
                  </Badge>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Story Points */}
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Points:</span>
                    <span className="font-medium">
                      {story.storyPoints || "—"}
                    </span>
                  </div>

                  {/* Heures estimées */}
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Heures:</span>
                    <span className="font-medium">
                      {story.estimatedHours ? `${story.estimatedHours}h` : "—"}
                    </span>
                  </div>

                  {/* Valeur business */}
                  {story.businessValue && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Valeur:</span>
                      <span className="font-medium">
                        {story.businessValue}/10
                      </span>
                    </div>
                  )}

                  {/* Date de création */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Créé:</span>
                    <span className="font-medium">
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {story.tags.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {story.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {story.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{story.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Labels */}
                {story.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {story.labels.slice(0, 2).map((label) => (
                      <Badge key={label} variant="outline" className="text-xs">
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
              </CardContent>

              <Separator />

              {/* Actions */}
              <CardFooter className="pt-3">
                <div className="flex items-center justify-between w-full">
                  {/* Actions principales */}
                  <div className="flex items-center gap-1">
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

                  {/* Actions de déplacement */}
                  <div className="flex items-center gap-1">
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
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Message si aucune story */}
      {stories.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Star className="h-16 w-16 opacity-50" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Aucune user story à afficher
              </h3>
              <p className="text-sm">
                Les cartes apparaîtront ici une fois créées
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
