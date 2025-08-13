// @/components/features/views/FeaturesViewCard.tsx
// Vue carte pour l'affichage des features en grille responsive
// Rôle : Affichage des features sous forme de cartes avec informations visuelles et actions CRUD
// Composants utilisés : Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress de shadcn/ui
// Icônes Lucide : Edit, Trash2, ChevronUp, ChevronDown, Calendar, Target, TrendingUp, Clock
// Props : Reçoit les features, état de chargement et callbacks pour les actions
// Layout : Grid responsive avec cartes détaillées et hover effects
// TypeScript : Mode strict avec interfaces complètes pour les features
// Design : Interface moderne avec badges colorés, barres de progression et métriques visuelles

"use client";

import { JSX } from "react";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calendar,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ✅ CORRIGÉ: Types standardisés pour être cohérents avec les composants parents.
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Status = "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";

interface Feature {
  id: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: Status; // Type Status strict
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null; // Type Date
  endDate: Date | null; // Type Date
  progress: number;
  position: number;
  order: number;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  createdAt: Date; // Type Date
  updatedAt: Date; // Type Date
}

interface FeaturesViewCardProps {
  features: Feature[];
  loading: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onOrderChange: (featureId: string, direction: "up" | "down") => void;
}

export function FeaturesViewCard({
  features,
  loading,
  onEdit,
  onDelete,
  onOrderChange,
}: FeaturesViewCardProps): JSX.Element {
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: Status): string => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "COMPLETED":
        return "success";
      case "ON_HOLD":
        return "secondary";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityIcon = (priority: Priority): JSX.Element => {
    switch (priority) {
      case "CRITICAL":
        return (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        );
      case "HIGH":
        return <div className="w-2 h-2 bg-orange-500 rounded-full" />;
      case "MEDIUM":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case "LOW":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-80 animate-pulse">
            <CardHeader className="pb-3">
              <div className="space-y-2">
                <div className="h-5 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-20 bg-muted rounded" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="flex justify-between">
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-8 sm:p-12 text-center">
          <Target className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h3 className="text-xl font-semibold mb-3">No Features Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start building your product by creating features that will drive
            your project forward.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {features.map((feature, index) => (
        <Card
          key={feature.id}
          className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 border-border/50 hover:border-primary/20 bg-card/50 hover:bg-card/80"
        >
          <CardHeader className="pb-3 relative">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getPriorityIcon(feature.priority)}
                <CardTitle className="text-base sm:text-lg line-clamp-2 flex-1">
                  {feature.name}
                </CardTitle>
              </div>

              <div className="hidden sm:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={() => onOrderChange(feature.id, "up")}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-primary/10"
                  onClick={() => onOrderChange(feature.id, "down")}
                  disabled={index === features.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={getPriorityColor(feature.priority) as any}
                className="text-xs font-medium"
              >
                {feature.priority}
              </Badge>
              <Badge
                variant={getStatusColor(feature.status) as any}
                className="text-xs font-medium"
              >
                {feature.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {feature.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {feature.description}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  Progress
                </span>
                <span className="font-semibold text-primary">
                  {feature.progress}%
                </span>
              </div>
              <Progress value={feature.progress} className="h-2 bg-muted/50" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {feature.storyPoints != null && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <div className="min-w-0 flex-1">
                    <span className="text-muted-foreground text-xs block">
                      Story Points
                    </span>
                    <span className="font-semibold">{feature.storyPoints}</span>
                  </div>
                </div>
              )}

              {feature.businessValue != null && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                  <Target className="h-3 w-3 text-green-600" />
                  <div className="min-w-0 flex-1">
                    <span className="text-muted-foreground text-xs block">
                      Business Value
                    </span>
                    <span className="font-semibold">
                      {feature.businessValue}/10
                    </span>
                  </div>
                </div>
              )}
            </div>

            {(feature.startDate || feature.endDate) && (
              <div className="space-y-2 p-2 bg-muted/20 rounded-md">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Timeline
                </div>
                <div className="space-y-1 text-xs">
                  {/* ✅ CORRIGÉ: Utilisation directe de l'objet Date */}
                  {feature.startDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-green-600" />
                      <span className="text-muted-foreground">Start:</span>
                      <span className="font-medium">
                        {feature.startDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {feature.endDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-red-600" />
                      <span className="text-muted-foreground">End:</span>
                      <span className="font-medium">
                        {feature.endDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                Updated {feature.updatedAt.toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  onClick={() => onEdit(feature)}
                  title="Edit feature"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(feature.id)}
                  title="Delete feature"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default FeaturesViewCard;
