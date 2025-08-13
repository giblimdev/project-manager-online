//@/store/useSelectedSprintStore.ts
"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// === ENUMS ===
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "CODE_REVIEW"
  | "TESTING"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED";

// === TYPE UserStory complet avec relations ===
interface UserStoryFull {
  id: string;
  title: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: Priority;
  status: TaskStatus;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours: number | null;
  actualHours: number | null;
  featureId: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  creator?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
  };

  feature?: {
    id: string;
    name: string;
    description: string | null;
    priority: Priority;
    status: string;
    storyPoints: number | null;
    businessValue: number | null;
    progress: number;
    epicId: string;
  };

  assignees?: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    isActive: boolean;
  }>;

  tasks?: Array<{
    id: string;
    title: string;
    order: number;
    description: string | null;
    priority: Priority;
    status: TaskStatus;
    type: string;
    position: number;
    labels: string[];
    tags: string[];
    estimatedHours: number | null;
    actualHours: number | null;
    dueDate: Date | null;
    startDate: Date | null;
    completedAt: Date | null;
    creatorId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

  comments?: Array<{
    id: string;
    title: string;
    content: string;
    mentions: string[];
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    isPinned: boolean;
    isResolved: boolean;
  }>;

  files?: Array<{
    id: string;
    name: string;
    type: string;
    mimeType: string | null;
    path: string | null;
    description: string | null;
    version: number;
    isFolder: boolean;
    metadata: Record<string, any> | null;
    tags: string[];
    createdAt: Date;
  }>;

  timeEntries?: Array<{
    id: string;
    description: string | null;
    hours: number;
    date: Date;
    startTime: Date | null;
    endTime: Date | null;
    isManual: boolean;
    userId: string;
    userStoryId: string;
    createdAt: Date;
  }>;

  dependencies?: Array<{
    id: string;
    type: string;
    description: string | null;
    dependentUserStoryId: string;
    dependsOnUserStoryId: string;
    createdAt: Date;
    dependsOnUserStory: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;

  dependents?: Array<{
    id: string;
    type: string;
    description: string | null;
    dependentUserStoryId: string;
    dependsOnUserStoryId: string;
    createdAt: Date;
    dependentUserStory: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;

  sprints?: Array<{
    id: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    status: string;
    projectId: string;
  }>;

  _count?: {
    assignees: number;
    tasks: number;
    comments: number;
    files: number;
    timeEntries: number;
    dependencies: number;
    dependents: number;
    sprints: number;
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
const isValidUserStory = (data: any): data is UserStoryFull =>
  data && typeof data.id === "string" && typeof data.title === "string";

// === State & Actions ===
interface UserStoryState {
  selectedUserStoryId: string | null;
  userStoryData: UserStoryFull | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;
}

interface UserStoryActions {
  setSelectedUserStoryId: (id: string | null) => void;
  loadUserStoryData: (id: string, force?: boolean) => Promise<void>;
  updateUserStoryData: (updates: Partial<UserStoryFull>) => void;
  clearUserStory: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshUserStory: () => Promise<void>;
  invalidateCache: () => void;
  getSelectedUserStory: () => UserStoryFull | null;
  isUserStorySelected: (id: string) => boolean;
  isDataFresh: () => boolean;
}

type UserStoryStore = UserStoryState & UserStoryActions;

// === Cache config ===
const CACHE_TTL = 5 * 60 * 1000;
const CURRENT_CACHE_VERSION = 1;

export const useSelectedUserStoryStore = create<UserStoryStore>()(
  persist(
    (set, get) => ({
      selectedUserStoryId: null,
      userStoryData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      setSelectedUserStoryId: (id) => {
        const current = get();
        if (current.selectedUserStoryId === id) return;

        set({ selectedUserStoryId: id, error: null });

        if (!id) {
          set({ userStoryData: null, lastFetched: null });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.userStoryData?.id === id;

          if (!isFresh) {
            get().loadUserStoryData(id);
          }
        }
      },

      loadUserStoryData: async (id, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.userStoryData?.id === id;

        if (isFresh) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/userstories/${id}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const result: ApiResponse = await res.json();
          const data = result.success ? result.data : result;
          if (!isValidUserStory(data))
            throw new Error("Données UserStory invalides");

          const normalized: UserStoryFull = {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            tasks: data.tasks?.map((task: any) => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              startDate: task.startDate ? new Date(task.startDate) : null,
              completedAt: task.completedAt ? new Date(task.completedAt) : null,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt),
            })),
            comments: data.comments?.map((comment: any) => ({
              ...comment,
              createdAt: new Date(comment.createdAt),
              updatedAt: new Date(comment.updatedAt),
            })),
            files: data.files?.map((file: any) => ({
              ...file,
              createdAt: new Date(file.createdAt),
            })),
            timeEntries: data.timeEntries?.map((te: any) => ({
              ...te,
              date: new Date(te.date),
              startTime: te.startTime ? new Date(te.startTime) : null,
              endTime: te.endTime ? new Date(te.endTime) : null,
              createdAt: new Date(te.createdAt),
            })),
            dependencies: data.dependencies?.map((dep: any) => ({
              ...dep,
              createdAt: new Date(dep.createdAt),
            })),
            dependents: data.dependents?.map((dep: any) => ({
              ...dep,
              createdAt: new Date(dep.createdAt),
            })),
            sprints: data.sprints?.map((sprint: any) => ({
              ...sprint,
              startDate: new Date(sprint.startDate),
              endDate: new Date(sprint.endDate),
            })),
          };

          set({
            userStoryData: normalized,
            isLoading: false,
            lastFetched: now,
          });

          // === Prefetch tasks ===
          if (normalized.id) {
            fetch(`/api/userstories/${normalized.id}/tasks`).catch(() => {});
          }
        } catch (err) {
          set({
            userStoryData: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Erreur inconnue",
            lastFetched: null,
          });
        }
      },

      updateUserStoryData: (updates) => {
        const current = get();
        if (!current.userStoryData) return;
        set({
          userStoryData: { ...current.userStoryData, ...updates },
          lastFetched: Date.now(),
        });
      },

      clearUserStory: () => {
        set({
          selectedUserStoryId: null,
          userStoryData: null,
          lastFetched: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      refreshUserStory: async () => {
        const id = get().selectedUserStoryId;
        if (id) await get().loadUserStoryData(id, true);
      },
      invalidateCache: () => set({ lastFetched: null }),
      getSelectedUserStory: () => get().userStoryData,
      isUserStorySelected: (id) => get().selectedUserStoryId === id,
      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "selected-userstory-storage",
      partialize: (s) => ({
        selectedUserStoryId: s.selectedUserStoryId,
        cacheVersion: s.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// === Hook Hydratation ===
export const useUserStoryStoreHydration = () => {
  const setHydrated = useSelectedUserStoryStore((s) => s.setHydrated);
  const isHydrated = useSelectedUserStoryStore((s) => s.isHydrated);
  const selectedUserStoryId = useSelectedUserStoryStore(
    (s) => s.selectedUserStoryId
  );
  const loadUserStoryData = useSelectedUserStoryStore(
    (s) => s.loadUserStoryData
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await useSelectedUserStoryStore.persist.rehydrate();
      if (!mounted) return;
      setHydrated(true);
      if (selectedUserStoryId) loadUserStoryData(selectedUserStoryId);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return isHydrated;
};

// === Sélecteurs ===
export const useSelectedUserStoryId = () =>
  useSelectedUserStoryStore((s) => s.selectedUserStoryId);
export const useSelectedUserStoryData = () =>
  useSelectedUserStoryStore((s) => s.userStoryData);
export const useUserStoryLoading = () =>
  useSelectedUserStoryStore((s) => s.isLoading);
export const useUserStoryError = () =>
  useSelectedUserStoryStore((s) => s.error);
export const useUserStoryActions = () =>
  useSelectedUserStoryStore((s) => ({
    setSelectedUserStoryId: s.setSelectedUserStoryId,
    loadUserStoryData: s.loadUserStoryData,
    updateUserStoryData: s.updateUserStoryData,
    clearUserStory: s.clearUserStory,
    refreshUserStory: s.refreshUserStory,
    invalidateCache: s.invalidateCache,
    getSelectedUserStory: s.getSelectedUserStory,
    isUserStorySelected: s.isUserStorySelected,
    isDataFresh: s.isDataFresh,
  }));

// === Hook combiné ===
export const useUserStoryStore = () => {
  const selectedUserStoryId = useSelectedUserStoryId();
  const userStoryData = useSelectedUserStoryData();
  const isLoading = useUserStoryLoading();
  const error = useUserStoryError();
  const actions = useUserStoryActions();
  const isHydrated = useUserStoryStoreHydration();
  return {
    selectedUserStoryId,
    userStoryData,
    isLoading,
    error,
    isHydrated,
    ...actions,
  };
};
