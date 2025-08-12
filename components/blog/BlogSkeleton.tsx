// components/blog/BlogSkeleton.tsx

/**
 * RÔLE : Composant skeleton pour le chargement du blog
 * RESPONSABILITÉS :
 * - Affichage d'un état de chargement élégant pendant le fetch
 * - Structure similaire au contenu final pour éviter les layout shifts
 * - Animations fluides avec Tailwind CSS
 * - Design responsive identique au contenu
 *
 * COMPOSANTS UTILISÉS :
 * - React JSX pour structure
 * - shadcn/ui: Card, Skeleton
 * - Tailwind CSS pour animations et responsive
 * - TypeScript strict mode
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const BlogSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton pour les statistiques */}
      <Card className="bg-gradient-to-r from-gray-300 to-gray-400">
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2 bg-gray-200" />
                <Skeleton className="h-4 w-20 mx-auto bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skeleton pour les filtres */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de recherche */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Options de filtrage */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Tags */}
          <div className="pt-4 border-t">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton pour les articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            {/* Skeleton image */}
            <Skeleton className="aspect-video w-full" />

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-6 flex-1 mr-2" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Métadonnées */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>

              {/* Bouton action */}
              <div className="pt-2 border-t">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton pagination */}
      <div className="flex justify-center items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
};
