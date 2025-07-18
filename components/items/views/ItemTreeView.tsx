// components/items/views/item-tree-view.tsx
// Vue en arbre hiérarchique pour l'affichage des items
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Edit, Trash2, Plus } from "lucide-react";
import type { Item } from "@/types/item";

interface ItemTreeViewProps {
  items: Item[];
  onAdd: () => void;
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => void;
  onReorder: (itemId: string, direction: "up" | "down") => void;
}

export const ItemTreeView: React.FC<ItemTreeViewProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildTree = (items: Item[]) => {
    const rootItems = items.filter((item) => !item.parentId);
    const childrenMap = new Map<string, Item[]>();

    items.forEach((item) => {
      if (item.parentId) {
        if (!childrenMap.has(item.parentId)) {
          childrenMap.set(item.parentId, []);
        }
        childrenMap.get(item.parentId)!.push(item);
      }
    });

    const renderNode = (item: Item, level: number = 0) => {
      const children = childrenMap.get(item.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = expandedNodes.has(item.id);

      return (
        <div key={item.id} className="select-none">
          <div
            className={`flex items-center gap-2 py-2 px-3 hover:bg-slate-50 rounded-lg transition-colors`}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(item.id)}
                className="p-1 h-6 w-6 hover:bg-slate-200"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6" />
            )}

            <div className="flex items-center gap-2 flex-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  item.type === "INITIATIVE"
                    ? "bg-purple-500"
                    : item.type === "EPIC"
                    ? "bg-blue-500"
                    : item.type === "FEATURE"
                    ? "bg-emerald-500"
                    : item.type === "USER_STORY"
                    ? "bg-orange-500"
                    : "bg-pink-500"
                }`}
              />

              <span className="font-medium text-slate-900">{item.name}</span>

              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {item.type}
              </span>

              {item.priority && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
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

            <div className="flex items-center gap-1">
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

          {hasChildren && isExpanded && (
            <div>{children.map((child) => renderNode(child, level + 1))}</div>
          )}
        </div>
      );
    };

    return rootItems.map((item) => renderNode(item));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Arbre Hiérarchique ({items.length})
        </h3>
        <Button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un item
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg">
        {items.length > 0 ? (
          <div className="p-4">{buildTree(items)}</div>
        ) : (
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
    </div>
  );
};
