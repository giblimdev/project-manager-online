// components/initiatives/InitiativesDisplay.tsx
"use client";

import React, { useState, useEffect, JSX } from "react";
import InitiativesList from "./InitiativesList";
import InitiativesForm from "./InitiativesForm";

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

interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface InitiativesDisplayProps {
  projectId: string;
  filters: FilterState;
  viewMode: "list" | "card" | "tree";
}

export default function InitiativesDisplay({
  projectId,
  filters,
  viewMode,
}: InitiativesDisplayProps): JSX.Element {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(
    null
  );

  const fetchInitiatives = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/initiatives?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des initiatives");
      }

      const data = await response.json();
      setInitiatives(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitiatives();
  }, [projectId]);

  const filteredInitiatives = initiatives.filter((initiative) => {
    const matchesName = initiative.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    const matchesPriority =
      filters.priority === "ALL" || initiative.priority === filters.priority;

    return matchesName && matchesPriority;
  });

  const handleCreateInitiative = (): void => {
    setEditingInitiative(null);
    setShowForm(true);
  };

  const handleEditInitiative = (initiative: Initiative): void => {
    setEditingInitiative(initiative);
    setShowForm(true);
  };

  const handleDeleteInitiative = async (
    initiativeId: string
  ): Promise<void> => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette initiative ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/initiatives/${initiativeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      await fetchInitiatives();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    }
  };

  const handleFormSuccess = (): void => {
    setShowForm(false);
    setEditingInitiative(null);
    fetchInitiatives();
  };

  const handleFormCancel = (): void => {
    setShowForm(false);
    setEditingInitiative(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <InitiativesForm
          projectId={projectId}
          initiative={editingInitiative}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <InitiativesList
        initiatives={filteredInitiatives}
        viewMode={viewMode}
        onCreateInitiative={handleCreateInitiative}
        onEditInitiative={handleEditInitiative}
        onDeleteInitiative={handleDeleteInitiative}
      />
    </div>
  );
}
