// @/components/features/FeatureList.tsx

// Rôle : Composant d'affichage de la liste des features avec réorganisation
// Responsabilités : Affichage des features, actions individuelles, drag & drop, boutons ordre
// Composants utilisés : Card, Badge, Button, Loader2, AlertCircle, ArrowUp, ArrowDown (shadcn/ui)
// Libs externes : @dnd-kit (pour drag & drop), sonner (notifications)
// Hooks utilisés : useState, useCallback (pour drag & drop)
// Types utilisés : SimpleFeature, Priority, ReorderRequest

import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Hash,
} from "lucide-react";
import { Priority } from "@/lib/generated/prisma/client";
import { toast } from "sonner";
import type { SimpleFeature, ReorderRequest } from "@/types/feature";

interface FeatureListProps {
  features: SimpleFeature[];
  isLoading: boolean;
  error: string | null;
  onCreateFeature: () => void;
  onEditFeature: (feature: SimpleFeature) => void;
  onDeleteFeature: (feature: SimpleFeature) => void;
  onMoveUp: (featureId: string) => Promise<boolean>;
  onMoveDown: (featureId: string) => Promise<boolean>;
  onReorderFeatures: (reorderData: ReorderRequest[]) => Promise<boolean>;
  className?: string;
}

const priorityLabels: Record<Priority, string> = {
  [Priority.CRITICAL]: "Critique",
  [Priority.HIGH]: "Élevée",
  [Priority.MEDIUM]: "Moyenne",
  [Priority.LOW]: "Faible",
};

const priorityColors: Record<Priority, string> = {
  [Priority.CRITICAL]: "destructive",
  [Priority.HIGH]: "orange",
  [Priority.MEDIUM]: "blue",
  [Priority.LOW]: "secondary",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

const formatDate = (date: Date | null): string => {
  return date ? new Date(date).toLocaleDateString("fr-FR") : "Non définie";
};

const formatMetric = (value: number | null, suffix: string = ""): string => {
  return value !== null ? `${value}${suffix}` : "Non défini";
};

export const FeatureList: React.FC<FeatureListProps> = ({
  features,
  isLoading,
  error,
  onCreateFeature,
  onEditFeature,
  onDeleteFeature,
  onMoveUp,
  onMoveDown,
  onReorderFeatures,
  className = "",
}) => {
  const [draggedFeature, setDraggedFeature] = useState<SimpleFeature | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);

  // ✅ Handlers pour la réorganisation avec boutons
  const handleMoveUp = useCallback(
    async (feature: SimpleFeature, index: number) => {
      if (index === 0) return;

      const success = await onMoveUp(feature.id);
      if (!success) {
        toast.error("Impossible de déplacer cette feature vers le haut");
      }
    },
    [onMoveUp]
  );

  const handleMoveDown = useCallback(
    async (feature: SimpleFeature, index: number) => {
      if (index === features.length - 1) return;

      const success = await onMoveDown(feature.id);
      if (!success) {
        toast.error("Impossible de déplacer cette feature vers le bas");
      }
    },
    [onMoveDown, features.length]
  );

  // ✅ Handlers pour le drag & drop
  const handleDragStart = useCallback(
    (e: React.DragEvent, feature: SimpleFeature) => {
      setDraggedFeature(feature);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", feature.id);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(-1);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();

      if (!draggedFeature) return;

      const sourceIndex = features.findIndex((f) => f.id === draggedFeature.id);
      if (sourceIndex === targetIndex) {
        setDraggedFeature(null);
        setDragOverIndex(-1);
        return;
      }

      // Calculer le nouvel ordre
      let newOrder: number;

      if (targetIndex === 0) {
        // Déplacer en première position
        newOrder = features[0].order - 1;
      } else if (targetIndex === features.length) {
        // Déplacer en dernière position
        newOrder = features[features.length - 1].order + 1;
      } else {
        // Insérer entre deux features
        const beforeFeature = features[targetIndex - 1];
        const afterFeature = features[targetIndex];
        newOrder = Math.floor((beforeFeature.order + afterFeature.order) / 2);
      }

      const reorderData: ReorderRequest[] = [
        {
          featureId: draggedFeature.id,
          newOrder: newOrder,
        },
      ];

      const success = await onReorderFeatures(reorderData);

      if (!success) {
        toast.error("Erreur lors de la réorganisation");
      }

      setDraggedFeature(null);
      setDragOverIndex(-1);
    },
    [draggedFeature, features, onReorderFeatures]
  );

  // État de chargement
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-muted-foreground">
              Chargement des features...
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État vide
  if (features.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Aucune Feature
                </h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Commencez par créer votre première feature pour cet epic.
                </p>
              </div>
              <Button onClick={onCreateFeature} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Créer une Feature
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Liste des features avec contrôles de réorganisation
  return (
    <div className={`space-y-4 ${className}`}>
      {features.map((feature, index) => (
        <div
          key={feature.id}
          className={`
            transition-all duration-200 
            ${dragOverIndex === index ? "scale-105 shadow-lg" : ""}
          `}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        >
          <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                {/* ✅ Contrôles de drag et ordre */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, feature)}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <Hash className="h-3 w-3 mr-1" />
                      {feature.order}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-50"
                      onClick={() => handleMoveUp(feature, index)}
                      disabled={index === 0}
                      title="Déplacer vers le haut"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-blue-50"
                      onClick={() => handleMoveDown(feature, index)}
                      disabled={index === features.length - 1}
                      title="Déplacer vers le bas"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Separator
                  orientation="vertical"
                  className="h-16 hidden lg:block"
                />

                {/* Contenu de la feature */}
                <div className="flex-1 min-w-0 lg:flex lg:items-start lg:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900 truncate">
                      {feature.name}
                    </CardTitle>
                    {feature.description && (
                      <CardDescription className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {feature.description}
                      </CardDescription>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">
                    <Badge
                      variant={priorityColors[feature.priority] as any}
                      className="whitespace-nowrap"
                    >
                      {priorityLabels[feature.priority]}
                    </Badge>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {statusLabels[feature.status] || feature.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Métriques principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Story Points
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMetric(feature.storyPoints)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Valeur Business
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMetric(feature.businessValue, "/100")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Risque Technique
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMetric(feature.technicalRisk, "/100")}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Effort
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatMetric(feature.effort, "h")}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date de début
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatDate(feature.startDate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Date de fin
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatDate(feature.endDate)}
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Progression
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {feature.progress}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(Math.max(feature.progress, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Critères d'acceptation */}
              {feature.acceptanceCriteria && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Critères d'acceptation
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {feature.acceptanceCriteria}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditFeature(feature)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteFeature(feature)}
                  className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      {/* ✅ Zone de drop en fin de liste */}
      <div
        className={`
          h-8 border-2 border-dashed border-gray-300 rounded-lg
          transition-all duration-200
          ${
            dragOverIndex === features.length
              ? "border-blue-500 bg-blue-50"
              : "hover:border-gray-400"
          }
        `}
        onDragOver={(e) => handleDragOver(e, features.length)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, features.length)}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-gray-500">
            Déposer ici pour placer en dernière position
          </p>
        </div>
      </div>
    </div> 
  );
};