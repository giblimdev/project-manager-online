//@/store/useSelectedTaskStore.ts
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

// === TYPE Task complet avec relations ===
interface TaskFull {
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
  userStoryId: string;
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
  };

  userStory?: {
    id: string;
    title: string;
    description: string | null;
    priority: Priority;
    status: TaskStatus;
    storyPoints: number | null;
    featureId: string;
    creatorId: string;
  };

  assignees?: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  }>;

  comments?: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    authorId: string;
    taskId: string;
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
    taskId: string;
    createdAt: Date;
  }>;

  dependencies?: Array<{
    id: string;
    type: string;
    description: string | null;
    dependentTaskId: string;
    dependsOnTaskId: string;
    createdAt: Date;
    dependsOnTask: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;

  dependents?: Array<{
    id: string;
    type: string;
    description: string | null;
    dependentTaskId: string;
    dependsOnTaskId: string;
    createdAt: Date;
    dependentTask: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;

  _count?: {
    comments: number;
    files: number;
    timeEntries: number;
    assignees: number;
    dependencies: number;
    dependents: number;
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
const isValidTask = (data: any): data is TaskFull =>
  data && typeof data.id === "string" && typeof data.title === "string";

// === State & Actions ===
interface TaskState {
  selectedTaskId: string | null;
  taskData: TaskFull | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;
}

interface TaskActions {
  setSelectedTaskId: (id: string | null) => void;
  loadTaskData: (id: string, force?: boolean) => Promise<void>;
  updateTaskData: (updates: Partial<TaskFull>) => void;
  clearTask: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  refreshTask: () => Promise<void>;
  invalidateCache: () => void;
  getSelectedTask: () => TaskFull | null;
  isTaskSelected: (id: string) => boolean;
  isDataFresh: () => boolean;
}

type TaskStore = TaskState & TaskActions;

// === Cache config ===
const CACHE_TTL = 5 * 60 * 1000;
const CURRENT_CACHE_VERSION = 1;

export const useSelectedTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      selectedTaskId: null,
      taskData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      setSelectedTaskId: (id) => {
        const current = get();
        if (current.selectedTaskId === id) return;

        set({ selectedTaskId: id, error: null });

        if (!id) {
          set({ taskData: null, lastFetched: null });
          return;
        }

        if (current.isHydrated) {
          const now = Date.now();
          const isFresh =
            current.lastFetched &&
            now - current.lastFetched < CACHE_TTL &&
            current.taskData?.id === id;

          if (!isFresh) {
            get().loadTaskData(id);
          }
        }
      },

      loadTaskData: async (id, force = false) => {
        const current = get();
        if (!current.isHydrated) return;

        const now = Date.now();
        const isFresh =
          !force &&
          current.lastFetched &&
          now - current.lastFetched < CACHE_TTL &&
          current.taskData?.id === id;

        if (isFresh) return;

        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`/api/tasks/${id}`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const result: ApiResponse = await res.json();
          const data = result.success ? result.data : result;
          if (!isValidTask(data)) throw new Error("Données Task invalides");

          const normalized: TaskFull = {
            ...data,
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            startDate: data.startDate ? new Date(data.startDate) : null,
            completedAt: data.completedAt ? new Date(data.completedAt) : null,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            comments: data.comments?.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
            })),
            files: data.files?.map((f: any) => ({
              ...f,
              createdAt: new Date(f.createdAt),
            })),
            timeEntries: data.timeEntries?.map((te: any) => ({
              ...te,
              date: new Date(te.date),
              startTime: te.startTime ? new Date(te.startTime) : null,
              endTime: te.endTime ? new Date(te.endTime) : null,
              createdAt: new Date(te.createdAt),
            })),
            dependencies: data.dependencies?.map((d: any) => ({
              ...d,
              createdAt: new Date(d.createdAt),
            })),
            dependents: data.dependents?.map((d: any) => ({
              ...d,
              createdAt: new Date(d.createdAt),
            })),
          };

          set({
            taskData: normalized,
            isLoading: false,
            lastFetched: now,
          });

          // === Prefetch time entries ===
          if (normalized.id) {
            fetch(`/api/tasks/${normalized.id}/time-entries`).catch(() => {});
          }
        } catch (err) {
          set({
            taskData: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Erreur inconnue",
            lastFetched: null,
          });
        }
      },

      updateTaskData: (updates) => {
        const current = get();
        if (!current.taskData) return;
        set({
          taskData: { ...current.taskData, ...updates },
          lastFetched: Date.now(),
        });
      },

      clearTask: () => {
        set({
          selectedTaskId: null,
          taskData: null,
          lastFetched: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      refreshTask: async () => {
        const id = get().selectedTaskId;
        if (id) await get().loadTaskData(id, true);
      },
      invalidateCache: () => set({ lastFetched: null }),
      getSelectedTask: () => get().taskData,
      isTaskSelected: (id) => get().selectedTaskId === id,
      isDataFresh: () => {
        const lf = get().lastFetched;
        return lf ? Date.now() - lf < CACHE_TTL : false;
      },
    }),
    {
      name: "selected-task-storage",
      partialize: (s) => ({
        selectedTaskId: s.selectedTaskId,
        cacheVersion: s.cacheVersion,
      }),
      skipHydration: true,
      version: CURRENT_CACHE_VERSION,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// === Hook Hydratation ===
export const useTaskStoreHydration = () => {
  const setHydrated = useSelectedTaskStore((s) => s.setHydrated);
  const isHydrated = useSelectedTaskStore((s) => s.isHydrated);
  const selectedTaskId = useSelectedTaskStore((s) => s.selectedTaskId);
  const loadTaskData = useSelectedTaskStore((s) => s.loadTaskData);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      await useSelectedTaskStore.persist.rehydrate();
      if (!mounted) return;
      setHydrated(true);
      if (selectedTaskId) loadTaskData(selectedTaskId);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return isHydrated;
};

// === Sélecteurs ===
export const useSelectedTaskId = () =>
  useSelectedTaskStore((s) => s.selectedTaskId);
export const useSelectedTaskData = () =>
  useSelectedTaskStore((s) => s.taskData);
export const useTaskLoading = () => useSelectedTaskStore((s) => s.isLoading);
export const useTaskError = () => useSelectedTaskStore((s) => s.error);
export const useTaskActions = () =>
  useSelectedTaskStore((s) => ({
    setSelectedTaskId: s.setSelectedTaskId,
    loadTaskData: s.loadTaskData,
    updateTaskData: s.updateTaskData,
    clearTask: s.clearTask,
    refreshTask: s.refreshTask,
    invalidateCache: s.invalidateCache,
    getSelectedTask: s.getSelectedTask,
    isTaskSelected: s.isTaskSelected,
    isDataFresh: s.isDataFresh,
  }));

// === Hook combiné ===
export const useTaskStore = () => {
  const selectedTaskId = useSelectedTaskId();
  const taskData = useSelectedTaskData();
  const isLoading = useTaskLoading();
  const error = useTaskError();
  const actions = useTaskActions();
  const isHydrated = useTaskStoreHydration();
  return { selectedTaskId, taskData, isLoading, error, isHydrated, ...actions };
};
