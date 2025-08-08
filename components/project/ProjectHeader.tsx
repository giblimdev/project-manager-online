// components/project/ProjectHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building,
  TrendingUp,
  Clock,
  AlertCircle,
  Globe,
  Lock,
  Edit,
  Plus,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  key: string;
  status: string;
  visibility: string;
  user: User[];
}

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Actif",
          icon: <TrendingUp className="h-4 w-4" />,
        };
      case "COMPLETED":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Terminé",
          icon: <Clock className="h-4 w-4" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Annulé",
          icon: <AlertCircle className="h-4 w-4" />,
        };
      case "ON_HOLD":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          label: "En pause",
          icon: <Clock className="h-4 w-4" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: status,
          icon: <AlertCircle className="h-4 w-4" />,
        };
    }
  };

  const getVisibilityConfig = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return {
          icon: <Globe className="h-4 w-4" />,
          label: "Public",
          color: "text-blue-600",
        };
      case "PRIVATE":
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Privé",
          color: "text-gray-600",
        };
      case "INTERNAL":
        return {
          icon: <Building className="h-4 w-4" />,
          label: "Interne",
          color: "text-orange-600",
        };
      default:
        return {
          icon: <Lock className="h-4 w-4" />,
          label: "Privé",
          color: "text-gray-600",
        };
    }
  };

  const statusConfig = getStatusConfig(project.status);
  const visibilityConfig = getVisibilityConfig(project.visibility);

  return (
    <div className="shadow-sm border-b border-slate-200/60">
      <p>components/project/ProjectHeader.tsx</p>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link
              href="/projects"
              className="hover:text-blue-600 transition-colors"
            >
              Projets
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{project.name}</span>
          </div>

          {/* Project Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {project.name}
                  </h1>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="font-mono text-sm">
                      {project.key}
                    </Badge>
                    <Badge
                      className={`${statusConfig.color} flex items-center gap-1`}
                    >
                      {statusConfig.icon}
                      {statusConfig.label}
                    </Badge>
                    <div
                      className={`flex items-center space-x-1 ${visibilityConfig.color}`}
                    >
                      {visibilityConfig.icon}
                      <span className="text-sm">{visibilityConfig.label}</span>
                    </div>
                  </div>
                </div>
              </div>
              {project.description && (
                <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                  {project.description}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle initiative
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
