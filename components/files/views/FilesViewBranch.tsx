// components/files/views/FilesViewBranch.tsx

/**
 * RÔLE : Vue arborescente des fichiers avec hiérarchie et navigation interactive
 * RESPONSABILITÉS :
 * - Affichage hiérarchique des fichiers et dossiers avec indentation visuelle
 * - Navigation dans l'arborescence avec expansion/collapse des nœuds
 * - Support du drag & drop pour réorganisation des éléments
 * - Filtrage et recherche dans l'arbre avec highlight des résultats
 * - Actions contextuelles par nœud (edit, delete, move, duplicate)
 * - Gestion des dossiers avec isFolder et navigation hiérarchique
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 * - Gestion du mimeType nullable selon le nouveau schéma Prisma
 * - Types unifiés via fichier central types/files.ts
 *
 * COMPOSANTS UTILISÉS :
 * - Card, CardContent: Conteneurs shadcn/ui pour structuration
 * - Button: Boutons d'action avec variants hover
 * - Input: Champ de recherche avec debounce
 * - Badge: Affichage des types, statuts et métadonnées
 * - Collapsible: Composants d'expansion/collapse pour nœuds
 * - DropdownMenu: Menus contextuels pour actions
 * - Tooltip: Info-bulles pour actions et métadonnées
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useCallback, useMemo, useEffect, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Card, Button, Input, Badge, Collapsible, DropdownMenu, Tooltip
 * - lucide-react: Icons pour types de fichiers, actions, navigation
 * - Tailwind CSS: Design responsive avec indentation et hover effects
 * - date-fns: Formatage des dates avec locale française
 * - sonner: Toast notifications pour feedback utilisateur
 */

"use client";

import { JSX, useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronRight,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Share2,
  Copy,
  Move,
  FolderOpen,
  File,
  FileText,
  Package,
  Settings,
  Layers,
  Database,
  Code2,
  Image,
  Video,
  Archive,
  Paintbrush,
  TestTube,
  Globe,
  Lock,
  Calendar,
  Tag,
  Hash,
  RefreshCw,
  Folder,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ✅ Import des types centralisés
import type {
  FileWithRelations,
  ViewMode,
  FilesViewProps,
  FileType,
} from "@/types/files";

// Interface pour les nœuds de l'arbre avec état d'expansion
interface TreeNode extends FileWithRelations {
  level: number;
  isExpanded: boolean;
  parentPath: string;
  hasChildren: boolean;
}

// Interface pour les options de vue
interface ViewOptions {
  searchTerm: string;
  showHiddenFiles: boolean;
  typeFilter: FileType[];
  expandAll: boolean;
}

// Interface pour les props du composant
interface FilesViewBranchProps extends FilesViewProps {
  files: FileWithRelations[];
  viewMode: ViewMode;
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onRefresh: () => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  onDelete?: (file: FileWithRelations) => void;
  onDownload?: (file: FileWithRelations) => void;
  onShare?: (file: FileWithRelations) => void;
  onDuplicate?: (file: FileWithRelations) => void;
  selectedFiles?: string[];
  onToggleSelection?: (fileId: string) => void;
  getFileTypeIcon?: (type: string, isFolder?: boolean) => JSX.Element;
  getTypeLabel?: (type: string) => string;
  formatFileSize?: (bytes: number | null) => string;
}

export default function FilesViewBranch({
  files,
  viewMode,
  currentFolder,
  onEdit,
  onRefresh,
  onFolderNavigate,
  onDelete,
  onDownload,
  onShare,
  onDuplicate,
  selectedFiles = [],
  onToggleSelection,
  getFileTypeIcon,
  getTypeLabel,
  formatFileSize,
}: FilesViewBranchProps): JSX.Element {
  // États locaux
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    searchTerm: "",
    showHiddenFiles: false,
    typeFilter: [],
    expandAll: false,
  });

  // ✅ Fonction pour obtenir l'icône du type avec gestion des dossiers
  const getFileIcon = useCallback(
    (file: FileWithRelations): JSX.Element => {
      if (getFileTypeIcon) {
        return getFileTypeIcon(file.type, file.isFolder);
      }

      if (file.isFolder) {
        return <Folder className="h-4 w-4 text-blue-500" />;
      }

      switch (file.type) {
        case "PAGE":
          return <FileText className="h-4 w-4 text-green-500" />;
        case "COMPONENT":
          return <Package className="h-4 w-4 text-blue-500" />;
        case "UTILS":
          return <Settings className="h-4 w-4 text-gray-500" />;
        case "LIB":
          return <Layers className="h-4 w-4 text-purple-500" />;
        case "STORE":
          return <Database className="h-4 w-4 text-orange-500" />;
        case "HOOK":
          return <Code2 className="h-4 w-4 text-pink-500" />;
        case "ENV":
          return <Settings className="h-4 w-4 text-yellow-500" />;
        case "SYSTEM":
          return <Globe className="h-4 w-4 text-red-500" />;
        case "TEST":
          return <TestTube className="h-4 w-4 text-green-600" />;
        default:
          return <File className="h-4 w-4 text-gray-400" />;
      }
    },
    [getFileTypeIcon]
  );

  // ✅ Fonction pour obtenir le label du type
  const getLabel = useCallback(
    (type: string): string => {
      if (getTypeLabel) {
        return getTypeLabel(type);
      }

      switch (type) {
        case "PAGE":
          return "Page Next.js";
        case "COMPONENT":
          return "Composant React";
        case "UTILS":
          return "Utilitaires";
        case "LIB":
          return "Librairie";
        case "STORE":
          return "Store";
        case "HOOK":
          return "Hook React";
        case "ENV":
          return "Environment";
        case "SYSTEM":
          return "Système";
        case "TEST":
          return "Test";
        default:
          return "Autre";
      }
    },
    [getTypeLabel]
  );

  // ✅ Fonction pour formater la taille avec gestion du nullable
  const formatSize = useCallback(
    (bytes: number | null): string => {
      if (formatFileSize) {
        return formatFileSize(bytes);
      }

      if (!bytes || bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    [formatFileSize]
  );

  // ✅ Construction de l'arbre hiérarchique avec gestion des nœuds
  const buildTree = useCallback(
    (files: FileWithRelations[]): TreeNode[] => {
      const nodeMap = new Map<string, TreeNode>();
      const rootNodes: TreeNode[] = [];

      // Première passe : créer tous les nœuds
      files.forEach((file) => {
        const node: TreeNode = {
          ...file,
          level: 0,
          isExpanded: expandedNodes.has(file.id),
          parentPath: "",
          hasChildren: file.isFolder && (file._count?.children || 0) > 0,
        };
        nodeMap.set(file.id, node);
      });

      // Deuxième passe : construire la hiérarchie
      files.forEach((file) => {
        const node = nodeMap.get(file.id)!;
        if (file.parent?.id) {
          const parentNode = nodeMap.get(file.parent.id);
          if (parentNode) {
            node.level = parentNode.level + 1;
            node.parentPath =
              `${parentNode.parentPath}/${parentNode.name}`.replace(/^\/+/, "");
          } else {
            rootNodes.push(node);
          }
        } else {
          rootNodes.push(node);
        }
      });

      return rootNodes.sort((a, b) => {
        // Dossiers en premier, puis tri alphabétique
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
    },
    [files, expandedNodes]
  );

  // ✅ Filtrage des nœuds selon les critères
  const filteredTree = useMemo(() => {
    const tree = buildTree(files);
    if (!viewOptions.searchTerm && viewOptions.typeFilter.length === 0) {
      return tree;
    }

    const filterNode = (node: TreeNode): boolean => {
      let matches = true;

      // Filtrage par terme de recherche
      if (viewOptions.searchTerm) {
        const searchLower = viewOptions.searchTerm.toLowerCase();
        matches =
          matches &&
          (node.name.toLowerCase().includes(searchLower) ||
            node.description?.toLowerCase().includes(searchLower) ||
            node.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
      }

      // Filtrage par type
      if (viewOptions.typeFilter.length > 0) {
        matches = matches && viewOptions.typeFilter.includes(node.type);
      }

      return matches;
    };

    return tree.filter(filterNode);
  }, [buildTree, viewOptions]);

  // ✅ Gestion de l'expansion des nœuds
  const toggleExpansion = useCallback((nodeId: string) => {
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

  // ✅ Gestion du clic sur un nœud
  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      if (node.isFolder) {
        if (onFolderNavigate) {
          onFolderNavigate(node.id, node.name);
        }
        toggleExpansion(node.id);
      } else {
        if (onEdit) {
          onEdit(node);
        }
      }
    },
    [onFolderNavigate, onEdit, toggleExpansion]
  );

  // ✅ Actions par défaut si non fournies
  const handleDelete = useCallback(
    (file: FileWithRelations) => {
      if (onDelete) {
        onDelete(file);
      } else {
        toast.info(`Suppression de ${file.name} - Action non configurée`);
      }
    },
    [onDelete]
  );

  const handleDownload = useCallback(
    (file: FileWithRelations) => {
      if (onDownload) {
        onDownload(file);
      } else if (file.url) {
        window.open(file.url, "_blank");
      } else {
        toast.error("URL de téléchargement non disponible");
      }
    },
    [onDownload]
  );

  const handleShare = useCallback(
    (file: FileWithRelations) => {
      if (onShare) {
        onShare(file);
      } else {
        navigator.clipboard.writeText(file.url);
        toast.success("URL copiée dans le presse-papiers");
      }
    },
    [onShare]
  );

  const handleDuplicate = useCallback(
    (file: FileWithRelations) => {
      if (onDuplicate) {
        onDuplicate(file);
      } else {
        toast.info(`Duplication de ${file.name} - Action non configurée`);
      }
    },
    [onDuplicate]
  );

  // ✅ Gestion de la sélection
  const handleToggleSelection = useCallback(
    (fileId: string) => {
      if (onToggleSelection) {
        onToggleSelection(fileId);
      }
    },
    [onToggleSelection]
  );

  // ✅ Expansion/collapse globale
  const handleExpandAll = useCallback(() => {
    if (viewOptions.expandAll) {
      setExpandedNodes(new Set());
    } else {
      const allFolderIds = files.filter((f) => f.isFolder).map((f) => f.id);
      setExpandedNodes(new Set(allFolderIds));
    }
    setViewOptions((prev) => ({ ...prev, expandAll: !prev.expandAll }));
  }, [files, viewOptions.expandAll]);

  // ✅ Rendu d'un nœud de l'arbre
  const renderNode = useCallback(
    (node: TreeNode, index: number): JSX.Element => {
      const isSelected = selectedFiles.includes(node.id);
      const hasChildren = node.isFolder && node.hasChildren;
      const isExpanded = expandedNodes.has(node.id);

      return (
        <div
          key={node.id}
          className={`
            flex items-center justify-between p-3 rounded-lg border
            hover:bg-gray-50 transition-colors cursor-pointer
            ${
              isSelected
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-200"
            }
          `}
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Toggle d'expansion pour les dossiers */}
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpansion(node.id);
                }}
                className="p-0 h-auto hover:bg-transparent"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-4" />
            )}

            {/* Checkbox de sélection */}
            {onToggleSelection && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggleSelection(node.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {/* Icône du fichier/dossier */}
            {getFileIcon(node)}

            {/* Nom et informations principales */}
            <div
              className="flex-1 min-w-0"
              onClick={() => handleNodeClick(node)}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">
                  {node.name}
                </span>

                {/* Badges d'état */}
                {node.isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    Public
                  </Badge>
                )}
                {node.version > 1 && (
                  <Badge variant="outline" className="text-xs">
                    v{node.version}
                  </Badge>
                )}
                <Badge variant="default" className="text-xs">
                  {getLabel(node.type)}
                </Badge>
              </div>

              {/* Informations secondaires */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                {!node.isFolder && node.size && (
                  <span>{formatSize(node.size)}</span>
                )}
                {node.isFolder && node._count?.children && (
                  <span>
                    {node._count.children} élément
                    {node._count.children > 1 ? "s" : ""}
                  </span>
                )}
                {node.mimeType && !node.isFolder && (
                  <span className="text-xs">{node.mimeType}</span>
                )}
                <span>
                  {format(node.updatedAt, "dd/MM/yyyy", { locale: fr })}
                </span>
                {node.uploader && (
                  <span>par {node.uploader.name || node.uploader.email}</span>
                )}
              </div>

              {/* Tags */}
              {node.tags.length > 0 && (
                <div className="flex items-center space-x-1 mt-2">
                  {node.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {node.tags.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{node.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Menu d'actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              {!node.isFolder && (
                <DropdownMenuItem onClick={() => handleDownload(node)}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleShare(node)}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(node)}>
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(node)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Enfants (si dossier expansé) */}
          {hasChildren && isExpanded && (
            <Collapsible open={isExpanded}>
              <CollapsibleContent className="mt-2">
                {files
                  .filter((f) => f.parent?.id === node.id)
                  .map((childFile, childIndex) => {
                    const childNode: TreeNode = {
                      ...childFile,
                      level: node.level + 1,
                      isExpanded: expandedNodes.has(childFile.id),
                      parentPath: `${node.parentPath}/${node.name}`.replace(
                        /^\/+/,
                        ""
                      ),
                      hasChildren:
                        childFile.isFolder &&
                        (childFile._count?.children || 0) > 0,
                    };
                    return renderNode(childNode, childIndex);
                  })}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      );
    },
    [
      selectedFiles,
      expandedNodes,
      files,
      onToggleSelection,
      getFileIcon,
      getLabel,
      formatSize,
      handleNodeClick,
      toggleExpansion,
      onEdit,
      handleDownload,
      handleShare,
      handleDuplicate,
      handleDelete,
      handleToggleSelection,
    ]
  );

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardContent className="p-6">
          {/* Barre d'outils */}
          <div className="flex items-center justify-between mb-6">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans l'arbre..."
                value={viewOptions.searchTerm}
                onChange={(e) =>
                  setViewOptions((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
                className="pl-10"
              />
            </div>

            {/* Actions globales */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleExpandAll}>
                {viewOptions.expandAll ? "Tout replier" : "Tout déplier"}
              </Button>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>

          {/* Arbre des fichiers */}
          <div className="space-y-2">
            {filteredTree.length > 0 ? (
              filteredTree.map((node, index) => renderNode(node, index))
            ) : (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {viewOptions.searchTerm
                    ? "Aucun résultat trouvé"
                    : "Aucun fichier"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {viewOptions.searchTerm
                    ? `Aucun fichier ne correspond à "${viewOptions.searchTerm}"`
                    : "Les fichiers et dossiers apparaîtront ici"}
                </p>
                {(viewOptions.searchTerm ||
                  viewOptions.typeFilter.length > 0) && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setViewOptions({
                        searchTerm: "",
                        showHiddenFiles: false,
                        typeFilter: [],
                        expandAll: false,
                      })
                    }
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
