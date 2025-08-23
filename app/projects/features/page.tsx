// @/app/projects/features/page.tsx
// Rôle : Page principale pour la gestion CRUD des features avec modes d'affichage multiples

"use client";

import React, { useState, useEffect } from "react";
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

import { FeatureDisplayMode } from "@/types/feature";
import { FeatureListSimple } from "@/components/features/views/FeatureListSimple";
import { FeatureTreeView } from "@/components/features/views/FeatureViewBranch";
import { FeatureList } from "@/components/features/views/FeatureList";
import { FeatureForm } from "@/components/features/FeatureForm";
import { DisplayModeSelector } from "@/components/features/FeatureDisplay";

import {
  useSelectedProjectData,
  useProjectStoreHydration,
  useProjectActions,
  useProjectLoading,
  useProjectError,
} from "@/stores/useSelectedProjectStore"; 

import { useFeatures } from "@/hooks/useFeatures";
import {
  Plus,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Settings,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function FeaturesPage(): React.JSX.Element {
  const selectedProject = useSelectedProjectData();
  const isHydrated = useProjectStoreHydration();
  const projectLoading = useProjectLoading();
  const projectError = useProjectError();
  const { refreshProject } = useProjectActions();

  const {
    features,
    availableParents,
    featuresSimple,
    featuresTree,
    isLoading: featuresLoading,
    error: featuresError,
    displayMode,
    createFeature,
    updateFeature,
    deleteFeature,
    moveFeatureUp,
    moveFeatureDown,
    reorderFeatures,
    setDisplayMode,
    getDisplayConfig,
    refetchFeatures,
  } = useFeatures(selectedProject?.id);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = getDisplayConfig();
  const isLoading = projectLoading || featuresLoading;
  const error = projectError || featuresError;

  useEffect(() => {
    if (selectedProject?.id && isHydrated) {
      refetchFeatures()?.catch((err: any) => {
        toast.error("Erreur de récupération des features");
        console.error('refetchFeatures failed', err);
      });
    }
  }, [selectedProject?.id, isHydrated]);

  const handleCreateFeature = (): void => {
    setSelectedFeature(null);
    setIsCreateModalOpen(true);
  };

  const handleEditFeature = (feature: any): void => {
    const featureWithHierarchy = features.find((f: any) => f.id === feature.id) ?? null;
    setSelectedFeature(featureWithHierarchy);
    setIsEditModalOpen(true);
  };

  const handleDeleteFeature = (feature: any): void => {
    const featureWithHierarchy = features.find((f: any) => f.id === feature.id) ?? null;
    setSelectedFeature(featureWithHierarchy);
    setIsDeleteAlertOpen(true);
  };

  const handleMoveUp = async (featureId: string) => moveFeatureUp(featureId);
  const handleMoveDown = async (featureId: string) => moveFeatureDown(featureId);
  const handleReorderFeatures = async (reorderData: any[]) => reorderFeatures(reorderData);

  const handleSortByPriority = async () => {
    if (!features.length) return;
    const priorityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    const sortedFeatures = [...features].sort((a, b) => {
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 5;
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 5;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.name.localeCompare(b.name);
    });
    const reorderData = sortedFeatures.map((feature, index) => ({
      featureId: feature.id,
      newOrder: (index + 1) * 10,
    }));
    const success = await reorderFeatures(reorderData);
    if (success) toast.success("Features réorganisées par priorité");
  };

  const handleFormSubmit = async (formData: any): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      if (!selectedProject?.id) {
        toast.error("Projet sélectionné manquant");
        return false;
      }
      const formDataWithProject = { ...formData, projectId: selectedProject.id };
      let success: boolean;
      if (selectedFeature) {
        success = await updateFeature(selectedFeature.id, formDataWithProject);
      } else {
        success = await createFeature(formDataWithProject);
      }
      if (success) {
        toast.success(`Feature ${selectedFeature ? "mise à jour" : "créée"} avec succès`);
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedFeature(null);
        await Promise.all([refetchFeatures(), refreshProject()]);
        return true;
      }
      return false;
    } catch (err) {
      toast.error("Erreur lors de la soumission du formulaire");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedFeature(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedFeature) return;
    setIsSubmitting(true);
    try {
      const success = await deleteFeature(selectedFeature.id);
      if (success) {
        toast.success("Feature supprimée avec succès");
        setIsDeleteAlertOpen(false);
        setSelectedFeature(null);
        await Promise.all([refetchFeatures(), refreshProject()]);
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      case "list":
        return <FeatureListSimple {...baseProps} featuresSimple={featuresSimple} />;
      case "tree":
        return <FeatureTreeView {...baseProps} featuresTree={featuresTree} />;
      case "detail":
        return <FeatureList {...baseProps} />;
      default:
        return <FeatureListSimple {...baseProps} featuresSimple={featuresSimple} />;
    }
  };

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

  if (!selectedProject) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-orange-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  Aucun Projet Sélectionné
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Veuillez sélectionner un projet pour gérer ses features.
                  Utilisez le sélecteur de projet dans la navigation.
                </p>
                <Link href="/projects">
                  <Button className="mt-4">
                    Sélectionner un Projet
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Features</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Projet:</span>
            <span className="font-medium text-gray-700">
              {selectedProject.name}
            </span>
            {selectedProject.key && (
              <>
                <span>•</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {selectedProject.key}
                </span>
              </>
            )}
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <DisplayModeSelector
            currentMode={displayMode}
            onModeChange={setDisplayMode}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            {features.length > 1 &&
              (displayMode === "list" ||
                displayMode === "detail") && (
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
              disabled={isLoading}
            >
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle Feature
            </Button>
          </div>
        </div>
      </div>
      {features.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Mode{" "}
                  {displayMode === "list"
                    ? "Liste"
                    : displayMode === "tree"
                    ? "Arbre"
                    : "Détaillé"}
                </p>
                <p className="text-xs text-blue-700">
                  {displayMode === "list" &&
                    "Affichage compact avec titre et description. Utilisez les flèches pour réorganiser."}
                  {displayMode === "tree" &&
                    "Vue hiérarchique des features. Cliquez sur les dossiers pour naviguer."}
                  {displayMode === "detail" &&
                    "Vue complète avec toutes les informations. Drag & drop et réorganisation disponibles."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {renderFeaturesDisplay()}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Nouvelle Feature
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle feature pour le projet "{selectedProject.name}".
              Remplissez les informations nécessaires pour définir cette feature.
            </DialogDescription>
          </DialogHeader>
          <FeatureForm
            availableParents={availableParents}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            showHierarchy={true}
            className="py-4"
            projectId={selectedProject.id}
          />
        </DialogContent>
      </Dialog>
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
            feature={selectedFeature ?? undefined}
            availableParents={availableParents}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            showHierarchy={true}
            className="py-4"
            projectId={selectedProject.id}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Supprimer la Feature
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>
                Êtes-vous sûr de vouloir supprimer la feature{" "}
                <span className="font-medium text-gray-900">
                  "{selectedFeature?.name}"
                </span>
                {" "} ?
              </div>
              <div className="text-sm text-red-600">
                Cette action est irréversible et supprimera également toutes les données associées.
              </div>
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
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/projects/sprints">
            Sprints du Projet
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/projects">
            Retour aux Projets
          </Link>
        </Button>
      </div>
    </div>
  );
}