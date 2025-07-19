// app/projects/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Users,
  Settings,
  Globe,
  Lock,
  Building,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  BarChart3,
  FileText,
  MessageSquare,
  Folder,
  Target,
  Zap,
  GitBranch,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Project {
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
  settings: any;
  metadata: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  initiatives: Array<{
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    startDate: Date | null;
    endDate: Date | null;
  }>;
  features: Array<{
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    storyPoints: number | null;
  }>;
  sprints: Array<{
    id: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    status: string;
    capacity: number | null;
    velocity: number | null;
  }>;
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    uploader: {
      name: string | null;
      email: string;
    };
  }>;
  channels: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    isPrivate: boolean;
    _count: {
      messages: number;
      members: number;
    };
  }>;
  _count: {
    initiatives: number;
    features: number;
    sprints: number;
    files: number;
    channels: number;
    templates: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Projet non trouvé");
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      toast.error("Impossible de charger le projet");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Actif",
          icon: <TrendingUp className="h-4 w-4" />,
        };
      case "COMPLETED":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Terminé",
          icon: <Clock className="h-4 w-4" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Annulé",
          icon: <AlertCircle className="h-4 w-4" />,
        };
      case "ON_HOLD":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "En pause",
          icon: <Clock className="h-4 w-4" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: status,
          icon: <AlertCircle className="h-4 w-4" />,
        };
    }
  };

  const getVisibilityConfig = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return {
          icon: <Globe className="h-4 w-4" />,
          label: "Public",
          color: "text-blue-600",
        };
      case "PRIVATE":
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Privé",
          color: "text-gray-600",
        };
      case "INTERNAL":
        return {
          icon: <Building className="h-4 w-4" />,
          label: "Interne",
          color: "text-orange-600",
        };
      default:
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Privé",
          color: "text-gray-600",
        };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateOverallProgress = () => {
    if (!project || project.initiatives.length === 0) return 0;
    const totalProgress = project.initiatives.reduce(
      (sum, initiative) => sum + initiative.progress,
      0
    );
    return Math.round(totalProgress / project.initiatives.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || "Projet non trouvé"}
          </h1>
          <p className="text-gray-600 mb-6">
            Le projet demandé n'existe pas ou vous n'avez pas les permissions
            pour y accéder.
          </p>
          <Link href="/projects">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux projets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(project.status);
  const visibilityConfig = getVisibilityConfig(project.visibility);
  const overallProgress = calculateOverallProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <Link
                href="/projects"
                className="hover:text-blue-600 transition-colors"
              >
                Projets
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{project.name}</span>
            </div>

            {/* Project Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                      {project.name}
                    </h1>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono text-sm">
                        {project.key}
                      </Badge>
                      <Badge
                        className={`${statusConfig.color} flex items-center gap-1`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                      <div
                        className={`flex items-center space-x-1 ${visibilityConfig.color}`}
                      >
                        {visibilityConfig.icon}
                        <span className="text-sm">
                          {visibilityConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {project.description && (
                  <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle initiative
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white border shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger
              value="initiatives"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Initiatives</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="sprints" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Sprints</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Fichiers</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Équipe</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">
                        Initiatives
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {project._count.initiatives}
                      </p>
                    </div>
                    <Target className="h-12 w-12 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">
                        Features
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {project._count.features}
                      </p>
                    </div>
                    <Zap className="h-12 w-12 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">
                        Sprints
                      </p>
                      <p className="text-3xl font-bold text-purple-900">
                        {project._count.sprints}
                      </p>
                    </div>
                    <GitBranch className="h-12 w-12 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">
                        Fichiers
                      </p>
                      <p className="text-3xl font-bold text-orange-900">
                        {project._count.files}
                      </p>
                    </div>
                    <FileText className="h-12 w-12 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Progression globale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progression</span>
                      <span className="text-sm text-gray-500">
                        {overallProgress}%
                      </span>
                    </div>
                    <Progress value={overallProgress} className="h-3" />
                    <p className="text-sm text-gray-600">
                      Basé sur la progression des {project.initiatives.length}{" "}
                      initiatives
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Chronologie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Date de début
                        </span>
                        <span className="text-sm text-gray-600">
                          {format(new Date(project.startDate), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Date de fin prévue
                        </span>
                        <span className="text-sm text-gray-600">
                          {format(new Date(project.endDate), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    )}
                    {project.startDate && project.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Durée</span>
                        <span className="text-sm text-gray-600">
                          {Math.ceil(
                            (new Date(project.endDate).getTime() -
                              new Date(project.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          jours
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Initiatives */}
            {project.initiatives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Initiatives récentes
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("initiatives")}
                    >
                      Voir tout
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.initiatives.slice(0, 3).map((initiative) => (
                      <div
                        key={initiative.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {initiative.name}
                          </h4>
                          {initiative.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {initiative.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              className={getPriorityColor(initiative.priority)}
                              variant="outline"
                            >
                              {initiative.priority}
                            </Badge>
                            <Badge variant="outline">{initiative.status}</Badge>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {initiative.progress}%
                            </span>
                            <Progress
                              value={initiative.progress}
                              className="w-20 h-2 mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Initiatives Tab */}
          <TabsContent value="initiatives" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Initiatives</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle initiative
              </Button>
            </div>

            {project.initiatives.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune initiative
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Créez votre première initiative pour structurer votre
                    projet.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une initiative
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {project.initiatives.map((initiative) => (
                  <Card
                    key={initiative.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {initiative.name}
                          </CardTitle>
                          {initiative.description && (
                            <p className="text-gray-600 mt-2">
                              {initiative.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={getPriorityColor(initiative.priority)}
                          variant="outline"
                        >
                          {initiative.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Progression
                            </span>
                            <span className="text-sm text-gray-500">
                              {initiative.progress}%
                            </span>
                          </div>
                          <Progress
                            value={initiative.progress}
                            className="h-2"
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline">{initiative.status}</Badge>
                          {initiative.startDate && initiative.endDate && (
                            <span className="text-gray-500">
                              {format(new Date(initiative.startDate), "dd/MM", {
                                locale: fr,
                              })}{" "}
                              -{" "}
                              {format(
                                new Date(initiative.endDate),
                                "dd/MM/yyyy",
                                { locale: fr }
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Features</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle feature
              </Button>
            </div>

            {project.features.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune feature
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez des fonctionnalités à développer.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une feature
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {project.features.map((feature) => (
                  <Card
                    key={feature.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {feature.name}
                            </h3>
                            <Badge
                              className={getPriorityColor(feature.priority)}
                              variant="outline"
                            >
                              {feature.priority}
                            </Badge>
                            <Badge variant="outline">{feature.status}</Badge>
                            {feature.storyPoints && (
                              <Badge variant="secondary">
                                {feature.storyPoints} pts
                              </Badge>
                            )}
                          </div>
                          {feature.description && (
                            <p className="text-gray-600 text-sm">
                              {feature.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-right">
                            <span className="text-sm font-medium">
                              {feature.progress}%
                            </span>
                            <Progress
                              value={feature.progress}
                              className="w-24 h-2 mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sprints Tab */}
          <TabsContent value="sprints" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Sprints</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau sprint
              </Button>
            </div>

            {project.sprints.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun sprint
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Organisez votre travail en sprints.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un sprint
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {project.sprints.map((sprint) => (
                  <Card
                    key={sprint.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {sprint.name}
                            </h3>
                            <Badge variant="outline">{sprint.status}</Badge>
                          </div>
                          {sprint.goal && (
                            <p className="text-gray-600 text-sm mb-3">
                              {sprint.goal}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              {format(new Date(sprint.startDate), "dd MMMM", {
                                locale: fr,
                              })}{" "}
                              -{" "}
                              {format(
                                new Date(sprint.endDate),
                                "dd MMMM yyyy",
                                { locale: fr }
                              )}
                            </span>
                            {sprint.capacity && (
                              <span>Capacité: {sprint.capacity}h</span>
                            )}
                            {sprint.velocity && (
                              <span>Vélocité: {sprint.velocity}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Fichiers</h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un fichier
              </Button>
            </div>

            {project.files.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun fichier
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez des documents, images ou autres fichiers au projet.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un fichier
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.files.map((file) => (
                  <Card
                    key={file.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {file.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB •{" "}
                            {file.uploader.name || file.uploader.email}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(file.createdAt), "dd/MM/yyyy", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Équipe du projet
              </h2>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un membre
              </Button>
            </div>

            {/* Project Owners */}
            {project.user.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Propriétaires du projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.user.map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={owner.image || undefined} />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {owner.name?.charAt(0) ||
                              owner.email?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">
                            {owner.name || owner.email}
                          </h4>
                          <p className="text-sm text-gray-500">Propriétaire</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membres de l'équipe ({project.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucun membre
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Invitez des membres à rejoindre le projet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback className="bg-green-500 text-white">
                            {member.user.name?.charAt(0) ||
                              member.user.email?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">
                            {member.user.name || member.user.email}
                          </h4>
                          <p className="text-sm text-gray-500">{member.role}</p>
                          <p className="text-xs text-gray-400">
                            Rejoint le{" "}
                            {format(new Date(member.joinedAt), "dd/MM/yyyy", {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
