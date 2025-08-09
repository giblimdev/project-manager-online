//@/components/features/FeatureList.tsx

import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import FeatureViewList from "@/components/features/views/FeatureViewList";
import FeatureViewCard from "@/components/features/views/FeatureViewCard";
import FeatureViewBranch from "@/components/features/views/FeatureViewBranch";
import { Skeleton } from "@/components/ui/skeleton";

interface FeatureListProps {
  files: File[];
  loading: boolean;
  onEdit: (file: File) => void;
  onDelete: (id: string) => void;
  viewMode: "list" | "grid" | "branch";
}

export default function FeatureList({
  files,
  loading,
  onEdit,
  onDelete,
  viewMode,
}: FeatureListProps) {
  const handleMove = async (id: string, direction: "up" | "down") => {
    // Implement move logic
    console.log(`Move ${id} ${direction}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <FeatureViewList files={files} onEdit={onEdit} onDelete={onDelete} />
    );
  }

  if (viewMode === "grid") {
    return (
      <FeatureViewCard files={files} onEdit={onEdit} onDelete={onDelete} />
    );
  }

  return (
    <FeatureViewBranch files={files} onEdit={onEdit} onDelete={onDelete} />
  );
}
