// 📄 /components/tasks/TasksList.tsx
// 🎯 Rôle : Gestionnaire d'affichage conditionnel
// 📦 Responsabilités : Reçoit les user stories filtrées, affiche selon le mode sélectionné, présente un bouton "Add UserStory", gère les actions : edit, delete, arrow-up, arrow-down
// 🔧 Composants utilisés : Dialog, Button, TasksViewList, TasksViewCard, TasksForm, Toaster, icônes Lucide React
// 🌐 API : /api/Tasks (DELETE, PUT pour réordonnancement)

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import {
  Plus,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye,
  FolderOpen,
  ListPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import TasksViewList from "@/components/tasks/views/TasksViewList";
import TasksViewCard from "@/components/tasks/views/TasksViewCard";
import TasksForm from "@/components/tasks/TasksForm";

// 🔧 Interface TypeScript basée sur le schéma Prisma
interface UserStory {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "CODE_REVIEW"
    | "TESTING"
    | "DONE"
    | "BLOCKED"
    | "CANCELLED";
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  featureId: string;
  creatorId: string;
}

interface TasksListProps {
  stories: UserStory[];
  filter: string;
  viewMode: "list" | "card";
  onStoriesChange: (stories: UserStory[]) => void;
  projectId: string;
}

export default function TasksList({
  stories,
  filter,
  viewMode,
  onStoriesChange,
  projectId,
}: TasksListProps) {
  // 🎨 États locaux
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [viewingStory, setViewingStory] = useState<UserStory | null>(null);
  const [deletingStory, setDeletingStory] = useState<UserStory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(
    null
  );

  // 🔍 Stories filtrées par le texte de recherche
  const filteredStories = useMemo(() => {
    if (!filter.trim()) return stories;

    return stories.filter((story: UserStory) =>
      story.title.toLowerCase().includes(filter.toLowerCase().trim())
    );
  }, [stories, filter]);

  // 🎯 Helper pour les toasts avec icônes
  const showSuccessToast = (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      duration: 4000,
    });
  };

  const showErrorToast = (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="h-4 w-4 text-red-600" />,
      duration: 5000,
    });
  };

  const showInfoToast = (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <AlertCircle className="h-4 w-4 text-blue-600" />,
      duration: 3000,
    });
  };

  // ➕ Ajout d'une nouvelle story
  const handleAddStory = async (newStoryData: Partial<UserStory>) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/Tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newStoryData,
          position: 0, // Nouvelle story en haut
          projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la création");
      }

      const newStory: UserStory = await response.json();
      onStoriesChange([newStory, ...stories]);
      setIsFormOpen(false);

      showSuccessToast(
        "User Story créée",
        "Nouvelle user story créée avec succès"
      );
    } catch (error) {
      console.error("Erreur création:", error);
      showErrorToast(
        "Erreur de création",
        error instanceof Error
          ? error.message
          : "Impossible de créer la user story"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ Modification d'une story
  const handleEditStory = async (updatedStoryData: Partial<UserStory>) => {
    try {
      setIsLoading(true);

      if (!editingStory?.id) {
        throw new Error("Aucune story sélectionnée pour modification");
      }

      const response = await fetch(`/api/Tasks/${editingStory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la modification");
      }

      const updatedStory: UserStory = await response.json();
      onStoriesChange(
        stories.map((story) =>
          story.id === updatedStory.id ? updatedStory : story
        )
      );
      setEditingStory(null);

      showSuccessToast(
        "Modification réussie",
        "User story mise à jour avec succès"
      );
    } catch (error) {
      console.error("Erreur modification:", error);
      showErrorToast(
        "Erreur de modification",
        error instanceof Error
          ? error.message
          : "Impossible de modifier la user story"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Suppression d'une story
  const handleDeleteStory = async () => {
    if (!deletingStory) return;

    try {
      setOperationInProgress(`delete-${deletingStory.id}`);

      const response = await fetch(`/api/Tasks/${deletingStory.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }

      onStoriesChange(stories.filter((story) => story.id !== deletingStory.id));
      setDeletingStory(null);

      showSuccessToast(
        "Suppression réussie",
        `La user story "${deletingStory.title}" a été supprimée`
      );
    } catch (error) {
      console.error("Erreur suppression:", error);
      showErrorToast(
        "Erreur de suppression",
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la user story"
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // ⬆️ Déplacer vers le haut
  const handleMoveUp = async (story: UserStory) => {
    const currentIndex = stories.findIndex((s) => s.id === story.id);
    if (currentIndex <= 0) {
      showInfoToast(
        "Déplacement impossible",
        "La story est déjà en première position"
      );
      return;
    }

    try {
      setOperationInProgress(`move-${story.id}`);

      const newStories = [...stories];
      [newStories[currentIndex], newStories[currentIndex - 1]] = [
        newStories[currentIndex - 1],
        newStories[currentIndex],
      ];

      // Mise à jour optimiste
      onStoriesChange(newStories);

      // Appel API pour sauvegarder les nouvelles positions
      const response = await fetch(`/api/Tasks/${story.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: currentIndex - 1 }),
      });

      if (!response.ok) {
        // Rollback en cas d'erreur
        onStoriesChange(stories);
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors du déplacement");
      }

      showSuccessToast(
        "Déplacement réussi",
        "User story déplacée vers le haut"
      );
    } catch (error) {
      console.error("Erreur déplacement:", error);
      showErrorToast(
        "Erreur de déplacement",
        error instanceof Error
          ? error.message
          : "Impossible de déplacer la user story"
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // ⬇️ Déplacer vers le bas
  const handleMoveDown = async (story: UserStory) => {
    const currentIndex = stories.findIndex((s) => s.id === story.id);
    if (currentIndex >= stories.length - 1) {
      showInfoToast(
        "Déplacement impossible",
        "La story est déjà en dernière position"
      );
      return;
    }

    try {
      setOperationInProgress(`move-${story.id}`);

      const newStories = [...stories];
      [newStories[currentIndex], newStories[currentIndex + 1]] = [
        newStories[currentIndex + 1],
        newStories[currentIndex],
      ];

      // Mise à jour optimiste
      onStoriesChange(newStories);

      // Appel API pour sauvegarder les nouvelles positions
      const response = await fetch(`/api/Tasks/${story.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: currentIndex + 1 }),
      });

      if (!response.ok) {
        // Rollback en cas d'erreur
        onStoriesChange(stories);
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors du déplacement");
      }

      showSuccessToast("Déplacement réussi", "User story déplacée vers le bas");
    } catch (error) {
      console.error("Erreur déplacement:", error);
      showErrorToast(
        "Erreur de déplacement",
        error instanceof Error
          ? error.message
          : "Impossible de déplacer la user story"
      );
    } finally {
      setOperationInProgress(null);
    }
  };

  // 🎯 Statistiques des stories filtrées
  const filteredStats = useMemo(() => {
    const total = filteredStories.length;
    const completed = filteredStories.filter((s) => s.status === "DONE").length;
    const inProgress = filteredStories.filter(
      (s) => s.status === "IN_PROGRESS"
    ).length;
    const blocked = filteredStories.filter(
      (s) => s.status === "BLOCKED"
    ).length;

    return { total, completed, inProgress, blocked };
  }, [filteredStories]);

  return (
    <div className="space-y-6">
      {/* 🎛️ Header avec actions */}
      <Card className="p-4 lg:p-6 border-2 border-dashed border-muted hover:border-primary/30 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ListPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                User Stories ({filteredStats.total})
              </h2>
              {filter && (
                <p className="text-sm text-muted-foreground">
                  Résultats pour "{filter}" • {filteredStats.completed}{" "}
                  terminées • {filteredStats.inProgress} en cours
                  {filteredStats.blocked > 0 &&
                    ` • ${filteredStats.blocked} bloquées`}
                </p>
              )}
            </div>

            {filteredStories.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {viewMode === "list" ? "Vue Liste" : "Vue Cartes"}
                </Badge>
                {filteredStats.completed > 0 && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    {Math.round(
                      (filteredStats.completed / filteredStats.total) * 100
                    )}
                    % terminé
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* ➕ Bouton d'ajout */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2 w-full sm:w-auto transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter une User Story</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Créer une nouvelle User Story
                </DialogTitle>
              </DialogHeader>
              <TasksForm
                onSubmit={handleAddStory}
                onCancel={() => setIsFormOpen(false)}
                projectId={projectId}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* 📋 Contenu principal - Affichage conditionnel */}
      <div className="relative">
        {filteredStories.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-muted">
            <div className="flex flex-col items-center gap-6 text-muted-foreground">
              <div className="p-6 bg-muted/30 rounded-full">
                <FolderOpen className="h-16 w-16 opacity-50" />
              </div>
              <div className="space-y-3 max-w-md">
                <h3 className="text-xl font-medium text-foreground">
                  {filter
                    ? "Aucun résultat trouvé"
                    : "Aucune user story disponible"}
                </h3>
                <p className="text-sm leading-relaxed">
                  {filter
                    ? `Aucune user story ne correspond à "${filter}". Essayez de modifier votre recherche.`
                    : "Commencez par créer votre première user story pour organiser votre projet."}
                </p>
              </div>
              {!filter && (
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 transition-all duration-200 hover:scale-105"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première User Story
                </Button>
              )}
            </div>
          </Card>
        ) : viewMode === "list" ? (
          <TasksViewList
            stories={filteredStories}
            onView={setViewingStory}
            onEdit={setEditingStory}
            onDelete={setDeletingStory}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            operationInProgress={operationInProgress}
          />
        ) : (
          <TasksViewCard
            stories={filteredStories}
            onView={setViewingStory}
            onEdit={setEditingStory}
            onDelete={setDeletingStory}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            operationInProgress={operationInProgress}
          />
        )}
      </div>

      {/* 👁️ Modal de visualisation */}
      <Dialog open={!!viewingStory} onOpenChange={() => setViewingStory(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Détails de la User Story
            </DialogTitle>
          </DialogHeader>
          {viewingStory && (
            <div className="space-y-6">
              {/* Titre et description */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xl leading-tight">
                  {viewingStory.title}
                </h3>
                {viewingStory.description && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Description</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {viewingStory.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Statut
                  </span>
                  <Badge variant="outline" className="w-fit">
                    {viewingStory.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Priorité
                  </span>
                  <Badge variant="outline" className="w-fit">
                    {viewingStory.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Story Points
                  </span>
                  <span className="text-sm font-medium">
                    {viewingStory.storyPoints || "Non estimé"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Heures estimées
                  </span>
                  <span className="text-sm font-medium">
                    {viewingStory.estimatedHours
                      ? `${viewingStory.estimatedHours}h`
                      : "Non estimé"}
                  </span>
                </div>
              </div>

              {/* Métriques avancées */}
              {(viewingStory.businessValue ||
                viewingStory.technicalRisk ||
                viewingStory.effort) && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {viewingStory.businessValue || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Valeur Business
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">
                      {viewingStory.technicalRisk || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Risque Technique
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {viewingStory.effort || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">Effort</div>
                  </div>
                </div>
              )}

              {/* Tags et labels */}
              {(viewingStory.tags.length > 0 ||
                viewingStory.labels.length > 0) && (
                <div className="space-y-3">
                  {viewingStory.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingStory.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingStory.labels.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingStory.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="text-xs"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Critères d'acceptation */}
              {viewingStory.acceptanceCriteria && (
                <div className="space-y-2">
                  <h4 className="font-medium">Critères d'acceptation</h4>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {viewingStory.acceptanceCriteria}
                    </pre>
                  </div>
                </div>
              )}

              {/* Métadonnées */}
              <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>
                    Créé le{" "}
                    {new Date(viewingStory.createdAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                  <span>
                    Modifié le{" "}
                    {new Date(viewingStory.updatedAt).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✏️ Modal d'édition */}
      <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Modifier la User Story
            </DialogTitle>
          </DialogHeader>
          {editingStory && (
            <TasksForm
              story={editingStory}
              onSubmit={handleEditStory}
              onCancel={() => setEditingStory(null)}
              projectId={projectId}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 🗑️ Dialog de confirmation de suppression */}
      <AlertDialog
        open={!!deletingStory}
        onOpenChange={() => setDeletingStory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer la user story{" "}
                <strong>"{deletingStory?.title}"</strong> ?
              </p>
              <p className="text-sm bg-destructive/10 p-2 rounded text-destructive">
                ⚠️ Cette action est irréversible et supprimera également toutes
                les tâches associées.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={!!operationInProgress}
              className="hover:bg-muted"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStory}
              disabled={!!operationInProgress}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {operationInProgress?.includes("delete") ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
