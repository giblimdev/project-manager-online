// 📄 /components/userStories/UserStoriesDisplay.tsx
// 🎯 Rôle : Composant qui permet de sélectionner le mode d'affichage des User Stories
// - Pas de logique métier
// - Affiche simplement deux boutons (liste / carte)
// - Utilise shadcn/ui et icônes Lucide

import { Button } from "@/components/ui/button";
import { List, Grid } from "lucide-react";

interface Props {
  viewMode: "list" | "card";
  onChange: (mode: "list" | "card") => void;
}

export default function UserStoriesDisplay({ viewMode, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("list")}
        className="flex items-center gap-1"
      >
        <List className="h-4 w-4" />
        Liste
      </Button>

      <Button
        variant={viewMode === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("card")}
        className="flex items-center gap-1"
      >
        <Grid className="h-4 w-4" />
        Carte
      </Button>
    </div>
  );
}
