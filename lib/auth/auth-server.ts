// lib/auth-server.ts
// lib/auth-server.ts
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { cache } from "react";

// Fonction cachée pour récupérer la session
export const getSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Erreur lors de la récupération de la session:", error);
    return null;
  }
});

// Fonction pour vérifier l'authentification
export const requireAuth = async () => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Authentification requise");
  }
  return session;
};

// Middleware de protection
export const withAuth = async <T extends any[], R>(
  handler: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    await requireAuth();
    return handler(...args);
  };
};
