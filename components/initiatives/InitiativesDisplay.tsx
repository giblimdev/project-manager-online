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
  Filter,
  Info,
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

// ✅ Props reçues de la page parent (pas de chargement interne)
interface InitiativesDisplayProps {
  projectId: string;
  filters: FilterState;
  viewMode: ViewMode;
  initiatives: Initiative[];
  onCreateInitiative: () => void;
  onEditInitiative: (initiative: Initiative) => void;
  onDeleteInitiative: (initiativeId: string) => Promise<void>; // ✅ CORRECTION: Promise<void>
  onMoveInitiative: (
    initiativeId: string,
    direction: "up" | "down"
  ) => Promise<void>; // ✅ CORRECTION: Promise<void>
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
  // ✅ Filtrage optimisé avec useMemo et recherche étendue
  const filteredInitiatives = useMemo(() => {
    if (!initiatives.length) return [];

    let filtered = [...initiatives];

    // Filtrage par nom (recherche dans nom, description, objectif)
    if (filters.name.trim()) {
      const searchTerm = filters.name.toLowerCase().trim();
      filtered = filtered.filter((initiative) => {
        const searchableText = [
          initiative.name,
          initiative.description,
          initiative.objective,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchTerm);
      });
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
    const baseStats = {
      total: filteredInitiatives.length,
      originalTotal: initiatives.length,
      active: filteredInitiatives.filter((i) => i.status === "ACTIVE").length,
      planning: filteredInitiatives.filter((i) => i.status === "PLANNING")
        .length,
      completed: filteredInitiatives.filter((i) => i.status === "COMPLETED")
        .length,
      onHold: filteredInitiatives.filter((i) => i.status === "ON_HOLD").length,
      cancelled: filteredInitiatives.filter((i) => i.status === "CANCELLED")
        .length,
      critical: filteredInitiatives.filter((i) => i.priority === "CRITICAL")
        .length,
      high: filteredInitiatives.filter((i) => i.priority === "HIGH").length,
    };

    return {
      ...baseStats,
      isFiltered: baseStats.total !== baseStats.originalTotal,
    };
  }, [filteredInitiatives, initiatives.length]);

  // Configuration des statuts avec couleurs
  const statusConfig = useMemo(
    () => ({
      PLANNING: { color: "text-blue-600", bgColor: "bg-blue-100" },
      ACTIVE: { color: "text-green-600", bgColor: "bg-green-100" },
      COMPLETED: { color: "text-emerald-600", bgColor: "bg-emerald-100" },
      ON_HOLD: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
      CANCELLED: { color: "text-red-600", bgColor: "bg-red-100" },
    }),
    []
  );

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

  // ✅ Affichage du skeleton pendant le chargement initial
  if (loading && initiatives.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <Card className="p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </div>
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
            <Card key={i} className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex space-x-1">
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
      {/* Header avec informations et statistiques détaillées */}
      <Card className="shadow-sm border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Informations et statistiques principales */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Initiatives du projet
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="font-medium">
                      {stats.total} affiché{stats.total > 1 ? "es" : "e"}
                    </span>
                    {stats.isFiltered && (
                      <>
                        <span>•</span>
                        <span>{stats.originalTotal} total</span>
                      </>
                    )}
                    {loading && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Actualisation...
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
                <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div className="font-bold text-green-600">{stats.active}</div>
                  <div className="text-gray-600">Actives</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div className="font-bold text-blue-600">
                    {stats.planning}
                  </div>
                  <div className="text-gray-600">Planifiées</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div className="font-bold text-emerald-600">
                    {stats.completed}
                  </div>
                  <div className="text-gray-600">Terminées</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div className="font-bold text-red-600">{stats.critical}</div>
                  <div className="text-gray-600">Critiques</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                  <div className="font-bold text-orange-600">{stats.high}</div>
                  <div className="text-gray-600">Haute priorité</div>
                </div>
              </div>
            </div>

            {/* Mode d'affichage actuel et filtres actifs */}
            <div className="flex flex-col items-end gap-3">
              {/* Mode d'affichage */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border">
                <span className="text-sm font-medium text-gray-700">
                  Affichage:
                </span>
                <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                  {getViewModeIcon(viewMode)}
                  <span className="text-sm font-medium">
                    {getViewModeLabel(viewMode)}
                  </span>
                </div>
              </div>

              {/* Filtres actifs */}
              {(filters.name || filters.priority !== "ALL") && (
                <div className="flex flex-wrap gap-2 justify-end">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Filter className="h-3 w-3" />
                    <span>Filtres actifs:</span>
                  </div>
                  {filters.name && (
                    <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                      "{filters.name}"
                    </span>
                  )}
                  {filters.priority !== "ALL" && (
                    <span className="px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                      {filters.priority}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message informatif sur les initiatives */}
      {!loading && initiatives.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>💡 Astuce:</strong> Cliquez sur une carte d'initiative pour
            voir ses détails, ou utilisez les boutons d'actions pour gérer les
            épics, modifier ou supprimer une initiative.
          </AlertDescription>
        </Alert>
      )}

      {/* Message si aucune initiative après filtrage */}
      {!loading &&
        filteredInitiatives.length === 0 &&
        initiatives.length > 0 && (
          <Card className="text-center py-12 border-dashed border-2 border-gray-300">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune initiative trouvée
              </h3>
              <p className="text-gray-600 mb-4">
                Aucune initiative ne correspond aux filtres appliqués.
                <br />
                Essayez de modifier vos critères de recherche ou créez une
                nouvelle initiative.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={onCreateInitiative}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Créer une initiative
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Message si aucune initiative du tout */}
      {!loading && initiatives.length === 0 && (
        <Card className="text-center py-16 border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent>
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Target className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Aucune initiative
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ce projet ne contient pas encore d'initiatives. Les initiatives
              permettent d'organiser et de structurer le travail de votre équipe
              vers des objectifs communs.
            </p>
            <Button
              onClick={onCreateInitiative}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Créer la première initiative
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ✅ Transmission à InitiativesList selon le mode sélectionné */}
      {!loading && filteredInitiatives.length > 0 && (
        <InitiativesList
          projectId={projectId} // ✅ CORRECTION: Ajout du projectId manquant
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
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-blue-800 font-medium">
                Actualisation des initiatives en cours...
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
