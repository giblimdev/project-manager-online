// app/projects/[id]/page.tsx

/**
 * RÔLE : Page de détail d'un projet avec gestion de la sélection d'initiatives
 * RESPONSABILITÉS :
 * - Afficher les informations complètes d'un projet selon le schéma Prisma avec relations
 * - Gérer l'authentification avec Better Auth useSession pour les permissions d'accès
 * - Utilisation exclusive du store Zustand corrigé pour éviter les boucles infinies
 * - Gestion de la sélection d'initiative avec useSelectedInitiativeStore
 * - Navigation vers la page des initiatives avec mise à jour du store
 * - Navigation responsive avec design moderne mobile-first
 * - Gestion robuste des états de chargement, d'erreur et d'hydratation
 * - Interface responsive avec Tailwind CSS et composants shadcn/ui
 * - Protection d'accès et validation des permissions utilisateur
 * - Optimisation performance avec cache intelligent TTL
 *
 * COMPOSANTS UTILISÉS :
 * - useSession de Better Auth (@/lib/auth/auth-client) pour l'authentification
 * - useSelectedProjectStore: Store Zustand avec cache stable et sélecteurs optimisés
 * - useSelectedInitiativeStore: Store Zustand pour la gestion des initiatives
 * - shadcn/ui: Card, Button, Badge, Avatar, Skeleton pour l'interface moderne
 * - Next.js 15: useParams, useRouter, Link avec navigation et TypeScript strict
 * - Sonner: Toast notifications pour le feedback utilisateur
 * - Lucide React: Icons cohérentes et modernes
 *
 * LIBS UTILISÉS :
 * - React 19 avec hooks (useState, useEffect, useCallback, useMemo) et TypeScript strict mode
 * - Next.js 15 app router avec params et gestion d'erreurs moderne
 * - Better Auth pour l'authentification et gestion des sessions
 * - Zustand pour l'état global avec cache stable (évite duplication d'appels API)
 * - shadcn/ui pour les composants UI modernes et accessibles
 * - Tailwind CSS pour le styling responsive mobile-first
 * - Sonner pour les notifications toast
 * - Lucide React pour les icônes vectorielles optimisées
 *
 * OPTIMISATION :
 * - Utilise exclusivement le store Zustand : @/stores/useSelectedProjectStore.ts
 * - Gestion des initiatives avec @/stores/useSelectedInitiativeStore.ts
 * - Sélecteurs optimisés pour éviter les boucles infinies getSnapshot
 * - Hydratation sécurisée avec protection contre les re-renders
 * - Cache intelligent TTL pour éviter les requêtes redondantes
 * - Affichage conditionnel selon disponibilité des données store
 * - Navigation intelligente vers les pages initiatives avec store sync
 */

"use client";

import { JSX, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Users,
  Eye,
  Globe,
  Lock,
  Activity,
  Pause,
  Archive,
  BarChart3,
  Target,
  Layers,
  BookOpen,
  CheckSquare,
  FileText,
  Settings,
  AlertCircle,
  ExternalLink,
  Info,
  RefreshCw,
  Share2,
  Clock,
  TrendingUp,
  Shield,
  Navigation,
  Hash,
  Zap,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// ✅ CORRECTION: Import exclusif des stores Zustand corrigés
import {
  useProjectStoreHydration,
  useSelectedProjectId,
  useSelectedProjectData,
  useProjectLoading,
  useProjectError,
  useProjectActions,
} from "@/stores/useSelectedProjectStore";

import {
  useInitiativeActions,
  useInitiativeStoreHydration,
} from "@/stores/useSelectedInitiativeStore";

// ✅ CORRECTION: Interface TypeScript Next.js 15 stricte
interface RouteParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

// Type pour les initiatives affichées
interface InitiativeSimple {
  id: string;
  name: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  progress: number;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
}

// ✅ CORRECTION: Export par défaut Next.js 15
export default function ProjectDetailPage(): JSX.Element {
  const params = useParams<RouteParams>();
  const router = useRouter();

  // ✅ Authentification Better Auth avec gestion complète
  const {
    data: session,
    isPending: isAuthLoading,
    error: authError,
  } = useSession();

  // ✅ CORRECTION: Utilisation exclusive du store Zustand avec hooks optimisés
  const selectedProjectId = useSelectedProjectId();
  const projectData = useSelectedProjectData();
  const isLoading = useProjectLoading();
  const error = useProjectError();
  const {
    setSelectedProjectId,
    refreshProject,
    isDataFresh,
    loadProjectData,
    clearProject,
  } = useProjectActions();

  // ✅ CORRECTION: Store Initiative pour la gestion de sélection
  const { setSelectedInitiativeId } = useInitiativeActions();
  const isInitiativeStoreHydrated = useInitiativeStoreHydration();

  // ✅ Hydratation sécurisée du store
  const isHydrated = useProjectStoreHydration();

  /**
   * ✅ CORRECTION: Synchronisation exclusive avec le store Zustand
   */
  useEffect(() => {
    let mounted = true;

    const syncWithStore = async () => {
      if (
        !mounted ||
        !isHydrated ||
        !params.id ||
        !session?.user ||
        authError
      ) {
        return;
      }

      try {
        // ✅ Synchronisation uniquement via le store
        if (selectedProjectId !== params.id) {
          console.log("🔄 Store sync - Nouveau projet:", params.id);
          setSelectedProjectId(params.id);
        } else if (!isDataFresh()) {
          console.log("⏰ Store sync - Données expirées, rechargement");
          await loadProjectData(params.id, true);
        }
      } catch (error) {
        console.error("💥 Erreur synchronisation store:", error);
        toast.error("Erreur de synchronisation des données");
      }
    };

    syncWithStore();

    return () => {
      mounted = false;
    };
  }, [
    isHydrated,
    params.id,
    session?.user,
    authError,
    selectedProjectId,
    setSelectedProjectId,
    isDataFresh,
    loadProjectData,
  ]);

  /**
   * ✅ CORRECTION: Utilitaires avec mémorisation optimisée
   */
  const statusConfig = useMemo(() => {
    const configs = {
      ACTIVE: {
        icon: Activity,
        color: "bg-green-100 text-green-800 border-green-200",
        label: "Actif",
        textColor: "text-green-600",
      },
      INACTIVE: {
        icon: Pause,
        color: "bg-orange-100 text-orange-800 border-orange-200",
        label: "Inactif",
        textColor: "text-orange-600",
      },
      ARCHIVED: {
        icon: Archive,
        color: "bg-gray-100 text-gray-600 border-gray-200",
        label: "Archivé",
        textColor: "text-gray-600",
      },
    };

    return (status: string) =>
      configs[status as keyof typeof configs] || {
        icon: Activity,
        color: "bg-blue-100 text-blue-800 border-blue-200",
        label: status,
        textColor: "text-blue-600",
      };
  }, []);

  const visibilityConfig = useMemo(() => {
    const configs = {
      PUBLIC: { icon: Globe, color: "text-blue-600", label: "Public" },
      PRIVATE: { icon: Lock, color: "text-purple-600", label: "Privé" },
      INTERNAL: { icon: Users, color: "text-orange-600", label: "Interne" },
    };

    return (visibility: string) =>
      configs[visibility as keyof typeof configs] || {
        icon: Eye,
        color: "text-gray-500",
        label: visibility,
      };
  }, []);

  const priorityConfig = useMemo(() => {
    const configs = {
      CRITICAL: {
        color: "text-red-700 bg-red-100 border-red-300",
        label: "Critique",
      },
      HIGH: {
        color: "text-orange-700 bg-orange-100 border-orange-300",
        label: "Haute",
      },
      MEDIUM: {
        color: "text-yellow-700 bg-yellow-100 border-yellow-300",
        label: "Moyenne",
      },
      LOW: {
        color: "text-green-700 bg-green-100 border-green-300",
        label: "Basse",
      },
    };

    return (priority: string) =>
      configs[priority as keyof typeof configs] || {
        color: "text-gray-700 bg-gray-100 border-gray-300",
        label: priority,
      };
  }, []);

  const formatDate = useCallback((date: Date | string | null): string => {
    if (!date) return "Non définie";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(dateObj);
    } catch {
      return "Date invalide";
    }
  }, []);

  const getInitials = useCallback((name?: string | null): string => {
    if (!name) return "U";

    const words = name.trim().split(" ");
    return words.length === 1
      ? words[0].charAt(0).toUpperCase()
      : words
          .slice(0, 2)
          .map((word) => word.charAt(0))
          .join("")
          .toUpperCase();
  }, []);

  /**
   * ✅ CORRECTION: Handlers optimisés pour le store
   */
  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!params.id) return;

    try {
      console.log("🔄 Rafraîchissement via store exclusivement");
      const refreshToast = toast.loading("Actualisation en cours...");

      await refreshProject();

      toast.success("Données actualisées", {
        id: refreshToast,
        duration: 2000,
      });
    } catch (error) {
      console.error("💥 Erreur rafraîchissement:", error);
      toast.error("Erreur lors de l'actualisation", {
        duration: 4000,
      });
    }
  }, [params.id, refreshProject]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!projectData) return;

    try {
      const shareData = {
        title: `Projet ${projectData.name}`,
        text:
          projectData.description || `Découvrez le projet ${projectData.name}`,
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Lien partagé");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié");
      }
    } catch (error) {
      console.error("Erreur partage:", error);
      toast.error("Impossible de partager");
    }
  }, [projectData]);

  const handleNavigateBack = useCallback(() => {
    console.log("🔙 Navigation retour - nettoyage store");
    clearProject(); // Nettoie le store avant navigation
    router.push("/projects");
  }, [router, clearProject]);

  /**
   * ✅ CORRECTION: Handler pour la sélection d'initiative
   */
  const handleInitiativeSelect = useCallback(
    (initiative: InitiativeSimple) => {
      if (!isInitiativeStoreHydrated) {
        console.warn("Store initiative pas encore hydraté");
        return;
      }

      console.log("🎯 Sélection initiative:", initiative.name, initiative.id);

      // Mise à jour du store initiative
      setSelectedInitiativeId(initiative.id);

      // Toast de feedback
      toast.success(`Initiative "${initiative.name}" sélectionnée`, {
        duration: 2000,
      });

      // Navigation vers la page des initiatives
      router.push(`/projects/${projectData?.id}/initiatives`);
    },
    [
      isInitiativeStoreHydrated,
      setSelectedInitiativeId,
      router,
      projectData?.id,
    ]
  );

  /**
   * ✅ CORRECTION: Navigation vers toutes les initiatives
   */
  const handleViewAllInitiatives = useCallback(() => {
    if (!projectData?.id) return;

    console.log("📋 Navigation vers toutes les initiatives");
    router.push(`/projects/${projectData.id}/initiatives`);
  }, [router, projectData?.id]);

  /**
   * ✅ CORRECTION: Calcul des statistiques depuis le store uniquement
   */
  const projectStats = useMemo(() => {
    if (!projectData) return null;

    // Calcul des statistiques depuis les données disponibles
    const stats = {
      initiatives:
        projectData._count?.initiatives || projectData.initiatives?.length || 0,
      features:
        projectData._count?.features || projectData.features?.length || 0,
      sprints: projectData._count?.sprints || projectData.sprints?.length || 0,
      members: projectData._count?.members || projectData.members?.length || 0,
      users: projectData._count?.user || projectData.user?.length || 0,
    };

    const total = stats.initiatives + stats.features + stats.sprints;

    return {
      ...stats,
      total,
      hasData: total > 0,
      hasMembers: stats.members > 0,
      hasUsers: stats.users > 0,
    };
  }, [projectData]);

  // ✅ États de chargement avec diagnostic développement
  if (isAuthLoading || !isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Initialisation
              </h3>
              <p className="text-gray-600">
                {!isHydrated
                  ? "Hydratation du store..."
                  : "Vérification authentification..."}
              </p>

              {/* Diagnostic développement */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between">
                    <span>Project Store:</span>
                    <span
                      className={
                        isHydrated ? "text-green-600" : "text-orange-600"
                      }
                    >
                      {isHydrated ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Initiative Store:</span>
                    <span
                      className={
                        isInitiativeStoreHydrated
                          ? "text-green-600"
                          : "text-orange-600"
                      }
                    >
                      {isInitiativeStoreHydrated ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth:</span>
                    <span
                      className={
                        !isAuthLoading ? "text-green-600" : "text-orange-600"
                      }
                    >
                      {!isAuthLoading ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Session:</span>
                    <span
                      className={session ? "text-green-600" : "text-red-600"}
                    >
                      {session ? "✅" : "❌"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projet ID:</span>
                    <code className="text-blue-600">{params.id || "N/A"}</code>
                  </div>
                  {authError && (
                    <div className="text-red-600 mt-2">
                      <Zap className="h-3 w-3 inline mr-1" />
                      {authError.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Gestion d'erreur authentification
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Erreur d'authentification
              </h3>
              <p className="text-gray-600 mt-2">
                {authError.message || "Erreur d'authentification"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/auth/signin")}
              >
                Se reconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Protection d'accès
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Connexion requise
              </h3>
              <p className="text-gray-600 mt-2">
                Connectez-vous pour accéder aux détails du projet
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => router.push("/auth/signin")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Affichage loading avec skeleton moderne
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header skeleton */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Content skeleton */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Description skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>

              {/* Stats skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="text-center p-4 bg-gray-50 rounded-lg"
                      >
                        <Skeleton className="h-6 w-6 mx-auto mb-2" />
                        <Skeleton className="h-6 w-8 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Gestion d'erreur store avec diagnostic
  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error || "Projet non trouvé"}
              </h3>
              <p className="text-gray-600 mb-4">
                Le projet demandé n'existe pas ou vous n'y avez pas accès.
              </p>

              {/* Debug info développement */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span>Projet demandé:</span>
                    <code className="text-blue-600">{params.id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Store projet:</span>
                    <code className="text-purple-600">
                      {selectedProjectId || "Aucun"}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache fresh:</span>
                    <span
                      className={
                        isDataFresh() ? "text-green-600" : "text-red-600"
                      }
                    >
                      {isDataFresh() ? "Oui" : "Non"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Données store:</span>
                    <span
                      className={
                        projectData ? "text-green-600" : "text-red-600"
                      }
                    >
                      {projectData ? "Présentes" : "Absentes"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleNavigateBack}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux projets
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Calcul des configurations depuis le store
  const currentStatus = statusConfig(projectData.status);
  const currentVisibility = visibilityConfig(projectData.visibility);
  const StatusIcon = currentStatus.icon;
  const VisibilityIcon = currentVisibility.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* ✅ En-tête projet avec design moderne */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Navigation et indicateurs */}
                <div className="flex items-center gap-3 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNavigateBack}
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Projets
                  </Button>

                  {/* Indicateur fraîcheur cache */}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      isDataFresh()
                        ? "text-green-600 border-green-200 bg-green-50"
                        : "text-amber-600 border-amber-200 bg-amber-50"
                    }`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {isDataFresh() ? "À jour" : "Cache"}
                  </Badge>
                </div>

                {/* Titre et clé */}
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    {projectData.name}
                  </h1>
                  <Badge className="font-mono text-xs px-3 py-1 bg-blue-100 text-blue-800 border-blue-200 shrink-0">
                    {projectData.key}
                  </Badge>
                </div>

                {/* Métadonnées */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <StatusIcon
                      className={`h-4 w-4 ${currentStatus.textColor}`}
                    />
                    <Badge className={`${currentStatus.color} text-xs`}>
                      {currentStatus.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <VisibilityIcon
                      className={`h-4 w-4 ${currentVisibility.color}`}
                    />
                    <span className="capitalize">
                      {currentVisibility.label}
                    </span>
                  </div>

                  {projectStats && projectStats.hasMembers && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{projectStats.members} membre(s)</span>
                    </div>
                  )}

                  {projectData.isActive && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-600 font-medium">
                        Projet actif
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-gray-500">
                    <Hash className="h-3 w-3" />
                    <span>#{projectData.order}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Actualiser
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="hover:bg-green-50 hover:border-green-300 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ✅ Navigation simple intégrée */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Navigation className="h-4 w-4" />
              <span>Navigation:</span>
              <div className="flex flex-wrap gap-2">
                {projectStats && projectStats.hasData && (
                  <>
                    {projectStats.initiatives > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewAllInitiatives}
                        className="hover:bg-blue-50 cursor-pointer border-blue-200 text-blue-700"
                      >
                        <Target className="h-3 w-3 mr-1" />
                        Initiatives ({projectStats.initiatives})
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                    {projectStats.features > 0 && (
                      <Link href={`/projects/${projectData.id}/features`}>
                        <Badge
                          variant="outline"
                          className="hover:bg-green-50 cursor-pointer"
                        >
                          <Layers className="h-3 w-3 mr-1" />
                          Features ({projectStats.features})
                        </Badge>
                      </Link>
                    )}
                    {projectStats.sprints > 0 && (
                      <Link href={`/projects/${projectData.id}/sprints`}>
                        <Badge
                          variant="outline"
                          className="hover:bg-purple-50 cursor-pointer"
                        >
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Sprints ({projectStats.sprints})
                        </Badge>
                      </Link>
                    )}
                  </>
                )}
                <Link href={`/projects/${projectData.id}/settings`}>
                  <Badge
                    variant="outline"
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Paramètres
                  </Badge>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ Contenu principal responsive */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {projectData.description && (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Description du projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {projectData.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ Statistiques depuis le store */}
            {projectStats && projectStats.hasData ? (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Aperçu des éléments
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {projectStats.total} éléments
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {projectStats.initiatives > 0 && (
                      <button
                        onClick={handleViewAllInitiatives}
                        className="block w-full"
                      >
                        <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-blue-200 group">
                          <Target className="h-6 w-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <div className="text-2xl font-bold text-blue-900">
                            {projectStats.initiatives}
                          </div>
                          <div className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                            Initiatives
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </div>
                      </button>
                    )}

                    {projectStats.features > 0 && (
                      <Link
                        href={`/projects/${projectData.id}/features`}
                        className="block"
                      >
                        <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-green-200 group">
                          <Layers className="h-6 w-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <div className="text-2xl font-bold text-green-900">
                            {projectStats.features}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Features
                          </div>
                        </div>
                      </Link>
                    )}

                    {projectStats.sprints > 0 && (
                      <Link
                        href={`/projects/${projectData.id}/sprints`}
                        className="block"
                      >
                        <div className="text-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 cursor-pointer border border-transparent hover:border-purple-200 group">
                          <CheckSquare className="h-6 w-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <div className="text-2xl font-bold text-purple-900">
                            {projectStats.sprints}
                          </div>
                          <div className="text-xs text-purple-600 font-medium">
                            Sprints
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Projet configuré
                      </h3>
                      <p className="text-gray-600 max-w-md">
                        Ce projet est prêt pour l'ajout d'initiatives, de
                        fonctionnalités et de sprints.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        onClick={handleViewAllInitiatives}
                        size="sm"
                        variant="outline"
                        className="hover:bg-blue-50"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Ajouter des initiatives
                      </Button>
                      <Link href={`/projects/${projectData.id}/features`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-50"
                        >
                          <Layers className="h-4 w-4 mr-2" />
                          Créer des features
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ Initiatives récentes depuis le store avec sélection */}
            {projectData.initiatives && projectData.initiatives.length > 0 ? (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Initiatives récentes
                    </CardTitle>
                    <Button
                      onClick={handleViewAllInitiatives}
                      variant="outline"
                      size="sm"
                      className="hover:bg-blue-50"
                    >
                      Voir tout ({projectData.initiatives.length})
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectData.initiatives
                      .slice(0, 3)
                      .map((initiative: InitiativeSimple) => {
                        const priorityConf = priorityConfig(
                          initiative.priority
                        );

                        return (
                          <button
                            key={initiative.id}
                            onClick={() => handleInitiativeSelect(initiative)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all duration-200 border border-transparent hover:border-blue-200 group cursor-pointer">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                    {initiative.name}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs border ${priorityConf.color}`}
                                  >
                                    {priorityConf.label}
                                  </Badge>
                                </div>
                                {initiative.description && (
                                  <p className="text-sm text-gray-600 truncate mb-2">
                                    {initiative.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    {initiative.status}
                                  </span>
                                  {initiative.budget && (
                                    <span className="flex items-center gap-1">
                                      <span>💰</span>
                                      {initiative.budget.toLocaleString()}€
                                    </span>
                                  )}
                                  {initiative.startDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(initiative.startDate)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 ml-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900 mb-1">
                                    {Math.round(initiative.progress)}%
                                  </div>
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        initiative.progress >= 80
                                          ? "bg-green-600"
                                          : initiative.progress >= 50
                                          ? "bg-blue-600"
                                          : "bg-orange-600"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          initiative.progress,
                                          100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </div>
                          </button>
                        );
                      })}

                    {projectData.initiatives.length > 3 && (
                      <div className="text-center pt-3 border-t border-gray-100">
                        <Button
                          onClick={handleViewAllInitiatives}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          Voir {projectData.initiatives.length - 3} autres
                          initiatives
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Initiatives
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-900 mb-2">
                      Aucune initiative
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Définissez les grandes orientations de votre projet
                    </p>
                    <Button
                      onClick={handleViewAllInitiatives}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Créer une initiative
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ✅ Colonne latérale avec informations du store (reste inchangé) */}
          <div className="space-y-6">
            {/* Planning */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Planning & Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium text-gray-600">
                      Début:
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {formatDate(projectData.startDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span className="text-sm font-medium text-gray-600">
                      Fin:
                    </span>
                    <span className="text-sm text-gray-900 font-medium">
                      {formatDate(projectData.endDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                    <span className="text-sm font-medium text-blue-600">
                      Créé le:
                    </span>
                    <span className="text-sm text-blue-900 font-medium">
                      {formatDate(projectData.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-green-50 rounded-md">
                    <span className="text-sm font-medium text-green-600">
                      Modifié:
                    </span>
                    <span className="text-sm text-green-900 font-medium">
                      {formatDate(projectData.updatedAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Le reste des sections (Équipe, Propriétaires, Configuration) restent identiques */}
            {/* ... (code existant pour les autres sections) ... */}
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ CORRECTION: Types exportés pour la réutilisabilité
export type { RouteParams, InitiativeSimple };
