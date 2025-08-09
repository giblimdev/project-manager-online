//@/components/features/Features/FeaturesDisplay.tsx

import { Button } from "@/components/ui/button";
import { List, Grid3X3, GitBranch } from "lucide-react";

interface FeatureDisplayProps {
  viewMode: "list" | "grid" | "branch";
  onViewModeChange: (mode: "list" | "grid" | "branch") => void;
}

export default function FeatureDisplay({
  viewMode,
  onViewModeChange,
}: FeatureDisplayProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        title="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        title="Grid view"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "branch" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("branch")}
        title="Branch view"
      >
        <GitBranch className="h-4 w-4" />
      </Button>
    </div>
  );
}
