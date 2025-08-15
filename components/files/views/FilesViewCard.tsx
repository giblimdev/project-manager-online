// @/components/files/views/FilesViewCard.tsx

/**
 * RÔLE : Vue grille des métadonnées fichiers/dossiers avec cartes visuelles
 * RESPONSABILITÉS :
 * - Affichage responsive en grille adaptative par taille d'écran
 * - Cartes individuelles avec icônes spécifiques dossiers/fichiers
 * - Actions sur chaque carte : éditer, supprimer, partager, dupliquer, télécharger/voir
 * - Statut, tags, version, date modif visibles
 * - Utilisation de shadcn/ui, Tailwind, lucide-react, toast notifications
 * - TypeScript strict + Next.js 15 compatible
 */

"use client";

import { JSX, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Download,
  Share2,
  Copy,
  MoreVertical,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import type { FileWithRelations, FilesViewProps } from "@/types/files";
import { Checkbox } from "@/components/ui/checkbox";
import { FileType } from "@/lib/generated/prisma/client";

export default function FilesViewCard({
  files,
  currentFolder,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onDuplicate,
  onFolderNavigate,
  selectedFiles,
  onToggleSelection,
  getFileTypeIcon,
  getTypeLabel,
  formatFileSize,
}: FilesViewProps): JSX.Element {
  // Format script size for display
  const getScriptSize = useCallback((file: FileWithRelations) => {
    if (!file.script) return null;
    return file.script.length;
  }, []);

  // Format author names into display string
  const getAuthorsDisplay = useCallback((authors: FileWithRelations["author"]) => {
    if (!authors || authors.length === 0) return "Inconnu";
    if (authors.length === 1) {
      const author = authors[0];
      if (author.firstName && author.lastName) return `${author.firstName} ${author.lastName}`;
      return author.name || author.email || "Inconnu";
    }
    return `${authors.length} auteurs`;
  }, []);

  // Handle card click: navigate folders or open file for edit
  const handleCardClick = useCallback(
    (file: FileWithRelations) => {
      if (file.isFolder) onFolderNavigate(file.id, file.name);
      else onEdit(file);
    },
    [onFolderNavigate, onEdit]
  );

  // Display empty state when no files
  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-6">
          {getFileTypeIcon(FileType.DOSSIER, true)}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-700">
          {currentFolder ? "Dossier vide" : "Aucun fichier"}
        </h3>
        
        <p className="text-gray-500 max-w-md mx-auto mt-2">
          {currentFolder 
            ? "Ce dossier ne contient aucune référence pour le moment."
            : "Commencez par ajouter des références de fichiers à votre projet."
          }
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {files.map((file) => {
          const selected = selectedFiles.includes(file.id);
          const scriptSize = getScriptSize(file);
          const updatedAt = file.updatedAt instanceof Date 
            ? file.updatedAt 
            : new Date(file.updatedAt);
            
          return (
            <Card
              key={file.id}
              onClick={() => handleCardClick(file)}
              className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                selected ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3"> 
                  <div className="flex items-center space-x-2">
                    {getFileTypeIcon(file.type, file.isFolder)}
                    <div>
                      <h3 className="font-semibold truncate max-w-[150px]" title={file.name}>
                        {file.name}
                      </h3>
                      <Badge variant="secondary" className="capitalize">
                        {getTypeLabel(file.type)}
                      </Badge>
                    </div>
                  </div>
                  
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggleSelection(file.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Sélectionner ${file.name}`}
                    className="w-5 h-5"
                  />
                </div>
                
                {file.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{file.description}</p>
                )}

                <div className="flex flex-wrap gap-1 mb-3">
                  {file.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {file.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{file.tags.length - 3}
                    </Badge>
                  )}
                  
                  {file.version > 1 && (
                    <Badge variant="destructive" className="text-xs">
                      v{file.version}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span className="truncate max-w-[120px]" title={getAuthorsDisplay(file.author)}>
                    {getAuthorsDisplay(file.author)}
                  </span>
                  
                  {scriptSize !== null && (
                    <span>{formatFileSize(scriptSize)}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <time dateTime={updatedAt.toISOString()}>
                      {format(updatedAt, "dd MMM yyyy", { locale: fr })}
                    </time>
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(file)}>
                        <Edit className="w-4 h-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      {!file.isFolder && (
                        <DropdownMenuItem onClick={() => onDownload(file)}>
                          <Download className="w-4 h-4 mr-2" /> Télécharger
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onShare(file)}>
                        <Share2 className="w-4 h-4 mr-2" /> Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(file)}>
                        <Copy className="w-4 h-4 mr-2" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(file)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Supprimer
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