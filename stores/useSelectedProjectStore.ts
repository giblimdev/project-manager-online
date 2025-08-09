// stores/useSelectedProjectStore.ts

/**
 * RÔLE : Store Zustand optimisé pour la gestion du projet sélectionné avec interfaces complètes
 *
 * RESPONSABILITÉS :
 * - Persistance de l'ID du projet sélectionné avec données complètes selon schéma Prisma
 * - Chargement paresseux des données du projet via l'API avec relations (members, initiatives, features, _count)
 * - Gestion des états de chargement et d'erreur avec Better Auth et validation des sessions
 * - Hydratation sécurisée côté client avec Next.js 15 et protection contre les boucles infinies
 * - Cache intelligent des données projet avec TTL et invalidation automatique
 * - Synchronisation entre composants et pages avec réactivité optimisée
 * - Support complet des relations Prisma : ProjectMember[], Initiative[], Feature[], _count
 * - Interface TypeScript stricte conforme au schéma Prisma Project avec toutes les propriétés
 *
 * COMPOSANTS UTILISÉS :
 * - zustand pour le state management global avec persist middleware moderne
 * - zustand/middleware pour la persistance localStorage avec createJSONStorage API
 * - Better Auth pour l'authentification et validation des sessions utilisateur
 * - React hooks pour l'hydratation sécurisée et lifecycle management optimisé
 *
 * LIBS UTILISÉS :
 * - zustand (^5.0.0) avec persist middleware et createJSONStorage API moderne
 * - React 18 hooks pour l'hydratation sécurisée et gestion du lifecycle
 * - TypeScript strict mode avec Next.js 15 et interfaces complètes basées sur Prisma
 * - localStorage pour la persistance cross-sessions avec API moderne async
 * - Fetch API pour les requêtes vers /api/projects/[id] avec cache intelligent
 * - Date.js pour manipulation des dates ISO et conversion des timestamps
 *
 * API :
 * - GET /api/projects/[id] (chargement d'un projet spécifique avec relations complètes)
 * - Support des réponses API avec success/error/data/timestamp selon votre route
 */

"use client";

import React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ✅ CORRECTION PRINCIPALE: Interface ProjectSimple complète selon votre schéma Prisma Project
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

  // ✅ CORRECTION: Ajout des relations manquantes selon votre schéma Prisma
  user?: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    username: string | null;
    isActive: boolean;
  }>;

  // ✅ CORRECTION: Relation members via ProjectMember[] selon votre schéma
  members?: Array<{
    id: string;
    role: string; // UserRole enum : ADMIN, PRODUCT_OWNER, SCRUM_MASTER, DEVELOPER, STAKEHOLDER, VIEWER
    joinedAt: Date;
    isActive: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;

  // ✅ CORRECTION: Relation initiatives via Initiative[] selon votre schéma
  initiatives?: Array<{
    id: string;
    name: string;
    description: string | null;
    objective: string | null;
    priority: string; // Priority enum : CRITICAL, HIGH, MEDIUM, LOW
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    progress: number; // Float 0.0-1.0 converti en pourcentage par l'API
    budget: number | null;
    roi: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>;

  // ✅ CORRECTION: Relation features via Feature[] selon votre schéma (via Epic -> Feature)
  features?: Array<{
    id: string;
    name: string;
    description: string | null;
    acceptanceCriteria: string | null;
    priority: string; // Priority enum : CRITICAL, HIGH, MEDIUM, LOW
    status: string;
    storyPoints: number | null;
    businessValue: number | null;
    technicalRisk: number | null;
    effort: number | null;
    startDate: Date | null;
    endDate: Date | null;
    progress: number; // Float 0.0-1.0 converti en pourcentage par l'API
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }>;

  // ✅ CORRECTION: Propriété _count générée automatiquement par Prisma avec include/_count
  _count?: {
    initiatives: number;
    features: number;
    sprints: number;
    files: number;
    channels: number;
    templates: number;
    members: number;
  };
}

// Interface pour les réponses API selon votre route /api/projects/[id]
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Interface pour l'état du projet dans le store avec propriétés étendues
interface ProjectState {
  selectedProjectId: string | null;
  projectData: ProjectSimple | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  lastFetched: number | null;
  cacheVersion: number;
}

// Interface pour les actions du store avec méthodes complètes
interface ProjectActions {
  // Actions principales
  setSelectedProjectId: (projectId: string | null) => void;
  loadProjectData: (projectId: string, force?: boolean) => Promise<void>;
  updateProjectData: (updates: Partial<ProjectSimple>) => void;
  clearProject: () => void;

  // Gestion des états
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;

  // Utilitaires
  refreshProject: () => Promise<void>;
  invalidateCache: () => void;

  // Getters dérivés
  getSelectedProject: () => ProjectSimple | null;
  isProjectSelected: (projectId: string) => boolean;
  isDataFresh: () => boolean;
}

// Type combiné pour le store
type ProjectStore = ProjectState & ProjectActions;

// Configuration du cache (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const CURRENT_CACHE_VERSION = 4; // ✅ Incrémenté pour invalider l'ancien cache

// Configuration du store avec persistance optimisée
export const useSelectedProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // État initial optimisé
      selectedProjectId: null,
      projectData: null,
      isLoading: false,
      isHydrated: false,
      error: null,
      lastFetched: null,
      cacheVersion: CURRENT_CACHE_VERSION,

      // Actions principales
      setSelectedProjectId: (projectId: string | null) => {
        console.log("📦 Store - Sélection projet ID:", projectId);

        const currentState = get();

        // Si c'est le même projet, ne rien faire
        if (currentState.selectedProjectId === projectId) {
          console.log("ℹ️ Store - Projet déjà sélectionné");
          return;
        }

        // Mettre à jour l'ID sélectionné et nettoyer l'erreur
        set({
          selectedProjectId: projectId,
          error: null,
        });

        // Si projectId est null, nettoyer toutes les données
        if (!projectId) {
          set({
            projectData: null,
            lastFetched: null,
            isLoading: false,
          });
          console.log("🗑️ Store - Données du projet nettoyées");
          return;
        }

        // ✅ Vérifier l'hydratation avant de charger
        if (currentState.isHydrated) {
          // Vérifier si on a déjà les données fraîches pour ce projet
          const now = Date.now();
          const isDataFresh =
            currentState.lastFetched &&
            now - currentState.lastFetched < CACHE_TTL &&
            currentState.projectData?.id === projectId;

          if (isDataFresh) {
            console.log("✅ Store - Données du projet en cache et fraîches");
            return;
          }

          // Charger les données du projet automatiquement
          console.log("🔄 Store - Chargement automatique des données");
          get().loadProjectData(projectId);
        } else {
          console.log("⏳ Store - Hydratation en cours, chargement différé");
        }
      },

      loadProjectData: async (
        projectId: string,
        force: boolean = false
      ): Promise<void> => {
        const currentState = get();

        // Ne pas charger si pas hydraté
        if (!currentState.isHydrated) {
          console.log("⚠️ Store - Store pas encore hydraté, chargement annulé");
          return;
        }

        // Vérifier si on a besoin de charger (cache fresh check)
        const now = Date.now();
        const isDataFresh =
          !force &&
          currentState.lastFetched &&
          now - currentState.lastFetched < CACHE_TTL &&
          currentState.projectData?.id === projectId;

        if (isDataFresh) {
          console.log("✅ Store - Données déjà fraîches, pas de rechargement");
          return;
        }

        console.log(
          "🔄 Store - Chargement des données pour le projet:",
          projectId
        );
        set({ isLoading: true, error: null });

        try {
          // ✅ Requête vers l'API pour récupérer les données complètes du projet
          const response = await fetch(`/api/projects/${projectId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Session expirée, veuillez vous reconnecter");
            }
            if (response.status === 404) {
              throw new Error("Projet non trouvé ou supprimé");
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // ✅ CORRECTION: Gérer les réponses selon votre format API
          const result = await response.json();

          // Votre API route retourne directement les données ou dans une structure success/data
          let projectData: ProjectSimple;

          if (result.success !== undefined) {
            // Format avec success/data/error selon votre route
            if (!result.success || !result.data) {
              throw new Error(
                result.error ||
                  result.message ||
                  "Erreur lors du chargement du projet"
              );
            }
            projectData = result.data;
          } else {
            // Format direct de données
            projectData = result;
          }

          console.log(
            "✅ Store - Données du projet chargées:",
            projectData.name
          );

          // ✅ CORRECTION: Conversion des dates pour les objets imbriqués selon votre schéma
          const normalizedProjectData: ProjectSimple = {
            ...projectData,
            // Conversion des dates principales
            startDate: projectData.startDate
              ? new Date(projectData.startDate)
              : null,
            endDate: projectData.endDate ? new Date(projectData.endDate) : null,
            createdAt: new Date(projectData.createdAt),
            updatedAt: new Date(projectData.updatedAt),

            // Conversion des dates dans les relations membres
            members: projectData.members?.map((member) => ({
              ...member,
              joinedAt: new Date(member.joinedAt),
            })),

            // Conversion des dates dans les relations initiatives
            initiatives: projectData.initiatives?.map((initiative) => ({
              ...initiative,
              startDate: initiative.startDate
                ? new Date(initiative.startDate)
                : null,
              endDate: initiative.endDate ? new Date(initiative.endDate) : null,
              createdAt: new Date(initiative.createdAt),
              updatedAt: new Date(initiative.updatedAt),
            })),

            // Conversion des dates dans les relations features
            features: projectData.features?.map((feature) => ({
              ...feature,
              startDate: feature.startDate ? new Date(feature.startDate) : null,
              endDate: feature.endDate ? new Date(feature.endDate) : null,
              createdAt: new Date(feature.createdAt),
              updatedAt: new Date(feature.updatedAt),
            })),
          };

          // Mise à jour de l'état avec les nouvelles données
          set({
            projectData: normalizedProjectData,
            isLoading: false,
            error: null,
            lastFetched: now,
          });
        } catch (error) {
          console.error("💥 Store - Erreur chargement projet:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Erreur inconnue";

          set({
            projectData: null,
            isLoading: false,
            error: errorMessage,
            lastFetched: null,
          });

          // Si c'est une erreur d'auth, nettoyer le projet sélectionné
          if (
            errorMessage.includes("Session expirée") ||
            errorMessage.includes("401")
          ) {
            set({ selectedProjectId: null });
          }
        }
      },

      updateProjectData: (updates: Partial<ProjectSimple>) => {
        const currentState = get();

        if (!currentState.projectData) {
          console.warn("⚠️ Store - Aucune donnée de projet à mettre à jour");
          return;
        }

        console.log("📝 Store - Mise à jour des données du projet:", updates);

        // Fusionner les mises à jour avec les données existantes
        const updatedProject: ProjectSimple = {
          ...currentState.projectData,
          ...updates,
          // Mise à jour automatique du timestamp
          updatedAt: new Date(),
        };

        set({
          projectData: updatedProject,
          lastFetched: Date.now(), // Marquer comme frais
          error: null,
        });

        console.log("✅ Store - Données du projet mises à jour");
      },

      clearProject: () => {
        console.log("🗑️ Store - Nettoyage complet du projet");
        set({
          selectedProjectId: null,
          projectData: null,
          isLoading: false,
          error: null,
          lastFetched: null,
        });
      },

      // Gestion des états
      setLoading: (loading: boolean) => {
        console.log("⏳ Store - Loading:", loading);
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        console.log("❌ Store - Error:", error);
        set({ error, isLoading: false });
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },

      refreshProject: async (): Promise<void> => {
        const currentState = get();
        if (currentState.selectedProjectId && currentState.isHydrated) {
          console.log("🔄 Store - Rafraîchissement forcé du projet");
          await get().loadProjectData(currentState.selectedProjectId, true);
        }
      },

      invalidateCache: () => {
        console.log("🧹 Store - Invalidation du cache");
        set({ lastFetched: null });
      },

      // Getters dérivés
      getSelectedProject: (): ProjectSimple | null => {
        return get().projectData;
      },

      isProjectSelected: (projectId: string): boolean => {
        return get().selectedProjectId === projectId;
      },

      isDataFresh: (): boolean => {
        const currentState = get();
        if (!currentState.lastFetched) return false;

        const now = Date.now();
        return now - currentState.lastFetched < CACHE_TTL;
      },
    }),
    {
      name: "selected-project-storage",
      // Persister seulement les données essentielles pour optimiser les performances
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        cacheVersion: state.cacheVersion,
      }),
      // Désactiver l'hydratation automatique pour un contrôle manual
      skipHydration: true,
      // ✅ Version incrémentée pour invalider l'ancien cache
      version: CURRENT_CACHE_VERSION,
      // Utilisation de 'storage' au lieu de 'getStorage' (API moderne)
      storage: createJSONStorage(() => localStorage),
      // Migration des données si changement de version
      migrate: (persistedState: any, version: number) => {
        console.log("🔄 Store - Migration depuis version:", version);

        // Migration depuis version < 4 (structure précédente)
        if (version < CURRENT_CACHE_VERSION) {
          return {
            selectedProjectId: persistedState.selectedProjectId || null,
            cacheVersion: CURRENT_CACHE_VERSION,
          };
        }

        return persistedState;
      },
    }
  )
);

// Hook d'hydratation amélioré avec protection contre les boucles
export const useProjectStoreHydration = () => {
  const setHydrated = useSelectedProjectStore((state) => state.setHydrated);
  const isHydrated = useSelectedProjectStore((state) => state.isHydrated);
  const selectedProjectId = useSelectedProjectStore(
    (state) => state.selectedProjectId
  );
  const loadProjectData = useSelectedProjectStore(
    (state) => state.loadProjectData
  );

  React.useEffect(() => {
    let mounted = true;
    let hydrationTimeout: NodeJS.Timeout;

    const hydrateStore = async () => {
      try {
        console.log("🔄 Store - Début de l'hydratation");

        // Force l'hydratation du store depuis localStorage avec API moderne
        await useSelectedProjectStore.persist.rehydrate();

        if (mounted) {
          console.log("✅ Store - Hydratation terminée");
          setHydrated(true);

          // Charger automatiquement les données du projet si un ID est persisté
          // Mais seulement après l'hydratation complète
          hydrationTimeout = setTimeout(() => {
            if (mounted && selectedProjectId) {
              console.log(
                "🔄 Hydratation - Chargement automatique du projet:",
                selectedProjectId
              );
              loadProjectData(selectedProjectId);
            }
          }, 100); // Petit délai pour s'assurer que l'hydratation est complète
        }
      } catch (error) {
        console.error("💥 Store - Erreur hydratation:", error);
        if (mounted) {
          setHydrated(true); // Continuer même en cas d'erreur
        }
      }
    };

    hydrateStore();

    return () => {
      mounted = false;
      if (hydrationTimeout) {
        clearTimeout(hydrationTimeout);
      }
    };
  }, []); // Dépendances vides pour éviter les boucles

  return isHydrated;
};

// Sélecteurs optimisés pour éviter les re-rendus inutiles
export const useSelectedProjectId = () =>
  useSelectedProjectStore((state) => state.selectedProjectId);

export const useSelectedProjectData = () =>
  useSelectedProjectStore((state) => state.projectData);

export const useProjectLoading = () =>
  useSelectedProjectStore((state) => state.isLoading);

export const useProjectError = () =>
  useSelectedProjectStore((state) => state.error);

export const useProjectActions = () =>
  useSelectedProjectStore((state) => ({
    setSelectedProjectId: state.setSelectedProjectId,
    loadProjectData: state.loadProjectData,
    updateProjectData: state.updateProjectData,
    clearProject: state.clearProject,
    setLoading: state.setLoading,
    setError: state.setError,
    refreshProject: state.refreshProject,
    invalidateCache: state.invalidateCache,
    getSelectedProject: state.getSelectedProject,
    isProjectSelected: state.isProjectSelected,
    isDataFresh: state.isDataFresh,
  }));

// Hook combiné pour les cas d'usage courants
export const useProjectStore = () => {
  const selectedProjectId = useSelectedProjectId();
  const projectData = useSelectedProjectData();
  const isLoading = useProjectLoading();
  const error = useProjectError();
  const actions = useProjectActions();
  const isHydrated = useProjectStoreHydration();

  return {
    selectedProjectId,
    projectData,
    isLoading,
    error,
    isHydrated,
    ...actions,
  };
};

// Hook pour surveiller la sélection d'un projet spécifique
export const useProjectSelection = (projectId: string) => {
  const isSelected = useSelectedProjectStore((state) =>
    state.isProjectSelected(projectId)
  );
  const setSelectedProjectId = useSelectedProjectStore(
    (state) => state.setSelectedProjectId
  );

  const select = React.useCallback(() => {
    setSelectedProjectId(projectId);
  }, [projectId, setSelectedProjectId]);

  const deselect = React.useCallback(() => {
    setSelectedProjectId(null);
  }, [setSelectedProjectId]);

  return {
    isSelected,
    select,
    deselect,
  };
};

// Export par défaut
export default useSelectedProjectStore;
