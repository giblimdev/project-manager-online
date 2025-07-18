// components/items/ItemList.tsx
// Composant principal pour afficher les items selon le mode de vue
"use client";

import React from "react";
import { ItemListView } from "./views/ItemListView";
import { ItemCardView } from "./views/ItemCardview";
import { ItemTreeView } from "./views/ItemTreeView";
import { ItemKanbanView } from "./views/ItemKanbanView";
import type { ViewMode, Item } from "@/types/item";

interface ItemListProps {
  items: Item[];
  viewMode: ViewMode;
  onAdd: () => void;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  viewMode,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const viewProps = {
    items,
    onAdd,
    onEdit,
    onDelete,
    onReorder,
  };

  switch (viewMode) {
    case "list":
      return <ItemListView {...viewProps} />;
    case "card":
      return <ItemCardView {...viewProps} />;
    case "tree":
      return <ItemTreeView {...viewProps} />;
    case "kanban":
      return <ItemKanbanView {...viewProps} />;
    default:
      return <ItemListView {...viewProps} />;
  }
};
