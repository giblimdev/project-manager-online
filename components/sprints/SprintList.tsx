// @/components/sprints/SprintList.tsx

/**
 * COMPOSANT : SprintList
 *
 * RÔLE : Contrôleur de vue pour l'affichage des sprints selon le mode sélectionné
 *
 * RESPONSABILITÉS :
 * - Centraliser la logique d'affichage des vues sprints
 * - Faire le pont entre les données et les composants d'affichage
 * - Garantir la cohérence des props passées aux vues enfants
 * - Gérer les transitions entre les modes d'affichage
 *
 * PROPS :
 * @param {Sprint[]} sprints - Liste des sprints à afficher (typée avec le modèle Prisma)
 * @param {"list" | "card"} viewMode - Mode de visualisation actif
 * @param {(sprintId: string) => void} onEdit - Callback pour l'édition d'un sprint
 * @param {(sprintId: string) => void} onDelete - Callback pour la suppression
 * @param {boolean} [isLoading] - État de chargement optionnel
 * @param {string} [emptyMessage] - Message personnalisé quand aucun sprint
 *
 * COMPOSANTS ENFANTS :
 * - SprintViewListe : Vue liste verticale
 * - SprintViewCard : Vue grille de cartes
 *
 * OPTIMISATIONS :
 * - Mémoïsation pour éviter les rendus inutiles
 * - Typage strict avec le modèle Prisma
 * - Gestion des états vides et loading
 */

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Sprint } from "@/lib/generated/prisma/client";

// Chargement dynamique pour le code splitting
const SprintViewListe = dynamic(() => import("./views/SprintViewListe"), {
  loading: () => <div>Chargement de la vue liste...</div>,
});

const SprintViewCard = dynamic(() => import("./views/SprintViewCard"), {
  loading: () => <div>Chargement de la vue cartes...</div>,
});

interface SprintListProps {
  sprints: Sprint[];
  viewMode: "list" | "card";
  onEdit: (sprintId: string) => void;
  onDelete: (sprintId: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function SprintList({
  sprints,
  viewMode,
  onEdit,
  onDelete,
  isLoading = false,
  emptyMessage = "Aucun sprint à afficher",
}: SprintListProps) {
  // Mémoïsation pour éviter les recalculs inutiles
  const memoizedSprints = useMemo(() => sprints, [sprints]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (!memoizedSprints || memoizedSprints.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="sprint-list-container">
      {viewMode === "list" ? (
        <SprintViewListe
          sprints={memoizedSprints}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <SprintViewCard
          sprints={memoizedSprints}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
