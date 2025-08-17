// components/tasks/TasksDisplay.tsx

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, Table } from "lucide-react"; // Retiré LayoutKanban

interface TasksDisplayProps {
  displayMode: "list" | "table"; // Retiré "kanban"
  onDisplayModeChange: (mode: "list" | "table") => void; // Types mis à jour
}

export default function TasksDisplay({ 
  displayMode, 
  onDisplayModeChange 
}: TasksDisplayProps) {
  return (
    <div className="flex justify-end mb-4">
      <ToggleGroup 
        type="single" 
        value={displayMode}
        onValueChange={(value) => 
          // Seuls "list" et "table" sont autorisés
          onDisplayModeChange(value as "list" | "table")
        }
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">List</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="table" aria-label="Table view">
          <Table className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">Table</span>
        </ToggleGroupItem>
      </ToggleGroup> 
    </div>
  );
}