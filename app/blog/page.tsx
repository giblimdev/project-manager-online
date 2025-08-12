// app/blog/page.tsx

/**
 * RÔLE : Page principale du blog avec gestion des paramètres de recherche
 * RESPONSABILITÉS :
 * - Affichage des articles de blog avec filtres et pagination
 * - Gestion des commentaires basés sur le modèle Comment de Prisma
 * - Support SSR et optimisation Next.js 15 avec Suspense
 * - Design responsive et moderne
 *
 * COMPOSANTS UTILISÉS :
 * - Next.js 15 App Router avec Suspense
 * - React Suspense pour les composants client
 * - shadcn/ui: Card, Button, Input, Select, Badge
 * - TypeScript strict mode
 * - Prisma models: Comment, User, categories, blog_tags
 */

import React, { JSX, Suspense } from "react";
import { Metadata } from "next";
import { BlogContent } from "@/components/blog/BlogContent";
import { BlogSkeleton } from "@/components/blog/BlogSkeleton";

export const metadata: Metadata = {
  title: "Blog | Project Manager",
  description: "Articles et ressources sur la gestion de projet moderne",
  keywords: [
    "blog",
    "gestion de projet",
    "développement",
    "équipes",
    "articles",
  ],
};

export default function BlogPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header principal */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Blog & Ressources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos derniers articles sur la gestion de projet, les
            meilleures pratiques et les tendances du développement moderne.
          </p>
        </div>

        {/* Contenu principal avec Suspense Boundary */}
        <Suspense fallback={<BlogSkeleton />}>
          <BlogContent />
        </Suspense>
      </div>
    </div>
  );
}
