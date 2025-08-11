//@/app/projects/[id]/sprint/page.tsx
/**
 * RÔLE : Page de gestion des sprint d'un projet sélectionné avec architecture séparée
 * RESPONSABILITÉS :
 * - Affichage des sprint du projet sélectionné via le store Zustand
 * - Gestion des filtres par nom et priorité (LOW, MEDIUM, HIGH, CRITICAL) via sprintFilter si applicable.
 * - Basculement entre les modes d'affichage (list, card, tree) via EpicsDisplay
 * - SprintDisplay sélectionne le mode et transmet à EpicsList qui affiche selon le mode
 * - SprintList gère l'affichage des Sprint + boutons actions (edit, delete, up, down) + bouton ajouter
 * - SprintForm en modal pour création/édition de Sprint
 * - Vérification de la sélection du projet avec gestion d'erreur
 * - Interface responsive et moderne avec design cards et transitions
 * - Intégration avec le store useSelectedProjectStore pour la persistance
 * - Gestion des états de chargement et d'hydratation du store
 * - Protection contre les boucles infinies d'appels API
 *
 * COMPOSANTS UTILISÉS :
 * - SprintDisplay: Composant qui sélectionne le mode d'affichage et transmet à EpicsList
 * - SprintList: Affiche les épics selon le mode sélectionné + boutons d'actions + bouton ajouter
 * - SprintFilter: Composant de filtrage par nom et priorité
 * - SprintForm: Formulaire de création/édition de Sprint modale avec fond transparent et desingn moderne t coloré et professionnel.
 * - useSelectedProjectStore: Store Zustand pour le projet sélectionné
 * - useProjectStoreHydration: Hook d'hydratation sécurisée du store
 * - Card, CardContent, Button: Composants UI shadcn/ui
 * - Skeleton: Composant de loading state
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, useRef, JSX
 * - Next.js 15 client component
 * - Zustand: Store management avec persistance localStorage
 * - TypeScript strict mode avec interfaces complètes
 * - Tailwind CSS: Design moderne responsive avec gradient et shadows
 * - lucide-react: Icons (RefreshCw, AlertTriangle, Folder, PlusCircle, Target)
 * - shadcn/ui: Card, Button, Skeleton components
 * - sonner: Toast notifications pour les actions utilisateur
 *
 * API :
 * - GET /api/sprint?projectId=[id] (liste des sprint d'un projet)
 * - POST /api/sprint (création d'un nouvel sprint)
 * - PUT /api/sprint/[id] (mise à jour d'un sprint)
 * - DELETE /api/sprint/[id] (suppression d'un sprint)
 * - Utilise les données du store chargées par /api/projects/[id]
 */

import React from "react";

export default function page() {
  return <div>sprint</div>;
}
