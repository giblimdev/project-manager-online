// @/components/files/FilesList.tsx

/**
 * RÔLE : Composant principal de liste des fichiers avec réorganisation
 * RESPONSABILITÉS :
 * - Affichage des boutons up/down pour chaque fichier
 * - Gestion des appels API de réorganisation
 * - Feedback visuel et désactivation pendant les actions
 * - Rafraîchissement automatique après modification
 *
 * COMPOSANTS UTILISÉS :
 * - Button: Boutons d'action up/down avec states
 * - ArrowUp, ArrowDown: Icônes lucide-react
 *
 * LIBS UTILISÉS :
 * - React 19 hooks avec TypeScript strict
 * - sonner: Toast notifications
 */

"use client";

import React, { JSX, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  FileText,
  Folder,
  Loader2,
} from "lucide-react";

import type { FileWithRelations } from "@/types/files";

interface FileListItemProps {
  file: FileWithRelations;
  index: number;
  totalCount: number;
  onEdit: (file: FileWithRelations) => void;
  onDelete?: (file: FileWithRelations) => void;
  onRefresh: () => void;
  currentFolder: string | null;
  isReorganizing: boolean;
  onReorganizeStart: () => void;
  onReorganizeEnd: () => void;
}

function FileListItem({
  file,
  index,
  totalCount,
  onEdit,
  onDelete,
  onRefresh,
  currentFolder,
  isReorganizing,
  onReorganizeStart,
  onReorganizeEnd,
}: FileListItemProps): JSX.Element {
  // Fonction pour déplacer vers le haut
  const handleMoveUp = useCallback(async () => {
    if (isReorganizing || index === 0) return;

    onReorganizeStart();
    try {
      const response = await fetch(`/api/files/${file.id}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction: "up",
          currentFolder,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Erreur lors du déplacement");
      }

      toast.success("Déplacement réussi", {
        description: `"${file.name}" déplacé vers le haut`,
      });

      onRefresh();
    } catch (error) {
      console.error("💥 Erreur lors du déplacement vers le haut:", error);
      toast.error("Erreur de déplacement", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      onReorganizeEnd();
    }
  }, [
    file.id,
    file.name,
    currentFolder,
    index,
    isReorganizing,
    onReorganizeStart,
    onReorganizeEnd,
    onRefresh,
  ]);

  // Fonction pour déplacer vers le bas
  const handleMoveDown = useCallback(async () => {
    if (isReorganizing || index === totalCount - 1) return;

    onReorganizeStart();
    try {
      const response = await fetch(`/api/files/${file.id}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction: "down",
          currentFolder,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Erreur lors du déplacement");
      }

      toast.success("Déplacement réussi", {
        description: `"${file.name}" déplacé vers le bas`,
      });

      onRefresh();
    } catch (error) {
      console.error("💥 Erreur lors du déplacement vers le bas:", error);
      toast.error("Erreur de déplacement", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      onReorganizeEnd();
    }
  }, [
    file.id,
    file.name,
    currentFolder,
    index,
    totalCount,
    isReorganizing,
    onReorganizeStart,
    onReorganizeEnd,
    onRefresh,
  ]);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      {/* Informations du fichier */}
      <div className="flex items-center space-x-3 flex-1">
        <div className="flex-shrink-0">
          {file.isFolder ? (
            <Folder className="h-5 w-5 text-blue-500" />
          ) : (
            <FileText className="h-5 w-5 text-gray-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          {file.description && (
            <p className="text-xs text-gray-500 truncate">{file.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {file.type}
          </span>
        </div>
      </div>

      {/* Actions de réorganisation */}
      <div className="flex items-center space-x-2 ml-4">
        {/* Bouton Up */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMoveUp}
          disabled={isReorganizing || index === 0}
          className="h-8 w-8 p-0"
          title={
            index === 0 ? "Déjà en première position" : "Déplacer vers le haut"
          }
        >
          {isReorganizing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowUp className="h-3 w-3" />
          )}
        </Button>

        {/* Bouton Down */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleMoveDown}
          disabled={isReorganizing || index === totalCount - 1}
          className="h-8 w-8 p-0"
          title={
            index === totalCount - 1
              ? "Déjà en dernière position"
              : "Déplacer vers le bas"
          }
        >
          {isReorganizing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
        </Button>

        {/* Actions standard */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(file)}
          className="h-8 w-8 p-0"
          title="Modifier"
        >
          <Edit className="h-3 w-3" />
        </Button>

        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(file)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Composant principal FilesList mis à jour
interface FileListProps {
  files: FileWithRelations[];
  onEdit: (file: FileWithRelations) => void;
  onDelete?: (file: FileWithRelations) => void;
  onRefresh: () => void;
  currentFolder: string | null;
}

export default function FilesList({
  files,
  onEdit,
  onDelete,
  onRefresh,
  currentFolder,
}: FileListProps): JSX.Element {
  const [isReorganizing, setIsReorganizing] = useState(false);

  const handleReorganizeStart = useCallback(() => {
    setIsReorganizing(true);
  }, []);

  const handleReorganizeEnd = useCallback(() => {
    setIsReorganizing(false);
  }, []);

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun fichier
        </h3>
        <p className="text-gray-500">
          {currentFolder
            ? "Ce dossier ne contient aucune référence pour le moment."
            : "Commencez par ajouter des références de fichiers à votre projet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* En-tête avec indicateur de réorganisation */}
      {isReorganizing && (
        <div className="flex items-center justify-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-600" />
          <span className="text-sm text-blue-700">
            Réorganisation en cours...
          </span>
        </div>
      )}

      {/* Liste des fichiers */}
      {files.map((file, index) => (
        <FileListItem
          key={file.id}
          file={file}
          index={index}
          totalCount={files.length}
          onEdit={onEdit}
          onDelete={onDelete}
          onRefresh={onRefresh}
          currentFolder={currentFolder}
          isReorganizing={isReorganizing}
          onReorganizeStart={handleReorganizeStart}
          onReorganizeEnd={handleReorganizeEnd}
        />
      ))}
    </div>
  );
}
