// @/app/projects/[id]/userStories/page.tsx

/*
 * Page de gestion des User Stories d'un projet (MISE À JOUR)
 * Rôle : Point d'entrée principal pour la gestion des user stories.
 * Responsabilités :
 * - Récupération des données du projet et des user stories.
 * - Utilise des types centralisés depuis @/types/userStories.ts.
 * - Coordination des composants enfants.
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import UserStoriesDisplay from "@/components/userStories/UserStoriesDisplay";
import UserStoriesFilter from "@/components/userStories/UserStoriesFilter";
import UserStoriesList from "@/components/userStories/UserStoriesList";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, Users, Target, TrendingUp } from "lucide-react";

// ✅ Import des types centralisés. Plus de définitions locales.
import {
  UserStoriesPageData,
  UserStoryData,
  DisplayMode,
} from "@/types/userStories";

export default function UserStoriesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const { data: session, isPending } = useSession();

  // États locaux
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserStoriesPageData | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [filteredUserStories, setFilteredUserStories] = useState<
    UserStoryData[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fonction utilitaire pour les appels API
  const apiCall = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Erreur réseau" }));
        throw new Error(error.error || `Erreur HTTP: ${response.status}`);
      }

      return response.json();
    },
    []
  );

  // Chargement des données
  const loadUserStoriesData = useCallback(async () => {
    if (!projectId || !session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiCall(`/api/projects/${projectId}/user-stories`);

      if (response.success) {
        setData(response.data);
        setFilteredUserStories(response.data.userStories);
      } else {
        throw new Error(
          response.error || "Erreur lors du chargement des données"
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des user stories:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);

      if (errorMessage.includes("403")) {
        toast.error("Accès non autorisé", {
          description:
            "Vous n'avez pas les permissions pour accéder à ce projet",
        });
        router.push("/projects");
      } else if (errorMessage.includes("404")) {
        toast.error("Projet non trouvé", {
          description: "Le projet demandé n'existe pas ou a été supprimé",
        });
        router.push("/projects");
      } else {
        toast.error("Erreur de chargement", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectId, session?.user?.id, apiCall, router]);

  // Chargement initial des données
  useEffect(() => {
    if (!isPending && session?.user?.id && projectId) {
      loadUserStoriesData();
    } else if (!isPending && !session?.user?.id) {
      router.push("/auth/signin");
    }
  }, [isPending, session?.user?.id, projectId, loadUserStoriesData, router]);

  // Filtrage des user stories par recherche textuelle
  const handleFilterChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!data?.userStories) return;

      if (!query.trim()) {
        setFilteredUserStories(data.userStories);
        return;
      }

      const lowerCaseQuery = query.toLowerCase();
      const filtered = data.userStories.filter(
        (us) =>
          us.title.toLowerCase().includes(lowerCaseQuery) ||
          us.description?.toLowerCase().includes(lowerCaseQuery) ||
          us.feature.name.toLowerCase().includes(lowerCaseQuery) ||
          us.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery)) ||
          us.labels.some((label) =>
            label.toLowerCase().includes(lowerCaseQuery)
          ) ||
          us.creator.name?.toLowerCase().includes(lowerCaseQuery) ||
          us.UserStoryAssignees.some((ua) =>
            ua.users.name?.toLowerCase().includes(lowerCaseQuery)
          )
      );
      setFilteredUserStories(filtered);
    },
    [data?.userStories]
  );

  // Gestion du changement de mode d'affichage
  const handleDisplayModeChange = useCallback((mode: DisplayMode) => {
    setDisplayMode(mode);
    try {
      localStorage.setItem("userStories_displayMode", mode);
    } catch (error) {
      console.warn(
        "Impossible de sauvegarder la préférence d'affichage:",
        error
      );
    }
  }, []);

  // Restauration de la préférence d'affichage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(
        "userStories_displayMode"
      ) as DisplayMode;
      if (savedMode && ["list", "card"].includes(savedMode)) {
        setDisplayMode(savedMode);
      }
    } catch (error) {
      console.warn("Impossible de récupérer la préférence d'affichage:", error);
    }
  }, []);

  // Gestion de l'actualisation des données
  const handleRefresh = useCallback(() => {
    loadUserStoriesData();
  }, [loadUserStoriesData]);

  // Mémoisation des statistiques
  const statistics = useMemo(() => {
    if (!data?.userStories) return null;

    const total = data.userStories.length;
    const byStatus = data.userStories.reduce((acc, us) => {
      acc[us.status] = (acc[us.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalStoryPoints = data.userStories.reduce(
      (sum, us) => sum + (us.storyPoints || 0),
      0
    );
    const completionRate =
      total > 0 ? Math.round(((byStatus.DONE || 0) / total) * 100) : 0;
    const blocked = data.userStories.filter(
      (us) => us.status === "BLOCKED"
    ).length;

    return { total, completionRate, totalStoryPoints, blocked };
  }, [data?.userStories]);

  // Affichage du state de chargement initial
  if (isPending || (isLoading && !data)) {
    return <UserStoriesLoadingSkeleton />;
  }

  // Affichage de l'erreur
  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Erreur de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirection si pas de données
  if (!data) {
    router.push("/projects");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Stories</h1>
          <p className="text-gray-600">Projet : {data.project.name}</p>
        </div>

        {/* Statistiques */}
        {statistics && (
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{statistics.total}</span>
              <span className="text-gray-500">stories</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">{statistics.completionRate}%</span>
              <span className="text-gray-500">terminées</span>
            </div>
            {statistics.blocked > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">{statistics.blocked}</span>
                <span>bloquées</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-gray-500">
                {data.userRole.replace("_", " ").toLowerCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <UserStoriesFilter
            searchQuery={searchQuery}
            onFilterChange={handleFilterChange}
            totalCount={data.userStories.length}
            filteredCount={filteredUserStories.length}
          />
        </div>
        <div className="flex-shrink-0">
          <UserStoriesDisplay
            viewMode={displayMode}
            onChange={handleDisplayModeChange}
          />
        </div>
      </div>

      {/* Liste des user stories */}
      <UserStoriesList
        userStories={filteredUserStories}
        displayMode={displayMode}
        features={data.features}
        projectMembers={data.projectMembers}
        sprints={data.sprints}
        userRole={data.userRole}
        projectId={projectId}
        onUpdate={handleRefresh}
        isLoading={isLoading}
      />
    </div>
  );
}

// Skeleton de chargement
function UserStoriesLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div> 
    </div>
  );
}
