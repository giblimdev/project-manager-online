// /app/projects/layout.tsx
"use client";

import ProjectSideBar from "@/components/layout/project/ProjectSideBar";
import React, { useState } from "react";

interface ProjectLayoutProps {
  children: React.ReactNode;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = (): void => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile uniquement */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            aria-label="Ouvrir le menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1 className="text-lg font-semibold text-gray-900">
            ProjectManager
          </h1>

          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-sm font-medium text-white">JP</span>
          </div>
        </div>
      </header>

      {/* Overlay mobile pour fermer la sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Container principal avec flexbox */}
      <div className="flex min-h-screen lg:min-h-screen">
        {/* Sidebar - MAINTENANT AVEC PLACE DANS LE DOM */}
        <aside
          className={`
            w-0 lg:w-72 xl:w-80 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? "" : ""}
          `}
        >
          {/* Sidebar mobile (fixed overlay) */}
          <div
            className={`
              fixed top-16 left-0 z-45 w-64 h-[calc(100vh-4rem)] transform transition-transform duration-300 ease-in-out lg:hidden
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
          >
            <div className="h-full bg-white shadow-lg border-r border-gray-200">
              {/* Header sidebar mobile avec bouton fermer */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Navigation
                </h2>
                <button
                  onClick={closeSidebar}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  aria-label="Fermer le menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Contenu de la sidebar mobile */}
              <div className="h-full overflow-y-auto pb-20">
                <ProjectSideBar onNavigate={closeSidebar} />
              </div>
            </div>
          </div>

          {/* Sidebar desktop (dans le flux du DOM) */}
          <div className="hidden lg:block h-screen bg-white shadow-lg border-r border-gray-200 sticky top-0">
            {/* Header sidebar desktop */}
            <div className="flex items-center justify-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-xl font-bold text-white">PM</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  ProjectManager
                </h2>
                <p className="text-sm text-gray-500 mt-1">Gestion de projets</p>
              </div>
            </div>

            {/* Contenu de la sidebar desktop */}
            <div className="h-full overflow-y-auto pb-6">
              <ProjectSideBar onNavigate={() => {}} />
            </div>
          </div>
        </aside>

        {/* Contenu principal - MAINTENANT AVEC ESPACE RÉSERVÉ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:min-h-screen">
          {/* Zone de contenu principal */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProjectLayout;
