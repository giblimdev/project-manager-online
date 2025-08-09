// components/epics/EpicsDisplay.tsx

/**
 * RÔLE : Composant intermédiaire pour la gestion des épics avec filtrage et affichage selon le mode
 * RESPONSABILITÉS :
 * - Réception des épics depuis la page parent et application des filtres
 * - Filtrage par nom et priorité selon l'état des filtres reçus
 * - Sélection du mode d'affichage et transmission à EpicsList
 * - Gestion des props et callbacks pour les actions sur les épics
 * - Interface entre la page et le composant d'affichage pour une architecture séparée
 * - Optimisation des performances avec useMemo pour les filtres
 * - Validation des données et gestion des états vides
 *
 * COMPOSANTS UTILISÉS :
 * - EpicsList: Composant d'affichage des épics selon le mode sélectionné
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useMemo, JSX
 * - TypeScript strict mode avec interfaces complètes
 *
 * PROPS reçues de la page :
 * - projectId: string - ID du projet pour les épics
 * - filters: FilterState - État des filtres (nom, priorité)
 * - viewMode: ViewMode - Mode d'affichage sélectionné
 * - epics: Epic[] - Liste des épics à afficher
 * - onCreateEpic: () => void - Handler création épic
 * - onEditEpic: (epic: Epic) => void - Handler édition épic
 * - onDeleteEpic: (epicId: string) => void - Handler suppression épic
 * - onMoveEpic: (epicId: string, direction: "up" | "down") => void - Handler réorganisation
 * - loading: boolean - État de chargement
 */

"use client";

import React, { JSX, useMemo } from "react";
import EpicsList from "@/components/epics/EpicsList";

// Interface Epic selon le schéma Prisma
export interface Epic {
  id: string;
  name: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  initiativeId: string;
  createdAt: Date;
  updatedAt: Date;
  features?: Array<{
    id: string;
    name: string;
    progress: number;
  }>;
}

// Interface pour les filtres
interface FilterState {
  name: string;
  priority: "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Types pour les modes d'affichage
type ViewMode = "list" | "card" | "tree";

// Interface pour les props du composant
interface EpicsDisplayProps {
  projectId: string;
  filters: FilterState;
  viewMode: ViewMode;
  epics: Epic[];
  onCreateEpic: () => void;
  onEditEpic: (epic: Epic) => void;
  onDeleteEpic: (epicId: string) => void;
  onMoveEpic: (epicId: string, direction: "up" | "down") => void;
  loading: boolean;
}

export default function EpicsDisplay({
  projectId,
  filters,
  viewMode,
  epics,
  onCreateEpic,
  onEditEpic,
  onDeleteEpic,
  onMoveEpic,
  loading,
}: EpicsDisplayProps): JSX.Element {
  // Filtrage des épics selon les critères sélectionnés
  const filteredEpics = useMemo(() => {
    let filtered = [...epics];

    // Filtrage par nom
    if (filters.name.trim()) {
      const searchTerm = filters.name.toLowerCase().trim();
      filtered = filtered.filter(
        (epic) =>
          epic.name.toLowerCase().includes(searchTerm) ||
          epic.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrage par priorité
    if (filters.priority !== "ALL") {
      filtered = filtered.filter((epic) => epic.priority === filters.priority);
    }

    return filtered;
  }, [epics, filters]);

  // Transmission des épics filtrés à EpicsList
  return (
    <EpicsList
      epics={filteredEpics}
      viewMode={viewMode}
      onCreateEpic={onCreateEpic}
      onEditEpic={onEditEpic}
      onDeleteEpic={onDeleteEpic}
      onMoveEpic={onMoveEpic}
      loading={loading}
    />
  );
}
