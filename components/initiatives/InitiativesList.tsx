// components/initiatives/InitiativesList.tsx
"use client";

import React, { JSX } from "react";
import { Initiative } from "./InitiativesDisplay";

interface InitiativesListProps {
  initiatives: Initiative[];
  viewMode: "list" | "card" | "tree";
  onCreateInitiative: () => void;
  onEditInitiative: (initiative: Initiative) => void;
  onDeleteInitiative: (initiativeId: string) => void;
}

export default function InitiativesList({
  initiatives,
  viewMode,
  onCreateInitiative,
  onEditInitiative,
  onDeleteInitiative,
}: InitiativesListProps): JSX.Element {
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const formatDate = (date: Date | null): string => {
    if (!date) return "Non défini";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (initiatives.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune initiative trouvée
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre première initiative pour commencer.
          </p>
          <button
            onClick={onCreateInitiative}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Créer une initiative
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'ajout */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {initiatives.length} initiative{initiatives.length > 1 ? "s" : ""}
        </h2>
        <button
          onClick={onCreateInitiative}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Ajouter une initiative
        </button>
      </div>

      {/* Liste des initiatives */}
      {viewMode === "list" && (
        <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initiatives.map((initiative) => (
                  <tr key={initiative.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {initiative.name}
                        </div>
                        {initiative.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {initiative.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          initiative.priority
                        )}`}
                      >
                        {getPriorityIcon(initiative.priority)}{" "}
                        {initiative.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {initiative.status}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${initiative.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 min-w-0">
                          {initiative.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(initiative.budget)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => onEditInitiative(initiative)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Modifier"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteInitiative(initiative.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Supprimer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue en cartes */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {initiative.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                        initiative.priority
                      )}`}
                    >
                      {getPriorityIcon(initiative.priority)}{" "}
                      {initiative.priority}
                    </span>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onEditInitiative(initiative)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Modifier"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteInitiative(initiative.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Supprimer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {initiative.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {initiative.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progrès</span>
                      <span>{initiative.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${initiative.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Statut:</span>
                    <span className="font-medium">{initiative.status}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">
                      {formatCurrency(initiative.budget)}
                    </span>
                  </div>

                  {initiative.roi !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ROI:</span>
                      <span className="font-medium">{initiative.roi}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vue en arbre */}
      {viewMode === "tree" && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-4">
              {initiatives.map((initiative, index) => (
                <div
                  key={initiative.id}
                  className="border-l-4 border-blue-600 pl-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">📋</span>
                        {initiative.name}
                        <span
                          className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            initiative.priority
                          )}`}
                        >
                          {getPriorityIcon(initiative.priority)}{" "}
                          {initiative.priority}
                        </span>
                      </h3>
                      {initiative.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {initiative.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => onEditInitiative(initiative)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Modifier"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDeleteInitiative(initiative.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Supprimer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-gray-600">Statut:</span>
                      <div className="font-medium">{initiative.status}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Progrès:</span>
                      <div className="font-medium">{initiative.progress}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <div className="font-medium">
                        {formatCurrency(initiative.budget)}
                      </div>
                    </div>
                    {initiative.roi !== null && (
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <div className="font-medium">{initiative.roi}%</div>
                      </div>
                    )}
                  </div>

                  {/* Epics sous l'initiative */}
                  {initiative.epics && initiative.epics.length > 0 && (
                    <div className="mt-4 ml-6 space-y-2">
                      {initiative.epics.map((epic) => (
                        <div
                          key={epic.id}
                          className="border-l-2 border-green-400 pl-3"
                        >
                          <div className="flex items-center text-sm">
                            <span className="mr-2">🎯</span>
                            <span className="font-medium text-gray-800">
                              {epic.name}
                            </span>
                            <span className="ml-2 text-gray-600">
                              ({epic.progress}%)
                            </span>
                          </div>
                          {epic.features && epic.features.length > 0 && (
                            <div className="mt-2 ml-6 space-y-1">
                              {epic.features.map((feature) => (
                                <div
                                  key={feature.id}
                                  className="text-xs text-gray-600 flex items-center"
                                >
                                  <span className="mr-2">✨</span>
                                  <span>{feature.name}</span>
                                  <span className="ml-auto">
                                    {feature.progress}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {index < initiatives.length - 1 && (
                    <hr className="mt-4 border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
