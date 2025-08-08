// app/projects/[id]/page.tsx

"use client";

import React, { useState, useEffect, JSX } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, ArrowLeft, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

// Composants extraits
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectStats } from "@/components/project/ProjectStats";
import { ProjectProgress } from "@/components/project/ProjectProgress";
import { ProjectNav } from "@/components/project/ProjectNav";

interface Project {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: any;
  metadata: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  initiatives: Array<{
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    startDate: Date | null;
    endDate: Date | null;
  }>;
  features: Array<{
    id: string;
    name: string;
    description: string | null;
    priority: string;
    status: string;
    progress: number;
    storyPoints: number | null;
  }>;
  sprints: Array<{
    id: string;
    name: string;
    goal: string | null;
    startDate: Date;
    endDate: Date;
    status: string;
    capacity: number | null;
    velocity: number | null;
  }>;
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: Date;
    uploader: {
      name: string | null;
      email: string;
    };
  }>;
  channels: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    isPrivate: boolean;
    _count: {
      messages: number;
      members: number;
    };
  }>;
  _count: {
    initiatives: number;
    epic: number;
    features: number;
    userStories: number;
    sprints: number;
    files: number;
    channels: number;
    templates: number;
  };
}

export default function ProjectDetailPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id);
    }
  }, [params.id]);

  const fetchProject = async (id: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/projects/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Projet non trouvé");
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: Project = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
      toast.error("Impossible de charger le projet");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || "Projet non trouvé"}
            </h3>
            <p className="text-gray-600 mb-6">
              Le projet demandé n'existe pas ou vous n'avez pas les permissions
              pour y accéder.
            </p>
            <Button asChild>
              <Link href="/projects" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour aux projets
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header du projet */}
        <ProjectHeader project={project} />

        {/* Vue d'ensemble du projet */}
        {/* Description du projet */}
        {project.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {project.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Statistiques du projet - CORRECTION ICI */}
        <ProjectStats
          count={{
            initiatives: project._count.initiatives || 0,
            epics: project._count.epic || 0,
            features: project._count.features || 0,
            userStories: project._count.userStories || 0,
            sprints: project._count.sprints || 0,
            tasks: 0, // Valeur par défaut
            files: project._count.files || 0,
            channels: project._count.channels || 0,
            templates: project._count.templates || 0,
          }}
        />

        {/* Navigation du projet */}
        <ProjectNav projectId={project.id} />

        {/* Progression du projet */}
        <ProjectProgress
          initiatives={project.initiatives}
          startDate={project.startDate}
          endDate={project.endDate}
        />

        {/* Informations détaillées */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Dates du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Date de début:
                </span>
                <span className="text-sm text-gray-900">
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString("fr-FR")
                    : "Non définie"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Date de fin:
                </span>
                <span className="text-sm text-gray-900">
                  {project.endDate
                    ? new Date(project.endDate).toLocaleDateString("fr-FR")
                    : "Non définie"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Statut:
                </span>
                <Badge variant="outline">{project.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Équipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Équipe ({project.members.length} membres)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {member.user.image ? (
                        <AvatarImage
                          src={member.user.image}
                          alt={member.user.name || member.user.email}
                        />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {(member.user.name || member.user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}

                {project.members.length > 5 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 text-center">
                      +{project.members.length - 5} autres membres
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
