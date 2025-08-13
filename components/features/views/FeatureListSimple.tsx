// @/components/features/views/FeatureListSimple.tsx

// Rôle : Composant d'affichage simple en liste pour les features
// Responsabilités : Affichage compact liste, titre et description uniquement, actions basiques
// Composants utilisés : Card, Badge, Button, Loader2 (shadcn/ui)
// Hooks utilisés : aucun (composant présentation pur)
// Types utilisés : FeatureSimple, Priority, FeatureDisplayProps
// Utilisé par : page features, mode liste

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Priority } from "@/lib/generated/prisma/client";
import { FeatureSimple, FeatureDisplayProps } from "@/types/feature";

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

interface FeatureListSimpleProps extends FeatureDisplayProps {
  featuresSimple: FeatureSimple[];
}

export const FeatureListSimple: React.FC<FeatureListSimpleProps> = ({
  featuresSimple,
  isLoading,
  error,
  onCreateFeature,
  onEditFeature,
  onDeleteFeature,
  onMoveUp,
  onMoveDown,
  className = "",
}) => {
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
  if (featuresSimple.length === 0) {
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

  // Liste des features en mode simple
  return (
    <div className={`space-y-3 ${className}`}>
      {featuresSimple.map((feature, index) => (
        <Card
          key={feature.id}
          className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              {/* Contrôles de réorganisation */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-50"
                    onClick={() => onMoveUp && onMoveUp(feature.id)}
                    disabled={index === 0}
                    title="Déplacer vers le haut"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-50"
                    onClick={() => onMoveDown && onMoveDown(feature.id)}
                    disabled={index === featuresSimple.length - 1}
                    title="Déplacer vers le bas"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Contenu principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900 truncate">
                      {feature.name}
                    </CardTitle>
                    {feature.description && (
                      <CardDescription className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {feature.description}
                      </CardDescription>
                    )}
                  </div>

                  {/* Badges et progression */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={priorityColors[feature.priority] as any}
                        className="whitespace-nowrap text-xs"
                      >
                        {priorityLabels[feature.priority]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap text-xs"
                      >
                        {statusLabels[feature.status] || feature.status}
                      </Badge>
                    </div>

                    {/* Mini barre de progression */}
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              Math.max(feature.progress, 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 min-w-[3rem]">
                        {feature.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditFeature(feature)}
                  className="h-8 w-8 p-0"
                  title="Modifier"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFeature(feature)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
