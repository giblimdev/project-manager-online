// stores/useSelectedProjectStore.ts

import React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProjectWithRelations } from "@/types/project"; 

interface ProjectState {
  selectedProject: ProjectWithRelations | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectActions {
  loadProject: (project: ProjectWithRelations) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProject: () => void;
  updateProject: (updates: Partial<ProjectWithRelations>) => void;
}

type ProjectStore = ProjectState & ProjectActions;

// ✅ Store principal
export const useSelectedProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // État initial
      selectedProject: null,
      isLoading: false,
      error: null,

      // Actions
      loadProject: (project: ProjectWithRelations) => {
        console.log(
          "📦 Store - Chargement du projet:",
          project.name,
          project.id
        );
        set({
          selectedProject: project,
          isLoading: false,
          error: null,
        });
        console.log("✅ Store - Projet chargé avec succès");
      },

      setLoading: (loading: boolean) => {
        console.log("⏳ Store - Loading:", loading);
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        console.log("❌ Store - Error:", error);
        set({ error, isLoading: false });
      },

      clearProject: () => {
        console.log("🗑️ Store - Nettoyage du projet");
        set({
          selectedProject: null,
          isLoading: false,
          error: null,
        });
      },

      updateProject: (updates: Partial<ProjectWithRelations>) => {
        const currentProject = get().selectedProject;
        if (currentProject) {
          console.log("📝 Store - Mise à jour du projet:", updates);
          set({
            selectedProject: {
              ...currentProject,
              ...updates,
            },
          });
        }
      },
    }),
    {
      name: "selected-project-storage",
      partialize: (state) => ({
        selectedProject: state.selectedProject,
      }),
      skipHydration: true,
    }
  )
);

// ✅ SÉLECTEURS STABLES - DÉFINIS EN DEHORS DES HOOKS
const selectProjectData = (state: ProjectStore) => state.selectedProject;
const selectIsLoading = (state: ProjectStore) => state.isLoading;
const selectError = (state: ProjectStore) => state.error;
const selectLoadProject = (state: ProjectStore) => state.loadProject;
const selectSetLoading = (state: ProjectStore) => state.setLoading;
const selectSetError = (state: ProjectStore) => state.setError;
const selectClearProject = (state: ProjectStore) => state.clearProject;
const selectUpdateProject = (state: ProjectStore) => state.updateProject;

// ✅ Hooks individuels avec sélecteurs stables
export const useSelectedProject = () => {
  return useSelectedProjectStore(selectProjectData);
};

export const useIsLoading = () => {
  return useSelectedProjectStore(selectIsLoading);
};

export const useProjectError = () => {
  return useSelectedProjectStore(selectError);
};

export const useLoadProject = () => {
  return useSelectedProjectStore(selectLoadProject);
};

export const useSetLoading = () => {
  return useSelectedProjectStore(selectSetLoading);
};

export const useSetError = () => {
  return useSelectedProjectStore(selectSetError);
};

export const useClearProject = () => {
  return useSelectedProjectStore(selectClearProject);
};

export const useUpdateProject = () => {
  return useSelectedProjectStore(selectUpdateProject);
};

// ✅ Hook combiné pour les actions (référence stable)
export const useProjectActions = () => {
  const loadProject = useSelectedProjectStore(selectLoadProject);
  const setLoading = useSelectedProjectStore(selectSetLoading);
  const setError = useSelectedProjectStore(selectSetError);
  const clearProject = useSelectedProjectStore(selectClearProject);
  const updateProject = useSelectedProjectStore(selectUpdateProject);

  return React.useMemo(
    () => ({
      loadProject,
      setLoading,
      setError,
      clearProject,
      updateProject,
    }),
    [loadProject, setLoading, setError, clearProject, updateProject]
  );
};

// ✅ Hook combiné pour les données (référence stable)
export const useProjectData = () => {
  const selectedProject = useSelectedProjectStore(selectProjectData);
  const isLoading = useSelectedProjectStore(selectIsLoading);
  const error = useSelectedProjectStore(selectError);

  return React.useMemo(
    () => ({
      selectedProject,
      isLoading,
      error,
    }),
    [selectedProject, isLoading, error]
  );
};

// ✅ Hook pour l'hydratation côté client
export const useStoreHydration = () => {
  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = useSelectedProjectStore.persist.onFinishHydration(
      () => {
        setHasHydrated(true);
      }
    );

    // Forcer la rehydratation si elle n'a pas encore eu lieu
    if (!useSelectedProjectStore.persist.hasHydrated()) {
      useSelectedProjectStore.persist.rehydrate();
    } else {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hasHydrated;
};

// ✅ Hook principal avec hydratation sécurisée
export const useHydratedProjectStore = () => {
  const hasHydrated = useStoreHydration();
  const projectData = useProjectData();
  const projectActions = useProjectActions();

  return React.useMemo(
    () => ({
      hasHydrated,
      ...projectData,
      ...projectActions,
    }),
    [hasHydrated, projectData, projectActions]
  );
};
