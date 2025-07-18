// /components/layout/project/ProjectSideBar.tsx
"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import {
  FolderIcon,
  BarChart3Icon,
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  PlusIcon,
  HomeIcon,
  FileTextIcon,
  TrendingUpIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

export default function ProjectSideBar() {
  const pathname = usePathname();

  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/projects",
      icon: HomeIcon,
      description: "Vue d'ensemble des projets",
    },
    {
      name: "Items",
      href: "/projects/items",
      icon: FolderIcon,
      badge: "",
      description: "Tâches et éléments",
    },

    {
      name: "Équipe",
      href: "/projects/team",
      icon: UsersIcon,
      badge: "",
      description: "Membres de l'équipe",
    },
    {
      name: "Rapports",
      href: "/projects/reports",
      icon: FileTextIcon,
      description: "Rapports et documents",
    },
    {
      name: "Statistiques",
      href: "/projects/analytics",
      icon: BarChart3Icon,
      description: "Analyses et métriques",
    },
    {
      name: "Paramètres",
      href: "/projects/settings",
      icon: SettingsIcon,
      description: "Configuration",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/projects") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUpIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ProjectHub</h2>
            <p className="text-sm text-gray-500">Gestion de projets</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navigation
          </h3>
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        active
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          active
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {active && item.description && (
                    <p className="text-xs text-gray-500 mt-1 ml-8">
                      {item.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              John Doe
            </p>
            <p className="text-xs text-gray-500 truncate">
              {"john.doe@example.com"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
