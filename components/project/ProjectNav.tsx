// components/project/ProjectNav.tsx
"use client";

import React, { JSX, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Target,
  Layers,
  BookOpen,
  CheckSquare,
  FileText,
  Menu,
  X,
} from "lucide-react";

interface ProjectNavProps {
  projectId: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigationItems: NavItem[] = [
  {
    href: "",
    label: "Vue d'ensemble",
    icon: BarChart3,
    description: "Aperçu du projet",
  },
  {
    href: "/initiatives",
    label: "Initiatives",
    icon: Target,
    description: "Objectifs stratégiques",
  },
  {
    href: "/epics",
    label: "Epics",
    icon: Layers,
    description: "Grandes fonctionnalités",
  },
  {
    href: "/features",
    label: "Features",
    icon: BookOpen,
    description: "Fonctionnalités détaillées",
  },
  {
    href: "/userStories",
    label: "User Stories",
    icon: BookOpen,
    description: "Besoins utilisateurs",
  },
  {
    href: "/sprint",
    label: "Sprint",
    icon: CheckSquare,
    description: "Tâches opérationnelles",
  },
  {
    href: "/tasks",
    label: "Tâches",
    icon: CheckSquare,
    description: "Tâches opérationnelles",
  },
  {
    href: "/files",
    label: "Fichiers",
    icon: FileText,
    description: "Documents",
  },
];

export function ProjectNav({ projectId }: ProjectNavProps): JSX.Element {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const getNavItemPath = (href: string): string => {
    return `/projects/${projectId}${href}`;
  };

  const isActive = (href: string): boolean => {
    const fullPath = getNavItemPath(href);
    return pathname === fullPath;
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Navigation desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border">
        <nav className="flex space-x-0 overflow-x-auto">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isCurrentPage = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={getNavItemPath(item.href)}
                className={cn(
                  "flex items-center space-x-3 py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 flex-1 justify-center min-w-0",
                  isCurrentPage
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                  index === 0 ? "rounded-tl-lg" : "",
                  index === navigationItems.length - 1 ? "rounded-tr-lg" : ""
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Navigation tablet */}
      <div className="hidden sm:block lg:hidden bg-white rounded-lg shadow-sm border">
        <nav className="flex space-x-0 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isCurrentPage = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={getNavItemPath(item.href)}
                className={cn(
                  "flex flex-col items-center space-y-1 py-3 px-3 border-b-2 font-medium text-xs whitespace-nowrap transition-all duration-200 min-w-[80px]",
                  isCurrentPage
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Navigation mobile */}
      <div className="sm:hidden">
        {/* Bouton menu mobile */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Page active affichée */}
          <div className="mt-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isCurrentPage = isActive(item.href);

              if (isCurrentPage) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center space-x-2 text-blue-600"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Menu déroulant mobile */}
        {isMobileMenuOpen && (
          <div className="mt-2 bg-white rounded-lg shadow-sm border overflow-hidden">
            <nav className="divide-y divide-gray-100">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isCurrentPage = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={getNavItemPath(item.href)}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center space-x-3 p-4 transition-colors",
                      isCurrentPage
                        ? "bg-blue-50 text-blue-600 border-r-4 border-blue-500"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
