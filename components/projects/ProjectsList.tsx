// components/projects/ProjectsList.tsx

/**
 * RÔLE : Composant d'affichage de la liste des projets avec actions CRUD intégrées
 * RESPONSABILITÉS :
 * - Afficher la liste des projets selon différents modes de vue (grid, list)
 * - Gérer les actions visuelles (boutons edit, delete, select, reorder)
 * - Interface responsive et moderne avec design cohérent shadcn/ui
 * - Callbacks remontants vers la page parente pour toutes les actions
 * - Optimisation des performances avec React.memo et useCallback
 * - États de chargement et animations fluides
 * - Navigation vers les détails avec indication visuelle 
 * - Intégration API route /api/projects/order pour sauvegarde ordre
 * - Notifications modernes avec Sonner
 * - Délégation d'affichage aux composants ProjectViewList et ProjectViewGrid
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Button, Card, CardContent, CardHeader, CardTitle, Badge, Skeleton
 * - lucide-react: PlusCircle, Grid3X3, List, FolderOpen, Globe, Lock, Activity, Archive
 * - sonner: toast notifications modernes
 * - Store: useSelectedProjectStore pour la cohérence d'état
 * - ProjectsListViewItem: composant dédié pour l'affichage en mode liste
 * - ProjectsGridViewItem: composant dédié pour l'affichage en mode grille
 * - React hooks: JSX, useCallback, useMemo, memo, useState
 *
 * LIBS UTILISÉS :
 * - React (JSX, useCallback, useMemo, memo, useState)
 * - Next.js 15 client component compatible
 * - TypeScript strict mode avec interfaces strictes
 * - Tailwind CSS pour le styling responsive et moderne
 * - Zustand store pour l'état partagé
 * - Sonner pour les notifications toast
 * - Fetch API pour appels REST vers /api/projects/order
 *
 * ROUTES API UTILISÉES :
 * - PUT /api/projects/order - Sauvegarde de l'ordre des projets
 *
 * PROPS de @/app/projects/page.tsx :
 * - projects: ProjectSimple[] - Liste des projets filtrés depuis la page
 * - viewMode: "grid" | "list" - Mode d'affichage contrôlé par la page
 * - onEdit: (project) => Promise<void> - Callback d'édition vers la page
 * - onDelete: (projectId) => Promise<void> - Callback de suppression vers la page
 * - onSelect: (project) => void - Callback de sélection/navigation vers la page
 * - onReorder: (projectId, direction) => Promise<void> - Callback de réorganisation
 * - onCreate: () => void - Callback de création vers la page
 * - loading: boolean - État de chargement global de la page
 * - onOrderUpdate: () => Promise<void> - Callback de rafraîchissement après réorganisation
 */

"use client";

import React, { JSX, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  PlusCircle,
  Grid3X3,
  List,
  FolderOpen,
  Globe,
  Lock,
  Activity,
  Archive,
  Pause,
  Settings,
  Users,
  Eye,
} from "lucide-react";

import {
  useSelectedProjectId,
  useProjectActions,
} from "@/stores/useSelectedProjectStore";

// ✅ Import des composants séparés pour les vues
import { ProjectsListViewItem } from "@/components/projects/views/ProjectViewList";
import { ProjectsGridViewItem } from "@/components/projects/views/ProjectViewGrid";

// Types basés sur le schéma Prisma Project cohérents avec app/projects/page.tsx
export interface ProjectSimple {
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
}

// Type pour le mode d'affichage cohérent avec la page
export type ViewMode = "grid" | "list";

// Interface pour les données de l'API route /api/projects/order
interface ProjectOrderItem {
  id: string;
  order: number;
}

interface ProjectOrderRequest {
  projectOrder: ProjectOrderItem[];
}

interface ProjectOrderResponse {
  message: string;
  updatedCount: number;
}

// Interface pour les props du composant strictement typée
interface ProjectsListProps {
  projects: ProjectSimple[];
  viewMode: ViewMode;
  onEdit: (project: ProjectSimple) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
  onSelect: (project: ProjectSimple) => void;
  onReorder: (projectId: string, direction: "up" | "down") => Promise<void>;
  onCreate: () => void;
  loading?: boolean;
  className?: string;
  // ✅ Callback pour rafraîchir après mise à jour de l'ordre
  onOrderUpdate?: () => Promise<void>;
}

// Configuration des badges de statut moderne
export interface StatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

// Configuration des icônes de visibilité
export interface VisibilityConfig {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  label: string;
}

export default React.memo(function ProjectsList({
  projects,
  viewMode,
  onEdit,
  onDelete,
  onSelect,
  onReorder,
  onCreate,
  loading = false,
  className = "",
  onOrderUpdate,
}: ProjectsListProps): JSX.Element {
  // ✅ Store cohérent avec la page
  const selectedProjectId = useSelectedProjectId();
  const { setSelectedProjectId } = useProjectActions();

  // ✅ États pour la gestion du réordonnement
  const [reorderingProjectId, setReorderingProjectId] = useState<string | null>(
    null
  );
  const [optimisticOrder, setOptimisticOrder] = useState<ProjectSimple[]>([]);

  /**
   * ✅ Appel API avec notifications Sonner
   */
  const saveProjectOrder = useCallback(
    async (projectOrder: ProjectOrderItem[]): Promise<boolean> => {
      try {
        console.log("🔄 ProjectsList - Sauvegarde ordre:", projectOrder);

        const requestBody: ProjectOrderRequest = {
          projectOrder,
        };

        const response = await fetch("/api/projects/order", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de la sauvegarde");
        }

        const data: ProjectOrderResponse = await response.json();

        console.log(
          "✅ Ordre sauvegardé:",
          data.message,
          `(${data.updatedCount} projets)`
        );

        // ✅ Notification de succès avec Sonner
        toast.success("Ordre mis à jour", {
          description: `${data.updatedCount} projets réorganisés avec succès.`,
          duration: 3000,
          action: {
            label: "✓",
            onClick: () => console.log("Toast fermé"),
          },
        });

        return true;
      } catch (error) {
        console.error("❌ Erreur sauvegarde ordre:", error);

        // ✅ Notification d'erreur avec Sonner
        toast.error("Erreur de sauvegarde", {
          description:
            error instanceof Error
              ? error.message
              : "Impossible de sauvegarder l'ordre",
          duration: 5000,
          action: {
            label: "Réessayer",
            onClick: () => window.location.reload(),
          },
        });

        return false;
      }
    },
    []
  );

  /**
   * ✅ Mise à jour optimiste de l'ordre
   */
  const updateOptimisticOrder = useCallback(
    (projectId: string, direction: "up" | "down"): ProjectSimple[] => {
      const currentProjects =
        optimisticOrder.length > 0 ? optimisticOrder : sortedProjects;
      const projectIndex = currentProjects.findIndex((p) => p.id === projectId);

      if (projectIndex === -1) return currentProjects;

      const newProjects = [...currentProjects];

      if (direction === "up" && projectIndex > 0) {
        // Échanger avec le projet précédent
        [newProjects[projectIndex - 1], newProjects[projectIndex]] = [
          newProjects[projectIndex],
          newProjects[projectIndex - 1],
        ];
      } else if (
        direction === "down" &&
        projectIndex < newProjects.length - 1
      ) {
        // Échanger avec le projet suivant
        [newProjects[projectIndex], newProjects[projectIndex + 1]] = [
          newProjects[projectIndex + 1],
          newProjects[projectIndex],
        ];
      }

      // Recalculer les ordres
      const updatedProjects = newProjects.map((project, index) => ({
        ...project,
        order: index,
      }));

      return updatedProjects;
    },
    [optimisticOrder, projects]
  );

  /**
   * Configuration des badges de statut selon le schéma Prisma
   */
  const getStatusConfig = useCallback(
    (status: string, isActive: boolean): StatusConfig => {
      if (!isActive) {
        return {
          variant: "secondary",
          className:
            "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
          icon: Archive,
          label: "Archivé",
        };
      }

      switch (status.toUpperCase()) {
        case "ACTIVE":
          return {
            variant: "default",
            className:
              "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
            icon: Activity,
            label: "Actif",
          };
        case "INACTIVE":
          return {
            variant: "secondary",
            className:
              "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
            icon: Pause,
            label: "Inactif",
          };
        case "ARCHIVED":
          return {
            variant: "outline",
            className:
              "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
            icon: Archive,
            label: "Archivé",
          };
        default:
          return {
            variant: "outline",
            className:
              "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
            icon: Settings,
            label: status,
          };
      }
    },
    []
  );

  /**
   * Configuration des icônes de visibilité selon le schéma Prisma
   */
  const getVisibilityConfig = useCallback(
    (visibility: string): VisibilityConfig => {
      switch (visibility.toUpperCase()) {
        case "PUBLIC":
          return {
            icon: Globe,
            className: "text-blue-600",
            label: "Public",
          };
        case "PRIVATE":
          return {
            icon: Lock,
            className: "text-purple-600",
            label: "Privé",
          };
        case "INTERNAL":
          return {
            icon: Users,
            className: "text-orange-600",
            label: "Interne",
          };
        default:
          return {
            icon: Eye,
            className: "text-gray-500",
            label: visibility,
          };
      }
    },
    []
  );

  /**
   * Gestion de la sélection de projet avec store synchronisé
   */
  const handleProjectSelect = useCallback(
    (project: ProjectSimple): void => {
      if (loading || reorderingProjectId) return;

      console.log(
        "📍 ProjectsList - Sélection projet:",
        project.name,
        project.id
      );

      // Synchronisation avec le store de la page
      setSelectedProjectId(project.id);

      // Callback vers la page parente
      onSelect(project);

      // ✅ Notification de sélection avec Sonner
      toast.info(`Projet "${project.name}" sélectionné`, {
        duration: 2000,
      });
    },
    [loading, reorderingProjectId, setSelectedProjectId, onSelect]
  );

  /**
   * Gestion des actions avec protection contre les appels multiples
   */
  const handleEdit = useCallback(
    async (event: React.MouseEvent, project: ProjectSimple): Promise<void> => {
      event.stopPropagation();
      if (loading || reorderingProjectId) return;

      console.log("✏️ ProjectsList - Édition projet:", project.name);

      try {
        // ✅ Notification de début d'édition
        toast.loading(`Édition de "${project.name}"...`, {
          id: `edit-${project.id}`,
        });

        await onEdit(project);

        // ✅ Notification de succès
        toast.success(`Projet "${project.name}" ouvert pour édition`, {
          id: `edit-${project.id}`,
          duration: 2000,
        });
      } catch (error) {
        console.error("Erreur lors de l'édition:", error);

        // ✅ Notification d'erreur
        toast.error("Erreur lors de l'édition", {
          id: `edit-${project.id}`,
          description:
            error instanceof Error ? error.message : "Une erreur est survenue",
          duration: 4000,
        });
      }
    },
    [onEdit, loading, reorderingProjectId]
  );

  const handleDelete = useCallback(
    async (event: React.MouseEvent, projectId: string): Promise<void> => {
      event.stopPropagation();
      if (loading || reorderingProjectId) return;

      const project = projects.find((p) => p.id === projectId);
      const projectName = project?.name || "le projet";

      console.log("🗑️ ProjectsList - Suppression projet:", projectId);

      try {
        // ✅ Notification de confirmation
        toast.loading(`Suppression de "${projectName}"...`, {
          id: `delete-${projectId}`,
        });

        await onDelete(projectId);

        // ✅ Notification de succès
        toast.success(`Projet "${projectName}" supprimé`, {
          id: `delete-${projectId}`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);

        // ✅ Notification d'erreur
        toast.error("Erreur lors de la suppression", {
          id: `delete-${projectId}`,
          description:
            error instanceof Error ? error.message : "Une erreur est survenue",
          duration: 4000,
        });
      }
    },
    [onDelete, loading, reorderingProjectId, projects]
  );

  /**
   * ✅ Gestion du réordonnement avec notifications Sonner
   */
  const handleReorder = useCallback(
    async (
      event: React.MouseEvent,
      projectId: string,
      direction: "up" | "down"
    ): Promise<void> => {
      event.stopPropagation();
      if (loading || reorderingProjectId) return;

      const project = projects.find((p) => p.id === projectId);
      const projectName = project?.name || "le projet";

      console.log(
        "📊 ProjectsList - Réorganisation projet:",
        projectId,
        direction
      );

      setReorderingProjectId(projectId);

      // ✅ Notification de début de réorganisation
      const toastId = `reorder-${projectId}`;
      toast.loading(`Réorganisation de "${projectName}"...`, {
        id: toastId,
      });

      try {
        // 1. Mise à jour optimiste de l'interface
        const newOptimisticOrder = updateOptimisticOrder(projectId, direction);
        setOptimisticOrder(newOptimisticOrder);

        // 2. Préparation des données pour l'API
        const projectOrderData: ProjectOrderItem[] = newOptimisticOrder.map(
          (project) => ({
            id: project.id,
            order: project.order,
          })
        );

        // 3. Sauvegarde via l'API
        const success = await saveProjectOrder(projectOrderData);

        if (success) {
          // 4. Callback vers la page parente pour synchronisation
          if (onReorder) {
            await onReorder(projectId, direction);
          }

          // 5. Rafraîchissement optionnel
          if (onOrderUpdate) {
            await onOrderUpdate();
          }

          // 6. Réinitialisation de l'état optimiste après succès
          setTimeout(() => {
            setOptimisticOrder([]);
          }, 500);

          // ✅ Fermeture du toast de chargement (succès géré par saveProjectOrder)
          toast.dismiss(toastId);
        } else {
          // 7. Annulation de la mise à jour optimiste en cas d'erreur
          setOptimisticOrder([]);
          toast.dismiss(toastId);
        }
      } catch (error) {
        console.error("Erreur lors de la réorganisation:", error);
 
        // Annulation de la mise à jour optimiste
        setOptimisticOrder([]);

        // ✅ Notification d'erreur spécifique
        toast.error("Erreur de réorganisation", {
          id: toastId,
          description: `Impossible de déplacer "${projectName}"`,
          duration: 4000,
        });
      } finally {
        setReorderingProjectId(null);
      }
    },
    [
      loading,
      reorderingProjectId,
      projects,
      updateOptimisticOrder,
      saveProjectOrder,
      onReorder,
      onOrderUpdate,
    ]
  );

  /**
   * Formatage des dates optimisé
   */
  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "Non définie";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }, []);

  /**
   * Classes CSS pour la grille responsive moderne
   */
  const containerClasses = useMemo(() => {
    const baseClasses = "w-full space-y-4";

    switch (viewMode) {
      case "grid":
        return `${baseClasses} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 space-y-0`;
      case "list":
        return `${baseClasses} flex flex-col gap-3 sm:gap-4`;
      default:
        return baseClasses;
    }
  }, [viewMode]);

  // ✅ Tri des projets avec gestion de l'état optimiste
  const sortedProjects = useMemo(() => {
    const projectsToUse =
      optimisticOrder.length > 0 ? optimisticOrder : projects;
    return [...projectsToUse].sort((a, b) => a.order - b.order);
  }, [projects, optimisticOrder]);

  // ✅ SKELETON DE CHARGEMENT MODERNE
  if (loading) {
    return (
      <div className={`${className}`}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>

          <CardContent>
            <div className={containerClasses}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border border-gray-100">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-2 pt-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-4 ${className}`}>
      <Card className="border-0 shadow-sm bg-white">
        {/* En-tête moderne */}
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {viewMode === "grid" ? (
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                ) : (
                  <List className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Liste des projets
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {sortedProjects.length} projet
                  {sortedProjects.length !== 1 ? "s" : ""} • Mode{" "}
                  {viewMode === "grid" ? "grille" : "liste"}
                  {reorderingProjectId && (
                    <span className="ml-2 text-blue-600">
                      • Réorganisation en cours...
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                onCreate();
                // ✅ Notification d'action
                toast.info("Formulaire de création ouvert", {
                  duration: 2000,
                });
              }}
              disabled={loading || !!reorderingProjectId}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              size="default"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* État vide moderne */}
          {sortedProjects.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <FolderOpen className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun projet trouvé
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Commencez par créer votre premier projet pour organiser votre
                  travail et suivre vos objectifs.
                </p>
              </div>
              <Button
                onClick={() => {
                  onCreate();
                  toast.success("Prêt à créer votre premier projet !", {
                    duration: 3000,
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white mt-4"
                disabled={!!reorderingProjectId}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer un projet
              </Button>
            </div>
          )}

          {/* Liste des projets */}
          {sortedProjects.length > 0 && (
            <div className={containerClasses}>
              {sortedProjects.map((project, index) => {
                const isSelected = selectedProjectId === project.id;
                const isReordering = reorderingProjectId === project.id;

                // ✅ Utilisation du composant séparé pour le mode liste
                if (viewMode === "list") {
                  return (
                    <ProjectsListViewItem
                      key={project.id}
                      project={project}
                      index={index}
                      isSelected={isSelected}
                      isReordering={isReordering}
                      loading={loading || !!reorderingProjectId}
                      total={sortedProjects.length}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSelect={handleProjectSelect}
                      onReorder={handleReorder}
                      getStatusConfig={getStatusConfig}
                      getVisibilityConfig={getVisibilityConfig}
                      formatDate={formatDate}
                    />
                  );
                }

                // ✅ Utilisation du composant séparé pour le mode grille
                return (
                  <ProjectsGridViewItem
                    key={project.id}
                    project={project}
                    index={index}
                    isSelected={isSelected}
                    isReordering={isReordering}
                    loading={loading || !!reorderingProjectId}
                    total={sortedProjects.length}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSelect={handleProjectSelect}
                    onReorder={handleReorder}
                    getStatusConfig={getStatusConfig}
                    getVisibilityConfig={getVisibilityConfig}
                    formatDate={formatDate}
                  />
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer avec statistiques */}
        {sortedProjects.length > 0 && (
          <CardFooter className="border-t bg-gray-50 text-sm text-gray-600">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-4">
                <span>Total: {sortedProjects.length} projets</span>
                <span>•</span>
                <span>
                  Actifs:{" "}
                  {
                    sortedProjects.filter(
                      (p) => p.status === "ACTIVE" && p.isActive
                    ).length
                  }
                </span>
                <span>•</span>
                <span>Mode: {viewMode === "grid" ? "Grille" : "Liste"}</span>
                {reorderingProjectId && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">
                      🔄 Sauvegarde en cours...
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Dernière mise à jour: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
});

// Export des types pour la réutilisabilité
export type {
  ProjectsListProps,
  ProjectOrderItem,
  ProjectOrderRequest,
};
