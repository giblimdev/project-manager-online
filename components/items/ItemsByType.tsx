// /components/items/ItemsByType.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "lucide-react";
import { ItemForm } from "./ItemForm";
import type { Item } from "@/types/item";

interface ItemsByTypeProps {
  onItemUpdate?: () => void;
}

interface GroupedItems {
  [key: string]: Item[];
}

interface ItemTypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const ITEM_TYPE_CONFIG: Record<string, ItemTypeConfig> = {
  INITIATIVE: {
    label: "Initiatives",
    icon: FolderIcon,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Objectifs stratégiques de haut niveau",
  },
  EPIC: {
    label: "Epics",
    icon: FolderIcon,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Grandes fonctionnalités à développer",
  },
  FEATURE: {
    label: "Features",
    icon: CheckCircleIcon,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Fonctionnalités spécifiques",
  },
  USER_STORY: {
    label: "User Stories",
    icon: ClockIcon,
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Histoires utilisateur",
  },
  TASK: {
    label: "Tasks",
    icon: CheckCircleIcon,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Tâches à accomplir",
  },
  BUG: {
    label: "Bugs",
    icon: XCircleIcon,
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Problèmes à corriger",
  },
  SUBTASK: {
    label: "Subtasks",
    icon: ClockIcon,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Sous-tâches",
  },
};

const PRIORITY_CONFIG = {
  LOW: { label: "Faible", color: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Moyen", color: "bg-blue-100 text-blue-600" },
  HIGH: { label: "Élevé", color: "bg-orange-100 text-orange-600" },
  CRITICAL: { label: "Critique", color: "bg-red-100 text-red-600" },
};

const STATUS_CONFIG = {
  ACTIVE: { label: "Actif", color: "bg-green-100 text-green-600" },
  COMPLETED: { label: "Terminé", color: "bg-blue-100 text-blue-600" },
  CANCELLED: { label: "Annulé", color: "bg-gray-100 text-gray-600" },
  ON_HOLD: { label: "En attente", color: "bg-yellow-100 text-yellow-600" },
};

export const ItemsByType: React.FC<ItemsByTypeProps> = ({ onItemUpdate }) => {
  const { data: session, isPending } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Chargement des items
  const loadItems = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/projects/items?userId=${session.user.id}&limit=100`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erreur lors du chargement des items");
      }

      const itemsData = Array.isArray(data.data) ? data.data : [];
      setItems(itemsData);

      // Grouper par type
      const grouped = itemsData.reduce((acc: GroupedItems, item: Item) => {
        const type = item.type || "UNKNOWN";
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(item);
        return acc;
      }, {});

      setGroupedItems(grouped);
    } catch (err) {
      console.error("Erreur lors du chargement des items:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Suppression d'un item
  const handleDelete = useCallback(
    async (itemId: string) => {
      if (!confirm("Êtes-vous sûr de vouloir supprimer cet item ?")) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/projects/items/${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression");
        }

        await loadItems();
        onItemUpdate?.();
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        setError(err instanceof Error ? err.message : "Erreur de suppression");
      } finally {
        setLoading(false);
      }
    },
    [loadItems, onItemUpdate]
  );

  // Gestion du formulaire
  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item);
    setShowForm(true);
  }, []);

  const handleAdd = useCallback((type?: string) => {
    setEditingItem(null);
    setSelectedType(type || null);
    setShowForm(true);
  }, []);

  const handleFormSave = useCallback(
    async (itemData: any) => {
      try {
        const isEditing = editingItem !== null;
        const url = isEditing
          ? `/api/projects/items/${editingItem.id}`
          : "/api/projects/items";
        const method = isEditing ? "PUT" : "POST";

        const payload = {
          ...itemData,
          userId: session?.user?.id,
          type: selectedType || itemData.type || "TASK",
        };

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de la sauvegarde");
        }

        setShowForm(false);
        setEditingItem(null);
        setSelectedType(null);
        await loadItems();
        onItemUpdate?.();
      } catch (err) {
        console.error("Erreur lors de la sauvegarde:", err);
        throw err;
      }
    },
    [editingItem, selectedType, session?.user?.id, loadItems, onItemUpdate]
  );

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingItem(null);
    setSelectedType(null);
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadItems();
    }
  }, [session?.user, loadItems]);

  if (isPending) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCwIcon className="animate-spin h-6 w-6 mr-2" />
        Chargement...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Alert>
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Vous devez être connecté pour voir les items.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Erreur: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadItems}
            className="ml-2"
          >
            <RefreshCwIcon className="h-4 w-4 mr-1" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Items par Type</h2>
          <p className="text-gray-600">
            {items.length} item{items.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={() => handleAdd()} disabled={loading}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvel Item
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(ITEM_TYPE_CONFIG).map(([type, config]) => {
          const count = groupedItems[type]?.length || 0;
          const Icon = config.icon;

          return (
            <Card
              key={type}
              className={`cursor-pointer transition-all hover:shadow-md ${
                count === 0 ? "opacity-50" : ""
              }`}
              onClick={() => count > 0 && handleAdd(type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                  {count > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdd(type);
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Items groupés par type */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <RefreshCwIcon className="animate-spin h-6 w-6 mr-2" />
          Chargement des items...
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([type, typeItems]) => {
            const config = ITEM_TYPE_CONFIG[type] || {
              label: type,
              icon: FolderIcon,
              color: "bg-gray-100 text-gray-800 border-gray-200",
              description: "Type d'item",
            };
            const Icon = config.icon;

            return (
              <Card key={type} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Icon className="h-5 w-5" />
                      <span>{config.label}</span>
                      <Badge variant="secondary">{typeItems.length}</Badge>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdd(type)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{config.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {typeItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {item.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                PRIORITY_CONFIG[
                                  item.priority as keyof typeof PRIORITY_CONFIG
                                ]?.color || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {PRIORITY_CONFIG[
                                item.priority as keyof typeof PRIORITY_CONFIG
                              ]?.label || item.priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                STATUS_CONFIG[
                                  item.status as keyof typeof STATUS_CONFIG
                                ]?.color || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {STATUS_CONFIG[
                                item.status as keyof typeof STATUS_CONFIG
                              ]?.label || item.status}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 truncate">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            {item.storyPoints && (
                              <span>SP: {item.storyPoints}</span>
                            )}
                            {item.progress !== undefined && (
                              <span>Progrès: {item.progress}%</span>
                            )}
                            {item.estimatedHours && (
                              <span>Est: {item.estimatedHours}h</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Formulaire d'ajout/édition */}
      {showForm && (
        <ItemForm
          isOpen={showForm}
          onClose={handleFormClose}
          onSave={handleFormSave}
          mode={editingItem ? "edit" : "create"}
          initialData={editingItem}
          defaultType={selectedType}
        />
      )}
    </div>
  );
};
