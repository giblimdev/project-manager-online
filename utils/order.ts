// utils/order.ts
export const moveItemUp = async (
  tableName: string,
  itemId: string
): Promise<void> => {
  const response = await fetch(`/api/${tableName}/${itemId}/move-up`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to move ${tableName} item up`);
  }
};

export const moveItemDown = async (
  tableName: string,
  itemId: string
): Promise<void> => {
  const response = await fetch(`/api/${tableName}/${itemId}/move-down`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to move ${tableName} item down`
    );
  }
};

export const updateItemOrder = async (
  tableName: string,
  itemId: string,
  newOrder: number
): Promise<void> => {
  const response = await fetch(`/api/${tableName}/${itemId}/order`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ order: newOrder }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to update ${tableName} item order`
    );
  }
};

export const reorderItems = async (
  tableName: string,
  itemIds: string[]
): Promise<void> => {
  const response = await fetch(`/api/${tableName}/reorder`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ itemIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to reorder ${tableName} items`
    );
  }
};
