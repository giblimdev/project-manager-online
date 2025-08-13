//@/store/useSelectedFeatureStore.ts
"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// === ENUMS ===
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// === TYPE Feature complet avec relations ===
interface FeatureFull {
  id: string;
  name: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  position: number;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  userStories?: Array<{
    id: string;
    title: string;
    order: number;
    description: string | null;
    acceptanceCriteria: string | null;
    priority: Priority;
    status: string;
    storyPoints: number | null;
    businessValue: number | null;
    technicalRisk: number | null;
    effort: number | null;
    position: number;
    labels: string[];
    tags: string[];
    estimatedHours: number | null;
    actualHours: number | null;
    createdAt: Date;
    updatedAt: Date;
    featureId: string;
    creatorId: string;
  }>;

  _count?: {
    userStories: number;
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
const isValidFeature = (data: any): data is FeatureFull =>
  data && typeof data.id === "string" && typeof data.name === "string";

// === State & Actions ===
interface FeatureState {
  selectedFeatureId: string | null;
  featureData: FeatureFull | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;
}

interface FeatureActions {
  setSelectedFeatureId: (id: string | null) => void;
  loadFeatureData: (id: string, force?: boolean) => Promise<void>;
  updateFeatureData: (updates: Partial<FeatureFull>) => void;
  clearFeature: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshFeature: () => Promise<void>;
  invalidateCache: () => void;
  getSelectedFeature: () => FeatureFull | null;
  isFeatureSelected: (id: string) => boolean;
  isDataFresh: () => boolean;
}

type FeatureStore = FeatureState & FeatureActions;

// === Cache config ===
const CACHE_TTL = 5 * 60 * 1000;
const CURRENT_CACHE_VERSION = 1;

export const useSelectedFeatureStore = create<FeatureStore>()(
  persist(
    (set, get) => ({
      selectedFeatureId: null,
      featureData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      setSelectedFeatureId: (id) => {
        const current = get();
        if (current.selectedFeatureId === id) return;

        set({ selectedFeatureId: id, error: null });

        if (!id) {
          set({ featureData: null, lastFetched: null });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.featureData?.id === id;

          if (!isFresh) {
            get().loadFeatureData(id);
          }
        }
      },

      loadFeatureData: async (id, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.featureData?.id === id;

        if (isFresh) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/features/${id}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const result: ApiResponse = await res.json();
          const data = result.success ? result.data : result;
          if (!isValidFeature(data))
            throw new Error("Données Feature invalides");

          const normalized: FeatureFull = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            userStories: data.userStories?.map((us: any) => ({
              ...us,
              createdAt: new Date(us.createdAt),
              updatedAt: new Date(us.updatedAt),
            })),
          };

          set({
            featureData: normalized,
            isLoading: false,
            lastFetched: now,
          });

          // === Prefetch user stories ===
          if (normalized.id) {
            fetch(`/api/features/${normalized.id}/userstories`).catch(() => {});
          }
        } catch (err) {
          set({
            featureData: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Erreur inconnue",
            lastFetched: null,
          });
        }
      },

      updateFeatureData: (updates) => {
        const current = get();
        if (!current.featureData) return;
        set({
          featureData: { ...current.featureData, ...updates },
          lastFetched: Date.now(),
        });
      },

      clearFeature: () => {
        set({
          selectedFeatureId: null,
          featureData: null,
          lastFetched: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      refreshFeature: async () => {
        const id = get().selectedFeatureId;
        if (id) await get().loadFeatureData(id, true);
      },
      invalidateCache: () => set({ lastFetched: null }),
      getSelectedFeature: () => get().featureData,
      isFeatureSelected: (id) => get().selectedFeatureId === id,
      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "selected-feature-storage",
      partialize: (s) => ({
        selectedFeatureId: s.selectedFeatureId,
        cacheVersion: s.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// === Hook Hydratation ===
export const useFeatureStoreHydration = () => {
  const setHydrated = useSelectedFeatureStore((s) => s.setHydrated);
  const isHydrated = useSelectedFeatureStore((s) => s.isHydrated);
  const selectedFeatureId = useSelectedFeatureStore((s) => s.selectedFeatureId);
  const loadFeatureData = useSelectedFeatureStore((s) => s.loadFeatureData);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await useSelectedFeatureStore.persist.rehydrate();
      if (!mounted) return;
      setHydrated(true);
      if (selectedFeatureId) loadFeatureData(selectedFeatureId);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return isHydrated;
};

// === Sélecteurs ===
export const useSelectedFeatureId = () =>
  useSelectedFeatureStore((s) => s.selectedFeatureId);
export const useSelectedFeatureData = () =>
  useSelectedFeatureStore((s) => s.featureData);
export const useFeatureLoading = () =>
  useSelectedFeatureStore((s) => s.isLoading);
export const useFeatureError = () => useSelectedFeatureStore((s) => s.error);
export const useFeatureActions = () =>
  useSelectedFeatureStore((s) => ({
    setSelectedFeatureId: s.setSelectedFeatureId,
    loadFeatureData: s.loadFeatureData,
    updateFeatureData: s.updateFeatureData,
    clearFeature: s.clearFeature,
    refreshFeature: s.refreshFeature,
    invalidateCache: s.invalidateCache,
    getSelectedFeature: s.getSelectedFeature,
    isFeatureSelected: s.isFeatureSelected,
    isDataFresh: s.isDataFresh,
  }));

// === Hook combiné ===
export const useFeatureStore = () => {
  const selectedFeatureId = useSelectedFeatureId();
  const featureData = useSelectedFeatureData();
  const isLoading = useFeatureLoading();
  const error = useFeatureError();
  const actions = useFeatureActions();
  const isHydrated = useFeatureStoreHydration();
  return {
    selectedFeatureId,
    featureData,
    isLoading,
    error,
    isHydrated,
    ...actions,
  };
};
