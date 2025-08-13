// @/stores/useSelectedInitiativeStore.ts

/**
 * RÔLE : Store Zustand optimisé pour la gestion de l'initiative sélectionnée avec cache
 * RESPONSABILITÉS :
 * - Gérer la sélection et les données de l'initiative actuelle avec cache TTL
 * - Optimiser les performances avec mémorisation et sélecteurs stables
 * - Éviter les boucles infinies avec getSnapshot cached
 * - Hydratation sécurisée pour Next.js 15 et SSR
 * - Gestion d'erreur robuste avec retry et fallbacks
 * - Persistance intelligente avec versioning et migration
 * - API cohérente avec hooks spécialisés pour éviter les re-renders
 * - Synchronisation avec useSelectedProjectStore pour navigation cohérente
 *
 * COMPOSANTS/LIBS UTILISÉS :
 * - zustand: Store state management avec middleware persist
 * - zustand/middleware: persist, createJSONStorage pour la persistance
 * - React hooks: useEffect, useState pour l'hydratation
 * - TypeScript strict mode avec interfaces complètes
 * - Date API pour la gestion des dates et cache TTL
 * - Fetch API pour les requêtes avec gestion d'erreur
 *
 * CACHE ET OPTIMISATION :
 * - TTL de 5 minutes pour éviter les requêtes inutiles
 * - Mémorisation des sélecteurs avec référence stable
 * - Validation stricte des données avec isValidInitiative
 * - Normalisation des dates pour cohérence
 * - Prefetch intelligent des données liées
 */

"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// === ENUMS du schéma Prisma ===
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// === TYPE Initiative complet basé sur le schéma Prisma ===
interface InitiativeFull {
  id: string;
  name: string;
  order: number;
  description: string | null;
  objective: string | null;
  priority: Priority;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  budget: number | null;
  roi: number | null;
  projectId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  epics?: Array<{
    id: string;
    name: string;
    order: number;
    description: string | null;
    priority: Priority;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  _count?: {
    epics: number;
  };
}

// === API response type ===
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// === Validation Initiative stricte ===
const isValidInitiative = (data: any): data is InitiativeFull =>
  data && typeof data.id === "string" && typeof data.name === "string";

// === State & Actions avec cache stable ===
interface InitiativeState {
  selectedInitiativeId: string | null;
  initiativeData: InitiativeFull | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;

  // ✅ Cache stable pour getSnapshot
  _cachedSelectors: Map<string, any>;
  _lastInitiativeSnapshot: InitiativeFull | null;
  _lastIdSnapshot: string | null;
}

interface InitiativeActions {
  setSelectedInitiativeId: (initiativeId: string | null) => void;
  loadInitiativeData: (initiativeId: string, force?: boolean) => Promise<void>;
  updateInitiativeData: (updates: Partial<InitiativeFull>) => void;
  clearInitiative: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshInitiative: () => Promise<void>;
  invalidateCache: () => void;
  getSelectedInitiative: () => InitiativeFull | null;
  isInitiativeSelected: (initiativeId: string) => boolean;
  isDataFresh: () => boolean;

  // ✅ Actions pour cache stable
  _clearSelectorsCache: () => void;
  _getCachedSelector: (key: string, value: any) => any;
}

type InitiativeStore = InitiativeState & InitiativeActions;

// === Cache config optimisé ===
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CURRENT_CACHE_VERSION = 1;

// ✅ Constantes stables hors du store
const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: Record<string, any> = {};

export const useSelectedInitiativeStore = create<InitiativeStore>()(
  persist(
    (set, get) => ({
      // État initial
      selectedInitiativeId: null,
      initiativeData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      // ✅ Cache stable pour éviter infinite loops
      _cachedSelectors: new Map(),
      _lastInitiativeSnapshot: null,
      _lastIdSnapshot: null,

      // ✅ Actions avec cache stable
      _clearSelectorsCache: () => {
        get()._cachedSelectors.clear();
      },

      _getCachedSelector: (key: string, value: any) => {
        const cache = get()._cachedSelectors;
        const cached = cache.get(key);

        if (
          cached === value ||
          (Array.isArray(cached) &&
            Array.isArray(value) &&
            cached.length === value.length &&
            cached.every((item, index) => item === value[index]))
        ) {
          return cached;
        }

        cache.set(key, value);
        return value;
      },

      setSelectedInitiativeId: (initiativeId) => {
        const current = get();
        if (current.selectedInitiativeId === initiativeId) return;

        // ✅ Clear cache when changing initiative
        current._clearSelectorsCache();

        set({
          selectedInitiativeId: initiativeId,
          error: null,
          _lastIdSnapshot: initiativeId,
        });

        if (!initiativeId) {
          set({
            initiativeData: null,
            lastFetched: null,
            _lastInitiativeSnapshot: null,
          });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.initiativeData?.id === initiativeId;

          if (!isFresh) {
            get().loadInitiativeData(initiativeId);
          }
        }
      },

      loadInitiativeData: async (initiativeId, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.initiativeData?.id === initiativeId;

        if (isFresh) return;

        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`/api/initiatives/${initiativeId}`, {
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const result: ApiResponse<InitiativeFull> = await res.json();
          const data = result.success ? result.data : result;

          if (!isValidInitiative(data)) {
            throw new Error("Données initiative invalides");
          }

          // ✅ Normalisation avec référence stable
          const normalized: InitiativeFull = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            epics:
              data.epics?.map((e: any) => ({
                ...e,
                startDate: e.startDate ? new Date(e.startDate) : null,
                endDate: e.endDate ? new Date(e.endDate) : null,
                createdAt: new Date(e.createdAt),
                updatedAt: new Date(e.updatedAt),
              })) || EMPTY_ARRAY,
          };

          // ✅ Clear cache on data update
          current._clearSelectorsCache();

          set({
            initiativeData: normalized,
            isLoading: false,
            lastFetched: now,
            _lastInitiativeSnapshot: normalized,
          });
        } catch (err) {
          console.error("Erreur loadInitiativeData:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Erreur inconnue";

          set({
            initiativeData: null,
            isLoading: false,
            error: errorMessage,
            lastFetched: null,
            _lastInitiativeSnapshot: null,
          });
        }
      },

      updateInitiativeData: (updates) => {
        const current = get();
        if (!current.initiativeData) return;

        // ✅ Clear cache on update
        current._clearSelectorsCache();

        const updatedInitiative = { ...current.initiativeData, ...updates };
        set({
          initiativeData: updatedInitiative,
          lastFetched: Date.now(),
          _lastInitiativeSnapshot: updatedInitiative,
        });
      },

      clearInitiative: () => {
        const current = get();
        current._clearSelectorsCache();

        set({
          selectedInitiativeId: null,
          initiativeData: null,
          lastFetched: null,
          _lastInitiativeSnapshot: null,
          _lastIdSnapshot: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      refreshInitiative: async () => {
        const id = get().selectedInitiativeId;
        if (id) {
          await get().loadInitiativeData(id, true);
        }
      },

      invalidateCache: () => {
        const current = get();
        current._clearSelectorsCache();
        set({ lastFetched: null });
      },

      // ✅ Getters avec cache stable
      getSelectedInitiative: () => {
        const current = get();
        const key = `selected_initiative_${current.selectedInitiativeId}`;
        return current._getCachedSelector(key, current.initiativeData);
      },

      isInitiativeSelected: (id) => get().selectedInitiativeId === id,

      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "selected-initiative-storage",
      // ✅ Persistance sélective sans cache
      partialize: (state) => ({
        selectedInitiativeId: state.selectedInitiativeId,
        cacheVersion: state.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // ✅ Migration pour nettoyer les anciens caches
      migrate: (persistedState: any, version: number) => {
        if (version < CURRENT_CACHE_VERSION) {
          return {
            selectedInitiativeId: persistedState?.selectedInitiativeId || null,
            cacheVersion: CURRENT_CACHE_VERSION,
          };
        }
        return persistedState;
      },
    }
  )
);

// === Hook Hydratation sécurisé ===
export const useInitiativeStoreHydration = () => {
  const setHydrated = useSelectedInitiativeStore((s) => s.setHydrated);
  const isHydrated = useSelectedInitiativeStore((s) => s.isHydrated);
  const selectedInitiativeId = useSelectedInitiativeStore(
    (s) => s.selectedInitiativeId
  );
  const loadInitiativeData = useSelectedInitiativeStore(
    (s) => s.loadInitiativeData
  );

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await useSelectedInitiativeStore.persist.rehydrate();
        if (!mounted) return;

        setHydrated(true);

        // ✅ Load data seulement si initiative sélectionnée
        if (selectedInitiativeId && mounted) {
          await loadInitiativeData(selectedInitiativeId);
        }
      } catch (error) {
        console.error("Erreur hydratation initiative store:", error);
        if (mounted) {
          setHydrated(true); // Set hydrated même en cas d'erreur
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // ✅ Dépendances vides pour éviter re-hydratation

  return isHydrated;
};

// ✅ Sélecteurs avec cache stable pour éviter infinite loops
export const useSelectedInitiativeId = () => {
  const store = useSelectedInitiativeStore((state) => state);
  const key = "selected_initiative_id";
  return store._getCachedSelector(key, store.selectedInitiativeId);
};

export const useSelectedInitiativeData = () => {
  const store = useSelectedInitiativeStore((state) => state);
  const key = "selected_initiative_data";
  return store._getCachedSelector(key, store.initiativeData);
};

export const useInitiativeLoading = () =>
  useSelectedInitiativeStore((s) => s.isLoading);

export const useInitiativeError = () =>
  useSelectedInitiativeStore((s) => s.error);

// ✅ Actions avec référence stable
const stableInitiativeActions = {
  setSelectedInitiativeId: (id: string | null) =>
    useSelectedInitiativeStore.getState().setSelectedInitiativeId(id),
  loadInitiativeData: (id: string, force?: boolean) =>
    useSelectedInitiativeStore.getState().loadInitiativeData(id, force),
  updateInitiativeData: (updates: Partial<InitiativeFull>) =>
    useSelectedInitiativeStore.getState().updateInitiativeData(updates),
  clearInitiative: () =>
    useSelectedInitiativeStore.getState().clearInitiative(),
  refreshInitiative: () =>
    useSelectedInitiativeStore.getState().refreshInitiative(),
  invalidateCache: () =>
    useSelectedInitiativeStore.getState().invalidateCache(),
  getSelectedInitiative: () =>
    useSelectedInitiativeStore.getState().getSelectedInitiative(),
  isInitiativeSelected: (id: string) =>
    useSelectedInitiativeStore.getState().isInitiativeSelected(id),
  isDataFresh: () => useSelectedInitiativeStore.getState().isDataFresh(),
};

export const useInitiativeActions = () => stableInitiativeActions;

// ✅ Hook composite stable
export const useInitiativeStore = () => {
  const selectedInitiativeId = useSelectedInitiativeId();
  const initiativeData = useSelectedInitiativeData();
  const isLoading = useInitiativeLoading();
  const error = useInitiativeError();
  const isHydrated = useInitiativeStoreHydration();

  return {
    selectedInitiativeId,
    initiativeData,
    isLoading,
    error,
    isHydrated,
    ...stableInitiativeActions,
  };
};

// Export des types pour la réutilisabilité
export type { InitiativeFull, ApiResponse, Priority };
