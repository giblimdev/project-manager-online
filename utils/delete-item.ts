// utils/delete-item.ts
// Fonction utilitaire pour supprimer un item
export const deleteItemUtil = async (
  tableName: string,
  itemId: string
): Promise<void> => {
  const response = await fetch(`/api/${tableName}/${itemId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete ${tableName} item`);
  }
};
