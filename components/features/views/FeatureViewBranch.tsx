// @/components/features/views/FeatureViewsBranch.tsx

// Rôle : Composant d'affichage hiérarchique en arbre pour les features
// Responsabilités : Affichage arborescent, navigation hiérarchie, expand/collapse, drag & drop
// Composants utilisés : Card, Badge, Button, Collapsible (shadcn/ui)
// Libs externes : lucide-react (icônes)
// Hooks utilisés : useState, useCallback (pour état d'expansion)
// Types utilisés : FeatureSimple, Priority, FeatureDisplayProps
// Utilisé par : page features, mode arbre

import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Plus,
  FileText,
  Folder,
  FolderOpen,
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

interface FeatureTreeViewProps extends FeatureDisplayProps {
  featuresTree: FeatureSimple[];
}

interface FeatureNodeProps {
  feature: FeatureSimple & { children?: FeatureSimple[] };
  level: number;
  onEdit: (feature: FeatureSimple) => void;
  onDelete: (feature: FeatureSimple) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

// Composant pour un nœud individuel de l'arbre
const FeatureNode: React.FC<FeatureNodeProps> = ({
  feature,
  level,
  onEdit,
  onDelete,
  expandedNodes,
  onToggleExpand,
}) => {
  const hasChildren = feature.children && feature.children.length > 0;
  const isExpanded = expandedNodes.has(feature.id);
  const indentWidth = level * 24; // 24px par niveau

  return (
    <div className="relative">
      {/* Ligne de connexion pour les enfants */}
      {level > 0 && (
        <div
          className="absolute left-3 top-0 w-px h-full bg-gray-200"
          style={{ left: `${indentWidth - 12}px` }}
        />
      )}

      <div
        className="relative flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg group"
        style={{ paddingLeft: `${indentWidth + 12}px` }}
      >
        {/* Indicateur de branche */}
        {level > 0 && (
          <div
            className="absolute w-3 h-px bg-gray-200"
            style={{ left: `${indentWidth - 12}px` }}
          />
        )}

        {/* Bouton d'expansion/collapse */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onToggleExpand(feature.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6 h-6" />
        )}

        {/* Icône de type */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
        </div>

        {/* Contenu du nœud */}
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {feature.name}
              </h4>
              <Badge
                variant={priorityColors[feature.priority] as any}
                className="text-xs"
              >
                {priorityLabels[feature.priority]}
              </Badge>
            </div>

            {feature.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {feature.description}
              </p>
            )}
          </div>

          {/* Progression et actions */}
          <div className="flex items-center gap-2">
            {/* Mini barre de progression */}
            <div className="flex items-center gap-1 w-16">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(Math.max(feature.progress, 0), 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 min-w-[2rem]">
                {feature.progress}%
              </span>
            </div>

            {/* Actions (visibles au hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(feature)}
                className="h-6 w-6 p-0"
                title="Modifier"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(feature)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Supprimer"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enfants */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {feature.children!.map((child) => (
            <FeatureNode
              key={child.id}
              feature={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FeatureTreeView: React.FC<FeatureTreeViewProps> = ({
  featuresTree,
  isLoading,
  error,
  onCreateFeature,
  onEditFeature,
  onDeleteFeature,
  className = "",
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const allNodeIds = new Set<string>();

    const collectIds = (features: FeatureSimple[]) => {
      features.forEach((feature) => {
        if (feature.children && feature.children.length > 0) {
          allNodeIds.add(feature.id);
          collectIds(feature.children);
        }
      });
    };

    collectIds(featuresTree);
    setExpandedNodes(allNodeIds);
  }, [featuresTree]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

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
  if (featuresTree.length === 0) {
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

  // Vue en arbre
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Contrôles d'expansion */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Vue hiérarchique
              </span>
              <Badge variant="outline" className="text-xs">
                {featuresTree.length} feature
                {featuresTree.length > 1 ? "s" : ""} racine
                {featuresTree.length > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandAll}
                className="text-blue-700 hover:text-blue-800"
              >
                Tout déplier
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapseAll}
                className="text-blue-700 hover:text-blue-800"
              >
                Tout replier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arbre des features */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {featuresTree.map((feature) => (
              <FeatureNode
                key={feature.id}
                feature={feature}
                level={0}
                onEdit={onEditFeature}
                onDelete={onDeleteFeature}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
