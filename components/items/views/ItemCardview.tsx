// components/items/views/item-card-view.tsx
// Vue en cartes pour l'affichage des items
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Edit, Trash2, Plus } from "lucide-react";
import type { Item } from "@/types/item";

interface ItemCardViewProps {
  items: Item[];
  onAdd: () => void;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
}

export const ItemCardView: React.FC<ItemCardViewProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "INITIATIVE":
        return "from-purple-500 to-purple-600";
      case "EPIC":
        return "from-blue-500 to-blue-600";
      case "FEATURE":
        return "from-emerald-500 to-emerald-600";
      case "USER_STORY":
        return "from-orange-500 to-orange-600";
      case "TASK":
        return "from-pink-500 to-pink-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Cartes des Items ({items.length})
        </h3>
        <Button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`h-2 bg-gradient-to-r ${getItemTypeColor(
                item.type
              )} rounded-t-lg`}
            />

            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {item.type}
                </span>
                <div className="flex gap-1">
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
              </div>

              <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                {item.name}
              </h4>

              {item.description && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {item.priority && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.priority === "CRITICAL"
                          ? "bg-red-100 text-red-800"
                          : item.priority === "HIGH"
                          ? "bg-orange-100 text-orange-800"
                          : item.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.priority}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
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

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
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

                {item.progress !== undefined && (
                  <div className="text-xs text-slate-500">
                    {item.progress}% complété
                  </div>
                )}
              </div>
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
