// @/hooks/useFeatures.ts
// RÔLE : Hook pour la gestion avancée des features d'un projet (cache, CRUD, tri, vue).
// Les API utilisent uniquement /api/features/route.ts et /api/features/[id]/route.ts

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  FeatureFormData,
  FeatureWithHierarchy,
  SimpleFeature,
  ReorderRequest,
  FeatureDisplayMode,
} from "@/types/feature";

// Exporter les types pour qu'ils soient disponibles ailleurs
export type { SimpleFeature, ReorderRequest };

interface UseFeaturesReturn {
  features: FeatureWithHierarchy[];
  availableParents: SimpleFeature[];
  featuresSimple: SimpleFeature[];
  featuresTree: FeatureWithHierarchy[];
  isLoading: boolean;
  error: string | null;
  displayMode: FeatureDisplayMode;
  createFeature: (data: FeatureFormData) => Promise<boolean>;
  updateFeature: (id: string, data: FeatureFormData) => Promise<boolean>;
  deleteFeature: (id: string) => Promise<boolean>;
  moveFeatureUp: (featureId: string) => Promise<boolean>;
  moveFeatureDown: (featureId: string) => Promise<boolean>;
  reorderFeatures: (reorderData: ReorderRequest[]) => Promise<boolean>;
  updateFeatureOrder: (featureId: string, newOrder: number, position?: number) => Promise<boolean>;
  setDisplayMode: (mode: FeatureDisplayMode) => void;
  getDisplayConfig: () => {
    mode: FeatureDisplayMode;
    showHierarchy: boolean;
    allowReorder: boolean;
    showMetrics: boolean;
  };
  refetchFeatures: () => Promise<void>;
  invalidateCache: () => void;
}

export const useFeatures = (projectId?: string): UseFeaturesReturn => {
  const [features, setFeatures] = useState<FeatureWithHierarchy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<FeatureDisplayMode>("list" as FeatureDisplayMode);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Fonction de récupération des features
  const fetchFeatures = useCallback(async (force = false): Promise<void> => {
    if (!projectId) {
      setFeatures([]);
      return;
    }
    const now = Date.now();
    if (!force && lastFetched && (now - lastFetched) < CACHE_TTL) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/features?projectId=${projectId}&includeHierarchy=true`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Erreur lors de la récupération des features");
      const normalizedFeatures: FeatureWithHierarchy[] = (result.data || []).map((feature: any) => ({
        id: feature.id,
        name: feature.name,
        description: feature.description ?? null,
        acceptanceCriteria: feature.acceptanceCriteria ?? null,
        priority: feature.priority,
        status: feature.status,
        storyPoints: feature.storyPoints ?? null,
        businessValue: feature.businessValue ?? null,
        technicalRisk: feature.technicalRisk ?? null,
        effort: feature.effort ?? null,
        startDate: feature.startDate ? new Date(feature.startDate) : null,
        endDate: feature.endDate ? new Date(feature.endDate) : null,
        progress: feature.progress ?? 0,
        position: feature.position ?? 0,
        order: feature.order ?? 0,
        createdAt: new Date(feature.createdAt),
        updatedAt: new Date(feature.updatedAt),
        epicId: feature.epicId ?? null,
        parentId: feature.parentId ?? null,
        projectId: feature.projectId,
        userId: feature.userId ?? null,
        parent: feature.parent ? { ...feature.parent, createdAt: new Date(feature.parent.createdAt), updatedAt: new Date(feature.parent.updatedAt) } : null,
        children: feature.children ? feature.children.map((child: any) => ({
          ...child,
          createdAt: new Date(child.createdAt),
          updatedAt: new Date(child.updatedAt)
        })) : [],
        epic: feature.epic ? { ...feature.epic } : null,
      }));
      setFeatures(normalizedFeatures);
      setLastFetched(now);
    } catch (err) {
      console.error("Erreur fetchFeatures:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      setFeatures([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, lastFetched]);

  useEffect(() => {
    if (projectId) fetchFeatures();
    else {
      setFeatures([]);
      setError(null);
    }
  }, [projectId, fetchFeatures]);

  // Utilitaire générique API
  const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    const response = await fetch(endpoint, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || "Erreur API");
    return result;
  };

  // CRUD
  const createFeature = useCallback(async (data: FeatureFormData) => {
    if (!projectId) return false;
    try {
      setIsLoading(true);
      setError(null);
      await apiRequest(`/api/features`, {
        method: "POST",
        body: JSON.stringify({ ...data, projectId }),
      });
      await fetchFeatures(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur création feature");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fetchFeatures]);

  const updateFeature = useCallback(async (id: string, data: FeatureFormData) => {
    if (!projectId) return false;
    try {
      setIsLoading(true);
      setError(null);
      await apiRequest(`/api/features/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...data, projectId }),
      });
      await fetchFeatures(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur mise à jour feature");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fetchFeatures]);

  const deleteFeature = useCallback(async (id: string) => {
    if (!projectId) return false;
    try {
      setIsLoading(true);
      setError(null);
      await apiRequest(`/api/features/${id}`, { method: "DELETE" });
      await fetchFeatures(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression feature");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [projectId, fetchFeatures]);

  // ---- PATCH ordre ----
  const updateFeatureOrder = useCallback(
    async (featureId: string, newOrder: number, position?: number) => {
      if (!projectId) return false;
      try {
        setIsLoading(true);
        setError(null);
        await apiRequest(`/api/features/${featureId}/order`, {
          method: "PATCH",
          body: JSON.stringify({
            order: newOrder,
            ...(typeof position === "number" ? { position } : {}),
          }),
        });
        await fetchFeatures(true);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur mise à jour ordre");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, fetchFeatures]
  );

  // ---- Déplacement haut/bas avec swap ----
  const moveFeatureUp = useCallback(
    async (featureId: string) => {
      if (!projectId) return false;
      const idx = features.findIndex(f => f.id === featureId);
      if (idx <= 0) return false;
      const current = features[idx];
      const above = features[idx - 1];
      if (!above) return false;

      const ok1 = await updateFeatureOrder(current.id, above.order);
      const ok2 = await updateFeatureOrder(above.id, current.order);
      return ok1 && ok2;
    },
    [projectId, features, updateFeatureOrder]
  );

  const moveFeatureDown = useCallback(
    async (featureId: string) => {
      if (!projectId) return false;
      const idx = features.findIndex(f => f.id === featureId);
      if (idx === -1 || idx >= features.length - 1) return false;
      const current = features[idx];
      const below = features[idx + 1];
      if (!below) return false;

      const ok1 = await updateFeatureOrder(current.id, below.order);
      const ok2 = await updateFeatureOrder(below.id, current.order);
      return ok1 && ok2;
    },
    [projectId, features, updateFeatureOrder]
  );

  // Réorganisation multiple
  const reorderFeatures = useCallback(async (reorderData: ReorderRequest[]) => {
    if (!projectId) return false;
    try {
      setError(null);
      await apiRequest(`/api/features/reorder`, {
        method: "POST",
        body: JSON.stringify({ reorderData, projectId }),
      });
      await fetchFeatures(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réorganisation features");
      return false;
    }
  }, [projectId, fetchFeatures]);

  // Sélecteurs dérivés
  const availableParents = useMemo(() => features.filter(f => !f.parentId), [features]);
  const featuresSimple = useMemo(() => features.map(({ parent, children, epic, ...rest }) => rest), [features]);
  const featuresTree = useMemo(() => {
    const rootFeatures = features.filter(f => !f.parentId);
    return rootFeatures.sort((a, b) => a.order - b.order);
  }, [features]);

  const getDisplayConfig = useCallback(() => ({
    mode: displayMode,
    showHierarchy: displayMode === "tree",
    allowReorder: displayMode !== "tree",
    showMetrics: displayMode === "detail",
  }), [displayMode]);

  const refetchFeatures = useCallback(async () => {
    await fetchFeatures(true);
  }, [fetchFeatures]);

  const invalidateCache = useCallback(() => {
    setLastFetched(null);
    setFeatures([]);
  }, []);

  return {
    features,
    availableParents,
    featuresSimple,
    featuresTree,
    isLoading,
    error,
    displayMode,
    createFeature,
    updateFeature,
    deleteFeature,
    moveFeatureUp,
    moveFeatureDown,
    reorderFeatures,
    updateFeatureOrder,
    setDisplayMode,
    getDisplayConfig,
    refetchFeatures,
    invalidateCache,
  };
};