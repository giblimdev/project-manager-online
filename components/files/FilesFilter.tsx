// components/files/FilesFilter.tsx

/**
 * RÔLE : Composant de filtrage avancé des métadonnées de fichiers selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Filtrage par recherche textuelle (nom, description, tags, import, export, use, script)
 * - Filtrage par type FileType selon enum EXACT du schéma Prisma (DOSSIER, ENV, SYSTEM, etc.)
 * - Tri multi-colonnes (nom, type, taille, date, author) avec ordre asc/desc
 * - Interface moderne responsive avec Select et Input shadcn/ui
 * - Gestion des états de filtrage avec callbacks vers composant parent
 * - Feedback visuel des filtres actifs et reset rapide
 * - Support spécifique à l'aide au développement avec métadonnées
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
  File,
  Folder,
  Sliders,
  Globe,
  TestTube,
  Users,
  Calendar,
} from "lucide-react";

// ✅ Import des types centralisés CORRECTS
import type { FilterType, SortBy, SortOrder } from "@/types/files";

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
  placeholder = "Rechercher par nom, description, import, export, use, script, tags...",
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

  // ✅ Fonction utilitaire CORRIGÉE pour obtenir l'icône du type selon schéma Prisma EXACT
  const getFileTypeIcon = useCallback((type: FilterType): JSX.Element => {
    switch (type) {
      case "DOSSIER":
        return <Folder className="h-4 w-4 text-blue-500" />;
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
      case "OTHER":
        return <File className="h-4 w-4 text-gray-400" />;
      default:
        return <Filter className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  // ✅ Fonction CORRIGÉE pour obtenir le label en français du type
  const getTypeLabel = useCallback((type: FilterType): string => {
    switch (type) {
      case "DOSSIER":
        return "Dossier";
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
      case "OTHER":
        return "Autre";
      default:
        return "Tous les types";
    }
  }, []);

  // ✅ Fonction pour obtenir le label du tri CORRIGÉE
  const getSortLabel = useCallback((sort: SortBy): string => {
    switch (sort) {
      case "name":
        return "Nom";
      case "type":
        return "Type";
      case "size":
        return "Complexité";
      case "date":
        return "Date";
      case "author":
        return "Auteurs";
      default:
        return "Nom";
    }
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* ✅ Header avec indicateur de filtres actifs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900">Filtres</span>
            {hasActiveFilters && (
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
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
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* ✅ Ligne principale de filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche textuelle étendue */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={value}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {value.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filtre par type FileType EXACT selon schéma Prisma */}
          <Select value={selectedType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue>
                {selectedType === "ALL" ? (
                  <span className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Tous les types
                  </span>
                ) : (
                  <span className="flex items-center">
                    {getFileTypeIcon(selectedType)}
                    <span className="ml-2">{getTypeLabel(selectedType)}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Tous les types
                </span>
              </SelectItem>

              {/* ✅ Section développement avec types EXACTS du schéma Prisma */}
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                Développement
              </div>
              <SelectItem value="DOSSIER">
                <span className="flex items-center">
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                  Dossier
                </span>
              </SelectItem>
              <SelectItem value="PAGE">
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-green-500" />
                  Page Next.js
                </span>
              </SelectItem>
              <SelectItem value="COMPONENT">
                <span className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-500" />
                  Composant React
                </span>
              </SelectItem>
              <SelectItem value="UTILS">
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-gray-500" />
                  Utilitaires
                </span>
              </SelectItem>
              <SelectItem value="LIB">
                <span className="flex items-center">
                  <Layers className="h-4 w-4 mr-2 text-purple-500" />
                  Librairie
                </span>
              </SelectItem>
              <SelectItem value="STORE">
                <span className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-orange-500" />
                  Store
                </span>
              </SelectItem>
              <SelectItem value="HOOK">
                <span className="flex items-center">
                  <Code2 className="h-4 w-4 mr-2 text-pink-500" />
                  Hook React
                </span>
              </SelectItem>

              {/* ✅ Section système avec nouveaux types */}
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                Système
              </div>
              <SelectItem value="ENV">
                <span className="flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-yellow-500" />
                  Environment
                </span>
              </SelectItem>
              <SelectItem value="SYSTEM">
                <span className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-red-500" />
                  Système
                </span>
              </SelectItem>
              <SelectItem value="TEST">
                <span className="flex items-center">
                  <TestTube className="h-4 w-4 mr-2 text-green-600" />
                  Test
                </span>
              </SelectItem>
              <SelectItem value="OTHER">
                <span className="flex items-center">
                  <File className="h-4 w-4 mr-2 text-gray-400" />
                  Autre
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Colonne de tri */}
          <Select value={sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger>
              <SelectValue>
                <span className="flex items-center">
                  <Sliders className="h-4 w-4 mr-2" />
                  {getSortLabel(sortBy)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">
                <span className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Nom
                </span>
              </SelectItem>
              <SelectItem value="type">
                <span className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Type
                </span>
              </SelectItem>
              <SelectItem value="size">
                <span className="flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Complexité
                </span>
              </SelectItem>
              <SelectItem value="date">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                </span>
              </SelectItem>
              <SelectItem value="author">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Auteurs
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Ordre de tri */}
          <Button
            variant="outline"
            onClick={toggleSortOrder}
            className="flex items-center justify-center"
          >
            {sortOrder === "asc" ? (
              <ArrowUp className="h-4 w-4 mr-2" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-2" />
            )}
            {sortOrder === "asc" ? "Croissant" : "Décroissant"}
          </Button>
        </div>

        {/* ✅ Résumé des filtres actifs */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">
                Filtres actifs:
              </span>
              {value.trim() && (
                <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  "{value.trim()}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange("")}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              )}
              {selectedType !== "ALL" && (
                <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  {getFileTypeIcon(selectedType)}
                  <span className="ml-1">{getTypeLabel(selectedType)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTypeChange("ALL")}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              )}
              {(sortBy !== "name" || sortOrder !== "asc") && (
                <span className="inline-flex items-center bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {getSortLabel(sortBy)} {sortOrder === "asc" ? "↑" : "↓"}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSortByChange("name");
                      onSortOrderChange("asc");
                    }}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
