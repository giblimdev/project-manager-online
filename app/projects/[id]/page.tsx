// app/projects/[id]/page.tsx

/**
 * RÔLE : Page de détail d'un projet spécifique avec vue d'ensemble simplifiée
 *
 * RESPONSABILITÉS :
 * - Afficher les informations complètes d'un projet selon le schéma Prisma avec relations
 * - Gérer l'authentification avec Better Auth useSession pour les permissions d'accès
 * - Intégration optimisée avec le store Zustand pour la gestion d'état global du projet sélectionné
 * - Navigation responsive avec ProjectNav pour accéder aux sous-sections du projet
 * - Gestion robuste des états de chargement, d'erreur et d'hydratation avec design moderne
 * - Interface responsive mobile-first avec Tailwind CSS et composants shadcn/ui
 * - Protection d'accès et validation des permissions utilisateur avec redirections appropriées
 * - Lecture pure du store Zustand (évite les appels API redondants)
 *
 * COMPOSANTS UTILISÉS :
 * - ProjectNav: Navigation vers les sous-sections du projet (initiatives, epics, features, sprints, etc.)
 * - useSession de Better Auth (@/lib/auth/auth-client) pour l'authentification et sessions
 * - useSelectedProjectStore: Store Zustand pour la lecture pure des données projet avec cache intelligent
 * - shadcn/ui: Card, Button, Badge, Avatar, Skeleton pour l'interface moderne et cohérente
 * - Next.js 15: useParams, Link, navigation avec paramètres async et TypeScript strict
 * - Sonner: Toast notifications pour les erreurs et feedback utilisateur
 * - Lucide React: Icons cohérentes et modernes pour l'interface utilisateur
 *
 * LIBS UTILISÉS :
 * - React 18 avec hooks (useState, useEffect, useCallback, useMemo) et TypeScript strict mode
 * - Next.js 15 app router avec params async et gestion d'erreurs moderne
 * - Better Auth pour l'authentification, gestion des sessions et protection d'accès
 * - Zustand pour la lecture pure d'état global (évite duplication d'appels API)
 * - shadcn/ui pour les composants UI modernes et accessibles
 * - Tailwind CSS pour le styling responsive avec design mobile-first
 * - Sonner pour les notifications toast avec gestion d'états
 * - Lucide React pour les icônes vectorielles optimisées
 *
 * OPTIMISATION :
 * - Lecture pure du store Zustand (pas de fetchProject dans la page)
 * - Le store gère déjà GET /api/projects/[id] avec cache intelligent TTL 5min
 * - Évite la duplication d'appels API et améliore significativement les performances
 * - Synchronisation automatique entre composants via le store global avec réactivité
 * - Hydratation sécurisée avec protection contre les boucles infinies
 * - États de chargement optimisés avec skeletons et spinners appropriés
 * - Affichage conditionnel des données selon disponibilité dans le store
 */

"use client";

import { JSX, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

// ✅ OPTIMISATION: Import uniquement du store Zustand (évite appels API redondants dans la page)
import useSelectedProjectStore, {
  useProjectStoreHydration,
} from "@/stores/useSelectedProjectStore";
import { ProjectNav } from "@/components/project/ProjectNav";

// ✅ CORRECTION: Interface conforme aux contraintes TypeScript Next.js 15
interface RouteParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

// ✅ CORRECTION PRINCIPALE: Export par défaut correct pour Next.js 15
export default function ProjectDetailPage(): JSX.Element {
  const params = useParams<RouteParams>();
  const router = useRouter();

  // Authentification Better Auth avec gestion complète d'erreurs
  const {
    data: session,
    isPending: isAuthLoading,
    error: authError,
  } = useSession();

  // ✅ OPTIMISATION: Lecture pure du store Zustand (pas d'appels API dans la page)
  const selectedProjectId = useSelectedProjectStore(
    (state) => state.selectedProjectId
  );
  const projectData = useSelectedProjectStore((state) => state.projectData);
  const isLoading = useSelectedProjectStore((state) => state.isLoading);
  const error = useSelectedProjectStore((state) => state.error);
  const setSelectedProjectId = useSelectedProjectStore(
    (state) => state.setSelectedProjectId
  );
  const refreshProject = useSelectedProjectStore(
    (state) => state.refreshProject
  );

  // Hydratation sécurisée du store avec protection contre les boucles
  const isHydrated = useProjectStoreHydration();

  /**
   * ✅ OPTIMISATION: Synchronisation avec le store uniquement (évite appels API redondants)
   * Le store gère déjà l'appel GET /api/projects/[id] avec cache intelligent TTL
   */
  useEffect(() => {
    if (isHydrated && params.id && session?.user && !authError) {
      // ✅ Synchronisation avec le store sans appel API redondant
      if (selectedProjectId !== params.id) {
        console.log("🔄 Synchronisation avec le store pour projet:", params.id);
        setSelectedProjectId(params.id); // Le store fera l'appel API si nécessaire
      }
    }
  }, [
    isHydrated,
    params.id,
    session?.user,
    authError,
    selectedProjectId,
    setSelectedProjectId,
  ]);

  /**
   * Utilitaires pour l'affichage avec optimisation des re-renders
   */
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "ACTIVE":
        return Activity;
      case "INACTIVE":
        return Pause;
      case "ARCHIVED":
        return Archive;
      default:
        return Activity;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "INACTIVE":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  }, []);

  const getVisibilityIcon = useCallback((visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return Globe;
      case "PRIVATE":
        return Lock;
      case "INTERNAL":
        return Users;
      default:
        return Eye;
    }
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
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }, []);

  /**
   * ✅ OPTIMISATION: Handler de rafraîchissement utilise le store uniquement
   */
  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      console.log("🔄 Rafraîchissement du projet via le store");
      await refreshProject(); // Utilise la méthode du store au lieu d'un nouvel appel API
      toast.success("Données du projet actualisées");
    } catch (error) {
      console.error("💥 Erreur rafraîchissement:", error);
      toast.error("Erreur lors de l'actualisation");
    }
  }, [refreshProject]);

  // ✅ États de chargement avec diagnostic pour debug
  if (isAuthLoading || !isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <div>
              <h3 className="text-lg font-medium">Initialisation</h3>
              <p className="text-gray-600">
                {!isHydrated
                  ? "Hydratation du store..."
                  : "Vérification de l'authentification..."}
              </p>
              {/* Diagnostic pour debug */}
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <div>Hydraté: {isHydrated ? "✅" : "⏳"}</div>
                <div>Auth Loading: {isAuthLoading ? "⏳" : "✅"}</div>
                <div>Session: {session ? "✅" : "❌"}</div>
                {authError && (
                  <div className="text-red-500">
                    Erreur: {authError.message}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gestion d'erreur d'authentification
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Erreur d'authentification
              </h3>
              <p className="text-gray-600 mt-2">
                {authError.message || "Une erreur s'est produite"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
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

  // Protection d'accès si non authentifié
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Users className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Connexion requise
              </h3>
              <p className="text-gray-600 mt-2">
                Vous devez être connecté pour accéder aux projets
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => router.push("/auth/signin")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Se connecter
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Affichage pendant le chargement du store (pas d'appel API séparé)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardHeader>
          </Card>

          {/* Content skeleton */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Gestion d'erreur du store (pas d'appel API séparé)
  if (error || !projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || "Projet non trouvé"}
            </h3>
            <p className="text-gray-600 mb-6">
              Le projet demandé n'existe pas ou vous n'avez pas les permissions
              pour y accéder.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => router.push("/projects")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux projets
              </Button>
              <Button variant="outline" onClick={handleRefresh}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Calcul des icônes basé sur les données du projet
  const StatusIcon = getStatusIcon(projectData.status);
  const VisibilityIcon = getVisibilityIcon(projectData.visibility);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* En-tête du projet avec design moderne */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/projects")}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Projets
                  </Button>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    {projectData.name}
                  </h1>
                  <Badge className="font-mono text-xs px-2 py-1">
                    {projectData.key}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <StatusIcon className="h-4 w-4" />
                    <Badge
                      className={`${getStatusColor(
                        projectData.status
                      )} text-xs`}
                    >
                      {projectData.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <VisibilityIcon className="h-4 w-4" />
                    <span className="capitalize">
                      {projectData.visibility.toLowerCase()}
                    </span>
                  </div>

                  {/* ✅ CORRECTION: Affichage conditionnel des membres */}
                  {projectData.members && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{projectData.members.length} membre(s)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <Settings className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Navigation du projet */}
        <ProjectNav projectId={projectData.id} />

        {/* Contenu principal responsive */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description du projet */}
            {projectData.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {projectData.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ✅ CORRECTION: Statistiques rapides avec affichage conditionnel */}
            {projectData._count && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Aperçu des éléments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <Target className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-blue-900">
                        {projectData._count.initiatives}
                      </div>
                      <div className="text-xs text-blue-600">Initiatives</div>
                    </div>

                    <div className="text-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <Layers className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-green-900">
                        {projectData._count.features}
                      </div>
                      <div className="text-xs text-green-600">Features</div>
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                      <CheckSquare className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-purple-900">
                        {projectData._count.sprints}
                      </div>
                      <div className="text-xs text-purple-600">Sprints</div>
                    </div>

                    <div className="text-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                      <FileText className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-orange-900">
                        {projectData._count.files}
                      </div>
                      <div className="text-xs text-orange-600">Fichiers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ CORRECTION: Initiatives récentes avec affichage conditionnel */}
            {projectData.initiatives && projectData.initiatives.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Initiatives récentes
                    </CardTitle>
                    <Link href={`/projects/${projectData.id}/initiatives`}>
                      <Button variant="outline" size="sm">
                        Voir tout
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectData.initiatives.slice(0, 3).map((initiative) => (
                      <div
                        key={initiative.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {initiative.name}
                          </h4>
                          {initiative.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {initiative.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {initiative.priority}
                          </Badge>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {initiative.progress}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${initiative.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ AJOUT: Message informatif si aucune donnée étendue */}
            {(!projectData._count || !projectData.initiatives) && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <Info className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Données de base uniquement
                      </h3>
                      <p className="text-gray-600">
                        Les informations détaillées (statistiques, initiatives,
                        équipe) seront affichées lors du prochain chargement
                        complet.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleRefresh}>
                      <Settings className="h-4 w-4 mr-2" />
                      Charger les détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale responsive */}
          <div className="space-y-6">
            {/* Planning avec informations temporelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Date de début:
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(projectData.startDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Date de fin:
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(projectData.endDate)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Créé le:
                  </span>
                  <span className="text-sm text-gray-900">
                    {formatDate(projectData.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ✅ CORRECTION: Équipe avec affichage conditionnel */}
            {projectData.members && projectData.members.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Équipe ({projectData.members.length} membres)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectData.members.slice(0, 6).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {member.user.image ? (
                            <AvatarImage
                              src={member.user.image}
                              alt={member.user.name || member.user.email}
                            />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.user.name || member.user.email}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {member.role.toLowerCase().replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    ))}

                    {projectData.members.length > 6 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 text-center">
                          +{projectData.members.length - 6} autres membres
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Informations d'équipe non disponibles
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ CORRECTION: Propriétaires avec affichage conditionnel */}
            {projectData.user && projectData.user.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Propriétaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectData.user.map((owner) => (
                      <div key={owner.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {owner.image ? (
                            <AvatarImage
                              src={owner.image}
                              alt={owner.name || owner.email}
                            />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {getInitials(owner.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {owner.name || owner.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {owner.username && `@${owner.username}`}
                          </p>
                        </div>

                        {owner.isActive && (
                          <div
                            className="h-2 w-2 bg-green-500 rounded-full"
                            title="Actif"
                          ></div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Propriétaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Informations de propriété non disponibles
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
