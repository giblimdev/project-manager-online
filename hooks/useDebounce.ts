// hooks/useDebounce.ts
/**
 * RÔLE : Hook pour debouncer les valeurs
 * RESPONSABILITÉS :
 * - Retarder l'actualisation d'une valeur pour éviter les appels API trop fréquents
 * - Optimiser les performances des composants avec entrée utilisateur
 * - Gérer automatiquement le nettoyage des timers pour éviter les fuites mémoire
 * - Fournir une interface typée générique pour tous types de valeurs
 *
 * COMPOSANTS/LIBS UTILISÉS :
 * - React hooks: useEffect, useState
 * - setTimeout/clearTimeout pour la gestion temporelle
 *
 * UTILISATION TYPIQUE :
 * - Recherche en temps réel avec input utilisateur
 * - Validation de formulaires avec retard
 * - Optimisation des appels API lors de la saisie
 */

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
