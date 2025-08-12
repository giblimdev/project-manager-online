// components/glossary/GlossarySkeleton.tsx

/**
 * RÔLE : Composant skeleton pour le chargement du glossaire
 * RESPONSABILITÉS :
 * - Affichage d'un état de chargement élégant pendant le fetch des termes
 * - Structure similaire au contenu final pour éviter les layout shifts
 * - Animations fluides avec Tailwind CSS pour une meilleure UX
 * - Design responsive identique au contenu final
 * - Support des modes sombre/clair
 *
 * COMPOSANTS UTILISÉS :
 * - React JSX pour structure
 * - shadcn/ui: Card, CardContent, CardHeader, Skeleton
 * - Tailwind CSS pour animations et responsive design
 * - TypeScript strict mode
 * - Design pattern skeleton loading
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const GlossarySkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton pour les statistiques */}
      <Card className="bg-gradient-to-r from-gray-300 to-gray-400 border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2 bg-gray-200 rounded" />
                <Skeleton className="h-4 w-20 mx-auto bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skeleton pour les filtres et recherche */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de recherche principale */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-28" />
          </div>

          {/* Options de filtrage */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Type */}
            <Skeleton className="h-10 w-full" />

            {/* Statut actif */}
            <Skeleton className="h-10 w-full" />

            {/* Tri */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>

            {/* Actions */}
            <Skeleton className="h-10 w-full md:col-span-2" />
          </div>

          {/* Types populaires */}
          <div className="pt-4 border-t">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicateur de résultats */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Skeleton pour la grille des termes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Titre du terme */}
                  <Skeleton className="h-6 w-32 mb-2" />
                  {/* Badges type et statut */}
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
                {/* Menu actions */}
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              <div className="space-y-2 min-h-[3rem]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              {/* Métadonnées */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton pour la pagination */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-10" />
            ))}
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Skeleton supplémentaire pour mobile */}
      <div className="block md:hidden">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* États de chargement animés */}
      <div className="hidden">
        {/* Pulse variations pour différents éléments */}
        <div className="animate-pulse bg-gray-200 rounded h-4" />
        <div className="animate-pulse bg-gray-300 rounded h-6" />
        <div className="animate-pulse bg-gray-100 rounded h-8" />
      </div>
    </div>
  );
};

export default GlossarySkeleton;
