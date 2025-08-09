// components/initiatives/InitiativesList.tsx

/**
 * RÔLE : Composant d'affichage des initiatives selon le mode sélectionné avec boutons d'actions complets
 * RESPONSABILITÉS :
 * - Affichage des initiatives selon le mode (list, card, tree) transmis par InitiativesDisplay
 * - Gestion des boutons d'actions rapides : edit, delete, up, down pour chaque initiative
 * - Bouton ajouter une nouvelle initiative en header de la liste
 * - Formatage des données (dates, devises, priorités) selon le schéma Prisma
 * - Interface responsive et moderne avec design cards et transitions fluides
 * - Gestion des états vides avec messages informatifs et call-to-action
 * - Affichage des relations (epics, features) en mode tree selon le schéma Prisma
 * - Actions de réorganisation (up/down) pour modifier l'ordre des initiatives
 * - Gestion du loading state avec indicateurs visuels appropriés
 *
 * COMPOSANTS UTILISÉS :
 * - Card, CardContent: Composants UI shadcn/ui pour les conteneurs d'initiatives
 * - Button: Composant bouton shadcn/ui avec variants pour les actions
 * - Skeleton: Composant de loading state pour les initiatives en chargement
 * - Alert: Composant d'alerte pour les messages d'erreur ou d'information
 * - Badge: Composant badge pour les priorités et statuts des initiatives
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: JSX pour l'affichage et optimisation des performances
 * - Next.js 15 client component avec TypeScript strict mode
 * - Tailwind CSS: Design moderne responsive avec grid, flex, hover, transitions
 * - lucide-react: Icons pour les actions (Edit, Trash2, ChevronUp, ChevronDown, Plus)
 * - shadcn/ui: Card, Button, Badge, Alert components avec design system cohérent
 * - Intl API: Formatage des devises et dates selon la locale française
 *
 * PROPS REÇUES DE InitiativesDisplay :
 * - initiatives: Liste des initiatives filtrées à afficher selon le schéma Prisma
 * - viewMode: Mode d'affichage sélectionné (list, card, tree)
 * - onCreateInitiative: Handler pour créer une nouvelle initiative
 * - onEditInitiative: Handler pour éditer une initiative existante
 * - onDeleteInitiative: Handler pour supprimer une initiative
 * - onMoveInitiative: Handler pour réorganiser (up/down) les initiatives
 * - loading: État de chargement des données depuis la page parent
 *
 * INTERFACES :
 * - Initiative: Interface complète selon le schéma Prisma avec relations optionnelles
 * - InitiativesListProps: Props du composant avec tous les handlers nécessaires
 */

"use client";

import React, { JSX } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

// ✅ CORRECTION: Import de l'interface Initiative depuis InitiativesDisplay
import { Initiative } from "./InitiativesDisplay";

// ✅ NOUVELLE LOGIQUE: Interface complète avec onMoveInitiative
interface InitiativesListProps {
  initiatives: Initiative[];
  viewMode: "list" | "card" | "tree";
  onCreateInitiative: () => void;
  onEditInitiative: (initiative: Initiative) => void;
  onDeleteInitiative: (initiativeId: string) => void;
  onMoveInitiative: (initiativeId: string, direction: "up" | "down") => void;
  loading: boolean;
}

export default function InitiativesList({
  initiatives,
  viewMode,
  onCreateInitiative,
  onEditInitiative,
  onDeleteInitiative,
  onMoveInitiative,
  loading,
}: InitiativesListProps): JSX.Element {
  // ✅ Fonctions utilitaires pour le formatage des données
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🟠";
      case "CRITICAL":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case "PLANNING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Non défini";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return "0%";
    return `${Math.round(value)}%`;
  };

  // ✅ Composant pour les boutons d'action avec icônes modernes
  const ActionButtons = ({
    initiative,
    index,
    isFirst,
    isLast,
  }: {
    initiative: Initiative;
    index: number;
    isFirst: boolean;
    isLast: boolean;
  }) => (
    <div className="flex items-center space-x-1">
      {/* Bouton déplacer vers le haut */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMoveInitiative(initiative.id, "up")}
        disabled={isFirst || loading}
        className="h-8 w-8 p-0 hover:bg-blue-100"
        title="Déplacer vers le haut"
      >
        <ChevronUp className="h-4 w-4 text-blue-600" />
      </Button>

      {/* Bouton déplacer vers le bas */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMoveInitiative(initiative.id, "down")}
        disabled={isLast || loading}
        className="h-8 w-8 p-0 hover:bg-blue-100"
        title="Déplacer vers le bas"
      >
        <ChevronDown className="h-4 w-4 text-blue-600" />
      </Button>

      {/* Bouton éditer */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEditInitiative(initiative)}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-green-100"
        title="Modifier l'initiative"
      >
        <Edit className="h-4 w-4 text-green-600" />
      </Button>

      {/* Bouton supprimer */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteInitiative(initiative.id)}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-red-100"
        title="Supprimer l'initiative"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );

  // ✅ Composant pour la barre de progression
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 min-w-0 font-medium">
        {formatPercentage(progress)}
      </span>
    </div>
  );

  // ✅ État vide avec design moderne
  if (initiatives.length === 0 && !loading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune initiative trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre première initiative pour commencer à organiser votre
            projet.
          </p>
          <Button
            onClick={onCreateInitiative}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer une initiative
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ✅ État de chargement avec skeleton
  if (loading && initiatives.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Content skeleton selon le mode */}
        {viewMode === "list" ? (
          <Card>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <div className="flex space-x-2 ml-auto">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div
            className={`grid gap-4 ${
              viewMode === "card"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-20" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ Header avec compteur et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {initiatives.length} initiative{initiatives.length > 1 ? "s" : ""}
          </h2>
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Actualisation...</span>
            </div>
          )}
        </div>

        <Button
          onClick={onCreateInitiative}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Ajouter une initiative</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* ✅ NOUVELLE LOGIQUE: Affichage selon le mode sélectionné */}

      {/* Mode Liste (Tableau) */}
      {viewMode === "list" && (
        <Card className="shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Initiative
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progrès
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initiatives.map((initiative, index) => (
                  <tr
                    key={initiative.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      loading ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {initiative.name}
                        </div>
                        {initiative.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {initiative.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${getPriorityColor(initiative.priority)}`}
                      >
                        {getPriorityIcon(initiative.priority)}{" "}
                        {initiative.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusColor(initiative.status)}`}>
                        {initiative.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <ProgressBar progress={initiative.progress} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>{formatCurrency(initiative.budget)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">
                            Début: {formatDate(initiative.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">
                            Fin: {formatDate(initiative.endDate)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionButtons
                        initiative={initiative}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === initiatives.length - 1}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Mode Cartes */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initiatives.map((initiative, index) => (
            <Card
              key={initiative.id}
              className={`shadow-sm border hover:shadow-md transition-all duration-200 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <CardContent className="p-6">
                {/* Header de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {initiative.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={`${getPriorityColor(initiative.priority)}`}
                      >
                        {getPriorityIcon(initiative.priority)}{" "}
                        {initiative.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(initiative.status)}`}>
                        {initiative.status}
                      </Badge>
                    </div>
                  </div>
                  <ActionButtons
                    initiative={initiative}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === initiatives.length - 1}
                  />
                </div>

                {/* Description */}
                {initiative.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {initiative.description}
                  </p>
                )}

                {/* Objectif */}
                {initiative.objective && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Objectif
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {initiative.objective}
                    </p>
                  </div>
                )}

                {/* Métriques principales */}
                <div className="space-y-3">
                  {/* Progrès */}
                  <div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Progrès</span>
                      </div>
                      <span className="font-medium">
                        {formatPercentage(initiative.progress)}
                      </span>
                    </div>
                    <ProgressBar progress={initiative.progress} />
                  </div>

                  {/* Budget et ROI */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget</span>
                      </div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(initiative.budget)}
                      </div>
                    </div>
                    {initiative.roi !== null && (
                      <div>
                        <div className="flex items-center space-x-1 text-gray-600 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>ROI</span>
                        </div>
                        <div className="font-medium text-gray-900">
                          {formatPercentage(initiative.roi)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Début:</span>
                      <span className="font-medium">
                        {formatDate(initiative.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Fin:</span>
                      <span className="font-medium">
                        {formatDate(initiative.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mode Arbre (Hiérarchique) */}
      {viewMode === "tree" && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-6">
              {initiatives.map((initiative, index) => (
                <div
                  key={initiative.id}
                  className={`border-l-4 border-blue-600 pl-6 relative ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  {/* Ligne principale de l'initiative */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {initiative.name}
                        </h3>
                        <Badge
                          className={`${getPriorityColor(initiative.priority)}`}
                        >
                          {getPriorityIcon(initiative.priority)}{" "}
                          {initiative.priority}
                        </Badge>
                        <Badge
                          className={`${getStatusColor(initiative.status)}`}
                        >
                          {initiative.status}
                        </Badge>
                      </div>

                      {initiative.description && (
                        <p className="text-gray-600 text-sm mb-2 ml-8">
                          {initiative.description}
                        </p>
                      )}

                      {initiative.objective && (
                        <div className="ml-8">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Objectif:
                          </span>
                          <p className="text-sm text-gray-700 mt-1">
                            {initiative.objective}
                          </p>
                        </div>
                      )}
                    </div>

                    <ActionButtons
                      initiative={initiative}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === initiatives.length - 1}
                    />
                  </div>

                  {/* Métriques en grille */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 ml-8">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Progrès</span>
                      </div>
                      <div className="font-medium">
                        {formatPercentage(initiative.progress)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${initiative.progress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget</span>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(initiative.budget)}
                      </div>
                    </div>

                    {initiative.roi !== null && (
                      <div>
                        <div className="flex items-center space-x-1 text-gray-600 mb-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>ROI</span>
                        </div>
                        <div className="font-medium">
                          {formatPercentage(initiative.roi)}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Durée</span>
                      </div>
                      <div className="font-medium text-xs">
                        {formatDate(initiative.startDate)} -{" "}
                        {formatDate(initiative.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Epics sous l'initiative (relations Prisma) */}
                  {initiative.epics && initiative.epics.length > 0 && (
                    <div className="ml-8 space-y-3 border-l-2 border-green-300 pl-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        📋 Epics ({initiative.epics.length})
                      </div>
                      {initiative.epics.map((epic) => (
                        <div key={epic.id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="font-medium text-gray-800">
                              {epic.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {formatPercentage(epic.progress)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {epic.status}
                            </Badge>
                          </div>

                          {/* Features sous l'epic */}
                          {epic.features && epic.features.length > 0 && (
                            <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
                              <div className="text-xs text-gray-600 mb-1">
                                ✨ Features ({epic.features.length})
                              </div>
                              {epic.features.map((feature) => (
                                <div
                                  key={feature.id}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                    <span className="text-gray-700">
                                      {feature.name}
                                    </span>
                                    {feature.storyPoints && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-1 py-0"
                                      >
                                        {feature.storyPoints}pt
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500">
                                      {formatPercentage(feature.progress)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {feature.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Séparateur entre initiatives */}
                  {index < initiatives.length - 1 && (
                    <hr className="mt-6 border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicateur de chargement global */}
      {loading && initiatives.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Actualisation des initiatives en cours...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
