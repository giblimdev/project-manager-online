//@/store/useSelectedUserStore.ts
"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// === ENUMS ===
type UserRole =
  | "ADMIN"
  | "PRODUCT_OWNER"
  | "SCRUM_MASTER"
  | "DEVELOPER"
  | "STAKEHOLDER"
  | "VIEWER";

// === TYPE User complet avec relations ===
interface UserFull {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  timezone: string | null;
  preferences: Record<string, any> | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations (exemple avec ProjectMember)
  projects?: Array<{
    id: string;
    name: string;
    slug: string;
    key: string;
    status: string;
    isActive: boolean;
    role: UserRole;
  }>;

  // Comptages
  _count?: {
    projects: number;
  };
}

// === API Response Type ===
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// === Type guard ===
const isValidUser = (data: any): data is UserFull =>
  data && typeof data.id === "string" && typeof data.email === "string";

// === State & Actions ===
interface UserState {
  currentUserId: string | null;
  userData: UserFull | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;
}

interface UserActions {
  setCurrentUserId: (id: string | null) => void;
  loadUserData: (id: string, force?: boolean) => Promise<void>;
  updateUserData: (updates: Partial<UserFull>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshUser: () => Promise<void>;
  invalidateCache: () => void;
  getCurrentUser: () => UserFull | null;
  isUserSelected: (id: string) => boolean;
  isDataFresh: () => boolean;
}

type UserStore = UserState & UserActions;

// === Cache config ===
const CACHE_TTL = 5 * 60 * 1000;
const CURRENT_CACHE_VERSION = 1;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      userData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      setCurrentUserId: (id) => {
        const current = get();
        if (current.currentUserId === id) return;

        set({ currentUserId: id, error: null });

        if (!id) {
          set({ userData: null, lastFetched: null });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.userData?.id === id;

          if (!isFresh) {
            get().loadUserData(id);
          }
        }
      },

      loadUserData: async (id, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.userData?.id === id;

        if (isFresh) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/users/${id}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const result: ApiResponse = await res.json();
          const data = result.success ? result.data : result;
          if (!isValidUser(data))
            throw new Error("Données utilisateur invalides");

          const normalized: UserFull = {
            ...data,
            lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            projects: data.projects?.map((p: any) => ({
              ...p,
            })),
          };

          set({
            userData: normalized,
            isLoading: false,
            lastFetched: now,
          });

          // Prefetch projets
          if (normalized.id) {
            fetch(`/api/users/${normalized.id}/projects`).catch(() => {});
          }
        } catch (err) {
          set({
            userData: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Erreur inconnue",
            lastFetched: null,
          });
        }
      },

      updateUserData: (updates) => {
        const current = get();
        if (!current.userData) return;
        set({
          userData: { ...current.userData, ...updates },
          lastFetched: Date.now(),
        });
      },

      clearUser: () => {
        set({
          currentUserId: null,
          userData: null,
          lastFetched: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      refreshUser: async () => {
        const id = get().currentUserId;
        if (id) await get().loadUserData(id, true);
      },
      invalidateCache: () => set({ lastFetched: null }),
      getCurrentUser: () => get().userData,
      isUserSelected: (id) => get().currentUserId === id,
      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "current-user-storage",
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        cacheVersion: s.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// === Hook Hydratation ===
export const useUserStoreHydration = () => {
  const setHydrated = useUserStore((s) => s.setHydrated);
  const isHydrated = useUserStore((s) => s.isHydrated);
  const currentUserId = useUserStore((s) => s.currentUserId);
  const loadUserData = useUserStore((s) => s.loadUserData);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await useUserStore.persist.rehydrate();
      if (!mounted) return;
      setHydrated(true);
      if (currentUserId) loadUserData(currentUserId);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return isHydrated;
};

// === Sélecteurs ===
export const useCurrentUserId = () => useUserStore((s) => s.currentUserId);
export const useCurrentUserData = () => useUserStore((s) => s.userData);
export const useUserLoading = () => useUserStore((s) => s.isLoading);
export const useUserError = () => useUserStore((s) => s.error);
export const useUserActions = () =>
  useUserStore((s) => ({
    setCurrentUserId: s.setCurrentUserId,
    loadUserData: s.loadUserData,
    updateUserData: s.updateUserData,
    clearUser: s.clearUser,
    refreshUser: s.refreshUser,
    invalidateCache: s.invalidateCache,
    getCurrentUser: s.getCurrentUser,
    isUserSelected: s.isUserSelected,
    isDataFresh: s.isDataFresh,
  }));

// === Hook combiné ===
export const useUserStoreData = () => {
  const currentUserId = useCurrentUserId();
  const userData = useCurrentUserData();
  const isLoading = useUserLoading();
  const error = useUserError();
  const actions = useUserActions();
  const isHydrated = useUserStoreHydration();
  return { currentUserId, userData, isLoading, error, isHydrated, ...actions };
};
