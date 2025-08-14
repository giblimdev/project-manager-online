// components/initiatives/InitiativesList.tsx

"use client";

import React, { JSX, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight,
  MousePointer,
} from "lucide-react";
import { toast } from "sonner";
import { useSelectedInitiativeStore } from "@/stores/useSelectedInitiativeStore";
import { Initiative } from "./InitiativesDisplay";

interface InitiativesListProps {
  projectId: string;
  initiatives: Initiative[];
  viewMode: "list" | "card" | "tree";
  onCreateInitiative: () => void;
  onEditInitiative: (initiative: Initiative) => void;
  onDeleteInitiative: (initiativeId: string) => Promise<void>;
  onMoveInitiative: (
    initiativeId: string,
    direction: "up" | "down"
  ) => Promise<void>;
  onInitiativeClick?: (initiative: Initiative) => void;
  loading: boolean;
}

export default function InitiativesList({
  projectId,
  initiatives,
  viewMode,
  onCreateInitiative,
  onEditInitiative,
  onDeleteInitiative,
  onMoveInitiative,
  onInitiativeClick,
  loading,
}: InitiativesListProps): JSX.Element {
  const router = useRouter();
  const setSelectedInitiativeId = useSelectedInitiativeStore(
    (state) => state.setSelectedInitiativeId
  );

  const handleInitiativeSelect = useCallback(
    (initiative: Initiative) => {
      console.log(
        "🎯 Sélection initiative pour navigation:",
        initiative.name,
        initiative.id
      );

      setSelectedInitiativeId(initiative.id);

      toast.success(`Initiative "${initiative.name}" sélectionnée`, {
        duration: 2000,
        description: "Navigation vers les épics en cours...",
      });

      // Navigation programmatique
      router.push(`/projects/${projectId}/epics?initiativeId=${initiative.id}`);

      if (onInitiativeClick) {
        onInitiativeClick(initiative);
      }
    },
    [setSelectedInitiativeId, onInitiativeClick, router, projectId]
  );

  const handleDeleteWithConfirm = useCallback(
    async (initiative: Initiative, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      // ✅ Appel direct sans prompt, l'AlertDialog de pj1 prendra le relais
      try {
        await onDeleteInitiative(initiative.id);
      } catch (error) {
        console.error("Erreur suppression initiative:", error);
        toast.error(
          `Erreur lors de la suppression : ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`
        );
      }
    },
    [onDeleteInitiative]
  );

  const handleMoveWithFeedback = useCallback(
    async (
      initiative: Initiative,
      direction: "up" | "down",
      e: React.MouseEvent
    ) => {
      e.stopPropagation();
      e.preventDefault();

      try {
        await onMoveInitiative(initiative.id, direction);
        toast.success(
          `Initiative "${initiative.name}" déplacée vers ${
            direction === "up" ? "le haut" : "le bas"
          }`
        );
      } catch (error) {
        console.error("Erreur déplacement initiative:", error);
        toast.error(
          `Erreur lors du déplacement : ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`
        );
      }
    },
    [onMoveInitiative]
  );

  // ✅ Fonctions utilitaires inchangées
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "LOW":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "🟢",
          label: "Faible",
        };
      case "MEDIUM":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "🟡",
          label: "Moyenne",
        };
      case "HIGH":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: "🟠",
          label: "Haute",
        };
      case "CRITICAL":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: "🔴",
          label: "Critique",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "⚪",
          label: priority,
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "PLANNING":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "📝",
          label: "Planification",
        };
      case "ACTIVE":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: "🚀",
          label: "Active",
        };
      case "ON_HOLD":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: "⏸️",
          label: "En pause",
        };
      case "COMPLETED":
        return {
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: "✅",
          label: "Terminée",
        };
      case "CANCELLED":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❌",
          label: "Annulée",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❓",
          label: status,
        };
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null): string => {
    if (amount === null || amount === 0) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null || value === undefined) return "0%";
    return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
  };

  // ✅ CORRECTION : ActionButtons sans liens imbriqués
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
    <div
      className="flex items-center space-x-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleMoveWithFeedback(initiative, "up", e)}
        disabled={isFirst || loading}
        className="h-8 w-8 p-0 hover:bg-blue-100 disabled:opacity-50"
        title="Déplacer vers le haut"
      >
        <ChevronUp className="h-4 w-4 text-blue-600" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleMoveWithFeedback(initiative, "down", e)}
        disabled={isLast || loading}
        className="h-8 w-8 p-0 hover:bg-blue-100 disabled:opacity-50"
        title="Déplacer vers le bas"
      >
        <ChevronDown className="h-4 w-4 text-blue-600" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEditInitiative(initiative);
        }}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-green-100 disabled:opacity-50"
        title="Modifier l'initiative"
      >
        <Edit className="h-4 w-4 text-green-600" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleDeleteWithConfirm(initiative, e)}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-red-100 disabled:opacity-50"
        title="Supprimer l'initiative"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>

      {/* ✅ CORRECTION : Bouton de navigation sans Link imbriqué */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleInitiativeSelect(initiative);
        }}
        className="h-8 w-8 p-0 hover:bg-purple-100"
        title="Voir les épics de cette initiative"
      >
        <ArrowRight className="h-4 w-4 text-purple-600" />
      </Button>
    </div>
  );

  const ProgressBar = ({ progress }: { progress: number }) => {
    const safeProgress = Math.max(0, Math.min(100, progress || 0));
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 min-w-0 font-medium tabular-nums">
          {formatPercentage(progress)}
        </span>
      </div>
    );
  };

  // États vide et loading inchangés...
  if (initiatives.length === 0 && !loading) {
    return (
      <Card className="text-center py-16 border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent>
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Target className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Aucune initiative trouvée
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Créez votre première initiative pour commencer à organiser votre
            projet en objectifs mesurables et réalisables.
          </p>
          <Button
            onClick={onCreateInitiative}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
            disabled={loading}
          >
            <Plus className="h-5 w-5 mr-2" />
            Créer la première initiative
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading && initiatives.length === 0) {
    // ... code skeleton inchangé
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-gray-900">
            {initiatives.length} initiative{initiatives.length > 1 ? "s" : ""}
          </h2>
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Actualisation...</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
            <MousePointer className="h-4 w-4 flex-shrink-0" />
            <span className="hidden md:inline">
              Cliquez sur une initiative pour voir ses épics
            </span>
            <span className="md:hidden">Clic → Épics</span>
          </div>

          <Button
            onClick={onCreateInitiative}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ajouter une initiative</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* ✅ MODE LISTE - CORRECTION: div cliquable au lieu de Link */}
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
                {initiatives.map((initiative, index) => {
                  const priorityConfig = getPriorityConfig(initiative.priority);
                  const statusConfig = getStatusConfig(initiative.status);

                  return (
                    <tr
                      key={initiative.id}
                      className={`hover:bg-blue-50 transition-colors group cursor-pointer ${
                        loading ? "opacity-50" : ""
                      }`}
                      onClick={() => handleInitiativeSelect(initiative)}
                      title="Cliquer pour voir les épics de cette initiative"
                    >
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                            {initiative.name}
                            <ArrowRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {initiative.description && (
                            <div className="text-sm text-gray-500 truncate mt-1">
                              {initiative.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={`${priorityConfig.color} font-medium`}
                        >
                          {priorityConfig.icon} {priorityConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${statusConfig.color} font-medium`}>
                          {statusConfig.icon} {statusConfig.label}
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
                          <span className="font-medium">
                            {formatCurrency(initiative.budget)}
                          </span>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ✅ MODE CARTES - CORRECTION: div cliquable au lieu de Link */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initiatives.map((initiative, index) => {
            const priorityConfig = getPriorityConfig(initiative.priority);
            const statusConfig = getStatusConfig(initiative.status);

            return (
              <Card
                key={initiative.id}
                className={`shadow-sm border hover:shadow-lg hover:border-blue-300 transition-all duration-200 group cursor-pointer ${
                  loading ? "opacity-50" : ""
                }`}
                onClick={() => handleInitiativeSelect(initiative)}
                title="Cliquer pour voir les épics de cette initiative"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 truncate flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                        {initiative.name}
                        <ArrowRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={`${priorityConfig.color} font-medium text-xs`}
                        >
                          {priorityConfig.icon} {priorityConfig.label}
                        </Badge>
                        <Badge
                          className={`${statusConfig.color} font-medium text-xs`}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionButtons
                        initiative={initiative}
                        index={index}
                        isFirst={index === 0}
                        isLast={index === initiatives.length - 1}
                      />
                    </div>
                  </div>

                  {/* Reste du contenu de la carte inchangé... */}
                  {initiative.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {initiative.description}
                    </p>
                  )}

                  {initiative.objective && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">
                          Objectif
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 line-clamp-2 leading-relaxed">
                        {initiative.objective}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-medium">Progrès</span>
                        </div>
                        <span className="font-bold text-gray-900 tabular-nums">
                          {formatPercentage(initiative.progress)}
                        </span>
                      </div>
                      <ProgressBar progress={initiative.progress} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center space-x-2 text-green-700 mb-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">Budget</span>
                        </div>
                        <div className="font-bold text-green-900 text-sm">
                          {formatCurrency(initiative.budget)}
                        </div>
                      </div>
                      {initiative.roi !== null && initiative.roi > 0 && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center space-x-2 text-purple-700 mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">ROI</span>
                          </div>
                          <div className="font-bold text-purple-900 text-sm">
                            {formatPercentage(initiative.roi)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-600 font-medium">
                            Début:
                          </span>
                          <div className="font-semibold text-gray-900 text-xs mt-1">
                            {formatDate(initiative.startDate)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">
                            Fin:
                          </span>
                          <div className="font-semibold text-gray-900 text-xs mt-1">
                            {formatDate(initiative.endDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center text-sm text-blue-600 group-hover:text-blue-700 transition-colors">
                      <MousePointer className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        Cliquer pour voir les épics
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ✅ MODE TREE - CORRECTION: div cliquable au lieu de Link */}
      {viewMode === "tree" && (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="space-y-6">
              {initiatives.map((initiative, index) => {
                const priorityConfig = getPriorityConfig(initiative.priority);
                const statusConfig = getStatusConfig(initiative.status);

                return (
                  <div
                    key={initiative.id}
                    className={`border-l-4 border-blue-600 pl-6 relative transition-colors group cursor-pointer ${
                      loading ? "opacity-50" : ""
                    }`}
                    onClick={() => handleInitiativeSelect(initiative)}
                    title="Cliquer pour voir les épics de cette initiative"
                  >
                    <div className="hover:bg-blue-50 rounded-r-lg transition-colors">
                      <div className="flex items-start justify-between mb-4 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <Target className="h-6 w-6 text-blue-600 flex-shrink-0" />
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                              {initiative.name}
                              <ArrowRight className="h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <Badge
                              className={`${priorityConfig.color} font-medium`}
                            >
                              {priorityConfig.icon} {priorityConfig.label}
                            </Badge>
                            <Badge
                              className={`${statusConfig.color} font-medium`}
                            >
                              {statusConfig.icon} {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Reste du contenu tree mode inchangé... */}
                        </div>

                        <div onClick={(e) => e.stopPropagation()}>
                          <ActionButtons
                            initiative={initiative}
                            index={index}
                            isFirst={index === 0}
                            isLast={index === initiatives.length - 1}
                          />
                        </div>
                      </div>

                      <div className="ml-9 mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center text-sm text-blue-600 group-hover:text-blue-700 transition-colors">
                          <MousePointer className="h-4 w-4 mr-2" />
                          <span className="font-medium">
                            Cliquer partout sur cette zone pour voir les épics
                          </span>
                        </div>
                      </div>
                    </div>

                    {index < initiatives.length - 1 && (
                      <hr className="mt-6 border-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && initiatives.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 font-medium">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Actualisation des initiatives en cours...</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
