// @/app/features/page.tsx

// Rôle : Page principale pour la gestion CRUD des features avec modes d'affichage multiples
// Responsabilités : Orchestration composants, gestion état global, modals, sélection mode affichage
// Composants utilisés : FeatureListSimple, FeatureTreeView, FeatureDetailView, FeatureForm, DisplayModeSelector
// Hooks utilisés : useFeatures, useSelectedEpicData, useState
// Libs externes : sonner (pour les toasts), lucide-react (icônes)
// Types utilisés : SimpleFeature, FeatureFormData, FeatureWithHierarchy, FeatureDisplayMode
// Utilisé par : navigation principale, routing features

"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FeatureListSimple } from "@/components/features/views/FeatureListSimple";
import { FeatureTreeView } from "@/components/features//views/FeatureViewBranch";
import { FeatureList } from "@/components/features/views/FeatureList";
import { FeatureForm } from "@/components/features/FeatureForm";
import { DisplayModeSelector } from "@/components/features/FeatureDisplay";
import { useFeatures, type FeatureFormData } from "@/hooks/useFeatures";
import {
  useSelectedEpicData,
  useEpicStoreHydration,
} from "@/stores/useSelectedEpicStore";
import {
  Plus,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  FeatureDisplayMode,
  FeatureWithHierarchy,
  SimpleFeature,
  ReorderRequest,
} from "@/types/feature";

export default function FeaturesPage(): React.JSX.Element {
  const {
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
    setDisplayMode,
    getDisplayConfig,
  } = useFeatures();

  const selectedEpic = useSelectedEpicData();
  const isHydrated = useEpicStoreHydration();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] =
    useState<FeatureWithHierarchy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const config = getDisplayConfig();

  // Handlers pour les composants d'affichage
  const handleCreateFeature = (): void => {
    setSelectedFeature(null);
    setIsCreateModalOpen(true);
  };

  const handleEditFeature = (feature: SimpleFeature): void => {
    const featureWithHierarchy = features.find((f) => f.id === feature.id);
    setSelectedFeature(featureWithHierarchy || null);
    setIsEditModalOpen(true);
  };

  const handleDeleteFeature = (feature: SimpleFeature): void => {
    const featureWithHierarchy = features.find((f) => f.id === feature.id);
    setSelectedFeature(featureWithHierarchy || null);
    setIsDeleteAlertOpen(true);
  };

  // Handlers pour la réorganisation
  const handleMoveUp = async (featureId: string): Promise<boolean> => {
    return await moveFeatureUp(featureId);
  };

  const handleMoveDown = async (featureId: string): Promise<boolean> => {
    return await moveFeatureDown(featureId);
  };

  const handleReorderFeatures = async (
    reorderData: ReorderRequest[]
  ): Promise<boolean> => {
    return await reorderFeatures(reorderData);
  };

  // Tri automatique par priorité
  const handleSortByPriority = async (): Promise<void> => {
    if (features.length === 0) return;

    const priorityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

    const sortedFeatures = [...features].sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 5;
      const priorityB = priorityOrder[b.priority] || 5;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.name.localeCompare(b.name);
    });

    const reorderData: ReorderRequest[] = sortedFeatures.map(
      (feature, index) => ({
        featureId: feature.id,
        newOrder: (index + 1) * 10,
      })
    );

    const success = await reorderFeatures(reorderData);
    if (success) {
      toast.success("Features réorganisées par priorité");
    }
  };

  // Handlers pour le formulaire
  const handleFormSubmit = async (
    formData: FeatureFormData
  ): Promise<boolean> => {
    setIsSubmitting(true);

    try {
      let success: boolean;

      if (selectedFeature) {
        success = await updateFeature(selectedFeature.id, formData);
      } else {
        success = await createFeature(formData);
      }

      if (success) {
        toast.success(
          `Feature ${selectedFeature ? "mise à jour" : "créée"} avec succès`
        );
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedFeature(null);
        return true;
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = (): void => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedFeature(null);
  };

  // Handler pour la confirmation de suppression
  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedFeature) return;

    setIsSubmitting(true);

    try {
      const success = await deleteFeature(selectedFeature.id);

      if (success) {
        toast.success("Feature supprimée avec succès");
        setIsDeleteAlertOpen(false);
        setSelectedFeature(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendu des composants selon le mode
  const renderFeaturesDisplay = () => {
    const baseProps = {
      features,
      isLoading,
      error,
      onCreateFeature: handleCreateFeature,
      onEditFeature: handleEditFeature,
      onDeleteFeature: handleDeleteFeature,
      onMoveUp: handleMoveUp,
      onMoveDown: handleMoveDown,
      onReorderFeatures: handleReorderFeatures,
    };

    switch (displayMode) {
      case FeatureDisplayMode.LIST:
        return (
          <FeatureListSimple {...baseProps} featuresSimple={featuresSimple} />
        );

      case FeatureDisplayMode.TREE:
        return <FeatureTreeView {...baseProps} featuresTree={featuresTree} />;

      case FeatureDisplayMode.DETAIL:
        return <FeatureList {...baseProps} />;

      default:
        return (
          <FeatureListSimple {...baseProps} featuresSimple={featuresSimple} />
        );
    }
  };

  // État de chargement initial
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Initialisation...</p>
        </div>
      </div>
    );
  }

  // État sans epic sélectionné
  if (!selectedEpic) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Aucun Epic Sélectionné
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Veuillez sélectionner un epic pour gérer ses features.
                  Utilisez le sélecteur d'epic dans la navigation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header avec titre, sélecteur de mode et actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Features</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Epic:</span>
            <span className="font-medium text-gray-700">
              {selectedEpic.name}
            </span>
            {features.length > 0 && (
              <>
                <span>•</span>
                <span>
                  {features.length} feature{features.length > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Contrôles d'affichage et actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* ✅ Sélecteur de mode d'affichage */}
          <DisplayModeSelector
            currentMode={displayMode}
            onModeChange={setDisplayMode}
            disabled={isLoading}
          />

          {/* Actions */}
          <div className="flex gap-2">
            {/* Bouton de tri (seulement pour liste et détail) */}
            {features.length > 1 &&
              (displayMode === FeatureDisplayMode.LIST ||
                displayMode === FeatureDisplayMode.DETAIL) && (
                <Button
                  variant="outline"
                  onClick={handleSortByPriority}
                  disabled={isLoading}
                  className="whitespace-nowrap"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Trier
                </Button>
              )}

            <Button
              onClick={handleCreateFeature}
              size="lg"
              className="whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle Feature
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions contextuelles selon le mode */}
      {features.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Mode{" "}
                  {displayMode === FeatureDisplayMode.LIST
                    ? "Liste"
                    : displayMode === FeatureDisplayMode.TREE
                    ? "Arbre"
                    : "Détaillé"}
                </p>
                <p className="text-xs text-blue-700">
                  {displayMode === FeatureDisplayMode.LIST &&
                    "Affichage compact avec titre et description. Utilisez les flèches pour réorganiser."}
                  {displayMode === FeatureDisplayMode.TREE &&
                    "Vue hiérarchique des features. Cliquez sur les dossiers pour naviguer."}
                  {displayMode === FeatureDisplayMode.DETAIL &&
                    "Vue complète avec toutes les informations. Drag & drop et réorganisation disponibles."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Affichage selon le mode sélectionné */}
      {renderFeaturesDisplay()}

      {/* Modal de création */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Nouvelle Feature
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle feature pour l'epic "{selectedEpic.name}".
              Remplissez les informations nécessaires pour définir cette
              feature.
            </DialogDescription>
          </DialogHeader>

          <FeatureForm
            availableParents={availableParents}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            showHierarchy={true}
            className="py-4"
          />
        </DialogContent>
      </Dialog>

      {/* Modal d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Modifier la Feature
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de la feature "{selectedFeature?.name}".
              Les modifications seront sauvegardées immédiatement.
            </DialogDescription>
          </DialogHeader>

          <FeatureForm
            feature={selectedFeature}
            availableParents={availableParents}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            showHierarchy={true}
            className="py-4"
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Supprimer la Feature
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer la feature{" "}
                <span className="font-medium text-gray-900">
                  "{selectedFeature?.name}"
                </span>{" "}
                ?
              </p>
              <p className="text-sm text-red-600">
                Cette action est irréversible et supprimera également toutes les
                données associées.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
