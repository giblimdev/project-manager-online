// components/initiatives/InitiativesFilter.tsx
"use client";

import React, { JSX } from "react";

interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface InitiativesFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function InitiativesFilter({
  filters,
  onFiltersChange,
}: InitiativesFilterProps): JSX.Element {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onFiltersChange({
      ...filters,
      name: e.target.value,
    });
  };

  const handlePriorityChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    onFiltersChange({
      ...filters,
      priority: e.target.value as FilterState["priority"],
    });
  };

  const clearFilters = (): void => {
    onFiltersChange({
      name: "",
      priority: "ALL",
    });
  };

  const hasActiveFilters = filters.name !== "" || filters.priority !== "ALL";

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search by name */}
        <div className="flex-1">
          <label
            htmlFor="name-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Rechercher par nom
          </label>
          <div className="relative">
            <input
              id="name-filter"
              type="text"
              placeholder="Nom de l'initiative..."
              value={filters.name}
              onChange={handleNameChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Priority filter */}
        <div className="w-full lg:w-64">
          <label
            htmlFor="priority-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Priorité
          </label>
          <select
            id="priority-filter"
            value={filters.priority}
            onChange={handlePriorityChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="LOW">🟢 Faible</option>
            <option value="MEDIUM">🟡 Moyenne</option>
            <option value="HIGH">🟠 Élevée</option>
            <option value="CRITICAL">🔴 Critique</option>
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.name && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Nom: "{filters.name}"
                <button
                  onClick={() => onFiltersChange({ ...filters, name: "" })}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.priority !== "ALL" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Priorité: {filters.priority}
                <button
                  onClick={() =>
                    onFiltersChange({ ...filters, priority: "ALL" })
                  }
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
