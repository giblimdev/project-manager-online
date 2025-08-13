// @/hooks/useFeatures.ts

// Rôle : Hook personnalisé pour gérer les features avec modes d'affichage et réorganisation
// Responsabilités : Fetch, cache, mutations CRUD, réorganisation ordre, conversion types complètes, transformation données
// Composants utilisés : fetch API, gestion d'état React, localStorage
// Libs externes : sonner (pour les notifications toast)
// Types utilisés : types centralisés depuis @/types/feature (TRANSFORMATION COMPLÈTE DES CHAMPS)
// Utilisé par : composants React, pages features, composants d'affichage

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelectedEpicId } from "@/stores/useSelectedEpicStore";
import { toast } from "sonner";
import type { Priority } from "@/lib/generated/prisma/client";
import {
  FeatureWithHierarchy,
  FeatureSimple,
  SimpleFeature,
  FeatureDisplayMode,
  FeatureFormData,
  FeatureApiData,
  ReorderRequest,
  ApiResponse,
} from "@/types/feature";

interface UseFeaturesReturn {
  // Données brutes
  features: FeatureWithHierarchy[];
  availableParents: FeatureWithHierarchy[];

  // Données transformées pour les différents modes
  featuresSimple: FeatureSimple[];
  featuresTree: FeatureSimple[];

  // État
  isLoading: boolean;
  error: string | null;
  displayMode: FeatureDisplayMode;

  // Actions CRUD
  refetch: () => Promise<void>;
  createFeature: (data: FeatureFormData) => Promise<boolean>;
  updateFeature: (
    id: string,
    data: Partial<FeatureFormData>
  ) => Promise<boolean>;
  deleteFeature: (id: string) => Promise<boolean>;
  getFeatureById: (id: string) => FeatureWithHierarchy | undefined;

  // Actions réorganisation
  moveFeatureUp: (featureId: string) => Promise<boolean>;
  moveFeatureDown: (featureId: string) => Promise<boolean>;
  reorderFeatures: (reorderData: ReorderRequest[]) => Promise<boolean>;
  updateFeatureOrder: (featureId: string, newOrder: number) => Promise<boolean>;

  // Actions mode d'affichage
  setDisplayMode: (mode: FeatureDisplayMode) => void;
  getDisplayConfig: () => {
    mode: FeatureDisplayMode;
    isListMode: boolean;
    isTreeMode: boolean;
    isDetailMode: boolean;
  };
}

// ✅ Export des types pour compatibilité (réexport depuis types centralisés)
export type {
  FeatureFormData,
  SimpleFeature,
  FeatureWithHierarchy,
  ReorderRequest,
  FeatureDisplayMode,
} from "@/types/feature";

// ✅ CORRECTION MAJEURE : Fonction pour transformer en données simplifiées avec TOUS les champs requis
const transformToSimple = (
  features: FeatureWithHierarchy[]
): FeatureSimple[] => {
  return features.map((feature) => ({
    // ✅ CORRECTION : Inclusion de TOUS les champs requis par FeatureSimple (qui étend SimpleFeature)
    id: feature.id,
    name: feature.name,
    order: feature.order,
    description: feature.description,
    acceptanceCriteria: feature.acceptanceCriteria, // ✅ Champ manquant ajouté
    priority: feature.priority,
    status: feature.status,
    storyPoints: feature.storyPoints, // ✅ Champ manquant ajouté
    businessValue: feature.businessValue, // ✅ Champ manquant ajouté
    technicalRisk: feature.technicalRisk, // ✅ Champ manquant ajouté
    effort: feature.effort, // ✅ Champ manquant ajouté
    startDate: feature.startDate, // ✅ Champ manquant ajouté
    endDate: feature.endDate, // ✅ Champ manquant ajouté
    progress: feature.progress,
    position: feature.position, // ✅ Champ manquant ajouté
    createdAt: feature.createdAt, // ✅ Champ manquant ajouté
    updatedAt: feature.updatedAt, // ✅ Champ manquant ajouté
    epicId: feature.epicId, // ✅ Champ manquant ajouté
    parentId: feature.parentId,
    projectId: feature.projectId, // ✅ Champ manquant ajouté
    userId: feature.userId, // ✅ Champ manquant ajouté
    // ✅ Champ spécifique à FeatureSimple
    children: feature.children
      ? transformToSimple(feature.children)
      : undefined,
  }));
};

// Fonction pour construire l'arbre hiérarchique
const buildFeatureTree = (features: FeatureSimple[]): FeatureSimple[] => {
  const featureMap = new Map<
    string,
    FeatureSimple & { children: FeatureSimple[] }
  >();
  const rootFeatures: FeatureSimple[] = [];

  // Créer une map avec children initialisés
  features.forEach((feature) => {
    featureMap.set(feature.id, { ...feature, children: [] });
  });

  // Construire l'arbre
  features.forEach((feature) => {
    const featureWithChildren = featureMap.get(feature.id)!;

    if (feature.parentId) {
      const parent = featureMap.get(feature.parentId);
      if (parent) {
        parent.children.push(featureWithChildren);
      } else {
        // Parent non trouvé, traiter comme racine
        rootFeatures.push(featureWithChildren);
      }
    } else {
      // Feature racine
      rootFeatures.push(featureWithChildren);
    }
  });

  // Trier les enfants par ordre
  const sortChildren = (features: FeatureSimple[]) => {
    features.sort((a, b) => a.order - b.order);
    features.forEach((feature) => {
      if ("children" in feature && feature.children) {
        sortChildren(feature.children);
      }
    });
  };

  sortChildren(rootFeatures);
  return rootFeatures;
};

// Fonctions utilitaires de conversion
const convertFormDataToApiData = (
  formData: FeatureFormData
): FeatureApiData => {
  return {
    name: formData.name,
    description: formData.description,
    acceptanceCriteria: formData.acceptanceCriteria,
    priority: formData.priority,
    status: formData.status,
    storyPoints: formData.storyPoints,
    businessValue: formData.businessValue,
    technicalRisk: formData.technicalRisk,
    effort: formData.effort,
    startDate: formData.startDate ? new Date(formData.startDate) : null,
    endDate: formData.endDate ? new Date(formData.endDate) : null,
    parentId: formData.parentId,
  };
};

const convertPartialFormDataToApiData = (
  formData: Partial<FeatureFormData>
): Partial<FeatureApiData> => {
  const apiData: Partial<FeatureApiData> = {};

  Object.keys(formData).forEach((key) => {
    if (key !== "startDate" && key !== "endDate") {
      (apiData as any)[key] = (formData as any)[key];
    }
  });

  if (formData.startDate !== undefined) {
    apiData.startDate = formData.startDate
      ? new Date(formData.startDate)
      : null;
  }

  if (formData.endDate !== undefined) {
    apiData.endDate = formData.endDate ? new Date(formData.endDate) : null;
  }

  return apiData;
};

export const useFeatures = (): UseFeaturesReturn => {
  const [features, setFeatures] = useState<FeatureWithHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayModeState] = useState<FeatureDisplayMode>(
    FeatureDisplayMode.LIST
  );

  const selectedEpicId = useSelectedEpicId();

  // ✅ Mémorisation des données transformées avec transformation complète
  const featuresSimple = useMemo(() => transformToSimple(features), [features]);

  const featuresTree = useMemo(
    () => buildFeatureTree(featuresSimple),
    [featuresSimple]
  );

  // Persistance du mode d'affichage
  const setDisplayMode = useCallback((mode: FeatureDisplayMode) => {
    setDisplayModeState(mode);
    localStorage.setItem("features-display-mode", mode);
  }, []);

  // Récupération du mode d'affichage depuis localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem(
      "features-display-mode"
    ) as FeatureDisplayMode;
    if (savedMode && Object.values(FeatureDisplayMode).includes(savedMode)) {
      setDisplayModeState(savedMode);
    }
  }, []);

  // Configuration du mode d'affichage
  const getDisplayConfig = useCallback(() => {
    return {
      mode: displayMode,
      isListMode: displayMode === FeatureDisplayMode.LIST,
      isTreeMode: displayMode === FeatureDisplayMode.TREE,
      isDetailMode: displayMode === FeatureDisplayMode.DETAIL,
    };
  }, [displayMode]);

  const fetchFeatures = useCallback(async (): Promise<void> => {
    if (!selectedEpicId) {
      setFeatures([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const url = new URL("/api/features", window.location.origin);
      url.searchParams.set("epicId", selectedEpicId);
      url.searchParams.set("includeHierarchy", "true");

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: ApiResponse<FeatureWithHierarchy[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur inconnue");
      }

      const normalizedFeatures = (result.data || []).map((feature) => ({
        ...feature,
        startDate: feature.startDate ? new Date(feature.startDate) : null,
        endDate: feature.endDate ? new Date(feature.endDate) : null,
        createdAt: new Date(feature.createdAt),
        updatedAt: new Date(feature.updatedAt),
        parent: feature.parent
          ? {
              ...feature.parent,
              startDate: feature.parent.startDate
                ? new Date(feature.parent.startDate)
                : null,
              endDate: feature.parent.endDate
                ? new Date(feature.parent.endDate)
                : null,
              createdAt: new Date(feature.parent.createdAt),
              updatedAt: new Date(feature.parent.updatedAt),
            }
          : null,
        children: feature.children
          ? feature.children.map((child) => ({
              ...child,
              startDate: child.startDate ? new Date(child.startDate) : null,
              endDate: child.endDate ? new Date(child.endDate) : null,
              createdAt: new Date(child.createdAt),
              updatedAt: new Date(child.updatedAt),
            }))
          : [],
      }));

      normalizedFeatures.sort((a, b) => a.order - b.order);
      setFeatures(normalizedFeatures);
    } catch (err) {
      console.error("Erreur lors du fetch des features:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      setFeatures([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEpicId]);

  // Calculer les parents disponibles
  const availableParents = features.filter((feature) => {
    return true; // À adapter selon vos besoins métier
  });

  // Fonction pour récupérer une feature par ID
  const getFeatureById = useCallback(
    (id: string): FeatureWithHierarchy | undefined => {
      return features.find((feature) => feature.id === id);
    },
    [features]
  );

  // Fonctions de réorganisation
  const moveFeatureUp = useCallback(
    async (featureId: string): Promise<boolean> => {
      try {
        setError(null);

        const currentIndex = features.findIndex((f) => f.id === featureId);
        if (currentIndex <= 0) return false;

        const currentFeature = features[currentIndex];
        const previousFeature = features[currentIndex - 1];

        const newOrder = previousFeature.order - 1;

        const success = await updateFeatureOrder(featureId, newOrder);
        if (success) {
          toast.success(`"${currentFeature.name}" déplacée vers le haut`);
        }
        return success;
      } catch (err) {
        console.error("Erreur lors du déplacement vers le haut:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [features]
  );

  const moveFeatureDown = useCallback(
    async (featureId: string): Promise<boolean> => {
      try {
        setError(null);

        const currentIndex = features.findIndex((f) => f.id === featureId);
        if (currentIndex >= features.length - 1) return false;

        const currentFeature = features[currentIndex];
        const nextFeature = features[currentIndex + 1];

        const newOrder = nextFeature.order + 1;

        const success = await updateFeatureOrder(featureId, newOrder);
        if (success) {
          toast.success(`"${currentFeature.name}" déplacée vers le bas`);
        }
        return success;
      } catch (err) {
        console.error("Erreur lors du déplacement vers le bas:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [features]
  );

  const updateFeatureOrder = useCallback(
    async (featureId: string, newOrder: number): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/features/${featureId}/order`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order: newOrder }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: ApiResponse<SimpleFeature> = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || "Erreur lors de la mise à jour de l'ordre"
          );
        }

        await fetchFeatures();
        return true;
      } catch (err) {
        console.error("Erreur lors de la mise à jour de l'ordre:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [fetchFeatures]
  );

  const reorderFeatures = useCallback(
    async (reorderData: ReorderRequest[]): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch("/api/features/reorder", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            epicId: selectedEpicId,
            reorders: reorderData,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la réorganisation");
        }

        await fetchFeatures();
        toast.success("Features réorganisées avec succès");
        return true;
      } catch (err) {
        console.error("Erreur lors de la réorganisation:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [selectedEpicId, fetchFeatures]
  );

  // Fonctions CRUD
  const createFeature = useCallback(
    async (formData: FeatureFormData): Promise<boolean> => {
      if (!selectedEpicId) {
        const errorMsg = "Aucun epic sélectionné";
        setError(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      try {
        setError(null);
        const apiData = convertFormDataToApiData(formData);

        const response = await fetch("/api/features", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...apiData,
            epicId: selectedEpicId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: ApiResponse<SimpleFeature> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la création");
        }

        await fetchFeatures();
        return true;
      } catch (err) {
        console.error("Erreur lors de la création de la feature:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [selectedEpicId, fetchFeatures]
  );

  const updateFeature = useCallback(
    async (
      id: string,
      formData: Partial<FeatureFormData>
    ): Promise<boolean> => {
      try {
        setError(null);
        const apiData = convertPartialFormDataToApiData(formData);

        const response = await fetch(`/api/features/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: ApiResponse<SimpleFeature> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la mise à jour");
        }

        await fetchFeatures();
        return true;
      } catch (err) {
        console.error("Erreur lors de la mise à jour de la feature:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [fetchFeatures]
  );

  const deleteFeature = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(`/api/features/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result: ApiResponse<void> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la suppression");
        }

        await fetchFeatures();
        return true;
      } catch (err) {
        console.error("Erreur lors de la suppression de la feature:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        return false;
      }
    },
    [fetchFeatures]
  );

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    availableParents,
    featuresSimple,
    featuresTree,
    isLoading,
    error,
    displayMode,
    refetch: fetchFeatures,
    createFeature,
    updateFeature,
    deleteFeature,
    getFeatureById,
    moveFeatureUp,
    moveFeatureDown,
    reorderFeatures,
    updateFeatureOrder,
    setDisplayMode,
    getDisplayConfig,
  };
};
