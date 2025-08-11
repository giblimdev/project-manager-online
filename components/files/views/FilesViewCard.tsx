// components/files/views/FilesViewCard.tsx

/**
 * RÔLE : Vue grille des métadonnées de fichiers avec cartes visuelles selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Affichage en mode grille responsive avec cartes modernes pour chaque fichier/dossier
 * - Interface visuelle attrayante avec aperçus, métadonnées et actions rapides
 * - Gestion différenciée des dossiers et fichiers avec icônes et comportements spécifiques
 * - Actions par carte : edit, delete, view, share avec boutons hover compacts
 * - Navigation dans l'arborescence avec clic sur dossiers virtuels
 * - Design responsive adaptatif avec grid variable selon la taille d'écran
 * - Support spécifique à l'aide au développement : import, export, use, script, tags
 * - Support des types FileType EXACTS selon schéma Prisma (DOSSIER, ENV, SYSTEM, etc.)
 * - Gestion du mimeType nullable et relations author[] selon schéma
 * - Affichage des métadonnées de développement avec badges colorés
 * - Types unifiés via fichier central types/files.ts
 *
 * COMPOSANTS UTILISÉS :
 * - Card, CardContent: Composants shadcn/ui pour les conteneurs de fichiers
 * - Button: Composants boutons pour les actions avec variants hover
 * - Badge: Affichage des types, tags, statuts et propriétés avec couleurs
 * - Avatar: Affichage des auteurs avec fallback et images utilisateur
 * - Tooltip: Info-bulles pour les actions et métadonnées détaillées
 * - Progress: Indicateur de complexité pour les fichiers avec script
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useCallback, useMemo, JSX pour optimisation performances
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Card, Button, Badge, Avatar, Tooltip components
 * - lucide-react: Icons pour types de fichiers, actions, navigation et métadonnées
 * - Tailwind CSS: Grid responsive, hover effects, transitions et design moderne
 * - date-fns: Formatage des dates avec locale française pour affichage utilisateur
 * - sonner: Toast notifications pour feedback utilisateur sur les actions
 */

"use client";

import { JSX, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Clock,
  Hash,
  Tag,
  Globe,
  TestTube,
  Users,
  Import,
  Download,
  BookOpen,
  Code,
  Zap,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ✅ Import des types centralisés mis à jour
import type { FileWithRelations, FilesViewProps } from "@/types/files";

export default function FilesViewCard({
  files,
  currentFolder,
  onEdit,
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
  // ✅ Fonction pour obtenir l'icône du type EXACTE selon schéma Prisma
  const getFileIcon = useCallback(
    (file: FileWithRelations, size: "lg" | "md" = "lg"): JSX.Element => {
      const sizeClass = size === "lg" ? "h-8 w-8" : "h-6 w-6";

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

  // ✅ Fonction pour calculer le niveau de complexité
  const getComplexityLevel = useCallback((file: FileWithRelations): number => {
    if (!file.script) return 0;
    const length = file.script.length;
    if (length < 100) return 25;
    if (length < 500) return 50;
    if (length < 2000) return 75;
    return 100;
  }, []);

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
      } else if (file.path) {
        window.open(file.path, "_blank");
      } else if (file.script) {
        // Afficher le script dans une modal
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${file.name} - Script</title>
                <style>
                  body { font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; }
                  h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
                  pre { background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; overflow: auto; }
                  code { color: #d73a49; }
                </style>
              </head>
              <body>
                <h1>${file.name}</h1>
                <p><strong>Type:</strong> ${getLabel(file.type)}</p>
                ${
                  file.description
                    ? `<p><strong>Description:</strong> ${file.description}</p>`
                    : ""
                }
                <pre><code>${file.script}</code></pre>
              </body>
            </html>
          `);
        }
      } else {
        toast.info("Aucun contenu à afficher");
      }
    },
    [onDownload, getLabel]
  );

  const handleShare = useCallback(
    (file: FileWithRelations) => {
      if (onShare) {
        onShare(file);
      } else {
        const shareUrl = `${window.location.origin}/files/${file.id}`;
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

  // Gestion du clic sur une carte
  const handleCardClick = useCallback(
    (file: FileWithRelations) => {
      if (file.isFolder) {
        onFolderNavigate(file.id, file.name);
      } else {
        onEdit(file);
      }
    },
    [onFolderNavigate, onEdit]
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {files.map((file) => {
          const isSelected = selectedFiles.includes(file.id);
          const complexityLevel = getComplexityLevel(file);

          return (
            <Card
              key={file.id}
              className={`
                relative group hover:shadow-lg transition-all duration-200 cursor-pointer
                ${
                  isSelected
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:shadow-md"
                }
              `}
              onClick={() => handleCardClick(file)}
            >
              <CardContent className="p-4">
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Checkbox de sélection */}
                    {onToggleSelection && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(file.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}

                    {/* Icône du fichier */}
                    {getFileIcon(file)}

                    {/* Nom du fichier */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getLabel(file.type)}
                      </p>
                    </div>
                  </div>

                  {/* Menu d'actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(file)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewFile(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir le contenu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(file)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(file)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(file)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                {file.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {file.description}
                  </p>
                )}

                {/* Métadonnées principales */}
                <div className="space-y-2 mb-3">
                  {/* Complexité et nombre d'éléments */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {file.isFolder ? "Éléments" : "Complexité"}
                    </span>
                    <div className="flex items-center space-x-2">
                      {file.isFolder ? (
                        <span className="font-medium">
                          {file._count?.children || 0} élément
                          {(file._count?.children || 0) > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-medium">
                            {complexityLevel === 0
                              ? "Vide"
                              : complexityLevel <= 25
                              ? "Simple"
                              : complexityLevel <= 50
                              ? "Moyen"
                              : complexityLevel <= 75
                              ? "Complexe"
                              : "Très complexe"}
                          </span>
                          <Progress
                            value={complexityLevel}
                            className="w-16 h-2"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Version */}
                  {file.version > 1 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Version</span>
                      <Badge variant="outline" className="text-xs">
                        v{file.version}
                      </Badge>
                    </div>
                  )}

                  {/* MimeType */}
                  {file.mimeType && !file.isFolder && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type MIME</span>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {file.mimeType.split("/").pop()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges métadonnées développement */}
                <div className="flex flex-wrap gap-1 mb-3">
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
                  {file.script && (
                    <Badge variant="secondary" className="text-xs">
                      <Code className="h-3 w-3 mr-1" />
                      Script
                    </Badge>
                  )}
                  {file.isFolder && (
                    <Badge variant="default" className="text-xs">
                      <Folder className="h-3 w-3 mr-1" />
                      Dossier
                    </Badge>
                  )}
                </div>

                {/* Dépendances (use) */}
                {file.use && (
                  <div className="mb-3">
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge
                          variant="outline"
                          className="text-xs w-full justify-start"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          <span className="truncate">
                            Utilise:{" "}
                            {file.use.length > 20
                              ? `${file.use.substring(0, 20)}...`
                              : file.use}
                          </span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dépendances: {file.use}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Tags */}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 3 && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-gray-400 cursor-help">
                            +{file.tags.length - 3} tags
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            {file.tags.slice(3).map((tag, i) => (
                              <p key={i}>{tag}</p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}

                {/* Relations */}
                <div className="space-y-1 mb-3 text-xs">
                  {file.project && (
                    <div className="flex items-center text-gray-600">
                      <Hash className="h-3 w-3 mr-1" />
                      <span className="truncate">{file.project.name}</span>
                    </div>
                  )}
                  {file.feature && (
                    <div className="flex items-center text-gray-600">
                      <Package className="h-3 w-3 mr-1" />
                      <span className="truncate">{file.feature.name}</span>
                    </div>
                  )}
                  {file.userStory && (
                    <div className="flex items-center text-gray-600">
                      <FileText className="h-3 w-3 mr-1" />
                      <span className="truncate">{file.userStory.title}</span>
                    </div>
                  )}
                </div>

                {/* Pied de carte */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {/* Auteurs */}
                  <div className="flex items-center space-x-2">
                    {file.author && file.author.length > 0 ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={file.author[0].image || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {getAuthorsDisplayName(file.author).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600 truncate">
                          {getAuthorsDisplayName(file.author)}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          Aucun auteur
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date de modification */}
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(file.updatedAt, "dd/MM", { locale: fr })}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Modifié le{" "}
                        {format(file.updatedAt, "dd MMMM yyyy 'à' HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Actions rapides en hover */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFile(file);
                          }}
                        >
                          {file.path ? (
                            <ExternalLink className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {file.path ? "Ouvrir le lien" : "Voir le contenu"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(file);
                          }}
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Partager</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
