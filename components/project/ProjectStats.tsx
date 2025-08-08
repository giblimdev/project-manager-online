// components/project/ProjectStats.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  Layers,
  Zap,
  BookOpen,
  GitBranch,
  CheckSquare,
  FileText,
} from "lucide-react";
import { JSX } from "react/jsx-runtime";

interface ProjectCount {
  initiatives: number;
  epics: number;
  features: number;
  userStories: number;
  sprints: number;
  tasks: number;
  files: number;
  channels?: number;
  templates?: number;
}

interface ProjectStatsProps {
  count: ProjectCount;
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

export function ProjectStats({ count }: ProjectStatsProps): JSX.Element {
  const stats: StatItem[] = [
    {
      label: "Initiatives",
      value: count.initiatives,
      icon: Target,
      color: "blue",
      description: "Objectifs stratégiques",
    },
    {
      label: "Epics",
      value: count.epics,
      icon: Layers,
      color: "indigo",
      description: "Grandes fonctionnalités",
    },
    {
      label: "Features",
      value: count.features,
      icon: Zap,
      color: "green",
      description: "Fonctionnalités détaillées",
    },
    {
      label: "User Stories",
      value: count.userStories,
      icon: BookOpen,
      color: "cyan",
      description: "Besoins utilisateurs",
    },
    {
      label: "Sprints",
      value: count.sprints,
      icon: GitBranch,
      color: "purple",
      description: "Itérations de développement",
    },
    {
      label: "Tâches",
      value: count.tasks,
      icon: CheckSquare,
      color: "rose",
      description: "Tâches opérationnelles",
    },
    {
      label: "Fichiers",
      value: count.files,
      icon: FileText,
      color: "orange",
      description: "Documents et ressources",
    },
  ];

  const getColorClasses = (
    color: string
  ): {
    border: string;
    bg: string;
    text: string;
    textDark: string;
    icon: string;
    iconBg: string;
  } => {
    switch (color) {
      case "blue":
        return {
          border: "border-blue-200",
          bg: "bg-blue-50/30",
          text: "text-blue-600",
          textDark: "text-blue-900",
          icon: "text-blue-500",
          iconBg: "bg-blue-100",
        };
      case "indigo":
        return {
          border: "border-indigo-200",
          bg: "bg-indigo-50/30",
          text: "text-indigo-600",
          textDark: "text-indigo-900",
          icon: "text-indigo-500",
          iconBg: "bg-indigo-100",
        };
      case "green":
        return {
          border: "border-green-200",
          bg: "bg-green-50/30",
          text: "text-green-600",
          textDark: "text-green-900",
          icon: "text-green-500",
          iconBg: "bg-green-100",
        };
      case "cyan":
        return {
          border: "border-cyan-200",
          bg: "bg-cyan-50/30",
          text: "text-cyan-600",
          textDark: "text-cyan-900",
          icon: "text-cyan-500",
          iconBg: "bg-cyan-100",
        };
      case "purple":
        return {
          border: "border-purple-200",
          bg: "bg-purple-50/30",
          text: "text-purple-600",
          textDark: "text-purple-900",
          icon: "text-purple-500",
          iconBg: "bg-purple-100",
        };
      case "rose":
        return {
          border: "border-rose-200",
          bg: "bg-rose-50/30",
          text: "text-rose-600",
          textDark: "text-rose-900",
          icon: "text-rose-500",
          iconBg: "bg-rose-100",
        };
      case "orange":
        return {
          border: "border-orange-200",
          bg: "bg-orange-50/30",
          text: "text-orange-600",
          textDark: "text-orange-900",
          icon: "text-orange-500",
          iconBg: "bg-orange-100",
        };
      default:
        return {
          border: "border-gray-200",
          bg: "bg-gray-50/30",
          text: "text-gray-600",
          textDark: "text-gray-900",
          icon: "text-gray-500",
          iconBg: "bg-gray-100",
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Statistiques du projet
        </h2>
        <p className="text-sm text-gray-600 mt-1 sm:mt-0">
          Vue d'ensemble des éléments du projet
        </p>
      </div>

      {/* Grille responsive des statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color);
          const IconComponent = stat.icon;

          return (
            <Card
              key={stat.label}
              className={`
                ${colors.border} ${colors.bg} 
                hover:shadow-lg transition-all duration-200 
                hover:scale-105 cursor-pointer group
                min-h-[120px] sm:min-h-[140px]
              `}
            >
              <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`${colors.text} text-xs sm:text-sm font-medium mb-1 truncate`}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={`text-2xl sm:text-3xl font-bold ${colors.textDark} leading-none`}
                    >
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`
                    ${colors.iconBg} p-2 rounded-lg 
                    group-hover:scale-110 transition-transform duration-200
                    flex-shrink-0 ml-2
                  `}
                  >
                    <IconComponent
                      className={`h-6 w-6 sm:h-8 sm:w-8 ${colors.icon}`}
                    />
                  </div>
                </div>

                {/* Description cachée sur mobile, visible sur desktop */}
                <p
                  className={`
                  ${colors.text} text-xs 
                  hidden lg:block opacity-75 
                  group-hover:opacity-100 transition-opacity duration-200
                  mt-auto
                `}
                >
                  {stat.description}
                </p>

                {/* Indicateur de progression pour certaines métriques */}
                {(stat.label === "Tâches" || stat.label === "User Stories") &&
                  stat.value > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className={colors.text}>Progression</span>
                        <span className={`${colors.textDark} font-medium`}>
                          {Math.round(Math.random() * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.icon.replace(
                            "text-",
                            "bg-"
                          )} transition-all duration-500`}
                          style={{
                            width: `${Math.round(Math.random() * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Résumé total sur mobile */}
      <div className="lg:hidden bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Résumé</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {(
                count.initiatives +
                count.epics +
                count.features
              ).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Éléments fonctionnels</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {(count.userStories + count.tasks).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Éléments de travail</p>
          </div>
        </div>
      </div>
    </div>
  );
}
