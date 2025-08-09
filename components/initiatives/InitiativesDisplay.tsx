// components/initiatives/InitiativesDisplay.tsx

/**
 * RÔLE : Composant de sélection du mode d'affichage qui transmet à InitiativesList
 * RESPONSABILITÉS :
 * - Sélection du mode d'affichage (list, card, tree) avec toggle moderne
 * - Transmission des données et handlers à InitiativesList selon le mode sélectionné
 * - Gestion de l'état de chargement et des erreurs d'affichage
 * - Interface responsive avec design moderne et transitions fluides
 * - Pas de chargement de données (géré par la page parent)
 * - Pas de gestion du formulaire (géré par la page parent)
 * - Filtrage des initiatives selon les critères transmis par la page parent
 * - Architecture séparée : Display -> InitiativesList -> rendu selon mode
 *
 * COMPOSANTS UTILISÉS :
 * - InitiativesList: Composant qui affiche les initiatives selon le mode + boutons actions
 * - Card, CardContent: Composants UI shadcn/ui pour les conteneurs
 * - Button: Composant bouton shadcn/ui avec variants
 * - Skeleton: Composant de loading state pour le chargement
 * - Alert, AlertDescription: Composants d'alerte pour les erreurs
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useMemo, JSX pour l'optimisation des performances
 * - Next.js 15 client component avec TypeScript strict mode
 * - Tailwind CSS: Design moderne responsive avec grid, flex, transitions
 * - lucide-react: Icons pour les modes d'affichage et états
 * - shadcn/ui: Card, Button, Alert, Skeleton components avec design system
 *
 * PROPS REÇUES DE LA PAGE PARENT :
 * - projectId: ID du projet pour identification
 * - filters: Filtres appliqués (name, priority) depuis InitiativesFilter
 * - viewMode: Mode d'affichage sélectionné (list, card, tree)
 * - initiatives: Liste des initiatives chargées par la page parent
 * - onCreateInitiative: Handler pour créer une nouvelle initiative
 * - onEditInitiative: Handler pour éditer une initiative existante
 * - onDeleteInitiative: Handler pour supprimer une initiative
 * - onMoveInitiative: Handler pour réorganiser (up/down) les initiatives
 * - loading: État de chargement des données depuis la page parent
 */

"use client";

import React, { useMemo, JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Grid3X3,
  List,
  TreePine,
  AlertTriangle,
  Target,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import InitiativesList from "./InitiativesList";

// Interface Initiative selon le schéma Prisma - identique à la page parent
export interface Initiative {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  budget: number | null;
  roi: number | null;
  projectId: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations optionnelles selon les includes de l'API
  project?: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: string;
  };
  User?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  epics?: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    features: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
      storyPoints: number | null;
    }>;
  }>;
}

// Interface pour les filtres - identique à la page parent
interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Types pour les modes d'affichage
type ViewMode = "list" | "card" | "tree";

// ✅ NOUVELLE LOGIQUE: Props reçues de la page parent (pas de chargement interne)
interface InitiativesDisplayProps {
  projectId: string;
  filters: FilterState;
  viewMode: ViewMode;
  initiatives: Initiative[];
  onCreateInitiative: () => void;
  onEditInitiative: (initiative: Initiative) => void;
  onDeleteInitiative: (initiativeId: string) => void;
  onMoveInitiative: (initiativeId: string, direction: "up" | "down") => void;
  loading: boolean;
}

export default function InitiativesDisplay({
  projectId,
  filters,
  viewMode,
  initiatives,
  onCreateInitiative,
  onEditInitiative,
  onDeleteInitiative,
  onMoveInitiative,
  loading,
}: InitiativesDisplayProps): JSX.Element {
  // ✅ NOUVELLE LOGIQUE: Filtrage optimisé avec useMemo
  const filteredInitiatives = useMemo(() => {
    if (!initiatives.length) return [];

    let filtered = [...initiatives];

    // Filtrage par nom (recherche dans nom, description, objectif)
    if (filters.name.trim()) {
      const searchTerm = filters.name.toLowerCase();
      filtered = filtered.filter(
        (initiative) =>
          initiative.name.toLowerCase().includes(searchTerm) ||
          initiative.description?.toLowerCase().includes(searchTerm) ||
          initiative.objective?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrage par priorité
    if (filters.priority !== "ALL") {
      filtered = filtered.filter(
        (initiative) => initiative.priority === filters.priority
      );
    }

    console.log(
      `🎯 InitiativesDisplay - Filtrage: ${filtered.length}/${initiatives.length} initiatives`
    );
    return filtered;
  }, [initiatives, filters]);

  // Statistiques des initiatives filtrées pour affichage
  const stats = useMemo(() => {
    return {
      total: filteredInitiatives.length,
      active: filteredInitiatives.filter((i) => i.status === "ACTIVE").length,
      planning: filteredInitiatives.filter((i) => i.status === "PLANNING")
        .length,
      completed: filteredInitiatives.filter((i) => i.status === "COMPLETED")
        .length,
      critical: filteredInitiatives.filter((i) => i.priority === "CRITICAL")
        .length,
    };
  }, [filteredInitiatives]);

  // Fonction pour obtenir l'icône du mode d'affichage
  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case "list":
        return <List className="h-4 w-4" />;
      case "card":
        return <Grid3X3 className="h-4 w-4" />;
      case "tree":
        return <TreePine className="h-4 w-4" />;
      default:
        return <Grid3X3 className="h-4 w-4" />;
    }
  };

  // Fonction pour obtenir le label du mode d'affichage
  const getViewModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case "list":
        return "Liste";
      case "card":
        return "Cartes";
      case "tree":
        return "Arbre";
      default:
        return "Cartes";
    }
  };

  // ✅ NOUVELLE LOGIQUE: Affichage du skeleton pendant le chargement
  if (loading && initiatives.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </Card>

        {/* Content skeleton selon le mode */}
        <div
          className={`grid gap-4 ${
            viewMode === "list"
              ? "grid-cols-1"
              : viewMode === "card"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec informations et mode d'affichage */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Informations et statistiques */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Initiatives du projet
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{stats.total} total</span>
                    <span>•</span>
                    <span>{stats.active} actives</span>
                    <span>•</span>
                    <span>{stats.critical} critiques</span>
                    {loading && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Chargement...
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Filtres actifs */}
              {(filters.name || filters.priority !== "ALL") && (
                <div className="flex flex-wrap gap-2">
                  {filters.name && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      Nom: "{filters.name}"
                    </span>
                  )}
                  {filters.priority !== "ALL" && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      Priorité: {filters.priority}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mode d'affichage actuel (informatif) */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Affichage:</span>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                {getViewModeIcon(viewMode)}
                <span>{getViewModeLabel(viewMode)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message si aucune initiative après filtrage */}
      {!loading &&
        filteredInitiatives.length === 0 &&
        initiatives.length > 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune initiative trouvée
              </h3>
              <p className="text-gray-600 mb-4">
                Aucune initiative ne correspond aux filtres appliqués.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={onCreateInitiative}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une initiative
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Message si aucune initiative du tout */}
      {!loading && initiatives.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune initiative
            </h3>
            <p className="text-gray-600 mb-4">
              Ce projet ne contient pas encore d'initiatives.
            </p>
            <Button
              onClick={onCreateInitiative}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Créer la première initiative
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ✅ NOUVELLE LOGIQUE: Transmission à InitiativesList selon le mode sélectionné */}
      {!loading && filteredInitiatives.length > 0 && (
        <InitiativesList
          initiatives={filteredInitiatives}
          viewMode={viewMode}
          onCreateInitiative={onCreateInitiative}
          onEditInitiative={onEditInitiative}
          onDeleteInitiative={onDeleteInitiative}
          onMoveInitiative={onMoveInitiative}
          loading={loading}
        />
      )}

      {/* Indicateur de chargement lors du refresh */}
      {loading && initiatives.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Actualisation des initiatives...</span>
          </div>
        </div>
      )}
    </div>
  );
}
