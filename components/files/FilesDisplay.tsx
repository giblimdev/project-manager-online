// components/files/FilesDisplay.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { List, Grid3X3, GitBranch, LayoutGrid } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ViewMode = "list" | "card" | "branch";

interface FilesDisplayProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const FilesDisplay: React.FC<FilesDisplayProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vue liste</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("card")}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vue grille</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === "branch" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("branch")}
              className="h-8 w-8 p-0"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vue arborescence</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
