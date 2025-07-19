// components/projects/ProjectsList.tsx
"use client";

import React from "react";
import { ProjectViewList } from "./views/ProjectViewList";
import { ProjectCard } from "./views/ProjectCard";
import { ProjectWithRelations } from "@/types/project";

export interface ProjectsListProps {
  projects: ProjectWithRelations[];
  viewMode: "list" | "card";
  onEdit: (project: ProjectWithRelations) => void;
  onRefresh: () => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  projects,
  viewMode,
  onEdit,
  onRefresh,
}) => {
  if (!Array.isArray(projects)) {
    console.error("ProjectsList: projects prop is not an array:", projects);
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-2">
          <svg
            className="h-8 w-8 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erreur de chargement des projets
        </h3>
        <p className="text-gray-600 mb-4">
          Les données des projets ne sont pas au format attendu.
        </p>
        <button
          onClick={onRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recharger
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun projet trouvé
        </h3>
        <p className="text-gray-600">
          Commencez par créer votre premier projet.
        </p>
      </div>
    );
  }

  const normalizedProjects: ProjectWithRelations[] = projects.map((project) => {
    const normalizedMembers = (project.members || []).map((member) => ({
      ...member,
      role: member.role || ("DEVELOPER" as const),
      joinedAt: member.joinedAt ? new Date(member.joinedAt) : new Date(),
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
    }));

    const normalizedOwners = (project.user || []).map((owner) => ({
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
      lastLoginAt: owner.lastLoginAt ? new Date(owner.lastLoginAt) : null,
      twoFactorEnabled: owner.twoFactorEnabled ?? false,
    }));

    return {
      ...project,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.endDate ? new Date(project.endDate) : null,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),

      user: normalizedOwners,
      members: normalizedMembers,

      _count: {
        user: project._count?.user || normalizedOwners.length,
        members: project._count?.members || normalizedMembers.length,
        initiatives: project._count?.initiatives || 0,
        features: project._count?.features || 0,
        sprints: project._count?.sprints || 0,
        files: project._count?.files || 0,
        channels: project._count?.channels || 0,
        templates: project._count?.templates || 0,
      },
    };
  });

  const activeProjects = normalizedProjects.filter(
    (project) => project.isActive
  );

  if (viewMode === "list") {
    return (
      <ProjectViewList
        projects={activeProjects}
        onEdit={onEdit}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {activeProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};
