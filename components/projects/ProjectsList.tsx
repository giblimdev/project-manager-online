// components/projects/ProjectsList.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js 15 utilise next/navigation
import { ProjectWithRelations } from "@/types/project";
import { ViewMode } from "./ProjectsFilter";
import { ProjectCard } from "@/components/projects/views/ProjectCard";
import { useProjectActions } from "@/stores/useSelectedProjectStore";

interface ProjectsListProps {
  projects: ProjectWithRelations[];
  viewMode: ViewMode;
  onEdit: (project: ProjectWithRelations) => void;
  onRefresh: () => void;
  onView?: (project: ProjectWithRelations) => void;
  onDelete?: (project: ProjectWithRelations) => void;
  onManageTeam?: (project: ProjectWithRelations) => void;
  isLoading?: boolean;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  viewMode,
  onEdit,
  onRefresh,
  onView,
  onDelete,
  onManageTeam,
  isLoading = false,
}) => {
  const router = useRouter();
  const { loadProject, setLoading } = useProjectActions();

  // ✅ Handler corrigé pour cliquer sur un projet
  const handleProjectClick = async (
    project: ProjectWithRelations
  ): Promise<void> => {
    try {
      setLoading(true);

      // ✅ Charger le projet dans le store AVANT la navigation
      loadProject(project);

      // ✅ Debug pour vérifier
      console.log("Navigation vers:", `/projects/${project.id}`);
      console.log("Projet chargé dans le store:", project);

      // ✅ Naviguer vers la page de détail
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error("Erreur lors de la navigation:", error);
      setLoading(false);
    }
  };

  const handleViewProject = async (
    project: ProjectWithRelations
  ): Promise<void> => {
    if (onView) {
      onView(project);
    } else {
      await handleProjectClick(project);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-600">Chargement des projets...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="text-gray-500">Aucun projet trouvé</p>
      </div>
    );
  }

  const getGridClass = (): string => {
    switch (viewMode) {
      case "list":
        return "flex flex-col gap-3 sm:gap-4";
      case "card":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";
      case "grid":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";
      default:
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";
    }
  };

  return (
    <div className={getGridClass()}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onRefresh={onRefresh}
          onView={handleViewProject}
          onDelete={onDelete}
          onManageTeam={onManageTeam}
          onProjectClick={handleProjectClick}
        />
      ))}
    </div>
  );
};

export default ProjectsList;
