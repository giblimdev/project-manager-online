// /app/projects/layout.tsx
import ProjectSideBar from "@/components/layout/project/ProjectSideBar";
import React from "react";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="m-20">
        <ProjectSideBar />
      </div>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default ProjectLayout;
