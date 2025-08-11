// 📄 /app/projects/[id]/tasks/page.tsx
// 🎯 Rôle : Page principale des tâches d'un projet avec gestion des User Stories
// 📦 Responsabilités : Récupération des données, gestion d'état, orchestration des composants
// 🔧 Composants utilisés : TasksDisplay, TasksFilter, TasksList
// 🌐 API : /api/Tasks

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FolderOpen, BarChart3 } from "lucide-react";
import TasksDisplay from "@/components/tasks/TasksDisplay";
import TasksFilter from "@/components/tasks/TasksFilter";
import TasksList from "@/components/tasks/TasksList";

// 🔧 Interface TypeScript conforme à Next.js 15
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

// ⚡ IMPORTANT : Type mis à jour pour Next.js 15
interface ProjectTasksPageProps {
  params: Promise<{ id: string }>; // ✅ Maintenant une Promise
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function ProjectTasksPage({
  params,
  searchParams,
}: ProjectTasksPageProps) {
  // 🎨 États principaux
  const [projectId, setProjectId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [filter, setFilter] = useState<string>("");
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ⚡ Extraction des paramètres avec await (Next.js 15)
  useEffect(() => {
    const getParams = async () => {
      try {
        // ✅ OBLIGATOIRE : await des paramètres dans Next.js 15
        const resolvedParams = await params;
        const resolvedSearchParams = searchParams ? await searchParams : null;

        setProjectId(resolvedParams.id);

        // Traitement des paramètres de recherche si nécessaires
        if (resolvedSearchParams) {
          const initialFilter = resolvedSearchParams.filter as string;
          if (initialFilter) setFilter(initialFilter);

          const initialView = resolvedSearchParams.view as "list" | "card";
          if (initialView) setViewMode(initialView);
        }
      } catch (err) {
        setError("Erreur lors de la récupération des paramètres");
        console.error("Erreur params:", err);
      }
    };

    getParams();
  }, [params, searchParams]);

  // 🔄 Récupération des données une fois que projectId est disponible
  useEffect(() => {
    if (!projectId) return;

    const fetchUserStories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/Tasks?projectId=${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setUserStories(result.data.terms || []);
        } else {
          throw new Error(result.error || "Erreur lors du chargement");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
        console.error("Erreur lors du chargement des user stories:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStories();
  }, [projectId]);

  // 🔍 Fonction de mise à jour des stories
  const handleStoriesChange = (updatedStories: UserStory[]) => {
    setUserStories(updatedStories);
  };

  // 🚨 Affichage de l'erreur
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 💀 Affichage du loader si params ou données en cours de chargement
  if (!projectId || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <Skeleton className="h-8 w-64" />
              </div>
              <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 min-h-screen">
      {/* 📱 Header responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Gestion des User Stories
            </h1>
            <p className="text-sm text-muted-foreground">
              Projet ID: {projectId}
            </p>
          </div>
        </div>

        {/* 📊 Statistiques rapides */}
        {userStories.length > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">
                Total:{" "}
                <span className="font-medium text-foreground">
                  {userStories.length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">
                Terminées:{" "}
                <span className="font-medium text-foreground">
                  {userStories.filter((s) => s.status === "DONE").length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-muted-foreground">
                Points:{" "}
                <span className="font-medium text-foreground">
                  {userStories.reduce(
                    (sum, s) => sum + (s.storyPoints || 0),
                    0
                  )}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 🎛️ Contrôles principaux */}
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex-1 w-full lg:w-auto">
            <TasksFilter
              filter={filter}
              onFilterChange={setFilter}
              storiesCount={userStories.length}
            />
          </div>
          <div className="w-full lg:w-auto">
            <TasksDisplay viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </Card>

      {/* 📋 Contenu principal */}
      <div className="min-h-[500px]">
        <TasksList
          stories={userStories}
          filter={filter}
          viewMode={viewMode}
          onStoriesChange={handleStoriesChange}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
