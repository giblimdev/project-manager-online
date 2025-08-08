// app/projects/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Building,
  AlertCircle,
  Target,
  Layers,
  FileText,
  Users,
  Calendar,
  Folder,
  TrendingUp,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Activity,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectsDisplayView } from "@/components/projects/ProjectsDisplayView";
import { ProjectsFilter } from "@/components/projects/ProjectsFilter";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { ProjectsForm } from "@/components/projects/ProjectsForm";
import { toast } from "sonner";
import {
  ProjectWithRelations,
  ProjectStats,
  WorkItemStats,
} from "@/types/project";

type ViewMode = "list" | "card" | "grid";

export default function ProjectsPage() {
  const { data: session, isPending } = useSession();
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    ProjectWithRelations[]
  >([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] =
    useState<ProjectWithRelations | null>(null);
  const [filterValue, setFilterValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (filterValue && Array.isArray(projects)) {
      const filtered = projects.filter((project) => {
        const searchTerm = filterValue.toLowerCase();

        const matchesBasicFields =
          project.name.toLowerCase().includes(searchTerm) ||
          project.description?.toLowerCase().includes(searchTerm) ||
          project.key.toLowerCase().includes(searchTerm);

        const matchesOwners = project.user.some(
          (owner) =>
            owner.name?.toLowerCase().includes(searchTerm) ||
            owner.email.toLowerCase().includes(searchTerm) ||
            owner.firstName?.toLowerCase().includes(searchTerm) ||
            owner.lastName?.toLowerCase().includes(searchTerm) ||
            owner.username?.toLowerCase().includes(searchTerm)
        );

        const matchesMembers = project.members.some(
          (member) =>
            member.user.name?.toLowerCase().includes(searchTerm) ||
            member.user.email.toLowerCase().includes(searchTerm) ||
            member.user.firstName?.toLowerCase().includes(searchTerm) ||
            member.user.lastName?.toLowerCase().includes(searchTerm)
        );

        return matchesBasicFields || matchesOwners || matchesMembers;
      });
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [projects, filterValue]);

  const fetchProjects = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data && typeof data === "object") {
        let projectsData: any[] = [];

        if (data.projects && Array.isArray(data.projects)) {
          projectsData = data.projects;
        } else if (Array.isArray(data)) {
          projectsData = data;
        } else {
          console.error("Structure de données inattendue:", data);
          throw new Error("Format de données inattendu reçu du serveur");
        }

        const normalizedProjects: ProjectWithRelations[] = projectsData.map(
          (project) => ({
            ...project,
            user: (project.user || []).map((owner: any) => ({
              id: owner.id || "",
              name: owner.name || null,
              email: owner.email || "",
              emailVerified: owner.emailVerified ?? false,
              image: owner.image || null,
              username: owner.username || null,
              firstName: owner.firstName || null,
              lastName: owner.lastName || null,
              bio: owner.bio || null,
              timezone: owner.timezone || "UTC",
              preferences: owner.preferences || {},
              isActive: owner.isActive ?? true,
              lastLoginAt: owner.lastLoginAt
                ? new Date(owner.lastLoginAt)
                : null,
              twoFactorEnabled: owner.twoFactorEnabled ?? false,
              createdAt: new Date(owner.createdAt || Date.now()),
              updatedAt: new Date(owner.updatedAt || Date.now()),
            })),

            members: (project.members || []).map((member: any) => ({
              id: member.id || "",
              role: member.role || "DEVELOPER",
              joinedAt: member.joinedAt
                ? new Date(member.joinedAt)
                : new Date(),
              isActive: member.isActive ?? true,
              projectId: member.projectId || project.id,
              userId: member.userId || member.user?.id,
              user: {
                id: member.user?.id || "",
                name: member.user?.name || null,
                email: member.user?.email || "",
                emailVerified: member.user?.emailVerified ?? false,
                image: member.user?.image || null,
                username: member.user?.username || null,
                firstName: member.user?.firstName || null,
                lastName: member.user?.lastName || null,
                bio: member.user?.bio || null,
                timezone: member.user?.timezone || "UTC",
                preferences: member.user?.preferences || {},
                isActive: member.user?.isActive ?? true,
                lastLoginAt: member.user?.lastLoginAt
                  ? new Date(member.user.lastLoginAt)
                  : null,
                twoFactorEnabled: member.user?.twoFactorEnabled ?? false,
                createdAt: new Date(member.user?.createdAt || Date.now()),
                updatedAt: new Date(member.user?.updatedAt || Date.now()),
              },
            })),

            _count: {
              user: project._count?.user || project.user?.length || 0,
              members: project._count?.members || project.members?.length || 0,
              initiatives: project._count?.initiatives || 0,
              epics: project._count?.epics || 0,
              features: project._count?.features || 0,
              userStories: project._count?.userStories || 0,
              tasks: project._count?.tasks || 0,
              sprints: project._count?.sprints || 0,
              files: project._count?.files || 0,
              channels: project._count?.channels || 0,
              templates: project._count?.templates || 0,
            },

            startDate: project.startDate ? new Date(project.startDate) : null,
            endDate: project.endDate ? new Date(project.endDate) : null,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          })
        );

        setProjects(normalizedProjects);
        setFilteredProjects(normalizedProjects);
      } else {
        throw new Error("Données invalides reçues du serveur");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      setProjects([]);
      setFilteredProjects([]);
      toast.error("Impossible de charger les projets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = (): void => {
    setIsAddModalOpen(false);
    setEditingProject(null);
    fetchProjects();
    toast.success(
      editingProject ? "Projet modifié avec succès" : "Projet créé avec succès"
    );
  };

  const handleEdit = (project: ProjectWithRelations): void => {
    setEditingProject(project);
    setIsAddModalOpen(true);
  };

  const getUserDisplayName = (user: {
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const getProjectStats = (): ProjectStats => {
    if (!Array.isArray(filteredProjects))
      return { total: 0, active: 0, completed: 0, onHold: 0, cancelled: 0 };

    return {
      total: filteredProjects.length,
      active: filteredProjects.filter(
        (p) => p.status === "ACTIVE" && p.isActive
      ).length,
      completed: filteredProjects.filter((p) => p.status === "COMPLETED")
        .length,
      onHold: filteredProjects.filter((p) => p.status === "ON_HOLD").length,
      cancelled: filteredProjects.filter((p) => p.status === "CANCELLED")
        .length,
    };
  };

  const getGlobalWorkItemStats = (): WorkItemStats => {
    if (!Array.isArray(filteredProjects)) {
      return {
        initiatives: 0,
        epics: 0,
        features: 0,
        userStories: 0,
        tasks: 0,
        sprints: 0,
        files: 0,
      };
    }

    return filteredProjects.reduce(
      (acc, project) => ({
        initiatives: acc.initiatives + (project._count?.initiatives || 0),
        epics: acc.epics + (project._count?.epics || 0),
        features: acc.features + (project._count?.features || 0),
        userStories: acc.userStories + (project._count?.userStories || 0),
        tasks: acc.tasks + (project._count?.tasks || 0),
        sprints: acc.sprints + (project._count?.sprints || 0),
        files: acc.files + (project._count?.files || 0),
      }),
      {
        initiatives: 0,
        epics: 0,
        features: 0,
        userStories: 0,
        tasks: 0,
        sprints: 0,
        files: 0,
      }
    );
  };

  const stats = getProjectStats();
  const workItemStats = getGlobalWorkItemStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Activity className="w-4 h-4 text-green-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case "ON_HOLD":
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 border-green-200";
      case "COMPLETED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ON_HOLD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">
            Chargement de vos projets...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Analyse des données en cours
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button
              onClick={fetchProjects}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Réessayer
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Actualiser la page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header avec informations globales */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-6">
            <div className="flex items-center space-x-4 mb-6 lg:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard Projets
                  </h1>
                  <p className="text-sm text-gray-600">
                    Gérez vos projets agiles et suivez leur progression
                  </p>
                </div>
              </div>
            </div>

            {session?.user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span>Connecté en tant que</span>
                </div>
                <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl px-4 py-2 border border-gray-200/50">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                      {session.user.name?.charAt(0) ||
                        session.user.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">
                      {getUserDisplayName({
                        name: session.user.name,
                        email: session.user.email,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session.user.email}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats des projets */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Projets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {stats.total}
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge
                  className={`text-xs px-2 py-0.5 ${getStatusColor("ACTIVE")}`}
                >
                  {stats.active} actifs
                </Badge>
                {stats.completed > 0 && (
                  <Badge
                    className={`text-xs px-2 py-0.5 ${getStatusColor(
                      "COMPLETED"
                    )}`}
                  >
                    {stats.completed} terminés
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats des initiatives */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Initiatives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-2">
                {workItemStats.initiatives}
              </div>
              <p className="text-xs text-purple-600">
                Objectifs stratégiques avec ROI
              </p>
            </CardContent>
          </Card>

          {/* Stats des epics/features */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Epics & Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-2">
                {workItemStats.epics + workItemStats.features}
              </div>
              <div className="flex gap-1">
                <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200">
                  {workItemStats.epics} epics
                </Badge>
                <Badge className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 border-emerald-200">
                  {workItemStats.features} features
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Stats des user stories/tasks */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Stories & Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 mb-2">
                {workItemStats.userStories + workItemStats.tasks}
              </div>
              <div className="flex gap-1">
                <Badge className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 border-orange-200">
                  {workItemStats.userStories} stories
                </Badge>
                <Badge className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 border-amber-200">
                  {workItemStats.tasks} tasks
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-indigo-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Sprints Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-900 mb-2">
                {workItemStats.sprints}
              </div>
              <p className="text-xs text-indigo-600">En cours d'exécution</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Fichiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {workItemStats.files}
              </div>
              <p className="text-xs text-gray-600">Documents partagés</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-teal-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Productivité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-900 mb-2">
                {projects.length > 0
                  ? Math.round((stats.active / stats.total) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-teal-600">Projets actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Contrôles et filtres */}
        <Card className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1 max-w-md">
                  <ProjectsFilter
                    value={filterValue}
                    onChange={setFilterValue}
                    placeholder="Rechercher par nom, description, clé, propriétaire ou membre..."
                  />
                </div>
                <ProjectsDisplayView
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>

              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-11 px-6 font-medium"
                    onClick={() => setEditingProject(null)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau projet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0">
                  <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {editingProject
                        ? "Modifier le projet"
                        : "Créer un nouveau projet"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="p-8">
                    <ProjectsForm
                      project={editingProject}
                      onSuccess={handleFormSuccess}
                      onCancel={() => {
                        setIsAddModalOpen(false);
                        setEditingProject(null);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Liste des projets */}
        <Card className="bg-white/80 backdrop-blur-xl shadow-lg border border-slate-200/60 overflow-hidden">
          {filteredProjects.length === 0 && !isLoading ? (
            <CardContent className="text-center py-16">
              <div className="text-gray-400 mb-6">
                <Building className="h-20 w-20 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {filterValue
                  ? "Aucun projet trouvé"
                  : "Commencez votre premier projet"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {filterValue
                  ? "Aucun projet ne correspond à votre recherche. Essayez avec d'autres mots-clés."
                  : "Créez votre premier projet agile et commencez à organiser vos initiatives, epics, features et user stories."}
              </p>
              {!filterValue && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Créer votre premier projet
                </Button>
              )}
            </CardContent>
          ) : (
            <ProjectsList
              projects={filteredProjects}
              viewMode={viewMode}
              onEdit={handleEdit}
              onRefresh={fetchProjects}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
