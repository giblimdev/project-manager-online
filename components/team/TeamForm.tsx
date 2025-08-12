// components/team/TeamForm.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Team, TeamFormData, TeamFormErrors } from "@/types/team";
import { X, Save, Plus, Loader2 } from "lucide-react";

// Rôle : Formulaire de création et modification d'équipes
// Responsabilités : Validation, soumission, gestion d'état du formulaire
// Composants utilisés : React hooks (useState, useEffect), Lucide icons
// Types utilisés : Team, TeamFormData, TeamFormErrors depuis @/types/team
// Validation : Contrôles stricts pour nom, slug, description, logoUrl
// Next.js 15 : Compatible avec les nouvelles API routes

type TeamFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (team: TeamFormData) => Promise<void>;
  parentTeams: Team[];
  initialData?: Team | null;
  loading?: boolean;
};

export default function TeamForm({
  isOpen,
  onClose,
  onSubmit,
  parentTeams,
  initialData,
  loading = false,
}: TeamFormProps) {
  // ✅ État du formulaire avec valeurs par défaut strictement typées
  const [formData, setFormData] = useState<TeamFormData>({
    name: "",
    description: null,
    slug: "",
    logoUrl: null,
    order: 1000,
    parentTeamId: null,
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<TeamFormErrors>({});

  // ✅ Réinitialisation du formulaire avec gestion stricte des types
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description, // Déjà string | null
        slug: initialData.slug,
        logoUrl: initialData.logoUrl, // Déjà string | null
        order: initialData.order,
        parentTeamId: initialData.parentTeamId, // Déjà string | null
        isActive: initialData.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: null,
        slug: "",
        logoUrl: null,
        order: 1000,
        parentTeamId: null,
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Auto-génération du slug à partir du nom
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) });
  };

  // ✅ Validation stricte du formulaire
  const validateForm = (): boolean => {
    const newErrors: TeamFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Le nom ne peut pas dépasser 100 caractères";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Le slug est requis";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug =
        "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets";
    } else if (formData.slug.length < 2) {
      newErrors.slug = "Le slug doit contenir au moins 2 caractères";
    } else if (formData.slug.length > 50) {
      newErrors.slug = "Le slug ne peut pas dépasser 50 caractères";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description =
        "La description ne peut pas dépasser 500 caractères";
    }

    if (formData.logoUrl && formData.logoUrl.trim()) {
      try {
        new URL(formData.logoUrl);
      } catch {
        newErrors.logoUrl = "L'URL du logo n'est pas valide";
      }
    }

    if (formData.order < 0) {
      newErrors.order = "L'ordre ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la sauvegarde",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ne pas rendre si la modale n'est pas ouverte
  if (!isOpen) return null;

  const isDisabled = isSubmitting || loading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? "Modifier l'équipe" : "Ajouter une nouvelle équipe"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isDisabled}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Container avec scroll */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de l'équipe *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                } focus:ring-2 focus:border-transparent`}
                placeholder="Nom de l'équipe"
                required
                disabled={isDisabled}
                maxLength={100}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.slug
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                } focus:ring-2 focus:border-transparent`}
                placeholder="slug-de-lequipe"
                required
                disabled={isDisabled}
                maxLength={50}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Utilisé dans les URLs (lettres minuscules, chiffres et tirets
                uniquement)
              </p>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.slug}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value || null,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white transition-colors resize-none ${
                  errors.description
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                } focus:ring-2 focus:border-transparent`}
                placeholder="Description de l'équipe (optionnel)"
                rows={3}
                disabled={isDisabled}
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                <div />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(formData.description || "").length}/500
                </span>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Équipe parente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Équipe parente
              </label>
              <select
                value={formData.parentTeamId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    parentTeamId: e.target.value || null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={isDisabled}
              >
                <option value="">Aucune (équipe principale)</option>
                {parentTeams
                  .filter((team) => !initialData || team.id !== initialData.id)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Cette équipe sera une sous-équipe de l'équipe sélectionnée
              </p>
            </div>

            {/* URL du logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL du logo
              </label>
              <input
                type="url"
                value={formData.logoUrl || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    logoUrl: e.target.value || null,
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.logoUrl
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                } focus:ring-2 focus:border-transparent`}
                placeholder="https://example.com/logo.png"
                disabled={isDisabled}
              />
              {errors.logoUrl && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.logoUrl}
                </p>
              )}
            </div>

            {/* Ordre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordre d'affichage
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: Math.max(0, parseInt(e.target.value) || 1000),
                  })
                }
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white transition-colors ${
                  errors.order
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                } focus:ring-2 focus:border-transparent`}
                min="0"
                disabled={isDisabled}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Plus le nombre est petit, plus l'équipe apparaîtra en premier
              </p>
              {errors.order && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.order}
                </p>
              )}
            </div>

            {/* Statut actif */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                disabled={isDisabled}
              />
              <div>
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Équipe active
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Les équipes inactives ne sont pas visibles dans la liste
                  principale
                </p>
              </div>
            </div>

            {/* Erreur de soumission */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.submit}
                </p>
              </div>
            )}
          </div>

          {/* Actions - Fixe en bas */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isDisabled}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {isDisabled ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Traitement...
                </>
              ) : (
                <>
                  {initialData ? (
                    <Save size={16} className="mr-2" />
                  ) : (
                    <Plus size={16} className="mr-2" />
                  )}
                  {initialData ? "Mettre à jour" : "Créer l'équipe"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
