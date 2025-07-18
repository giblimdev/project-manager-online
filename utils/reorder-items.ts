// utils/reorder-items.ts
// Fonction utilitaire pour réorganiser les items
import type { Item } from "@/types/item";

export const reorderItemsUtil = async (
  items: Item[],
  itemId: string,
  direction: "up" | "down"
): Promise<void> => {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex === -1) return;

  const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0 || newIndex >= items.length) return;

  const response = await fetch(`/api/items/${itemId}/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction, newIndex }),
  });

  if (!response.ok) {
    throw new Error("Failed to reorder item");
  }
};
