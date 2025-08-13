// @/stores/useSelectedEpicStore.ts
"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface EpicFull {
  id: string;
  name: string;
  order: number;
  description: string | null;
  priority: Priority;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  initiativeId: string;
  createdAt: Date;
  updatedAt: Date;
  features?: Array<{
    id: string;
    name: string;
    order: number;
    status: string;
    progress: number;
  }>;
  userstories?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

const isValidEpic = (data: any): data is EpicFull =>
  data && typeof data.id === "string" && typeof data.name === "string";

interface EpicState {
  selectedEpicId: string | null;
  epicData: EpicFull | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;
}

interface EpicActions {
  setSelectedEpicId: (id: string | null) => void;
  loadEpicData: (id: string, force?: boolean) => Promise<void>;
  updateEpicData: (updates: Partial<EpicFull>) => void;
  clearEpic: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshEpic: () => Promise<void>;
  invalidateCache: () => void;
  getSelectedEpic: () => EpicFull | null;
  isEpicSelected: (id: string) => boolean;
  isDataFresh: () => boolean;
}

type EpicStore = EpicState & EpicActions;

const CACHE_TTL = 5 * 60 * 1000;
const CURRENT_CACHE_VERSION = 1;

export const useSelectedEpicStore = create<EpicStore>()(
  persist(
    (set, get) => ({
      selectedEpicId: null,
      epicData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      setSelectedEpicId: (id) => {
        const current = get();
        if (current.selectedEpicId === id) return;

        set({ selectedEpicId: id, error: null });

        if (!id) {
          set({ epicData: null, lastFetched: null });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.epicData?.id === id;

          if (!isFresh) {
            get().loadEpicData(id);
          }
        }
      },

      loadEpicData: async (id, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.epicData?.id === id;

        if (isFresh) return;

        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`/api/epics/${id}`, {
            cache: "no-store",
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const result: ApiResponse<EpicFull> = await res.json();
          const data = result.success ? result.data : result;

          if (!isValidEpic(data)) throw new Error("Données Epic invalides");

          const normalized: EpicFull = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            features: data.features?.map((f: any) => ({
              ...f,
              createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
              updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
            })),
            userstories: data.userstories?.map((us: any) => ({
              ...us,
              createdAt: us.createdAt ? new Date(us.createdAt) : new Date(),
              updatedAt: us.updatedAt ? new Date(us.updatedAt) : new Date(),
            })),
          };

          set({
            epicData: normalized,
            isLoading: false,
            lastFetched: now,
          });
        } catch (err) {
          console.error("Erreur loadEpicData:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Erreur inconnue";

          set({
            epicData: null,
            isLoading: false,
            error: errorMessage,
            lastFetched: null,
          });
        }
      },

      updateEpicData: (updates) => {
        const current = get();
        if (!current.epicData) return;

        const updatedEpic = { ...current.epicData, ...updates };
        set({
          epicData: updatedEpic,
          lastFetched: Date.now(),
        });
      },

      clearEpic: () => {
        set({
          selectedEpicId: null,
          epicData: null,
          lastFetched: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      refreshEpic: async () => {
        const id = get().selectedEpicId;
        if (id) await get().loadEpicData(id, true);
      },
      invalidateCache: () => set({ lastFetched: null }),
      getSelectedEpic: () => get().epicData,
      isEpicSelected: (id) => get().selectedEpicId === id,
      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "selected-epic-storage",
      partialize: (state) => ({
        selectedEpicId: state.selectedEpicId,
        cacheVersion: state.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useEpicStoreHydration = () => {
  const setHydrated = useSelectedEpicStore((s) => s.setHydrated);
  const isHydrated = useSelectedEpicStore((s) => s.isHydrated);
  const selectedEpicId = useSelectedEpicStore((s) => s.selectedEpicId);
  const loadEpicData = useSelectedEpicStore((s) => s.loadEpicData);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await useSelectedEpicStore.persist.rehydrate();
        if (!mounted) return;

        setHydrated(true);

        if (selectedEpicId && mounted) {
          await loadEpicData(selectedEpicId);
        }
      } catch (error) {
        console.error("Erreur hydratation epic store:", error);
        if (mounted) {
          setHydrated(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return isHydrated;
};

export const useSelectedEpicId = () =>
  useSelectedEpicStore((s) => s.selectedEpicId);

export const useSelectedEpicData = () =>
  useSelectedEpicStore((s) => s.epicData);

export const useEpicLoading = () => useSelectedEpicStore((s) => s.isLoading);

export const useEpicError = () => useSelectedEpicStore((s) => s.error);

export const useEpicActions = () => {
  const store = useSelectedEpicStore();
  return {
    setSelectedEpicId: store.setSelectedEpicId,
    loadEpicData: store.loadEpicData,
    updateEpicData: store.updateEpicData,
    clearEpic: store.clearEpic,
    refreshEpic: store.refreshEpic,
    invalidateCache: store.invalidateCache,
    getSelectedEpic: store.getSelectedEpic,
    isEpicSelected: store.isEpicSelected,
    isDataFresh: store.isDataFresh,
  };
};

export const useEpicStore = () => {
  const selectedEpicId = useSelectedEpicId();
  const epicData = useSelectedEpicData();
  const isLoading = useEpicLoading();
  const error = useEpicError();
  const actions = useEpicActions();
  const isHydrated = useEpicStoreHydration();

  return {
    selectedEpicId,
    epicData,
    isLoading,
    error,
    isHydrated,
    ...actions,
  };
};
