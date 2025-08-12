// app/glossary/page.tsx

/**
 * RÔLE : Page principale de gestion du glossaire avec paramètres de recherche
 * RESPONSABILITÉS :
 * - Affichage, filtrage, pagination et CRUD des termes du glossaire
 * - Gestion des paramètres de recherche via URL
 * - Support SSR et optimisation Next.js 15 avec Suspense
 * - Design responsive et moderne
 *
 * COMPOSANTS UTILISÉS :
 * - Next.js 15 App Router avec Suspense
 * - React Suspense pour les composants client
 * - shadcn/ui: Button, Input, Card, Select, Switch, Badge, Pagination
 * - TypeScript strict mode
 * - Prisma models: Glossary, User
 */

import React, { JSX, Suspense } from "react";
import { Metadata } from "next";
import { GlossaryContent } from "@/components/glossary/GlossaryContent";
import { GlossarySkeleton } from "@/components/glossary/GlossarySkeleton";

export const metadata: Metadata = {
  title: "Glossaire | Project Manager",
  description: "Gérez les termes, acronymes et concepts de votre projet",
  keywords: [
    "glossaire",
    "termes",
    "définitions",
    "gestion de projet",
    "vocabulaire",
  ],
};

export default function GlossaryPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header principal */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Glossaire du Projet
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gérez les termes, acronymes et concepts de votre projet pour une
            meilleure collaboration d'équipe.
          </p>
        </div>

        {/* Contenu principal avec Suspense Boundary */}
        <Suspense fallback={<GlossarySkeleton />}>
          <GlossaryContent />
        </Suspense>
      </div>
    </div>
  );
}
