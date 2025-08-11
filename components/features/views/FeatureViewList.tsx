// @/components/features/views/FeatureViewList.tsx
// Vue liste pour l'affichage des features
// Rôle : Affichage tabulaire détaillé des features avec actions CRUD et réorganisation
// Composants : Table, Button, Badge, Progress de shadcn/ui pour interface moderne
// Icônes Lucide : Edit, Trash2, ChevronUp, ChevronDown, Calendar, Target, TrendingUp
// Props : Reçoit les features, état de chargement et callbacks pour les actions
// TypeScript : Mode strict avec interfaces complètes pour les features
// Responsive : Design adaptatif avec overflow horizontal pour mobile

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Feature {
  id: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  position: number;
  order: number;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FeaturesViewListProps {
  features: Feature[];
  loading: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onOrderChange: (featureId: string, direction: "up" | "down") => void;
}

export function FeaturesViewList({
  features,
  loading,
  onEdit,
  onDelete,
  onOrderChange,
}: FeaturesViewListProps): JSX.Element {
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "CRITICAL":
        return "destructive";
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

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (features.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Features Found</h3>
          <p className="text-muted-foreground">
            Start by creating your first feature to organize your project
            development.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Features ({features.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="min-w-[150px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Priority</TableHead>
                <TableHead className="min-w-[100px]">Progress</TableHead>
                <TableHead className="min-w-[80px]">Points</TableHead>
                <TableHead className="min-w-[100px]">Dates</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature, index) => (
                <TableRow key={feature.id} className="group">
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onOrderChange(feature.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onOrderChange(feature.id, "down")}
                        disabled={index === features.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{feature.name}</div>
                      {feature.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={getStatusColor(feature.status) as any}>
                      {feature.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={getPriorityColor(feature.priority) as any}>
                      {feature.priority}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={feature.progress} className="w-16" />
                      <span className="text-xs text-muted-foreground">
                        {feature.progress}%
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {feature.storyPoints && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-sm">{feature.storyPoints}</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-xs">
                      {feature.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(feature.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {feature.endDate && (
                        <div className="text-muted-foreground">
                          → {new Date(feature.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(feature)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDelete(feature.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Export par défaut pour la compatibilité
export default FeaturesViewList;
