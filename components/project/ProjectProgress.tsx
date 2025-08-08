// components/project/ProjectProgress.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Initiative {
  id: string;
  name: string;
  progress: number;
}

interface ProjectProgressProps {
  initiatives: Initiative[];
  startDate: Date | null;
  endDate: Date | null;
}

export function ProjectProgress({
  initiatives,
  startDate,
  endDate,
}: ProjectProgressProps) {
  const calculateOverallProgress = () => {
    if (initiatives.length === 0) return 0;
    const totalProgress = initiatives.reduce(
      (sum, initiative) => sum + initiative.progress,
      0
    );
    return Math.round(totalProgress / initiatives.length);
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className=" bg-emerald-200 p-3">
      <div className=" p-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progression globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progression</span>
                <span className="text-sm text-gray-500">
                  {overallProgress}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-sm text-gray-600">
                Basé sur la progression des {initiatives.length} initiatives
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Chronologie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {startDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Date de début</span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(startDate), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                </div>
              )}
              {endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Date de fin prévue
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(endDate), "dd MMMM yyyy", {
                      locale: fr,
                    })}
                  </span>
                </div>
              )}
              {startDate && endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Durée</span>
                  <span className="text-sm text-gray-600">
                    {Math.ceil(
                      (new Date(endDate).getTime() -
                        new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    jours
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
