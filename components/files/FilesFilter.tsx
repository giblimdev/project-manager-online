// components/files/FilesFilter.tsx
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  FileText,
  Image,
  Video,
  Archive,
  Code,
  FileCode,
  Palette,
  TestTube,
  MoreHorizontal,
} from "lucide-react";

type FilterType =
  | "ALL"
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

interface FilesFilterProps {
  value: string;
  onChange: (value: string) => void;
  selectedType: FilterType;
  onTypeChange: (type: FilterType) => void;
  sortBy: SortBy;
  onSortByChange: (sort: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  placeholder?: string;
}

export const FilesFilter: React.FC<FilesFilterProps> = ({
  value,
  onChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  placeholder = "Rechercher des fichiers...",
}) => {
  const getFileTypeIcon = (type: FilterType) => {
    switch (type) {
      case "DOCUMENT":
        return <FileText className="h-4 w-4" />;
      case "IMAGE":
        return <Image className="h-4 w-4" />;
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "ARCHIVE":
        return <Archive className="h-4 w-4" />;
      case "CODE":
        return <Code className="h-4 w-4" />;
      case "SPECIFICATION":
        return <FileCode className="h-4 w-4" />;
      case "DESIGN":
        return <Palette className="h-4 w-4" />;
      case "TEST":
        return <TestTube className="h-4 w-4" />;
      case "OTHER":
        return <MoreHorizontal className="h-4 w-4" />;
      default:
        return <Filter className="h-4 w-4" />;
    }
  };

  const getFileTypeLabel = (type: FilterType) => {
    switch (type) {
      case "ALL":
        return "Tous les types";
      case "DOCUMENT":
        return "Documents";
      case "IMAGE":
        return "Images";
      case "VIDEO":
        return "Vidéos";
      case "ARCHIVE":
        return "Archives";
      case "CODE":
        return "Code";
      case "SPECIFICATION":
        return "Spécifications";
      case "DESIGN":
        return "Design";
      case "TEST":
        return "Tests";
      case "OTHER":
        return "Autres";
      default:
        return type;
    }
  };

  const getSortLabel = (sort: SortBy) => {
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
        return "Uploader";
      default:
        return sort;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Barre de recherche */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-4 h-10"
        />
      </div>

      {/* Filtre par type */}
      <Select
        value={selectedType}
        onValueChange={(value) => onTypeChange(value as FilterType)}
      >
        <SelectTrigger className="w-[180px] h-10">
          <div className="flex items-center gap-2">
            {getFileTypeIcon(selectedType)}
            <SelectValue placeholder="Type de fichier" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tous les types
            </div>
          </SelectItem>
          <SelectItem value="DOCUMENT">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </div>
          </SelectItem>
          <SelectItem value="IMAGE">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </div>
          </SelectItem>
          <SelectItem value="VIDEO">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Vidéos
            </div>
          </SelectItem>
          <SelectItem value="ARCHIVE">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Archives
            </div>
          </SelectItem>
          <SelectItem value="CODE">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code
            </div>
          </SelectItem>
          <SelectItem value="SPECIFICATION">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              Spécifications
            </div>
          </SelectItem>
          <SelectItem value="DESIGN">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Design
            </div>
          </SelectItem>
          <SelectItem value="TEST">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Tests
            </div>
          </SelectItem>
          <SelectItem value="OTHER">
            <div className="flex items-center gap-2">
              <MoreHorizontal className="h-4 w-4" />
              Autres
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Tri */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 px-3">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {getSortLabel(sortBy)}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onSortByChange("name")}>
            <div className="flex items-center justify-between w-full">
              <span>Nom</span>
              {sortBy === "name" && (
                <span className="text-blue-600">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange("type")}>
            <div className="flex items-center justify-between w-full">
              <span>Type</span>
              {sortBy === "type" && (
                <span className="text-blue-600">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange("size")}>
            <div className="flex items-center justify-between w-full">
              <span>Taille</span>
              {sortBy === "size" && (
                <span className="text-blue-600">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange("date")}>
            <div className="flex items-center justify-between w-full">
              <span>Date modifiée</span>
              {sortBy === "date" && (
                <span className="text-blue-600">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortByChange("uploader")}>
            <div className="flex items-center justify-between w-full">
              <span>Uploader</span>
              {sortBy === "uploader" && (
                <span className="text-blue-600">
                  {sortOrder === "asc" ? "↑" : "↓"}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bouton ordre de tri */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
        className="h-10 w-10 p-0"
      >
        {sortOrder === "asc" ? "↑" : "↓"}
      </Button>
    </div>
  );
};
