// @/hooks/useFeatures.ts
// Rôle : Hook React personnalisé pour la gestion des features
// Responsabilités : Fetch, cache, mutations des features avec gestion d'état optimiste

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FeatureWithRelations,
  CreateFeatureData,
  UpdateFeatureData,
} from "@/types/feature";

interface UseFeuresOptions {
  projectId?: string;
  epicId?: string;
  parentId?: string;
  includeChildren?: boolean;
}

interface UseFeaturesReturn {
  features: FeatureWithRelations[];
  loading: boolean;
  error: string | null;
  createFeature: (
    data: CreateFeatureData
  ) => Promise<FeatureWithRelations | null>;
  updateFeature: (
    data: UpdateFeatureData
  ) => Promise<FeatureWithRelations | null>;
  deleteFeature: (id: string) => Promise<boolean>;
  refreshFeatures: () => Promise<void>;
}

export function useFeatures(options: UseFeuresOptions = {}): UseFeaturesReturn {
  const [features, setFeatures] = useState<FeatureWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.projectId) params.append("projectId", options.projectId);
      if (options.epicId) params.append("epicId", options.epicId);
      if (options.parentId) params.append("parentId", options.parentId);
      if (options.includeChildren) params.append("includeChildren", "true");

      const response = await fetch(`/api/features?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch features");
      }

      const data = await response.json();
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [
    options.projectId,
    options.epicId,
    options.parentId,
    options.includeChildren,
  ]);

  const createFeature = useCallback(
    async (data: CreateFeatureData): Promise<FeatureWithRelations | null> => {
      try {
        setError(null);
        const response = await fetch("/api/features", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create feature");
        }

        const newFeature = await response.json();
        setFeatures((prev) => [...prev, newFeature]);
        return newFeature;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      }
    },
    []
  );

  const updateFeature = useCallback(
    async (data: UpdateFeatureData): Promise<FeatureWithRelations | null> => {
      try {
        setError(null);
        const response = await fetch(`/api/features/${data.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update feature");
        }

        const updatedFeature = await response.json();
        setFeatures((prev) =>
          prev.map((f) => (f.id === data.id ? updatedFeature : f))
        );
        return updatedFeature;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return null;
      }
    },
    []
  );

  const deleteFeature = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`/api/features/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete feature");
      }

      setFeatures((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return false;
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    loading,
    error,
    createFeature,
    updateFeature,
    deleteFeature,
    refreshFeatures: fetchFeatures,
  };
}
