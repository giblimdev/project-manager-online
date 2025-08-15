// @/components/files/views/FilesViewList.tsx

/**
 * RÔLE : Vue tableau des métadonnées de fichiers avec colonnes triables
 * RESPONSABILITÉS :
 * - Affichage en table responsive avec colonnes triables: nom, type, taille, auteur, date
 * - Navigation dans l'arborescence par clic sur dossiers virtuels
 * - Actions par ligne : édition, suppression, partage, duplication, téléchargement
 * - Gestion différenciée dossiers/fichiers avec icônes spécifiques
 * - Tri performant avec correction de la gestion des dates et auteurs multiples
 * - Support du multi-sélection avec checkbox
 * - Interface moderne avec shadcn/ui, lucide-react, tailwind CSS
 * - Typescript strict mode compatible Next.js 15 client component
 */
"use client"; 

import React, { useMemo, useCallback, JSX } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  Download,
  Share2,
  Copy,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { FileWithRelations, SortBy, SortOrder } from "@/types/files";
import { FileType } from "@/lib/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface FilesViewListProps {
  files: FileWithRelations[];
  currentFolder: string | null;
  onEdit: (file: FileWithRelations) => void;
  onDelete: (file: FileWithRelations) => void;
  onDownload: (file: FileWithRelations) => void;
  onShare: (file: FileWithRelations) => void;
  onDuplicate: (file: FileWithRelations) => void;
  onFolderNavigate: (folderId: string | null, folderName?: string) => void;
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy) => void;
  getFileTypeIcon: (type: FileType, isFolder?: boolean) => JSX.Element;
  getTypeLabel: (type: FileType) => string;
  formatFileSize: (bytes: number | null) => string;
  isReorganizing: boolean;
  processingFileId: string | null;
  onReorganize: (fileId: string, direction: "up" | "down", currentIndex: number, totalFiles: number) => void;
}

export default function FilesViewList({
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
  sortBy,
  sortOrder,
  onSortChange,
  getFileTypeIcon,
  getTypeLabel,
  formatFileSize,
  isReorganizing,
  processingFileId,
  onReorganize,
}: FilesViewListProps): JSX.Element {
  const collator = useMemo(
    () => new Intl.Collator("fr", { sensitivity: "base", numeric: true }),
    []
  );

  const getAuthorsDisplayName = useCallback(
    (authors: FileWithRelations["author"]): string => {
      if (!authors || authors.length === 0) return "Inconnu";
      if (authors.length === 1) {
        const a = authors[0];
        if (a.firstName && a.lastName) return `${a.firstName} ${a.lastName}`;
        return a.name ?? a.email ?? "Inconnu";
      }
      return `${authors.length} auteurs`;
    },
    []
  );

  const getTimestamp = useCallback((date: Date | string): number => {
    if (date instanceof Date) return date.getTime();
    return new Date(date).getTime();
  }, []);

  const sortedFiles = useMemo(() => {
    if (!sortBy) return files;
    const arr = [...files];
    arr.sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;
      switch (sortBy) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "size":
          // Utilise la longueur du script comme taille pour les fichiers
          aVal = a.isFolder ? Number.NEGATIVE_INFINITY : (a.script?.length ?? 0);
          bVal = b.isFolder ? Number.NEGATIVE_INFINITY : (b.script?.length ?? 0);
          break;
        case "date":
          aVal = getTimestamp(a.updatedAt);
          bVal = getTimestamp(b.updatedAt);
          break;
        case "author": {
          const aAuthor = a.author?.[0];
          const bAuthor = b.author?.[0];
          const aName = aAuthor
            ? `${aAuthor.lastName ?? ""} ${aAuthor.firstName ?? ""}`.trim() ||
              aAuthor.name ||
              aAuthor.email ||
              ""
            : "";
          const bName = bAuthor
            ? `${bAuthor.lastName ?? ""} ${bAuthor.firstName ?? ""}`.trim() ||
              bAuthor.name ||
              bAuthor.email ||
              ""
            : "";
          aVal = aName;
          bVal = bName;
          break;
        }
        default:
          aVal = 0;
          bVal = 0;
      }
      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = collator.compare(String(aVal), String(bVal));
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [files, sortBy, sortOrder, collator, getTimestamp]);

  const handleSort = useCallback(
    (key: SortBy) => {
      onSortChange(key);
    },
    [onSortChange]
  );

  const renderSortIcon = (key: SortBy) => {
    if (sortBy !== key) return null;
    return sortOrder === "asc" ? (
      <span aria-label="tri ascendant">▲</span>
    ) : (
      <span aria-label="tri descendant">▼</span>
    );
  };

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

  const allSelected =
    selectedFiles.length > 0 && selectedFiles.length === files.length;

  const toggleAll = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      const selectedSet = new Set(selectedFiles);
      if (allSelected) {
        files.forEach((f) => {
          if (selectedSet.has(f.id)) onToggleSelection(f.id);
        });
      } else {
        files.forEach((f) => {
          if (!selectedSet.has(f.id)) onToggleSelection(f.id);
        });
      }
    },
    [onToggleSelection, files, selectedFiles, allSelected]
  );

  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>
          {currentFolder
            ? "Ce dossier ne contient aucune référence."
            : "Aucune référence trouvée."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => {}}
                onClick={toggleAll}
                aria-label="Sélectionner tout"
              />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("name")}
            >
              Nom {renderSortIcon("name")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("type")}
            >
              Type {renderSortIcon("type")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right hidden sm:table-cell"
              onClick={() => handleSort("size")}
            >
              Taille {renderSortIcon("size")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("author")}
            >
              Auteur {renderSortIcon("author")}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("date")}
            >
              Modifié {renderSortIcon("date")}
            </TableHead>
            <TableHead className="w-40 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFiles.map((file, index) => {
            const isSelected = selectedFiles.includes(file.id);
            const updatedAt =
              file.updatedAt instanceof Date
                ? file.updatedAt
                : new Date(file.updatedAt);
            const isProcessing = processingFileId === file.id && isReorganizing;
            const totalFiles = sortedFiles.length;
                
            return (
              <TableRow
                key={file.id}
                className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                  isSelected ? "bg-blue-100" : ""
                } ${isProcessing ? "opacity-50" : ""}`}
                onClick={() => handleRowClick(file)}
              >
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  className="align-middle"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelection(file.id)}
                    aria-label={`Sélectionner ${file.name}`}
                    disabled={isProcessing}
                  />
                </TableCell>
                <TableCell className="flex items-center gap-2 max-w-[320px]">
                  <div className="flex items-center">
                    {getFileTypeIcon(file.type, file.isFolder)}
                    <span className="truncate ml-2" title={file.name}> 
                      {file.name}
                    </span>
                  </div>
                  {file.version > 1 && (
                    <Badge variant="destructive" className="ml-2">
                      v{file.version}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getTypeLabel(file.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {file.isFolder
                    ? `${file._count?.children ?? 0} éléments`
                    : formatFileSize(file.script?.length ?? 0)}
                </TableCell>
                <TableCell title={getAuthorsDisplayName(file.author)}>
                  <span className="truncate max-w-[150px] block">
                    {getAuthorsDisplayName(file.author)}
                  </span>
                </TableCell>
                <TableCell>
                  {Number.isFinite(updatedAt.getTime())
                    ? format(updatedAt, "dd MMM yyyy", { locale: fr })
                    : "—"}
                </TableCell>
                <TableCell
                  className="text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            disabled={isProcessing || isReorganizing || index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorganize(file.id, "up", index, totalFiles);
                            }}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowUp className="h-4 w-4" />
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
                            disabled={isProcessing || isReorganizing || index === totalFiles - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReorganize(file.id, "down", index, totalFiles);
                            }}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Déplacer vers le bas</TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(file)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          
                          {!file.isFolder && (
                            <DropdownMenuItem onClick={() => onDownload(file)}>
                              <Download className="mr-2 h-4 w-4" /> Télécharger
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => onShare(file)}>
                            <Share2 className="mr-2 h-4 w-4" /> Partager
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => onDuplicate(file)}>
                            <Copy className="mr-2 h-4 w-4" /> Dupliquer
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => onDelete(file)} 
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}