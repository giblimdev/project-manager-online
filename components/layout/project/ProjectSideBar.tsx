// /components/layout/project/ProjectSideBar.tsx
"use client";

import Link from "next/link";
import React, { useState } from "react";
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
  ChevronDownIcon,
  ChevronRightIcon,
  LogOutIcon,
  BellIcon,
  SearchIcon,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  children?: NavItem[];
}

interface ProjectSideBarProps {
  onNavigate?: () => void; // Callback pour fermer la sidebar sur mobile
}

interface ProjectInfo {
  name: string;
  type: string;
  progress: number;
  sprintCurrent: string;
  teamSize: number;
}

export default function ProjectSideBar({ onNavigate }: ProjectSideBarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "work-items",
  ]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Informations du projet actuel
  const projectInfo: ProjectInfo = {
    name: "E-commerce Platform",
    type: "Web Application",
    progress: 68,
    sprintCurrent: "Sprint 12",
    teamSize: 8,
  };

  const navigationItems: NavItem[] = [
    {
      name: "Dashboard",
      href: "/projects",
      icon: HomeIcon,
      description: "Vue d'ensemble des projets et métriques clés",
    },
    {
      name: "Sprint Actuel",
      href: "/projects/sprint",
      icon: CalendarIcon,
      badge: 15,
      description: "Sprint en cours avec tâches actives",
    },
    {
      name: "Rapports",
      href: "/projects/reports",
      icon: BarChart3Icon,
      description: "Analytics et insights IA",
    },
  ];

  const workItemsNavigation: NavItem[] = [
    {
      name: "Initiatives",
      href: "/projects/initiatives",
      icon: FolderIcon,
      badge: 3,
      description: "Objectifs business stratégiques avec ROI et budget",
    },
    {
      name: "Epics",
      href: "/projects/epics",
      icon: FolderIcon,
      badge: 12,
      description: "Ensembles de fonctionnalités liées à un domaine métier",
    },
    {
      name: "Features",
      href: "/projects/features",
      icon: FolderIcon,
      badge: 24,
      description:
        "Fonctionnalités avec critères d'acceptation et valeur business",
    },
    {
      name: "User Stories",
      href: "/projects/userStories",
      icon: FileTextIcon,
      badge: 67,
      description: "Besoins utilisateur avec estimation en story points",
    },
    {
      name: "Tasks",
      href: "/projects/tasks",
      icon: SettingsIcon,
      badge: 89,
      description: "Tâches techniques avec estimation en heures",
    },
  ];

  const teamNavigation: NavItem[] = [
    {
      name: "Équipe",
      href: "/projects/team",
      icon: UsersIcon,
      badge: projectInfo.teamSize,
      description: "Membres de l'équipe et assignations",
    },
    {
      name: "Paramètres",
      href: "/projects/settings",
      icon: SettingsIcon,
      description: "Configuration du projet",
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === "/projects") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (section: string): void => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleItemClick = (): void => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const filteredItems = (items: NavItem[]) => {
    if (!searchQuery) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderNavItems = (items: NavItem[], level: number = 0) => {
    return filteredItems(items).map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedSections.includes(item.href);

      return (
        <li key={item.name}>
          <div className="relative">
            <Link
              href={item.href}
              onClick={handleItemClick}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                level > 0 ? "ml-4 border-l-2 border-gray-100 pl-6" : ""
              } ${
                active
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  active
                    ? "text-blue-600"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
              />
              <span className="flex-1 font-medium">{item.name}</span>

              {item.badge && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full min-w-[20px] ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection(item.href);
                  }}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
              )}
            </Link>

            {/* Indicateur visuel pour l'item actif */}
            {active && (
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
            )}
          </div>

          {/* Description tooltip sur hover */}
          {active && item.description && (
            <div className="mt-2 mx-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 leading-relaxed">
                💡 {item.description}
              </p>
            </div>
          )}

          {/* Sous-navigation */}
          {hasChildren && isExpanded && (
            <ul className="mt-1 space-y-1">
              {renderNavItems(item.children!, level + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl">
      {/* Header du projet */}
      <div className="p-4 sm:p-6 border-b border-gray-200/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUpIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {projectInfo.name}
            </h2>
            <p className="text-sm text-gray-500">{projectInfo.type}</p>
          </div>
        </div>

        {/* Indicateur de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">
              {projectInfo.sprintCurrent}
            </span>
            <span className="text-blue-600 font-bold">
              {projectInfo.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${projectInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50"
          />
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto scrollbar-hide">
        {/* Navigation principale */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Navigation
          </h3>
          <ul className="space-y-1">{renderNavItems(navigationItems)}</ul>
        </div>

        {/* Éléments de travail */}
        <div>
          <div className="flex items-center justify-between mb-3 px-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Éléments de travail
            </h3>
            <button
              onClick={() => toggleSection("work-items")}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {expandedSections.includes("work-items") ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          {expandedSections.includes("work-items") && (
            <ul className="space-y-1">{renderNavItems(workItemsNavigation)}</ul>
          )}
        </div>

        {/* Équipe et paramètres */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Équipe & Paramètres
          </h3>
          <ul className="space-y-1">{renderNavItems(teamNavigation)}</ul>
        </div>
      </nav>

      {/* Footer utilisateur */}
      <div className="border-t border-gray-200/50 p-4">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-100">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">JP</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              Jean-Pierre Heurteux
            </p>
            <p className="text-xs text-gray-500 truncate">Product Owner</p>
          </div>
          <div className="flex items-center space-x-1">
            <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200">
              <BellIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white/50 transition-all duration-200">
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
