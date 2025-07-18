// components/items/views/item-list-view.tsx
// Vue en liste pour l'affichage des items
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Edit, Trash2, Plus } from "lucide-react";
import type { Item } from "@/types/item"; 

interface ItemListViewProps {
  items: Item[];
  onAdd: () => void;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
}

export const ItemListView: React.FC<ItemListViewProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "INITIATIVE":
        return "bg-purple-100 text-purple-800";
      case "EPIC":
        return "bg-blue-100 text-blue-800";
      case "FEATURE":
        return "bg-emerald-100 text-emerald-800";
      case "USER_STORY":
        return "bg-orange-100 text-orange-800";
      case "TASK":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Liste des Items ({items.length})
        </h3>
        <Button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un item
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReorder(item.id, "up")}
                  disabled={index === 0}
                  className="p-1 h-6 w-6"
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReorder(item.id, "down")}
                  disabled={index === items.length - 1}
                  className="p-1 h-6 w-6"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex items-center gap-3 flex-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getItemTypeColor(
                    item.type
                  )}`}
                >
                  {item.type}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                    item.priority || "MEDIUM"
                  )}`}
                >
                  {item.priority || "MEDIUM"}
                </span>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-slate-600 mt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                {item.storyPoints && (
                  <span className="bg-slate-100 px-2 py-1 rounded">
                    {item.storyPoints} SP
                  </span>
                )}
                {item.estimatedHours && (
                  <span className="bg-slate-100 px-2 py-1 rounded">
                    {item.estimatedHours}h
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">Aucun item trouvé</p>
          <Button
            onClick={onAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer votre premier item
          </Button>
        </div>
      )}
    </div>
  );
};
