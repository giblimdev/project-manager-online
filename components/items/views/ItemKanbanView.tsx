// components/items/views/item-kanban-view.tsx
// Vue Kanban pour l'affichage des items par statut
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import type { Item } from "@/types/item";

interface ItemKanbanViewProps {
  items: Item[];
  onAdd: () => void;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
}

export const ItemKanbanView: React.FC<ItemKanbanViewProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const statusColumns = [
    { status: "ACTIVE", title: "Actif", color: "bg-blue-100 border-blue-300" },
    {
      status: "COMPLETED",
      title: "Terminé",
      color: "bg-green-100 border-green-300",
    },
    {
      status: "ON_HOLD",
      title: "En attente",
      color: "bg-yellow-100 border-yellow-300",
    },
    {
      status: "CANCELLED",
      title: "Annulé",
      color: "bg-red-100 border-red-300",
    },
  ];

  const getItemsByStatus = (status: string) => {
    return items.filter((item) => item.status === status);
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case "INITIATIVE":
        return "border-l-purple-500";
      case "EPIC":
        return "border-l-blue-500";
      case "FEATURE":
        return "border-l-emerald-500";
      case "USER_STORY":
        return "border-l-orange-500";
      case "TASK":
        return "border-l-pink-500";
      default:
        return "border-l-gray-500";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Vue Kanban ({items.length})
        </h3>
        <Button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => {
          const columnItems = getItemsByStatus(column.status);
          return (
            <div
              key={column.status}
              className={`${column.color} border rounded-lg p-4 min-h-[500px]`}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-900">{column.title}</h4>
                <span className="text-sm text-slate-600 bg-white px-2 py-1 rounded">
                  {columnItems.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border-l-4 ${getItemTypeColor(
                      item.type
                    )}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {item.type}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-700 p-1 h-6 w-6"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id)}
                          className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <h5 className="font-medium text-slate-900 mb-2 line-clamp-2">
                      {item.name}
                    </h5>

                    {item.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
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

                    {item.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progression</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {columnItems.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-400">
                  <p className="text-sm">Aucun item</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
