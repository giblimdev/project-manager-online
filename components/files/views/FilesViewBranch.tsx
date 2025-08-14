// @/components/files/views/FilesViewBranch.tsx

/**
 * RÔLE : Vue arborescente des fichiers avec hiérarchie et navigation interactive CORRIGÉE
 * RESPONSABILITÉS :
 * - Affichage hiérarchique des fichiers et dossiers avec indentation visuelle
 * - Navigation dans l'arborescence avec expansion/collapse des nœuds
 * - Support du drag & drop pour réorganisation des éléments
 * - Filtrage et recherche dans l'arbre avec highlight des résultats
 * - Actions contextuelles par nœud (edit, delete, move, duplicate)
 * - CORRECTION MAJEURE : Gestion correcte de la hiérarchie parent/enfant
 * - CORRECTION : Affichage récursif des enfants dans l'arborescence
 * - CORRECTION : Construction correcte de l'arbre hiérarchique
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

// ✅ CORRECTION : Interface pour les nœuds de l'arbre avec enfants
interface TreeNode extends FileWithRelations {
  level: number;
  isExpanded: boolean;
  parentPath: string;
  hasChildren: boolean;
  children: TreeNode[]; // ✅ AJOUT : Enfants directs du nœud
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
    (size: number | null): string => {
      if (formatFileSize) {
        return formatFileSize(size);
      }

      if (!size || size === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(size) / Math.log(k));
      return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    [formatFileSize]
  );

  // ✅ CORRECTION MAJEURE : Construction de l'arbre hiérarchique avec enfants
  const buildTree = useCallback(
    (files: FileWithRelations[]): TreeNode[] => {
      console.log(
        "🌳 Construction de l'arbre hiérarchique avec",
        files.length,
        "fichiers"
      );

      // Créer une map pour accès rapide
      const fileMap = new Map<string, FileWithRelations>();
      files.forEach((file) => {
        fileMap.set(file.id, file);
      });

      // ✅ Fonction récursive pour construire les nœuds avec enfants
      const buildNode = (
        file: FileWithRelations,
        level: number = 0,
        parentPath: string = ""
      ): TreeNode => {
        // Trouver les enfants directs
        const directChildren = files.filter((f) => f.parentId === file.id);

        // Construire les nœuds enfants récursivement
        const childNodes = directChildren.map((child) =>
          buildNode(
            child,
            level + 1,
            `${parentPath}/${file.name}`.replace(/^\/+/, "")
          )
        );

        // Trier les enfants (dossiers en premier, puis alphabétique)
        childNodes.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name, "fr", { numeric: true });
        });

        const node: TreeNode = {
          ...file,
          level,
          isExpanded: expandedNodes.has(file.id),
          parentPath: parentPath.replace(/^\/+/, ""),
          hasChildren: directChildren.length > 0,
          children: childNodes, // ✅ CORRECTION : Inclure les enfants dans le nœud
        };

        return node;
      };

      // ✅ Construire l'arbre à partir des nœuds racine (parentId null ou undefined)
      const rootFiles = files.filter((file) => !file.parentId);

      console.log("📁 Fichiers racine trouvés:", rootFiles.length);

      const rootNodes = rootFiles.map((file) => buildNode(file, 0, ""));

      // Trier les nœuds racine
      rootNodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name, "fr", { numeric: true });
      });

      console.log("✅ Arbre construit avec", rootNodes.length, "nœuds racine");

      return rootNodes;
    },
    [files, expandedNodes]
  );

  // ✅ Filtrage des nœuds selon les critères
  const filteredTree = useMemo(() => {
    const tree = buildTree(files);

    if (!viewOptions.searchTerm && viewOptions.typeFilter.length === 0) {
      return tree;
    }

    // ✅ Fonction récursive pour filtrer l'arbre
    const filterNode = (node: TreeNode): TreeNode | null => {
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

      // Filtrer les enfants récursivement
      const filteredChildren = node.children
        .map((child) => filterNode(child))
        .filter((child): child is TreeNode => child !== null);

      // Un nœud est inclus s'il correspond aux critères OU s'il a des enfants qui correspondent
      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          hasChildren: filteredChildren.length > 0,
        };
      }

      return null;
    };

    const filteredNodes = tree
      .map((node) => filterNode(node))
      .filter((node): node is TreeNode => node !== null);

    return filteredNodes;
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
      } else if (file.versions && file.versions.length > 0) {
        const latestVersion = file.versions[0];
        if (latestVersion.url) {
          window.open(latestVersion.url, "_blank");
        } else {
          toast.error("URL de téléchargement non disponible");
        }
      } else if (file.path) {
        window.open(file.path, "_blank");
      } else {
        toast.error("Aucun chemin de téléchargement disponible");
      }
    },
    [onDownload]
  );

  const handleShare = useCallback(
    (file: FileWithRelations) => {
      if (onShare) {
        onShare(file);
      } else {
        let shareUrl: string | undefined;

        if (file.versions && file.versions.length > 0 && file.versions[0].url) {
          shareUrl = file.versions[0].url;
        } else if (file.path) {
          shareUrl = `${window.location.origin}/api/files/${file.id}/download`;
        } else {
          shareUrl = `${window.location.origin}/files/${file.id}`;
        }

        navigator.clipboard.writeText(shareUrl);
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
      const getAllFolderIds = (nodes: TreeNode[]): string[] => {
        const ids: string[] = [];

        const traverse = (nodeList: TreeNode[]) => {
          nodeList.forEach((node) => {
            if (node.isFolder) {
              ids.push(node.id);
              traverse(node.children);
            }
          });
        };

        traverse(nodes);
        return ids;
      };

      const allFolderIds = getAllFolderIds(filteredTree);
      setExpandedNodes(new Set(allFolderIds));
    }

    setViewOptions((prev) => ({ ...prev, expandAll: !prev.expandAll }));
  }, [filteredTree, viewOptions.expandAll]);

  // ✅ CORRECTION MAJEURE : Rendu récursif d'un nœud avec ses enfants
  const renderNode = useCallback(
    (node: TreeNode, index: number): JSX.Element => {
      const isSelected = selectedFiles.includes(node.id);
      const hasChildren = node.isFolder && node.hasChildren;
      const isExpanded = expandedNodes.has(node.id);

      return (
        <div key={node.id} className="select-none">
          {/* ✅ Nœud principal */}
          <div
            className={`
              flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer
              ${isSelected ? "bg-blue-50 border border-blue-200" : ""}
              ${node.level > 0 ? `ml-${Math.min(node.level * 4, 20)}` : ""}
            `}
            style={{ marginLeft: `${node.level * 20}px` }}
            onClick={() => handleNodeClick(node)}
          >
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
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            ) : (
              <div className="w-4 h-4" />
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
            <div className="flex-1 min-w-0">
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => handleNodeClick(node)}
              >
                <span className="font-medium text-gray-900 truncate">
                  {node.name}
                </span>

                {/* Badges d'état */}
                {node.version > 1 && (
                  <Badge variant="outline" className="text-xs">
                    v{node.version}
                  </Badge>
                )}

                <Badge variant="secondary" className="text-xs">
                  {getLabel(node.type)}
                </Badge>
              </div>

              {/* Informations secondaires */}
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                {!node.isFolder &&
                  node.versions &&
                  node.versions.length > 0 &&
                  node.versions[0].size && (
                    <span>{formatSize(node.versions[0].size)}</span>
                  )}

                {node.isFolder && node._count?.children && (
                  <span>
                    {node._count.children} élément
                    {node._count.children > 1 ? "s" : ""}
                  </span>
                )}

                {node.mimeType && !node.isFolder && (
                  <Badge variant="outline" className="text-xs">
                    {node.mimeType}
                  </Badge>
                )}

                <span>
                  {format(node.updatedAt, "dd/MM/yyyy", { locale: fr })}
                </span>

                {node.author && node.author.length > 0 && (
                  <span>par {node.author[0].name || node.author[0].email}</span>
                )}
              </div>

              {/* Tags */}
              {node.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {node.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {node.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{node.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Menu d'actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
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
          </div>

          {/* ✅ CORRECTION MAJEURE : Affichage récursif des enfants */}
          {hasChildren && isExpanded && node.children.length > 0 && (
            <div className="ml-4">
              {node.children.map((childNode, childIndex) =>
                renderNode(childNode, childIndex)
              )}
            </div>
          )}
        </div>
      );
    },
    [
      selectedFiles,
      expandedNodes,
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {/* Recherche */}
            <div className="relative flex-1 max-w-sm">
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
                {viewOptions.expandAll ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                {viewOptions.expandAll ? "Tout replier" : "Tout déplier"}
              </Button>

              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>

          {/* ✅ Arbre des fichiers avec affichage récursif */}
          <div className="space-y-1">
            {filteredTree.length > 0 ? (
              filteredTree.map((node, index) => renderNode(node, index))
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
