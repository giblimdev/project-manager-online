// @/components/features/views/FeaturesViewBranch.tsx
// Vue arbre hiérarchique pour l'affichage des features
// Rôle : Affichage en structure arborescente avec relations parent-enfant et actions CRUD
// Composants utilisés : Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress de shadcn/ui
// Icônes Lucide : Edit, Trash2, ChevronUp, ChevronDown, ChevronRight, ExpandIcon, GitBranch, Target
// Props : Reçoit les features, état de chargement et callbacks pour les actions
// État : Gère l'expansion/collapse des nœuds de l'arbre avec Set d'IDs
// TypeScript : Mode strict avec interfaces complètes pour les features et nœuds d'arbre
// Navigation : Expansion/collapse des branches avec indentation visuelle
// Design : Interface moderne avec connecteurs visuels et structure hiérarchique

"use client";

import { JSX, useState } from "react";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronDown as ExpandIcon,
  GitBranch,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

interface TreeNode extends Feature {
  children: TreeNode[];
  level: number;
}

interface FeaturesViewTreeProps {
  features: Feature[];
  loading: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onOrderChange: (featureId: string, direction: "up" | "down") => void;
}

export function FeaturesViewTree({
  features,
  loading,
  onEdit,
  onDelete,
  onOrderChange,
}: FeaturesViewTreeProps): JSX.Element {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const buildTree = (features: Feature[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes
    features.forEach((feature) => {
      nodeMap.set(feature.id, {
        ...feature,
        children: [],
        level: 0,
      });
    });

    // Build hierarchy
    features.forEach((feature) => {
      const node = nodeMap.get(feature.id)!;
      if (feature.parentId && nodeMap.has(feature.parentId)) {
        const parent = nodeMap.get(feature.parentId)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        rootNodes.push(node);
      }
    });

    // Sort by order
    const sortByOrder = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .sort((a, b) => a.order - b.order)
        .map((node) => ({
          ...node,
          children: sortByOrder(node.children),
        }));
    };

    return sortByOrder(rootNodes);
  };

  const toggleExpanded = (nodeId: string): void => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

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

  const renderTreeNode = (
    node: TreeNode,
    index: number,
    siblings: TreeNode[]
  ): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const indentLevel = node.level * 24;

    return (
      <div key={node.id} className="space-y-1">
        <div
          className="group flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-transparent hover:border-primary/20"
          style={{ marginLeft: `${indentLevel}px` }}
        >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-primary/10"
            onClick={() => toggleExpanded(node.id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ExpandIcon className="h-4 w-4 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-primary" />
              )
            ) : (
              <div className="h-4 w-4 flex items-center justify-center">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              </div>
            )}
          </Button>

          {/* Tree connector lines */}
          {node.level > 0 && (
            <div className="flex items-center">
              <div className="w-4 h-px bg-border" />
              <GitBranch className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          {/* Feature content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium truncate text-sm sm:text-base">
                {node.name}
              </span>
              <div className="flex items-center gap-1">
                <Badge
                  variant={getPriorityColor(node.priority) as any}
                  className="text-xs"
                >
                  {node.priority}
                </Badge>
                <Badge
                  variant={getStatusColor(node.status) as any}
                  className="text-xs"
                >
                  {node.status}
                </Badge>
              </div>
            </div>

            {node.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2 hidden sm:block">
                {node.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1 min-w-0">
                <span className="hidden sm:inline">Progress:</span>
                <span className="sm:hidden">Prog:</span>
                <div className="flex items-center gap-1 min-w-0">
                  <Progress
                    value={node.progress}
                    className="w-12 sm:w-16 h-1"
                  />
                  <span className="text-xs">{node.progress}%</span>
                </div>
              </div>
              {node.storyPoints && (
                <div className="flex items-center gap-1">
                  <span className="hidden sm:inline">SP:</span>
                  <span className="sm:hidden">P:</span>
                  <span className="font-medium">{node.storyPoints}</span>
                </div>
              )}
              {hasChildren && (
                <div className="flex items-center gap-1 text-primary">
                  <span className="text-xs">
                    {node.children.length} sub-feature
                    {node.children.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Order controls - Hidden on mobile, shown on hover */}
          <div className="hidden sm:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10"
              onClick={() => onOrderChange(node.id, "up")}
              disabled={index === 0}
              title="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10"
              onClick={() => onOrderChange(node.id, "down")}
              disabled={index === siblings.length - 1}
              title="Move down"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10"
              onClick={() => onEdit(node)}
              title="Edit feature"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(node.id)}
              title="Delete feature"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-1 border-l border-muted ml-6 pl-2">
            {node.children.map((child, childIndex) =>
              renderTreeNode(child, childIndex, node.children)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse flex-1" />
                <div className="h-4 w-16 sm:w-20 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const treeData = buildTree(features);

  if (treeData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-12 text-center">
          <GitBranch className="h-12 sm:h-16 w-12 sm:w-16 mx-auto text-muted-foreground mb-4 sm:mb-6" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
            No Features Found
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Create features and organize them in a hierarchical structure to
            better manage your project.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <GitBranch className="h-5 w-5" />
          <span className="hidden sm:inline">Features Tree</span>
          <span className="sm:hidden">Tree</span>
          <span className="text-sm sm:text-base font-normal text-muted-foreground">
            ({features.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="space-y-1">
          {treeData.map((node, index) => renderTreeNode(node, index, treeData))}
        </div>

        {/* Mobile Order Controls Info */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground sm:hidden">
          <p className="flex items-center gap-1">
            <ChevronUp className="h-3 w-3" />
            <ChevronDown className="h-3 w-3" />
            Order controls available on desktop
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Export par défaut pour la compatibilité avec vos imports
export default FeaturesViewTree;
