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

  // ✅ Fonction pour formater la complexité (longueur du script)
  const formatComplexity = useCallback(
    (file: FileWithRelations): { label: string; value: number } => {
      if (!file.script) return { label: "Vide", value: 0 };

      const length = file.script.length;
      if (length < 100) return { label: "Simple", value: 25 };
      if (length < 500) return { label: "Moyen", value: 50 };
      if (length < 2000) return { label: "Complexe", value: 75 };
      return { label: "Très complexe", value: 100 };
    },
    []
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

  // Actions par défaut si non fournies - CORRIGÉES
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
        // ✅ CORRECTION : Utiliser l'URL de la dernière version
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
              <head>
                <title>${file.name} - Script</title>
                <style>
                  body { font-family: 'Courier New', monospace; padding: 20px; line-height: 1.6; }
                  h1 { color: #333; border-bottom: 2px solid #007acc; }
                  pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
                  .metadata { background: #e8f4ff; padding: 10px; margin: 10px 0; border-radius: 5px; }
                </style>
              </head>
              <body>
                <h1>${file.name}</h1>
                <div class="metadata">
                  <strong>Type:</strong> ${getLabel(file.type)}<br/>
                  ${
                    file.description
                      ? `<strong>Description:</strong> ${file.description}<br/>`
                      : ""
                  }
                  ${
                    file.use ? `<strong>Utilise:</strong> ${file.use}<br/>` : ""
                  }
                  ${
                    file.import
                      ? `<strong>Imports:</strong> ${file.import}<br/>`
                      : ""
                  }
                  ${
                    file.export
                      ? `<strong>Exports:</strong> ${file.export}<br/>`
                      : ""
                  }
                </div>
                <h2>Script/Code :</h2>
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
        let shareUrl: string | undefined;

        // ✅ CORRECTION : Priorité à l'URL de la dernière version
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

  // Gestion de la sélection
  const handleToggleSelection = useCallback(
    (fileId: string) => {
      if (onToggleSelection) {
        onToggleSelection(fileId);
      }
    },
    [onToggleSelection]
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => {
          const isSelected = selectedFiles.includes(file.id);
          const complexity = formatComplexity(file);

          return (
            <Card
              key={file.id}
              className={`
                hover:shadow-lg transition-all duration-200 cursor-pointer group
                ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
              `}
              onClick={() => handleCardClick(file)}
            >
              <CardContent className="p-4">
                {/* En-tête avec icône et sélection */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file)}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {file.name}
                      </h3>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getLabel(file.type)}
                      </Badge>
                    </div>
                  </div>

                  {/* Checkbox de sélection */}
                  {onToggleSelection && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelection(file.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>

                {/* Description */}
                {file.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {file.description}
                  </p>
                )}

                {/* Métadonnées principales */}
                <div className="space-y-2 mb-3">
                  {/* Complexité pour les fichiers avec script */}
                  {!file.isFolder && file.script && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Complexité</span>
                        <span>{complexity.label}</span>
                      </div>
                      <Progress value={complexity.value} className="h-1" />
                      <div className="text-xs text-gray-400">
                        {file.script.length} caractères
                      </div>
                    </div>
                  )}

                  {/* Informations pour les dossiers */}
                  {file.isFolder && file._count?.children && (
                    <div className="text-sm text-gray-500">
                      <Folder className="h-4 w-4 inline mr-1" />
                      {file._count.children} élément
                      {file._count.children > 1 ? "s" : ""}
                    </div>
                  )}

                  {/* Métadonnées de développement */}
                  {!file.isFolder && (
                    <div className="space-y-1">
                      {file.use && (
                        <div className="text-xs text-gray-500">
                          <Code className="h-3 w-3 inline mr-1" />
                          Utilise: {file.use}
                        </div>
                      )}
                      {file.import && (
                        <div className="text-xs text-gray-500">
                          <Import className="h-3 w-3 inline mr-1" />
                          Imports configurés
                        </div>
                      )}
                      {file.export && (
                        <div className="text-xs text-gray-500">
                          <Download className="h-3 w-3 inline mr-1" />
                          Exports fournis
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.slice(0, 3).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{file.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Auteurs */}
                {file.author && file.author.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    <Avatar className="h-6 w-6">
                      {file.author[0].image ? (
                        <AvatarImage src={file.author[0].image} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {getAuthorsDisplayName(file.author).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500 truncate">
                      {getAuthorsDisplayName(file.author)}
                    </span>
                  </div>
                )}

                {/* Date et actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Modifié le{" "}
                    {format(
                      file.updatedAt instanceof Date
                        ? file.updatedAt
                        : new Date(file.updatedAt),
                      "dd MMMM yyyy 'à' HH:mm",
                      { locale: fr }
                    )}
                  </span>

                  {/* Menu d'actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 w-6 p-0"
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
                        {file.path ? "Ouvrir le lien" : "Voir le contenu"}
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
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
