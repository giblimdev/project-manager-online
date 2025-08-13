// @/components/features/DisplayModeSelector.tsx

// Rôle : Sélecteur de mode d'affichage pour les features
// Responsabilités : Interface de sélection, persistance mode, feedback visuel
// Composants utilisés : Button, Badge, Tooltip (shadcn/ui)
// Libs externes : lucide-react (icônes)
// Types utilisés : FeatureDisplayMode, DisplayModeConfig
// Utilisé par : page features, header d'actions

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { List, GitBranch, FileText } from "lucide-react";
import { FeatureDisplayMode, DISPLAY_MODE_CONFIGS } from "@/types/feature";

interface DisplayModeSelectorProps {
  currentMode: FeatureDisplayMode;
  onModeChange: (mode: FeatureDisplayMode) => void;
  disabled?: boolean;
  className?: string;
}

const modeIcons = {
  [FeatureDisplayMode.LIST]: List,
  [FeatureDisplayMode.TREE]: GitBranch,
  [FeatureDisplayMode.DETAIL]: FileText,
};

export const DisplayModeSelector: React.FC<DisplayModeSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false,
  className = "",
}) => {
  return (
    <TooltipProvider>
      <div
        className={`flex items-center gap-1 bg-gray-100 rounded-lg p-1 ${className}`}
      >
        {Object.values(FeatureDisplayMode).map((mode) => {
          const config = DISPLAY_MODE_CONFIGS[mode];
          const IconComponent = modeIcons[mode];
          const isActive = currentMode === mode;

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onModeChange(mode)}
                  disabled={disabled}
                  className={`
                    relative h-8 px-3 transition-all duration-200
                    ${
                      isActive
                        ? "bg-white shadow-sm text-gray-900"
                        : "hover:bg-gray-200 text-gray-600"
                    }
                  `}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{config.label}</span>

                  {isActive && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-blue-500"
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-center">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-gray-600">{config.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
