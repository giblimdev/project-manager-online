// app/initiatives/page.tsx
"use client";

import React, { JSX, useState } from "react";
import { useSelectedProjectStore } from "@/stores/useSelectedProjectStore";
import InitiativesDisplay from "@/components/initiatives/InitiativesDisplay";
import InitiativesFilter from "@/components/initiatives/InitiativesFilter";

interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export default function InitiativesPage(): JSX.Element {
  const { selectedProject } = useSelectedProjectStore();
  const [filters, setFilters] = useState<FilterState>({
    name: "",
    priority: "ALL",
  });
  const [viewMode, setViewMode] = useState<"list" | "card" | "tree">("card");

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun projet sélectionné
          </h2>
          <p className="text-gray-500">
            Veuillez sélectionner un projet pour voir les initiatives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Initiatives</h1>
              <p className="text-gray-600 mt-1">
                Projet:{" "}
                <span className="font-medium">{selectedProject.name}</span>
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              {(["list", "card", "tree"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {mode === "list" && "📋"}
                  {mode === "card" && "🗂️"}
                  {mode === "tree" && "🌳"}
                  <span className="ml-2 capitalize">{mode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <InitiativesFilter filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Display */}
        <InitiativesDisplay
          projectId={selectedProject.id}
          filters={filters}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}
