// hooks/use-items.ts
// Hook personnalisé pour la gestion des items
import { useState, useEffect } from "react";
import { reorderItemsUtil } from "@/utils/reorder-items";
import { deleteItemUtil } from "@/utils/delete-item";
import type { Item } from "@/types/item";

export const useItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const createItem = async (itemData: Partial<Item>) => {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error("Failed to create item");
    await fetchItems();
  };

  const updateItem = async (itemId: string, itemData: Partial<Item>) => {
    const response = await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error("Failed to update item");
    await fetchItems();
  };

  const deleteItem = async (itemId: string) => {
    await deleteItemUtil("items", itemId);
    await fetchItems();
  };

  const reorderItems = async (itemId: string, direction: "up" | "down") => {
    await reorderItemsUtil(items, itemId, direction);
    await fetchItems();
  };

  return {
    items,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
};
