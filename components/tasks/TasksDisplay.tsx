// 📄 /components/tasks/TasksDisplay.tsx
// 🎯 Rôle : Permet de sélectionner le mode d'affichage (liste, carte)
// 📦 Responsabilités : Basculement entre les vues, interface utilisateur moderne
// 🔧 Composants utilisés : Button, ToggleGroup de shadcn/ui, icônes Lucide React

import { LayoutGrid, List, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

interface TasksDisplayProps {
  viewMode: "list" | "card";
  onChange: (mode: "list" | "card") => void;
}

export default function TasksDisplay({
  viewMode,
  onChange,
}: TasksDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
          Affichage:
        </span>
      </div>

      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => value && onChange(value as "list" | "card")}
        className="border rounded-lg p-1 bg-background"
      >
        <ToggleGroupItem
          value="list"
          aria-label="Vue liste"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-200"
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Liste</span>
        </ToggleGroupItem>

        <ToggleGroupItem
          value="card"
          aria-label="Vue cartes"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground transition-all duration-200"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Cartes</span>
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Badge indicateur */}
      <Badge variant="secondary" className="text-xs hidden md:inline-flex">
        {viewMode === "list" ? "Mode Liste" : "Mode Cartes"}
      </Badge>
    </div>
  );
}
