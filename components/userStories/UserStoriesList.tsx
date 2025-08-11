// @/components/userStories/UserStoriesList.tsx

/*
 * Composant de gestion d'affichage conditionnel des User Stories (MISE À JOUR)
 * Rôle : Gestionnaire principal d'affichage et d'actions CRUD.
 * Responsabilités :
 * - Affiche les user stories en mode liste ou carte.
 * - Gère les actions CRUD : ajout, modification, suppression, duplication, réorganisation.
 * - Utilise les types et configurations partagés depuis @/types/userStories.ts.
 * - Gère les permissions utilisateur et affiche des notifications claires.
 * - Intègre un état de chargement global pour des retours visuels fluides.
 */

"use client";

import React, { useState, useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Plus,
  Loader2,
  AlertTriangle,
  Target,
  Copy,
  BarChart3,
  TrendingUp,
  AlertCircle,
  FileText,
  MessageSquare,
  Paperclip,
  Clock,
} from "lucide-react";

// ✅ Import des types et configurations centralisés
import { UserStoryData, UserStoriesListProps } from "@/types/userStories";

// Import des vues spécialisées et du formulaire
import UserStoriesViewList from "./views/UserStoriesViewList";
import UserStoriesViewCard from "./views/UserStoriesViewCard";
import UserStoriesForm from "./UserStoriesForm";

const UserStoriesList: React.FC<UserStoriesListProps> = ({
  userStories,
  displayMode,
  features,
  projectMembers,
  sprints,
  userRole,
  projectId,
  onUpdate,
  className = "",
  isLoading: parentLoading = false,
}) => {
  // États locaux
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUserStory, setEditingUserStory] =
    useState<UserStoryData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [userStoryToDelete, setUserStoryToDelete] =
    useState<UserStoryData | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Gestion des permissions
  const permissions = useMemo(
    () => ({
      canCreate: ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"].includes(userRole),
      canEdit: ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"].includes(userRole),
      canDelete: ["ADMIN", "PRODUCT_OWNER"].includes(userRole),
      canReorder: ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"].includes(userRole),
      canDuplicate: ["ADMIN", "PRODUCT_OWNER", "SCRUM_MASTER"].includes(
        userRole
      ),
    }),
    [userRole]
  );

  // Fonction utilitaire pour les appels API
  const apiCall = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers },
      });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: `Erreur HTTP: ${response.status}` }));
        throw new Error(error.error || error.message);
      }
      return response.json();
    },
    []
  );

  // Gestionnaires d'actions
  const handleCreate = useCallback(() => {
    if (!permissions.canCreate) {
      toast.error("Permissions insuffisantes pour créer.");
      return;
    }
    setEditingUserStory(null);
    setIsFormOpen(true);
  }, [permissions.canCreate]);

  const handleEdit = useCallback(
    (userStory: UserStoryData) => {
      if (!permissions.canEdit) {
        toast.error("Permissions insuffisantes pour modifier.");
        return;
      }
      setEditingUserStory(userStory);
      setIsFormOpen(true);
    },
    [permissions.canEdit]
  );

  const handleDelete = useCallback(
    (userStory: UserStoryData) => {
      if (!permissions.canDelete) {
        toast.error("Permissions insuffisantes pour supprimer.");
        return;
      }
      setUserStoryToDelete(userStory);
      setDeleteDialogOpen(true);
    },
    [permissions.canDelete]
  );

  const confirmDelete = useCallback(async () => {
    if (!userStoryToDelete) return;
    setIsActionLoading(true);
    try {
      await apiCall(`/api/user-stories/${userStoryToDelete.id}`, {
        method: "DELETE",
      });
      toast.success("User story supprimée avec succès.");
      startTransition(onUpdate);
      setDeleteDialogOpen(false);
      setUserStoryToDelete(null);
    } catch (error) {
      toast.error("Échec de la suppression.", {
        description:
          error instanceof Error ? error.message : "Erreur inconnue.",
      });
    } finally {
      setIsActionLoading(false);
    }
  }, [userStoryToDelete, apiCall, onUpdate]);

  const handleDuplicate = useCallback(
    async (userStory: UserStoryData) => {
      if (!permissions.canDuplicate) {
        toast.error("Permissions insuffisantes pour dupliquer.");
        return;
      }
      setIsActionLoading(true);
      try {
        const duplicateData = {
          title: `${userStory.title} (Copie)`,
          description: userStory.description,
          acceptanceCriteria: userStory.acceptanceCriteria,
          priority: userStory.priority,
          status: "TODO" as const,
          storyPoints: userStory.storyPoints,
          labels: [...userStory.labels],
          tags: [...userStory.tags],
          featureId: userStory.featureId,
          projectId,
        };
        await apiCall(`/api/user-stories`, {
          method: "POST",
          body: JSON.stringify(duplicateData),
        });
        toast.success("User story dupliquée avec succès.");
        startTransition(onUpdate);
      } catch (error) {
        toast.error("Échec de la duplication.", {
          description:
            error instanceof Error ? error.message : "Erreur inconnue.",
        });
      } finally {
        setIsActionLoading(false);
      }
    },
    [permissions.canDuplicate, projectId, apiCall, onUpdate]
  );

  const handleMove = useCallback(
    async (userStoryId: string, direction: "up" | "down") => {
      if (!permissions.canReorder) {
        toast.error("Permissions insuffisantes pour réorganiser.");
        return;
      }
      setIsMoving(userStoryId);
      try {
        await apiCall(`/api/user-stories/${userStoryId}/move`, {
          method: "PATCH",
          body: JSON.stringify({ direction }),
        });
        startTransition(onUpdate);
      } catch (error) {
        toast.error("Échec du déplacement.", {
          description:
            error instanceof Error ? error.message : "Erreur inconnue.",
        });
      } finally {
        setIsMoving(null);
      }
    },
    [permissions.canReorder, apiCall, onUpdate]
  );

  // Callbacks pour le formulaire
  const handleFormSave = useCallback(
    (savedUserStory: UserStoryData) => {
      toast.success(
        `User story "${savedUserStory.title}" ${
          editingUserStory ? "modifiée" : "créée"
        }.`
      );
      setIsFormOpen(false);
      setEditingUserStory(null);
      startTransition(onUpdate);
    },
    [editingUserStory, onUpdate]
  );

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingUserStory(null);
  }, []);

  // État de chargement global pour toutes les actions
  const isAnyLoading =
    parentLoading || isActionLoading || isPending || !!isMoving;

  // Rendu si la liste est vide
  if (userStories.length === 0 && !parentLoading) {
    return (
      <div className={`text-center py-16 px-4 ${className}`}>
        <div className="max-w-md mx-auto">
          <Target className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 my-3">
            Aucune user story trouvée
          </h3>
          <p className="text-gray-600 mb-8">
            Commencez par créer votre première user story pour ce projet.
          </p>
          {permissions.canCreate && (
            <Button onClick={handleCreate} size="lg" disabled={isAnyLoading}>
              <Plus className="mr-2 h-5 w-5" />
              Créer une user story
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-6 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-grow">
            {/* Vous pouvez ajouter des statistiques ici si nécessaire */}
          </div>
          {permissions.canCreate && (
            <Button onClick={handleCreate} disabled={isAnyLoading}>
              {isAnyLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Ajouter une user story
            </Button>
          )}
        </div>

        <div className="relative">
          {isAnyLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          )}
          <div
            className={`${
              displayMode === "card"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-3"
            } ${isAnyLoading ? "opacity-50" : ""}`}
          >
            {userStories.map((userStory, index) => {
              const commonProps = {
                key: userStory.id,
                userStory,
                onEdit: () => handleEdit(userStory),
                onDelete: () => handleDelete(userStory),
                onDuplicate: () => handleDuplicate(userStory),
                onMoveUp:
                  index > 0 ? () => handleMove(userStory.id, "up") : undefined,
                onMoveDown:
                  index < userStories.length - 1
                    ? () => handleMove(userStory.id, "down")
                    : undefined,
                canEdit: permissions.canEdit,
                canDelete: permissions.canDelete,
                canReorder: permissions.canReorder,
                canDuplicate: permissions.canDuplicate,
                isLoading: isMoving === userStory.id,
              };
              return displayMode === "card" ? (
                <UserStoriesViewCard {...commonProps} />
              ) : (
                <UserStoriesViewList {...commonProps} />
              );
            })}
          </div>
        </div>

        <UserStoriesForm
          isOpen={isFormOpen}
          userStory={editingUserStory}
          projectId={projectId}
          features={features}
          projectMembers={projectMembers}
          sprints={sprints}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-3 h-6 w-6" />
                Confirmer la suppression
              </AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous certain de vouloir supprimer la user story{" "}
                <span className="font-semibold text-gray-900">
                  "{userStoryToDelete?.title}"
                </span>{" "}
                ?
                {userStoryToDelete &&
                  (userStoryToDelete._count.tasks > 0 ||
                    userStoryToDelete._count.comments > 0) && (
                    <div className="bg-red-50 rounded-lg p-3 mt-4 text-sm text-red-800 space-y-2">
                      <p className="font-medium">
                        Cette action supprimera également de manière permanente
                        :
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {userStoryToDelete._count.tasks > 0 && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            {userStoryToDelete._count.tasks} tâche(s)
                          </span>
                        )}
                        {userStoryToDelete._count.comments > 0 && (
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4" />
                            {userStoryToDelete._count.comments} commentaire(s)
                          </span>
                        )}
                        {userStoryToDelete._count.files > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Paperclip className="h-4 w-4" />
                            {userStoryToDelete._count.files} fichier(s)
                          </span>
                        )}
                        {userStoryToDelete._count.timeEntries > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {userStoryToDelete._count.timeEntries} entrée(s) de
                            temps
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActionLoading}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isActionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isActionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default UserStoriesList;
