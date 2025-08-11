// @/components/features/FeaturesList.tsx

// Rôle : Orchestration de l'affichage des features selon le mode sélectionné via props centralisés
// Responsabilités : Gestion CRUD des features, changement d'ordre, gestion des vues (list/card/tree)
// Composants utilisés : FeaturesViewList, FeaturesViewCard, FeaturesViewTree, FeaturesForm
// API : Routes CRUD /api/projects/[projectId]/features avec gestion d'erreurs complète
// Hooks : useState, useEffect, useCallback pour la gestion d'état et performance optimisée
// UI : Button (shadcn/ui), toast (sonner), lucide-react icons avec design responsive
// Types : Utilise exclusivement @/types/feature pour éviter les conflits d'export
// Next.js 15 : Compatible avec les nouvelles API routes et gestion des paramètres Promise
// TypeScript : Mode strict avec interfaces complètes et typage des callbacks

"use client";

import { JSX, useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturesViewList } from "@/components/features/views/FeatureViewList";
import { FeaturesViewCard } from "@/components/features/views/FeatureViewCard";
import { FeaturesViewTree } from "@/components/features/views/FeatureViewBranch";
import { FeaturesForm } from "@/components/features/FeatureForm";
import { toast } from "sonner";
// ✅ Import exclusivement depuis le fichier de types centralisé
import type {
  ViewMode,
  FeatureWithRelations,
  FeatureStatus,
  Priority,
} from "@/types/feature";

// ✅ Interface locale pour les props du composant uniquement
interface FeaturesListProps {
  userId: string;
  projectId: string;
  viewMode: ViewMode;
  features?: FeatureWithRelations[]; // Prop optionnelle pour passer les features depuis le parent
  onUpdate?: () => void; // Callback optionnel pour notifier le parent des changements
}

export function FeaturesList({
  userId,
  projectId,
  viewMode,
  features: externalFeatures,
  onUpdate,
}: FeaturesListProps): JSX.Element {
  const [internalFeatures, setInternalFeatures] = useState<
    FeatureWithRelations[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingFeature, setEditingFeature] =
    useState<FeatureWithRelations | null>(null);

  // Utilise les features externes si fournies, sinon les features internes
  const features = externalFeatures || internalFeatures;

  const fetchFeatures = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/features`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch features: ${response.status} ${response.statusText}`
        );
      }

      const data: FeatureWithRelations[] = await response.json();
      setInternalFeatures(data);

      // Notifie le parent si un callback est fourni
      if (onUpdate) {
        onUpdate();
      }

      toast.success("Features loaded successfully", {
        description: `Retrieved ${data.length} feature${
          data.length !== 1 ? "s" : ""
        } from the project`,
      });
    } catch (error) {
      console.error("Error fetching features:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to load features", {
        description: errorMessage,
      });

      // Fallback vide en cas d'erreur
      setInternalFeatures([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, onUpdate]);

  useEffect(() => {
    // Ne fetch que si pas de features externes fournies
    if (projectId && !externalFeatures) {
      fetchFeatures();
    } else if (externalFeatures) {
      setLoading(false);
    }
  }, [projectId, fetchFeatures, externalFeatures]);

  const handleAdd = (): void => {
    setEditingFeature(null);
    setIsFormOpen(true);
  };

  const handleEdit = (feature: FeatureWithRelations): void => {
    setEditingFeature(feature);
    setIsFormOpen(true);
  };

  const handleDelete = async (featureId: string): Promise<void> => {
    if (
      !confirm(
        "Are you sure you want to delete this feature? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/features/${featureId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to delete feature: ${response.status} ${response.statusText}`
        );
      }

      // Met à jour les features internes si pas de features externes
      if (!externalFeatures) {
        setInternalFeatures((prev) => prev.filter((f) => f.id !== featureId));
      }

      // Notifie le parent
      if (onUpdate) {
        onUpdate();
      }

      toast.success("Feature deleted successfully", {
        description:
          "The feature has been permanently removed from your project",
      });
    } catch (error) {
      console.error("Error deleting feature:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to delete feature", {
        description: errorMessage,
      });
    }
  };

  const handleOrderChange = async (
    featureId: string,
    direction: "up" | "down"
  ): Promise<void> => {
    const feature = features.find((f) => f.id === featureId);
    if (!feature) {
      toast.error("Feature not found", {
        description: "The feature you're trying to reorder could not be found",
      });
      return;
    }

    const newOrder = direction === "up" ? feature.order - 1 : feature.order + 1;

    // Validation des limites
    if (newOrder < 0) {
      toast.warning("Cannot move up", {
        description: "This feature is already at the top",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/features/${featureId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order: newOrder }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to update feature order: ${response.status} ${response.statusText}`
        );
      }

      // Refresh les données
      if (!externalFeatures) {
        await fetchFeatures();
      } else if (onUpdate) {
        onUpdate();
      }

      toast.success("Feature order updated", {
        description: `Feature moved ${direction}ward in the list`,
      });
    } catch (error) {
      console.error("Error updating feature order:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to update feature order", {
        description: errorMessage,
      });
    }
  };

  const handleFormSuccess = (): void => {
    setIsFormOpen(false);
    setEditingFeature(null);

    // Refresh les données
    if (!externalFeatures) {
      fetchFeatures();
    } else if (onUpdate) {
      onUpdate();
    }
  };

  const handleFormCancel = (): void => {
    setIsFormOpen(false);
    setEditingFeature(null);
  };

  // Fonction pour déterminer le mode du formulaire
  const getFormMode = (): "new" | "edit" => {
    return editingFeature ? "edit" : "new";
  };

  const renderFeaturesView = (): JSX.Element => {
    const commonProps = {
      features,
      loading,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onOrderChange: handleOrderChange,
    };

    switch (viewMode) {
      case "card":
        return <FeaturesViewCard {...commonProps} />;
      case "tree":
        return <FeaturesViewTree {...commonProps} />;
      case "list":
      default:
        return <FeaturesViewList {...commonProps} />;
    }
  };

  // Statistiques pour l'affichage
  const completedFeatures = features.filter((f) => f.status === "DONE").length;
  const inProgressFeatures = features.filter(
    (f) => f.status === "IN_PROGRESS"
  ).length;
  const blockedFeatures = features.filter((f) => f.status === "BLOCKED").length;

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Features Management
          </h2>
          {features.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {features.length} feature{features.length !== 1 ? "s" : ""}{" "}
                total
              </span>
              {completedFeatures > 0 && (
                <span className="text-green-600">
                  {completedFeatures} completed
                </span>
              )}
              {inProgressFeatures > 0 && (
                <span className="text-blue-600">
                  {inProgressFeatures} in progress
                </span>
              )}
              {blockedFeatures > 0 && (
                <span className="text-red-600">{blockedFeatures} blocked</span>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={handleAdd}
          className="flex items-center gap-2 shrink-0"
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
          Add Feature
        </Button>
      </div>

      {/* Vue des features */}
      <div className="min-h-[200px]">{renderFeaturesView()}</div>

      {/* État vide */}
      {!loading && features.length === 0 && (
        <div className="text-center py-12">
          <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Features Yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Start organizing your project by creating your first feature.
            Features help you break down work into manageable pieces.
          </p>
          <Button
            onClick={handleAdd}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Create First Feature
          </Button>
        </div>
      )}

      {/* Formulaire modal */}
      {isFormOpen && (
        <FeaturesForm
          mode={getFormMode()}
          userId={userId}
          projectId={projectId}
          feature={editingFeature}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}

// ✅ Export du composant uniquement (pas de types)
export default FeaturesList;
