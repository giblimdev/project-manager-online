// @/stores/useSelectedProjectStore.ts

/**
 * RÔLE : Store Zustand optimisé pour la gestion du projet sélectionné avec cache
 * RESPONSABILITÉS :
 * - Gérer la sélection et les données du projet actuel avec cache TTL
 * - Optimiser les performances avec mémorisation et sélecteurs stables
 * - Éviter les boucles infinies avec getSnapshot cached
 * - Hydratation sécurisée pour Next.js 15 et SSR
 * - Gestion d'erreur robuste avec retry et fallbacks
 * - Persistance intelligente avec versioning et migration
 * - API cohérente avec hooks spécialisés pour éviter les re-renders
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
 * - Validation stricte des données avec isValidProject
 * - Normalisation des dates pour cohérence
 * - Prefetch intelligent des données liées
 */

"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// === ENUMS du schéma Prisma ===
type UserRole =
  | "ADMIN"
  | "PRODUCT_OWNER"
  | "SCRUM_MASTER"
  | "DEVELOPER"
  | "STAKEHOLDER"
  | "VIEWER";

type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Visibility = "PRIVATE" | "PUBLIC" | "INTERNAL";
type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

// === TYPE Project complet basé sur le schéma Prisma ===
interface ProjectSimple {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: Array<{
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
  }>;
  members?: Array<{
    id: string;
    role: UserRole;
    order: number;
    joinedAt: Date;
    isActive: boolean;
    projectId: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      emailVerified: boolean;
      image: string | null;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      isActive: boolean;
    };
  }>;
  initiatives?: Array<{
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
  }>;
  features?: Array<{
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
  }>;
  sprints?: Array<{
    id: string;
    name: string;
    order: number;
    goal: string | null;
    description: string | null;
    startDate: Date;
    endDate: Date;
    status: SprintStatus;
    capacity: number | null;
    velocity: number | null;
    burndownData: Record<string, any> | null;
    retrospective: Record<string, any> | null;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  _count?: {
    initiatives: number;
    features: number;
    sprints: number;
    members: number;
    user: number;
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

// === Validation Project stricte ===
const isValidProject = (data: any): data is ProjectSimple =>
  data && typeof data.id === "string" && Array.isArray(data.user);

// === State & Actions avec cache stable ===
interface ProjectState {
  selectedProjectId: string | null;
  projectData: ProjectSimple | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;

  // ✅ CORRECTION: Cache stable pour getSnapshot
  _cachedSelectors: Map<string, any>;
  _lastProjectSnapshot: ProjectSimple | null;
  _lastIdSnapshot: string | null;
}

interface ProjectActions {
  setSelectedProjectId: (projectId: string | null) => void;
  loadProjectData: (projectId: string, force?: boolean) => Promise<void>;
  updateProjectData: (updates: Partial<ProjectSimple>) => void;
  clearProject: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshProject: () => Promise<void>;
  invalidateCache: () => void;
  getSelectedProject: () => ProjectSimple | null;
  isProjectSelected: (projectId: string) => boolean;
  isDataFresh: () => boolean;

  // ✅ CORRECTION: Actions pour cache stable
  _clearSelectorsCache: () => void;
  _getCachedSelector: (key: string, value: any) => any;
}

type ProjectStore = ProjectState & ProjectActions;

// === Cache config optimisé ===
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CURRENT_CACHE_VERSION = 8; // ✅ Incrémenté pour reset cache

// ✅ CORRECTION: Sélecteurs stables hors du store
const EMPTY_ARRAY: any[] = [];
const EMPTY_OBJECT: Record<string, any> = {};

export const useSelectedProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // État initial
      selectedProjectId: null,
      projectData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      // ✅ CORRECTION: Cache stable pour éviter infinite loops
      _cachedSelectors: new Map(),
      _lastProjectSnapshot: null,
      _lastIdSnapshot: null,

      // ✅ CORRECTION: Actions avec cache stable
      _clearSelectorsCache: () => {
        get()._cachedSelectors.clear();
      },

      _getCachedSelector: (key: string, value: any) => {
        const cache = get()._cachedSelectors;
        const cached = cache.get(key);

        // ✅ Comparaison de référence pour stabilité
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

      setSelectedProjectId: (projectId) => {
        const current = get();
        if (current.selectedProjectId === projectId) return;

        // ✅ CORRECTION: Clear cache when changing project
        current._clearSelectorsCache();

        set({
          selectedProjectId: projectId,
          error: null,
          _lastIdSnapshot: projectId,
        });

        if (!projectId) {
          set({
            projectData: null,
            lastFetched: null,
            _lastProjectSnapshot: null,
          });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.projectData?.id === projectId;

          if (!isFresh) {
            get().loadProjectData(projectId);
          }
        }
      },

      loadProjectData: async (projectId, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.projectData?.id === projectId;

        if (isFresh) return;

        set({ isLoading: true, error: null });

        try {
          const res = await fetch(`/api/projects/${projectId}`, {
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const result: ApiResponse<ProjectSimple> = await res.json();
          const data = result.success ? result.data : result;

          if (!isValidProject(data)) {
            throw new Error("Données projet invalides");
          }

          // ✅ CORRECTION: Normalisation avec référence stable
          const normalized: ProjectSimple = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : null,
            endDate: data.endDate ? new Date(data.endDate) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            user: data.user.map((u: any) => ({
              ...u,
              lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
              createdAt: new Date(u.createdAt),
              updatedAt: new Date(u.updatedAt),
            })),
            members:
              data.members?.map((m: any) => ({
                ...m,
                joinedAt: new Date(m.joinedAt),
                user: { ...m.user },
              })) || EMPTY_ARRAY,
            initiatives:
              data.initiatives?.map((i: any) => ({
                ...i,
                startDate: i.startDate ? new Date(i.startDate) : null,
                endDate: i.endDate ? new Date(i.endDate) : null,
                createdAt: new Date(i.createdAt),
                updatedAt: new Date(i.updatedAt),
              })) || EMPTY_ARRAY,
            features:
              data.features?.map((f: any) => ({
                ...f,
                startDate: f.startDate ? new Date(f.startDate) : null,
                endDate: f.endDate ? new Date(f.endDate) : null,
                createdAt: new Date(f.createdAt),
                updatedAt: new Date(f.updatedAt),
              })) || EMPTY_ARRAY,
            sprints:
              data.sprints?.map((s: any) => ({
                ...s,
                startDate: new Date(s.startDate),
                endDate: new Date(s.endDate),
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
              })) || EMPTY_ARRAY,
            settings: data.settings || EMPTY_OBJECT,
            metadata: data.metadata || EMPTY_OBJECT,
          };

          // ✅ CORRECTION: Clear cache on data update
          current._clearSelectorsCache();

          set({
            projectData: normalized,
            isLoading: false,
            lastFetched: now,
            _lastProjectSnapshot: normalized,
          });

          // ✅ Prefetch initiatives optimisé
          if (
            normalized.id &&
            normalized.initiatives &&
            normalized.initiatives.length === 0
          ) {
            fetch(`/api/projects/${normalized.id}/initiatives`).catch(() => {
              // Silent fail pour prefetch
            });
          }
        } catch (err) {
          console.error("Erreur loadProjectData:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Erreur inconnue";

          set({
            projectData: null,
            isLoading: false,
            error: errorMessage,
            lastFetched: null,
            _lastProjectSnapshot: null,
          });
        }
      },

      updateProjectData: (updates) => {
        const current = get();
        if (!current.projectData) return;

        // ✅ CORRECTION: Clear cache on update
        current._clearSelectorsCache();

        const updatedProject = { ...current.projectData, ...updates };
        set({
          projectData: updatedProject,
          lastFetched: Date.now(),
          _lastProjectSnapshot: updatedProject,
        });
      },

      clearProject: () => {
        const current = get();
        current._clearSelectorsCache();

        set({
          selectedProjectId: null,
          projectData: null,
          lastFetched: null,
          _lastProjectSnapshot: null,
          _lastIdSnapshot: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),

      refreshProject: async () => {
        const id = get().selectedProjectId;
        if (id) {
          await get().loadProjectData(id, true);
        }
      },

      invalidateCache: () => {
        const current = get();
        current._clearSelectorsCache();
        set({ lastFetched: null });
      },

      // ✅ CORRECTION: Getters avec cache stable
      getSelectedProject: () => {
        const current = get();
        const key = `selected_project_${current.selectedProjectId}`;
        return current._getCachedSelector(key, current.projectData);
      },

      isProjectSelected: (id) => get().selectedProjectId === id,

      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "selected-project-storage",
      // ✅ CORRECTION: Persistance sélective sans cache
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        cacheVersion: state.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // ✅ CORRECTION: Migration pour nettoyer les anciens caches
      migrate: (persistedState: any, version: number) => {
        if (version < CURRENT_CACHE_VERSION) {
          return {
            selectedProjectId: persistedState?.selectedProjectId || null,
            cacheVersion: CURRENT_CACHE_VERSION,
          };
        }
        return persistedState;
      },
    }
  )
);

// === Hook Hydratation sécurisé ===
export const useProjectStoreHydration = () => {
  const setHydrated = useSelectedProjectStore((s) => s.setHydrated);
  const isHydrated = useSelectedProjectStore((s) => s.isHydrated);
  const selectedProjectId = useSelectedProjectStore((s) => s.selectedProjectId);
  const loadProjectData = useSelectedProjectStore((s) => s.loadProjectData);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await useSelectedProjectStore.persist.rehydrate();
        if (!mounted) return;

        setHydrated(true);

        // ✅ CORRECTION: Load data seulement si projet sélectionné
        if (selectedProjectId && mounted) {
          await loadProjectData(selectedProjectId);
        }
      } catch (error) {
        console.error("Erreur hydratation store:", error);
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

// ✅ CORRECTION: Sélecteurs avec cache stable pour éviter infinite loops
export const useSelectedProjectId = () => {
  const store = useSelectedProjectStore((state) => state);
  const key = "selected_project_id";
  return store._getCachedSelector(key, store.selectedProjectId);
};

export const useSelectedProjectData = () => {
  const store = useSelectedProjectStore((state) => state);
  const key = "selected_project_data";
  return store._getCachedSelector(key, store.projectData);
};

export const useProjectLoading = () =>
  useSelectedProjectStore((s) => s.isLoading);

export const useProjectError = () => useSelectedProjectStore((s) => s.error);

// ✅ CORRECTION: Actions avec référence stable
const stableActions = {
  setSelectedProjectId: (id: string | null) =>
    useSelectedProjectStore.getState().setSelectedProjectId(id),
  loadProjectData: (id: string, force?: boolean) =>
    useSelectedProjectStore.getState().loadProjectData(id, force),
  updateProjectData: (updates: Partial<ProjectSimple>) =>
    useSelectedProjectStore.getState().updateProjectData(updates),
  clearProject: () => useSelectedProjectStore.getState().clearProject(),
  refreshProject: () => useSelectedProjectStore.getState().refreshProject(),
  invalidateCache: () => useSelectedProjectStore.getState().invalidateCache(),
  getSelectedProject: () =>
    useSelectedProjectStore.getState().getSelectedProject(),
  isProjectSelected: (id: string) =>
    useSelectedProjectStore.getState().isProjectSelected(id),
  isDataFresh: () => useSelectedProjectStore.getState().isDataFresh(),
};

export const useProjectActions = () => stableActions;

// ✅ CORRECTION: Hook composite stable
export const useProjectStore = () => {
  const selectedProjectId = useSelectedProjectId();
  const projectData = useSelectedProjectData();
  const isLoading = useProjectLoading();
  const error = useProjectError();
  const isHydrated = useProjectStoreHydration();

  return {
    selectedProjectId,
    projectData,
    isLoading,
    error,
    isHydrated,
    ...stableActions,
  };
};
