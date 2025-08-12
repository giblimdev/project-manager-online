// components/files/views/FilesViewList.tsx

/**
 * RÔLE : Vue tableau des métadonnées de fichiers avec colonnes détaillées selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Affichage en tableau responsive avec toutes les propriétés selon schéma Prisma
 * - Colonnes complètes : nom, type, complexité, auteurs, dates, relations (feature, userStory, task, sprint)
 * - Actions par ligne : edit, delete, view, share avec boutons compacts
 * - Gestion des dossiers avec navigation et icônes différenciées selon isFolder
 * - Tri bidirectionnel par colonnes avec indicateurs visuels d'état
 * - Sélection multiple avec checkbox et actions en lot
 * - Support spécifique à l'aide au développement : import, export, use, script
 * - Responsive design avec colonnes masquables selon la taille d'écran
 * - Support des types FileType EXACTS selon schéma Prisma (DOSSIER, ENV, SYSTEM, etc.)
 * - Gestion du mimeType nullable et relations author[] selon schéma
 * - Types unifiés via fichier central types/files.ts avec interfaces strictes
 *
 * COMPOSANTS UTILISÉS :
 * - Table, TableBody, TableCell, TableHead, TableHeader, TableRow: shadcn/ui pour tableau moderne
 * - Button: Composants boutons pour les actions avec variants hover et size
 * - Badge: Affichage des types, statuts et propriétés avec couleurs semantic
 * - Avatar, AvatarFallback, AvatarImage: Affichage des auteurs avec fallback
 * - Tooltip, TooltipContent, TooltipProvider, TooltipTrigger: Info-bulles détaillées
 * - Checkbox: Sélection multiple des éléments avec état indeterminate
 * - DropdownMenu: Menus contextuels pour actions avec séparateurs
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useCallback, useMemo, useState, JSX pour optimisations
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Table, Button, Badge, Avatar, Tooltip, Checkbox components
 * - lucide-react: Icons pour types de fichiers, actions, navigation et tri
 * - Tailwind CSS: Styling responsive avec hover effects et transitions smooth
 * - date-fns: Formatage des dates avec locale française pour UX native
 * - sonner: Toast notifications pour feedback utilisateur sur les actions
 */

"use client";

import { JSX, useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Edit,
  Trash2,
  Eye,
  Share2,
  Copy,
  MoreVertical,
  FileText,
  Package,
  Settings,
  Layers,
  Database,
  Code2,
  File,
  Folder,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Hash,
  Tag,
  Globe,
  TestTube,
  Users,
  Import,
  Download,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ✅ Import des types centralisés mis à jour
import type {
  FileWithRelations,
  FilesViewProps,
  SortBy,
  SortOrder,
} from "@/types/files";

// Type pour le tri local
type SortConfig = {
  key: SortBy | null;
  direction: SortOrder;
};

export default function FilesViewList({
  files,
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
}: FilesViewProps): JSX.Element {
  // État local pour le tri
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  // ✅ Fonction pour obtenir l'icône du type EXACTE selon schéma Prisma
  const getFileIcon = useCallback(
    (file: FileWithRelations, size: "sm" | "md" = "sm"): JSX.Element => {
      const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

      if (getFileTypeIcon) {
        return getFileTypeIcon(file.type, file.isFolder);
      }

      if (file.isFolder) {
        return <Folder className={`${sizeClass} text-blue-500`} />;
      }

      switch (file.type) {
        case "DOSSIER":
          return <Folder className={`${sizeClass} text-blue-500`} />;
        case "PAGE":
          return <FileText className={`${sizeClass} text-green-500`} />;
        case "COMPONENT":
          return <Package className={`${sizeClass} text-blue-500`} />;
        case "UTILS":
          return <Settings className={`${sizeClass} text-gray-500`} />;
        case "LIB":
          return <Layers className={`${sizeClass} text-purple-500`} />;
        case "STORE":
          return <Database className={`${sizeClass} text-orange-500`} />;
        case "HOOK":
          return <Code2 className={`${sizeClass} text-pink-500`} />;
        case "ENV":
          return <Settings className={`${sizeClass} text-yellow-500`} />;
        case "SYSTEM":
          return <Globe className={`${sizeClass} text-red-500`} />;
        case "TEST":
          return <TestTube className={`${sizeClass} text-green-600`} />;
        case "OTHER":
        default:
          return <File className={`${sizeClass} text-gray-400`} />;
      }
    },
    [getFileTypeIcon]
  );

  // ✅ Fonction pour obtenir le label du type EXACT
  const getLabel = useCallback(
    (type: string): string => {
      if (getTypeLabel) {
        return getTypeLabel(type);
      }

      switch (type) {
        case "DOSSIER":
          return "Dossier";
        case "PAGE":
          return "Page";
        case "COMPONENT":
          return "Composant";
        case "UTILS":
          return "Utils";
        case "LIB":
          return "Lib";
        case "STORE":
          return "Store";
        case "HOOK":
          return "Hook";
        case "ENV":
          return "Env";
        case "SYSTEM":
          return "Système";
        case "TEST":
          return "Test";
        case "OTHER":
        default:
          return "Autre";
      }
    },
    [getTypeLabel]
  );

  // ✅ Fonction pour formater la complexité (longueur du script)
  const formatComplexity = useCallback(
    (file: FileWithRelations): string => {
      if (formatFileSize && file.script) {
        return formatFileSize(file.script.length);
      }

      if (!file.script) return "Vide";
      const length = file.script.length;
      if (length < 100) return "Simple";
      if (length < 500) return "Moyen";
      if (length < 2000) return "Complexe";
      return "Très complexe";
    },
    [formatFileSize]
  );

  // ✅ Obtenir le nom d'affichage des auteurs (relation multiple selon schéma)
  const getAuthorsDisplayName = useCallback(
    (authors: FileWithRelations["author"]): string => {
      if (!authors || authors.length === 0) return "Inconnu";

      if (authors.length === 1) {
        const author = authors[0];
        if (author.firstName && author.lastName) {
          return `${author.firstName} ${author.lastName}`;
        }
        return author.name || author.email;
      }

      return `${authors.length} auteurs`;
    },
    []
  );

  // Actions par défaut si non fournies
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

  const handleViewFile = useCallback(
    (file: FileWithRelations) => {
      if (onDownload) {
        onDownload(file);
      } else if (file.versions && file.versions.length > 0) {
        // Utiliser l'URL de la dernière version
        const latestVersion = file.versions[0];
        if (latestVersion.url) {
          window.open(latestVersion.url, "_blank");
        } else {
          toast.error("URL de téléchargement non disponible");
        }
      } else if (file.path) {
        window.open(file.path, "_blank");
      } else if (file.script) {
        // Afficher le script dans une modal
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${file.name} - Script</title></head>
              <body style="font-family: monospace; padding: 20px;">
                <h1>${file.name}</h1>
                <pre><code>${file.script}</code></pre>
              </body>
            </html>
          `);
        }
      } else {
        toast.info("Aucun contenu à afficher");
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

        // Priorité à l'URL de la dernière version
        if (file.versions && file.versions.length > 0 && file.versions[0].url) {
          shareUrl = file.versions[0].url;
        }
        // Fallback : construire une URL depuis le path
        else if (file.path) {
          shareUrl = `${window.location.origin}/api/files/${file.id}/download`;
        }
        // Dernière option : URL vers la page du fichier
        else {
          shareUrl = `${window.location.origin}/files/${file.id}`;
        }

        navigator.clipboard.writeText(shareUrl);
        toast.success("Lien vers la référence copié");
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

  // Gestion du tri
  const handleSort = useCallback((key: SortBy) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // ✅ CORRECTION : Fonction utilitaire pour gérer les dates
  const getTimestamp = useCallback((date: Date | string): number => {
    if (date instanceof Date) {
      return date.getTime();
    }
    if (typeof date === "string") {
      return new Date(date).getTime();
    }
    // Si c'est un type DateTime de Prisma
    return new Date(date as any).getTime();
  }, []);

  // Tri des fichiers avec correction des dates
  const sortedFiles = useMemo(() => {
    if (!sortConfig.key) return files;

    return [...files].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "size":
          aValue = a.script?.length || 0;
          bValue = b.script?.length || 0;
          break;
        case "date":
          // ✅ CORRECTION : Gestion des dates string ou Date objects
          aValue = getTimestamp(a.updatedAt);
          bValue = getTimestamp(b.updatedAt);
          break;
        case "author":
          aValue = getAuthorsDisplayName(a.author).toLowerCase();
          bValue = getAuthorsDisplayName(b.author).toLowerCase();
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });
  }, [files, sortConfig, getAuthorsDisplayName, getTimestamp]);

  // Gestion du clic sur une ligne
  const handleRowClick = useCallback(
    (file: FileWithRelations) => {
      if (file.isFolder) {
        onFolderNavigate(file.id, file.name);
      } else {
        onEdit(file);
      }
    },
    [onFolderNavigate, onEdit]
  );

  // Composant pour l'en-tête de colonne avec tri
  const SortableHeader = useCallback(
    ({
      sortKey,
      children,
      className = "",
    }: {
      sortKey: SortBy;
      children: React.ReactNode;
      className?: string;
    }) => (
      <TableHead className={className}>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
          onClick={() => handleSort(sortKey)}
        >
          {children}
          {sortConfig.key === sortKey ? (
            sortConfig.direction === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      </TableHead>
    ),
    [sortConfig, handleSort]
  );

  // Message si aucun fichier
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          Aucune référence dans ce dossier
        </h3>
        <p className="text-gray-500 mb-6">
          {currentFolder
            ? "Ce dossier ne contient aucune référence pour le moment."
            : "Aucune référence de fichier n'a été trouvée dans ce projet."}
        </p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>💡 Cliquez sur "Ajouter une référence" pour commencer</p>
          <p>📁 Vous pouvez créer des dossiers virtuels pour organiser</p>
          <p>
            🔧 Types supportés: Dossiers, Pages, Composants, Utils, Stores,
            Hooks, Env, System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Sélection globale */}
              {onToggleSelection && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </TableHead>
              )}

              {/* Colonnes triables */}
              <SortableHeader sortKey="name" className="min-w-[200px]">
                Nom
              </SortableHeader>
              <SortableHeader sortKey="type" className="w-32">
                Type
              </SortableHeader>
              <SortableHeader
                sortKey="size"
                className="w-24 hidden sm:table-cell"
              >
                Complexité
              </SortableHeader>
              <SortableHeader
                sortKey="author"
                className="w-36 hidden md:table-cell"
              >
                Auteurs
              </SortableHeader>
              <SortableHeader
                sortKey="date"
                className="w-32 hidden lg:table-cell"
              >
                Modifié
              </SortableHeader>
              <TableHead className="w-48 hidden xl:table-cell">
                Métadonnées
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFiles.map((file) => {
              const isSelected = selectedFiles.includes(file.id);

              return (
                <TableRow
                  key={file.id}
                  className={`
                    cursor-pointer hover:bg-gray-50 transition-colors
                    ${isSelected ? "bg-blue-50" : ""}
                  `}
                  onClick={() => handleRowClick(file)}
                >
                  {/* Sélection */}
                  {onToggleSelection && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(file.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}

                  {/* Nom avec icône */}
                  <TableCell>
                    <div className="flex items-center space-x-3 min-w-0">
                      {getFileIcon(file)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 truncate">
                            {file.name}
                          </span>

                          {/* Badges et informations */}
                          {file.version > 1 && (
                            <Badge variant="outline" className="text-xs">
                              v{file.version}
                            </Badge>
                          )}
                          {file.import && (
                            <Badge variant="secondary" className="text-xs">
                              <Import className="h-3 w-3 mr-1" />
                              Imports
                            </Badge>
                          )}
                          {file.export && (
                            <Badge variant="secondary" className="text-xs">
                              <Download className="h-3 w-3 mr-1" />
                              Exports
                            </Badge>
                          )}
                        </div>

                        {/* Description (mobile) */}
                        {file.description && (
                          <p className="text-sm text-gray-500 truncate mt-1 sm:hidden">
                            {file.description}
                          </p>
                        )}

                        {/* Use/Dépendances (mobile) */}
                        {file.use && (
                          <p className="text-xs text-gray-400 mt-1 sm:hidden">
                            Utilise: {file.use}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        {getLabel(file.type)}
                      </Badge>

                      {/* MimeType */}
                      {file.mimeType && !file.isFolder && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="text-xs">
                              {file.mimeType.split("/").pop()}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.mimeType}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  {/* Complexité */}
                  <TableCell className="hidden sm:table-cell">
                    {file.isFolder ? (
                      <span className="text-sm text-gray-500">
                        {file._count?.children || 0} éléments
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">
                          {formatComplexity(file)}
                        </span>
                        {file.script && (
                          <div className="text-xs text-gray-400">
                            {file.script.length} caractères
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Auteurs (relation multiple selon schéma) */}
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center space-x-2">
                      {file.author && file.author.length > 0 && (
                        <>
                          <Avatar className="h-6 w-6">
                            {file.author[0].image ? (
                              <AvatarImage src={file.author[0].image} />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {getAuthorsDisplayName(file.author).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getAuthorsDisplayName(file.author)}
                            </p>
                            {file.author[0].username && (
                              <p className="text-xs text-gray-500">
                                @{file.author[0].username}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* Date de modification */}
                  <TableCell className="hidden lg:table-cell">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {format(
                          file.updatedAt instanceof Date
                            ? file.updatedAt
                            : new Date(file.updatedAt),
                          "dd/MM/yyyy",
                          { locale: fr }
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(
                          file.updatedAt instanceof Date
                            ? file.updatedAt
                            : new Date(file.updatedAt),
                          "HH:mm",
                          { locale: fr }
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Métadonnées développement */}
                  <TableCell className="hidden xl:table-cell">
                    <div className="space-y-1">
                      {file.use && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <Package className="h-3 w-3 mr-1" />
                              Dépendances
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Utilise: {file.use}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {file.tags.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {file.tags.length} tags
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              {file.tags.slice(0, 5).map((tag, i) => (
                                <p key={i}>{tag}</p>
                              ))}
                              {file.tags.length > 5 && (
                                <p>+{file.tags.length - 5} autres</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {file.project && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {file.project.key}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Projet: {file.project.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(file);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFile(file);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir le contenu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(file);
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Partager
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(file);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
