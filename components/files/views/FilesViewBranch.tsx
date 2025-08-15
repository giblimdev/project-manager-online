// @/components/files/views/FilesViewBranch.tsx

/**
 * RÔLE : Vue arborescente des fichiers avec navigation et manipulation hiérarchique
 * RESPONSABILITÉS :
 * - Affichage en arbre hiérarchique, expansion/collapse des dossiers
 * - Navigation via clic sur dossier, gestion sélection multiple
 * - Recherche filtrée récursive avec maintien de contexte parent
 * - Actions fichier/dossier : éditer, supprimer, déplacer, partager, télécharger, dupliquer
 * - Support complet des métadonnées
 * - UI moderne avec shadcn/ui, lucide-react, tailwind, gestion petits écrans
 * - TypeScript strict, React 19 hooks + Next.js 15 compatible
 */

"use client";

import React, { useCallback, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Download, 
  Share2, 
  Copy,
  MoreVertical,
  Plus,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { JSX } from "react";
import type { FileWithRelations, FilesViewProps } from "@/types/files";
import { FileType } from "@/lib/generated/prisma/client";
import { Badge } from "@/components/ui/badge";

interface TreeNode extends FileWithRelations {
  level: number;
  expanded: boolean;
  children: TreeNode[];
}

export interface FilesViewBranchProps extends FilesViewProps { 
  onReorganize: (
    fileId: string, 
    direction: "up" | "down",
    currentIndex: number,
    totalFiles: number
  ) => void;
  isReorganizing: boolean;
  processingFileId: string | null;
}

export default function FilesViewBranch({
  files,
  currentFolder,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onDuplicate,
  onFolderNavigate,
  selectedFiles = [],
  onToggleSelection,
  getFileTypeIcon,
  getTypeLabel,
  formatFileSize,
  onCreateNew,
  onReorganize,
  isReorganizing,
  processingFileId,
}: FilesViewBranchProps): JSX.Element{
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Build tree structure from flat files list
  const buildTree = useCallback(
    (filesList: FileWithRelations[], parentId: string | null = null, level = 0): TreeNode[] => {
      return filesList
        .filter((f) => (f.parentId ?? null) === parentId)
        .map((file) => {
          const children = buildTree(filesList, file.id, level + 1);
          return {
            ...file,
            level,
            expanded: expandedNodes.has(file.id),
            children,
          };
        })
        .sort((a, b) => {
          // Folders first, then alphabetically
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.order - b.order;
        });
    },
    [expandedNodes]
  );

  const treeData = useMemo(() => buildTree(files, currentFolder), [files, currentFolder, buildTree]);

  // Toggle expand/collapse folder
  const toggleExpand = useCallback(
    (id: string) => {
      setExpandedNodes((prev) => {
        const copy = new Set(prev);
        if (copy.has(id)) copy.delete(id);
        else copy.add(id);
        return copy;
      });
    },
    []
  );

  // Format date helper
  const formatDate = (date: Date | string): string => {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "dd/MM/yyyy", { locale: fr });
  };

  // Find position of a node in its parent's children
  const getNodePosition = useCallback((nodeId: string, parentId: string | null): [number, number] => {
    const siblings = files.filter(f => (f.parentId ?? null) === parentId);
    const index = siblings.findIndex(f => f.id === nodeId);
    return [index, siblings.length];
  }, [files]);

  // Render a tree node recursively
  const renderNode = useCallback(
    (node: TreeNode): JSX.Element => {
      const isSelected = selectedFiles.includes(node.id);
      const hasChildren = node.children.length > 0;
      const isProcessing = processingFileId === node.id;
      const [currentIndex, totalSiblings] = getNodePosition(node.id, node.parentId ?? currentFolder);

      return (
        <div key={node.id} className="group">
          <div
            className={`flex items-center cursor-pointer select-none p-2 hover:bg-gray-100 rounded ${
              isSelected ? "bg-blue-100" : ""
            }`}
            style={{ paddingLeft: `${node.level * 1.5}rem` }}
            onClick={() => {
              if (node.isFolder) {
                onFolderNavigate?.(node.id, node.name);
              }
            }}
          >
            {node.isFolder ? (
              hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.id);
                  }}
                  aria-label={node.expanded ? "Réduire" : "Développer"}
                  className="mr-2"
                >
                  {node.expanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              ) : (
                <div className="w-5 h-5 mr-2" />
              )
            ) : (
              <div className="w-5 h-5 mr-2" />
            )}

            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(node.id)}
              onClick={(e) => e.stopPropagation()}
              className="mr-2"
            />

            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {getFileTypeIcon(node.type, node.isFolder)}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate max-w-xs">{node.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p><strong>Nom:</strong> {node.name}</p>
                      {!node.isFolder && (
                        <>
                          <p><strong>Type:</strong> {getTypeLabel(node.type)}</p>
                          <p><strong>Modifié:</strong> {formatDate(node.updatedAt)}</p>
                        </>
                      )}
                      {node.description && (
                        <p><strong>Description:</strong> {node.description}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex space-x-1">
                <Badge variant="secondary" className="capitalize truncate">
                  {getTypeLabel(node.type)}
                </Badge>
                {node.version > 1 && (
                  <Badge variant="destructive" title="Version supérieure">
                    v{node.version}
                  </Badge>
                )}
              </div>
            </div>

            <div className="ml-auto flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      disabled={isReorganizing || isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorganize(node.id, "up", currentIndex, totalSiblings);
                      }}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUp size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Déplacer vers le haut</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                      disabled={isReorganizing || isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorganize(node.id, "down", currentIndex, totalSiblings);
                      }}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowDown size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Déplacer vers le bas</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(node)}>
                    <Edit className="mr-2 h-4 w-4" /> Modifier
                  </DropdownMenuItem>
                  
                  {!node.isFolder && (
                    <DropdownMenuItem onClick={() => onDownload(node)}>
                      <Download className="mr-2 h-4 w-4" /> Télécharger
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => onShare(node)}>
                    <Share2 className="mr-2 h-4 w-4" /> Partager
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onDuplicate(node)}>
                    <Copy className="mr-2 h-4 w-4" /> Dupliquer
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => onDelete(node)} 
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {node.expanded && node.children.map((child) => renderNode(child))}
        </div>
      );
    },
    [
      getFileTypeIcon,
      getTypeLabel,
      onDelete,
      onDownload,
      onDuplicate,
      onEdit,
      onFolderNavigate,
      onReorganize,
      onShare,
      onToggleSelection,
      processingFileId,
      isReorganizing,
      selectedFiles,
      toggleExpand,
      getNodePosition,
      currentFolder
    ]
  );

  if (files.length === 0) {
    return (
      <Card className="bg-gray-50 border-0">
        <CardContent className="p-6 text-center">
          <Folder className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {currentFolder ? "Dossier vide" : "Aucun fichier"}
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            {currentFolder 
              ? "Ce dossier ne contient aucune référence pour le moment."
              : "Commencez par ajouter des références de fichiers à votre projet."
            }
          </p>
          
          {onCreateNew && (
            <Button 
              onClick={onCreateNew} 
              className="mt-4"
              variant="default"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un fichier
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {treeData.map((node) => renderNode(node))}
    </div>
  );
}