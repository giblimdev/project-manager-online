// app/projects/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Building, AlertCircle } from "lucide-react";
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
import { ProjectWithRelations } from "@/types/project";

type ViewMode = "list" | "card";

export default function ProjectsPage() {
  const { data: session, isPending } = useSession();
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    ProjectWithRelations[]
  >([]);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] =
    useState<ProjectWithRelations | null>(null);
  const [filterValue, setFilterValue] = useState("");
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

  const fetchProjects = async () => {
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
            })),

            members: (project.members || []).map((member: any) => ({
              id: member.id || "",
              role: member.role || "DEVELOPER",
              joinedAt: member.joinedAt
                ? new Date(member.joinedAt)
                : new Date(),
              isActive: member.isActive ?? true,
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
              },
            })),

            _count: {
              user: project._count?.user || project.user?.length || 0,
              members: project._count?.members || project.members?.length || 0,
              initiatives: project._count?.initiatives || 0,
              features: project._count?.features || 0,
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

  const handleFormSuccess = () => {
    setIsAddModalOpen(false);
    setEditingProject(null);
    fetchProjects();
    toast.success(
      editingProject ? "Projet modifié avec succès" : "Projet créé avec succès"
    );
  };

  const handleEdit = (project: ProjectWithRelations) => {
    setEditingProject(project);
    setIsAddModalOpen(true);
  };

  const getUserDisplayName = (user: {
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const getProjectStats = () => {
    if (!Array.isArray(filteredProjects))
      return { total: 0, active: 0, completed: 0 };

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

  const stats = getProjectStats();

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des projets...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Projets</h1>
                  <p className="text-sm text-gray-600">
                    Gérez vos projets et suivez leur progression
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {stats.total} projet{stats.total !== 1 ? "s" : ""}
                </Badge>
                {stats.active > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-1 bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    {stats.active} actif{stats.active !== 1 ? "s" : ""}
                  </Badge>
                )}
                {stats.completed > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    {stats.completed} terminé{stats.completed !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            {session?.user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span>Connecté en tant que</span>
                </div>
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                      {session.user.name?.charAt(0) ||
                        session.user.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 mb-8">
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
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 px-6"
                  onClick={() => setEditingProject(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0">
                <DialogHeader className="p-8 pb-0">
                  <DialogTitle className="text-3xl font-bold">
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
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          {filteredProjects.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Building className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                {filterValue
                  ? "Aucun projet ne correspond à votre recherche."
                  : "Commencez par créer votre premier projet."}
              </p>
              {!filterValue && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un projet
                </Button>
              )}
            </div>
          ) : (
            <ProjectsList
              projects={filteredProjects}
              viewMode={viewMode}
              onEdit={handleEdit}
              onRefresh={fetchProjects}
            />
          )}
        </div>
      </div>
    </div>
  );
}
