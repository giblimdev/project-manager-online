// lib/auth/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;

/*
// lib/auth-client.ts - Solution temporaire
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://project-manager-online.vercel.app", // ✅ URL hardcodée temporairement
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
*/
