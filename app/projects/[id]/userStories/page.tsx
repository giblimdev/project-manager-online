/*
je veux que tu me donnes le code complet du fichiers suivant :   
app/files/page.tsx qui utilisera les commposants  :
FilesDisplay.tsx (liste, card, branch)
FilesFilter.tsx (by name, by type, by date)
FilesList.tsx (pours chaque fichier les boutons up dawn edit, delete)
FilesForm.tsx (creation / modification de fichier)

views/FileswiewList.tsx 
views/FilesViewCard.tsx
views/FilesViewBranch.tsx

 et les fichier suivant deja existant : 

// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;



// lib/prisma.ts
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;


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


*/

import React from "react";

export default function page() {
  return <div>User Stories</div>;
}
