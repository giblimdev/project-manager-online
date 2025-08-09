// components/files/FilesFilter.tsx

/**
 * RÔLE : Composant de filtrage avancé des fichiers avec recherche multi-critères
 * RESPONSABILITÉS :
 * - Filtrage par recherche textuelle (nom, description, tags, relations)
 * - Filtrage par type FileType selon enum du schéma Prisma mis à jour
 * - Tri multi-colonnes (nom, type, taille, date, uploader) avec ordre asc/desc
 * - Interface moderne responsive avec Select et Input shadcn/ui
 * - Gestion des états de filtrage avec callbacks vers composant parent
 * - Feedback visuel des filtres actifs et reset rapide
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 *
 * COMPOSANTS UTILISÉS :
 * - Input: Composant de saisie shadcn/ui pour la recherche textuelle
 * - Select: Composant de sélection shadcn/ui pour type et tri
 * - Button: Composant bouton pour les actions de tri et reset
 * - Card, CardContent: Composants structurants pour organisation
 * - lucide-react: Icons pour Search, Filter, ArrowUpDown, X et types de fichiers
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useCallback, JSX pour gestion des événements
 * - Next.js 15 client component avec TypeScript strict mode
 * - shadcn/ui: Input, Select, Button, Card components avec design cohérent
 * - lucide-react: Icons modernes pour l'interface utilisateur
 * - Tailwind CSS: Design responsive avec spacing et hover effects
 *
 * PROPS reçues du parent :
 * - value: Valeur actuelle de la recherche textuelle
 * - onChange: Callback de changement de la recherche
 * - selectedType: Type FileType sélectionné pour le filtre
 * - onTypeChange: Callback de changement du type
 * - sortBy: Colonne de tri actuelle
 * - onSortByChange: Callback de changement de colonne de tri
 * - sortOrder: Ordre de tri (asc/desc)
 * - onSortOrderChange: Callback de changement d'ordre
 * - placeholder: Texte placeholder pour le champ de recherche
 */

"use client";

import React, { JSX, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  ArrowUpDown,
  X,
  ArrowUp,
  ArrowDown,
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
  File,
  FolderOpen,
  Sliders,
} from "lucide-react";

// ✅ Types mis à jour selon le nouveau schéma Prisma FileType
type FilterType =
  | "ALL"
  | "PAGE"
  | "COMPONENT"
  | "UTILS"
  | "LIB"
  | "STORE"
  | "HOOK"
  | "DOCUMENT"
  | "IMAGE"
  | "VIDEO"
  | "ARCHIVE"
  | "CODE"
  | "SPECIFICATION"
  | "DESIGN"
  | "TEST"
  | "OTHER";

type SortBy = "name" | "type" | "size" | "date" | "uploader";
type SortOrder = "asc" | "desc";

// Interface pour les props du composant
interface FilesFilterProps {
  value: string;
  onChange: (value: string) => void;
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
  sortBy: SortBy;
  onSortByChange: (sortBy: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  placeholder?: string;
}

export default function FilesFilter({
  value,
  onChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  placeholder = "Rechercher des fichiers...",
}: FilesFilterProps): JSX.Element {
  // Handler pour la recherche textuelle
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Handler pour le changement de type
  const handleTypeChange = useCallback(
    (type: string): void => {
      onTypeChange(type as FilterType);
    },
    [onTypeChange]
  );

  // Handler pour le changement de colonne de tri
  const handleSortByChange = useCallback(
    (sort: string): void => {
      onSortByChange(sort as SortBy);
    },
    [onSortByChange]
  );

  // Handler pour basculer l'ordre de tri
  const toggleSortOrder = useCallback((): void => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
  }, [sortOrder, onSortOrderChange]);

  // Handler pour reset tous les filtres
  const resetFilters = useCallback((): void => {
    onChange("");
    onTypeChange("ALL");
    onSortByChange("name");
    onSortOrderChange("asc");
  }, [onChange, onTypeChange, onSortByChange, onSortOrderChange]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters =
    value.trim() !== "" ||
    selectedType !== "ALL" ||
    sortBy !== "name" ||
    sortOrder !== "asc";

  // ✅ Fonction utilitaire mise à jour pour obtenir l'icône du type de fichier
  const getFileTypeIcon = useCallback((type: FilterType): JSX.Element => {
    switch (type) {
      case "PAGE":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "COMPONENT":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "UTILS":
        return <Settings className="h-4 w-4 text-orange-600" />;
      case "LIB":
        return <Layers className="h-4 w-4 text-indigo-600" />;
      case "STORE":
        return <Database className="h-4 w-4 text-green-600" />;
      case "HOOK":
        return <Code2 className="h-4 w-4 text-teal-600" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "IMAGE":
        return <Image className="h-4 w-4 text-pink-600" />;
      case "VIDEO":
        return <Video className="h-4 w-4 text-red-600" />;
      case "ARCHIVE":
        return <Archive className="h-4 w-4 text-yellow-600" />;
      case "CODE":
        return <Code2 className="h-4 w-4 text-gray-600" />;
      case "SPECIFICATION":
        return <FileText className="h-4 w-4 text-cyan-600" />;
      case "DESIGN":
        return <Paintbrush className="h-4 w-4 text-rose-600" />;
      case "TEST":
        return <TestTube className="h-4 w-4 text-emerald-600" />;
      case "OTHER":
        return <File className="h-4 w-4 text-gray-400" />;
      default:
        return <FolderOpen className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  // ✅ Fonction pour obtenir le label en français du type
  const getTypeLabel = useCallback((type: FilterType): string => {
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
      case "DOCUMENT":
        return "Document";
      case "IMAGE":
        return "Image";
      case "VIDEO":
        return "Vidéo";
      case "ARCHIVE":
        return "Archive";
      case "CODE":
        return "Code";
      case "SPECIFICATION":
        return "Spécification";
      case "DESIGN":
        return "Design";
      case "TEST":
        return "Test";
      case "OTHER":
        return "Autre";
      default:
        return "Tous les types";
    }
  }, []);

  // ✅ Fonction pour obtenir le label du tri
  const getSortLabel = useCallback((sort: SortBy): string => {
    switch (sort) {
      case "name":
        return "Nom";
      case "type":
        return "Type";
      case "size":
        return "Taille";
      case "date":
        return "Date";
      case "uploader":
        return "Créateur";
      default:
        return "Nom";
    }
  }, []);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* ✅ Header avec indicateur de filtres actifs amélioré */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-semibold text-gray-900">
                  Filtres
                </span>
              </div>
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Actifs
                  </span>
                  <span className="text-xs text-gray-500">
                    {[
                      value.trim() && "recherche",
                      selectedType !== "ALL" && "type",
                      (sortBy !== "name" || sortOrder !== "asc") && "tri",
                    ]
                      .filter(Boolean)
                      .join(" + ")}
                  </span>
                </div>
              )}
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* ✅ Ligne principale de filtres améliorée */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Recherche textuelle */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={handleSearchChange}
                className="pl-10 h-10"
              />
              {value.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filtre par type */}
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Tous les types">
                  {selectedType === "ALL" ? (
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                      <span>Tous les types</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {getFileTypeIcon(selectedType)}
                      <span>{getTypeLabel(selectedType)}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span>Tous les types</span>
                  </div>
                </SelectItem>

                {/* ✅ Section développement */}
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  Développement
                </div>
                <SelectItem value="PAGE">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span>Page Next.js</span>
                  </div>
                </SelectItem>
                <SelectItem value="COMPONENT">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Composant React</span>
                  </div>
                </SelectItem>
                <SelectItem value="UTILS">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-600" />
                    <span>Utilitaires</span>
                  </div>
                </SelectItem>
                <SelectItem value="LIB">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Librairie</span>
                  </div>
                </SelectItem>
                <SelectItem value="STORE">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span>Store</span>
                  </div>
                </SelectItem>
                <SelectItem value="HOOK">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-teal-600" />
                    <span>Hook React</span>
                  </div>
                </SelectItem>

                {/* ✅ Section général */}
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  Général
                </div>
                <SelectItem value="DOCUMENT">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Document</span>
                  </div>
                </SelectItem>
                <SelectItem value="CODE">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-gray-600" />
                    <span>Code</span>
                  </div>
                </SelectItem>
                <SelectItem value="SPECIFICATION">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-600" />
                    <span>Spécification</span>
                  </div>
                </SelectItem>
                <SelectItem value="TEST">
                  <div className="flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-emerald-600" />
                    <span>Test</span>
                  </div>
                </SelectItem>

                {/* ✅ Section média */}
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  Média
                </div>
                <SelectItem value="IMAGE">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-pink-600" />
                    <span>Image</span>
                  </div>
                </SelectItem>
                <SelectItem value="VIDEO">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-red-600" />
                    <span>Vidéo</span>
                  </div>
                </SelectItem>
                <SelectItem value="DESIGN">
                  <div className="flex items-center gap-2">
                    <Paintbrush className="h-4 w-4 text-rose-600" />
                    <span>Design</span>
                  </div>
                </SelectItem>
                <SelectItem value="ARCHIVE">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-yellow-600" />
                    <span>Archive</span>
                  </div>
                </SelectItem>
                <SelectItem value="OTHER">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-gray-400" />
                    <span>Autre</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* ✅ Tri combiné (colonne + ordre) */}
            <div className="flex gap-2">
              {/* Colonne de tri */}
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue placeholder="Trier par">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <span>{getSortLabel(sortBy)}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <span>🔤</span>
                      <span>Nom</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="type">
                    <div className="flex items-center gap-2">
                      <span>🏷️</span>
                      <span>Type</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="size">
                    <div className="flex items-center gap-2">
                      <span>📏</span>
                      <span>Taille</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Date</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="uploader">
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Créateur</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Ordre de tri */}
              <Button
                variant="outline"
                onClick={toggleSortOrder}
                className="h-10 px-3 flex items-center gap-2 min-w-fit"
              >
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {sortOrder === "asc" ? "Croissant" : "Décroissant"}
                </span>
              </Button>
            </div>
          </div>

          {/* ✅ Résumé des filtres actifs amélioré */}
          {hasActiveFilters && (
            <div className="border-t border-gray-100 pt-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">
                  Filtres actifs:
                </span>
                {value.trim() && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    <Search className="h-3 w-3" />
                    <span>"{value.trim()}"</span>
                    <button
                      onClick={() => onChange("")}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                )}
                {selectedType !== "ALL" && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {getFileTypeIcon(selectedType)}
                    <span>{getTypeLabel(selectedType)}</span>
                    <button
                      onClick={() => onTypeChange("ALL")}
                      className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                )}
                {(sortBy !== "name" || sortOrder !== "asc") && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span>
                      {getSortLabel(sortBy)} {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                    <button
                      onClick={() => {
                        onSortByChange("name");
                        onSortOrderChange("asc");
                      }}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
