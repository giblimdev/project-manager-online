// app/welcome/page.tsx
"use client";

import { useSession, signOut } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Mail,
  User,
  Loader2,
  FolderPlus,
  Users,
  BarChart3,
  CheckSquare,
  Zap,
  Target,
  GitBranch,
  Calendar,
  Settings,
} from "lucide-react";

export default function WelcomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/auth/signin");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const { user } = session;

  // Actions rapides avec IDs uniques et routes spécifiques
  const quickActions = [
    {
      id: "new-project",
      title: "Nouveau Projet",
      description: "Créer un nouveau projet",
      icon: FolderPlus,
      href: "/projects/new",
      color: "bg-blue-500 hover:bg-blue-600",
      variant: "default" as const,
    },
    {
      id: "new-initiative",
      title: "Créer une Initiative",
      description: "Lancer une nouvelle initiative",
      icon: Target,
      href: "/initiatives/new",
      color: "bg-green-500 hover:bg-green-600",
      variant: "default" as const,
    },
    {
      id: "new-task",
      title: "Nouvelle Tâche",
      description: "Ajouter une tâche rapide",
      icon: CheckSquare,
      href: "/tasks/new",
      color: "bg-purple-500 hover:bg-purple-600",
      variant: "default" as const,
    },
    {
      id: "sprint-planning",
      title: "Sprint Planning",
      description: "Planifier un nouveau sprint",
      icon: Calendar,
      href: "/sprints/new",
      color: "bg-orange-500 hover:bg-orange-600",
      variant: "default" as const,
    },
  ];

  const navigationCards = [
    {
      id: "projects",
      title: "Mes Projets",
      description: "Gérer vos projets en cours",
      icon: FolderPlus,
      href: "/projects",
      count: "3 actifs",
    },
    {
      id: "teams",
      title: "Équipes",
      description: "Collaborer avec vos équipes",
      icon: Users,
      href: "/teams",
      count: "2 équipes",
    },
    {
      id: "tasks",
      title: "Tâches Assignées",
      description: "Vos tâches en attente",
      icon: CheckSquare,
      href: "/tasks/assigned",
      count: "8 tâches",
    },
    {
      id: "reports",
      title: "Rapports",
      description: "Analytics et statistiques",
      icon: BarChart3,
      href: "/services",
      count: "Vue d'ensemble",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header avec déconnexion */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Project Manager
            </h1>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Message de bienvenue */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.image || ""} alt={user.name || "User"} />
                <AvatarFallback className="text-xl">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenue, {user.name}! 👋
            </h2>
            <p className="text-lg text-gray-600">
              Gérez vos projets efficacement avec votre tableau de bord
            </p>
          </div>

          {/* Actions rapides */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.id} href={action.href}>
                    <Button
                      variant="secondary"
                      className="w-full h-auto p-4 flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    >
                      <action.icon className="w-6 h-6" />
                      <div className="text-center">
                        <div className="font-medium text-sm">
                          {action.title}
                        </div>
                        <div className="text-xs opacity-80">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation principale */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navigationCards.map((card) => (
              <Link key={card.id} href={card.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <card.icon className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-2">
                      {card.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {card.count}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Informations utilisateur et session */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profil utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations du Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Membre depuis{" "}
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Email vérifié" : "Email non vérifié"}
                  </Badge>
                </div>
                <Link href="/profile">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Modifier le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Activité récente / Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Tâches complétées
                    </span>
                    <Badge>12 cette semaine</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Projets actifs
                    </span>
                    <Badge variant="secondary">3 projets</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Heures travaillées
                    </span>
                    <Badge variant="outline">32h cette semaine</Badge>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Voir le tableau de bord complet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Call to action pour commencer */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <GitBranch className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Prêt à gérer vos projets?
                </h3>
                <p className="text-green-700 mb-4">
                  Organisez vos équipes, suivez vos tâches et livrez vos projets
                  avec succès
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/projects">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Créer un projet
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Voir le dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
