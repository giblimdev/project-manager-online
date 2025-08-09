// components/epics/EpicsList.tsx

/**
 * RÔLE : Composant d'affichage des épics selon le mode sélectionné avec boutons d'actions complets
 * RESPONSABILITÉS :
 * - Affichage des épics selon le mode (list, card, tree) transmis par EpicsDisplay
 * - Gestion des boutons d'actions rapides : edit, delete, up, down pour chaque épic
 * - Bouton ajouter un nouvel épic en header de la liste
 * - Formatage des données (dates, priorités) selon le schéma Prisma
 * - Interface responsive et moderne avec design cards et transitions fluides
 * - Gestion des états vides avec messages informatifs et call-to-action
 * - Affichage des relations (features) en mode tree selon le schéma Prisma
 * - Actions de réorganisation (up/down) pour modifier l'ordre des épics
 * - Gestion du loading state avec indicateurs visuels appropriés
 *
 * COMPOSANTS UTILISÉS :
 * - Card, CardContent: Composants UI shadcn/ui pour les conteneurs d'épics
 * - Button: Composant bouton shadcn/ui avec variants pour les actions
 * - Skeleton: Composant de loading state pour les épics en chargement
 * - Badge: Composant badge pour les priorités et statuts des épics
 * - Progress: Composant progress bar pour l'avancement
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: JSX pour l'affichage et optimisation des performances
 * - Next.js 15 client component avec TypeScript strict mode
 * - Tailwind CSS: Design moderne responsive avec grid, flex, hover, transitions
 * - lucide-react: Icons pour les actions (Edit, Trash2, ChevronUp, ChevronDown, Plus)
 * - shadcn/ui: Card, Button, Badge, Progress components avec design system cohérent
 * - Intl API: Formatage des dates selon la locale française
 *
 * PROPS reçues de EpicsDisplay :
 * - epics: Liste des épics filtrés à afficher selon le schéma Prisma
 * - viewMode: Mode d'affichage sélectionné (list, card, tree)
 * - onCreateEpic: Handler pour créer un nouvel épic
 * - onEditEpic: Handler pour éditer un épic existant
 * - onDeleteEpic: Handler pour supprimer un épic
 * - onMoveEpic: Handler pour réorganiser (up/down) les épics
 * - loading: État de chargement des données depuis la page parent
 */

"use client";

import React, { JSX, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Epic } from "./EpicsDisplay";

// Interface pour les props du composant
interface EpicsListProps {
  epics: Epic[];
  viewMode: "list" | "card" | "tree";
  onCreateEpic: () => void;
  onEditEpic: (epic: Epic) => void;
  onDeleteEpic: (epicId: string) => void;
  onMoveEpic: (epicId: string, direction: "up" | "down") => void;
  loading: boolean;
}

export default function EpicsList({
  epics,
  viewMode,
  onCreateEpic,
  onEditEpic,
  onDeleteEpic,
  onMoveEpic,
  loading,
}: EpicsListProps): JSX.Element {
  // Fonctions utilitaires pour le formatage des données
  const getPriorityColor = useCallback((priority: string): string => {
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
  }, []);

  const getPriorityIcon = useCallback((priority: string): string => {
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
  }, []);

  const getStatusColor = useCallback((status: string): string => {
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
  }, []);

  const formatDate = useCallback((date: Date | null): string => {
    if (!date) return "Non défini";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const formatPercentage = useCallback((value: number | null): string => {
    if (value === null) return "0%";
    return `${Math.round(value)}%`;
  }, []);

  // Composant pour les boutons d'action avec icônes modernes
  const ActionButtons = ({
    epic,
    index,
    isFirst,
    isLast,
  }: {
    epic: Epic;
    index: number;
    isFirst: boolean;
    isLast: boolean;
  }) => (
    <div className="flex items-center space-x-1">
      {/* Bouton déplacer vers le haut */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMoveEpic(epic.id, "up")}
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
        onClick={() => onMoveEpic(epic.id, "down")}
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
        onClick={() => onEditEpic(epic)}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-green-100"
        title="Modifier l'épic"
      >
        <Edit className="h-4 w-4 text-green-600" />
      </Button>

      {/* Bouton supprimer */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDeleteEpic(epic.id)}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-red-100"
        title="Supprimer l'épic"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );

  // Composant pour la barre de progression
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

  // État vide avec design moderne
  if (epics.length === 0 && !loading) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun épic trouvé
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier épic pour commencer à organiser vos
            fonctionnalités.
          </p>
          <Button
            onClick={onCreateEpic}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un épic
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec compteur et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">
            {epics.length} épic{epics.length > 1 ? "s" : ""}
          </h2>
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Actualisation...</span>
            </div>
          )}
        </div>

        <Button
          onClick={onCreateEpic}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Ajouter un épic</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Affichage selon le mode sélectionné */}

      {/* Mode Liste (Tableau) */}
      {viewMode === "list" && (
        <Card className="shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Épic
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
                    Dates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {epics.map((epic, index) => (
                  <tr
                    key={epic.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      loading ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {epic.name}
                        </div>
                        {epic.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {epic.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getPriorityColor(epic.priority)}`}>
                        {getPriorityIcon(epic.priority)} {epic.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusColor(epic.status)}`}>
                        {epic.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <ProgressBar progress={epic.progress} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">
                            Début: {formatDate(epic.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">
                            Fin: {formatDate(epic.endDate)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionButtons
                        epic={epic}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === epics.length - 1}
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
          {epics.map((epic, index) => (
            <Card
              key={epic.id}
              className={`shadow-sm border hover:shadow-md transition-all duration-200 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <CardContent className="p-6">
                {/* Header de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                      {epic.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${getPriorityColor(epic.priority)}`}>
                        {getPriorityIcon(epic.priority)} {epic.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(epic.status)}`}>
                        {epic.status}
                      </Badge>
                    </div>
                  </div>
                  <ActionButtons
                    epic={epic}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === epics.length - 1}
                  />
                </div>

                {/* Description */}
                {epic.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {epic.description}
                  </p>
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
                        {formatPercentage(epic.progress)}
                      </span>
                    </div>
                    <ProgressBar progress={epic.progress} />
                  </div>

                  {/* Dates */}
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Début:</span>
                      <span className="font-medium">
                        {formatDate(epic.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Fin:</span>
                      <span className="font-medium">
                        {formatDate(epic.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Features count */}
                  {epic.features && epic.features.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Features:</span>
                      <span className="font-medium">
                        {epic.features.length} fonctionnalité
                        {epic.features.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
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
              {epics.map((epic, index) => (
                <div
                  key={epic.id}
                  className={`border-l-4 border-blue-600 pl-6 relative ${
                    loading ? "opacity-50" : ""
                  }`}
                >
                  {/* Ligne principale de l'épic */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {epic.name}
                        </h3>
                        <Badge className={`${getPriorityColor(epic.priority)}`}>
                          {getPriorityIcon(epic.priority)} {epic.priority}
                        </Badge>
                        <Badge className={`${getStatusColor(epic.status)}`}>
                          {epic.status}
                        </Badge>
                      </div>

                      {epic.description && (
                        <p className="text-gray-600 text-sm mb-2 ml-8">
                          {epic.description}
                        </p>
                      )}
                    </div>

                    <ActionButtons
                      epic={epic}
                      index={index}
                      isFirst={index === 0}
                      isLast={index === epics.length - 1}
                    />
                  </div>

                  {/* Métriques en grille */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4 ml-8">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <BarChart3 className="h-4 w-4" />
                        <span>Progrès</span>
                      </div>
                      <div className="font-medium">
                        {formatPercentage(epic.progress)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${epic.progress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Début</span>
                      </div>
                      <div className="font-medium">
                        {formatDate(epic.startDate)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Fin</span>
                      </div>
                      <div className="font-medium">
                        {formatDate(epic.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Features sous l'épic */}
                  {epic.features && epic.features.length > 0 && (
                    <div className="mt-4 ml-6 space-y-2">
                      {epic.features.map((feature) => (
                        <div
                          key={feature.id}
                          className="border-l-2 border-green-400 pl-3"
                        >
                          <div className="flex items-center text-sm">
                            <span className="mr-2">✨</span>
                            <span className="font-medium text-gray-800">
                              {feature.name}
                            </span>
                            <span className="ml-2 text-gray-600">
                              ({feature.progress}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {index < epics.length - 1 && (
                    <hr className="mt-4 border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
