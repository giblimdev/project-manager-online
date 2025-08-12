// components/glossary/GlossaryForm.tsx

/**
 * RÔLE : Formulaire de création/modification des termes du glossaire
 * RESPONSABILITÉS :
 * - Validation des données du formulaire avec règles métier
 * - Soumission sécurisée vers API avec gestion d'erreurs
 * - Gestion d'état réactif du formulaire avec TypeScript strict
 * - Interface utilisateur moderne et responsive
 * - Feedback utilisateur en temps réel
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Form, Input, Textarea, Select, Button, Switch, Card, Label
 * - lucide-react: Icons pour améliorer l'UX
 * - sonner: Toast notifications
 * - React Hooks: useState, useEffect pour gestion d'état
 * - TypeScript strict mode avec interfaces complètes
 *
 * API ENDPOINTS :
 * - POST /api/glossary (création)
 * - PUT /api/glossary/[id] (modification)
 *
 * TYPES UTILISÉS :
 * - Basé sur le modèle Prisma Glossary
 * - Interfaces TypeScript strictes pour validation
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  X,
  Loader2,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Tag,
  Hash,
  Type,
  ToggleLeft,
  FileText,
} from "lucide-react";

// Types basés sur votre schéma Prisma
interface GlossaryTerm {
  id: string;
  term: string;
  order: number;
  description: string | null;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GlossaryFormData {
  term: string;
  description: string;
  type: GlossaryTermType;
  order: number;
  isActive: boolean;
}

// Types de termes basés sur les besoins métier
type GlossaryTermType =
  | "TERM"
  | "ACRONYM"
  | "CONCEPT"
  | "TOOL"
  | "PROCESS"
  | "ROLE"
  | "METHODOLOGY"
  | "FRAMEWORK"
  | "TECHNOLOGY";

// Configuration des types de termes avec métadonnées
const GLOSSARY_TERM_TYPES = [
  {
    value: "TERM" as const,
    label: "Terme général",
    description: "Définition d'un terme courant",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: FileText,
  },
  {
    value: "ACRONYM" as const,
    label: "Acronyme",
    description: "Abréviation ou sigle",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: Hash,
  },
  {
    value: "CONCEPT" as const,
    label: "Concept",
    description: "Notion abstraite ou théorique",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: BookOpen,
  },
  {
    value: "TOOL" as const,
    label: "Outil",
    description: "Logiciel, plateforme ou instrument",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    icon: Tag,
  },
  {
    value: "PROCESS" as const,
    label: "Processus",
    description: "Méthode, procédure ou workflow",
    color: "bg-teal-100 text-teal-800 border-teal-300",
    icon: Type,
  },
  {
    value: "ROLE" as const,
    label: "Rôle",
    description: "Fonction ou responsabilité",
    color: "bg-pink-100 text-pink-800 border-pink-300",
    icon: ToggleLeft,
  },
  {
    value: "METHODOLOGY" as const,
    label: "Méthodologie",
    description: "Approche ou méthode structurée",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    icon: BookOpen,
  },
  {
    value: "FRAMEWORK" as const,
    label: "Framework",
    description: "Cadre de travail ou structure",
    color: "bg-cyan-100 text-cyan-800 border-cyan-300",
    icon: Tag,
  },
  {
    value: "TECHNOLOGY" as const,
    label: "Technologie",
    description: "Technologies et stack techniques",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: Type,
  },
] as const;

// Interface pour les props du composant
interface GlossaryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: GlossaryTerm | null;
  onSuccess: (term: GlossaryTerm) => void;
}

// Règles de validation
const VALIDATION_RULES = {
  term: {
    minLength: 1,
    maxLength: 255,
    required: true,
  },
  description: {
    maxLength: 2000,
    required: false,
  },
  order: {
    min: 0,
    max: 999999,
    required: true,
  },
} as const;

export const GlossaryForm: React.FC<GlossaryFormProps> = ({
  open,
  onOpenChange,
  term,
  onSuccess,
}) => {
  // États du formulaire avec valeurs par défaut
  const [formData, setFormData] = useState<GlossaryFormData>({
    term: "",
    description: "",
    type: "TERM",
    order: 1000,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<keyof GlossaryFormData, string>>({
    term: "",
    description: "",
    type: "",
    order: "",
    isActive: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Initialisation du formulaire
  useEffect(() => {
    if (open) {
      if (term) {
        // Mode édition - charger les données existantes
        setFormData({
          term: term.term,
          description: term.description || "",
          type: term.type as GlossaryTermType,
          order: term.order,
          isActive: term.isActive,
        });
      } else {
        // Mode création - valeurs par défaut
        setFormData({
          term: "",
          description: "",
          type: "TERM",
          order: 1000,
          isActive: true,
        });
      }

      // Reset des états
      setErrors({
        term: "",
        description: "",
        type: "",
        order: "",
        isActive: "",
      });
      setIsDirty(false);
    }
  }, [open, term]);

  // Gestion des changements de champs avec validation en temps réel
  const handleInputChange = <K extends keyof GlossaryFormData>(
    field: K,
    value: GlossaryFormData[K]
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Validation en temps réel
    const fieldErrors = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors }));
  };

  // Validation d'un champ spécifique
  const validateField = <K extends keyof GlossaryFormData>(
    field: K,
    value: GlossaryFormData[K]
  ): string => {
    switch (field) {
      case "term":
        const termValue = value as string;
        if (!termValue.trim()) {
          return "Le terme est obligatoire";
        }
        if (termValue.trim().length < VALIDATION_RULES.term.minLength) {
          return `Le terme doit faire au moins ${VALIDATION_RULES.term.minLength} caractère`;
        }
        if (termValue.trim().length > VALIDATION_RULES.term.maxLength) {
          return `Le terme ne peut pas dépasser ${VALIDATION_RULES.term.maxLength} caractères`;
        }
        // Validation de format (lettres, chiffres, espaces, tirets, underscores)
        if (!/^[a-zA-ZÀ-ÿ0-9\s\-_\.]+$/.test(termValue.trim())) {
          return "Le terme contient des caractères non autorisés";
        }
        break;

      case "description":
        const descValue = value as string;
        if (
          descValue &&
          descValue.length > VALIDATION_RULES.description.maxLength
        ) {
          return `La description ne peut pas dépasser ${VALIDATION_RULES.description.maxLength} caractères`;
        }
        break;

      case "order":
        const orderValue = value as number;
        if (orderValue < VALIDATION_RULES.order.min) {
          return `L'ordre ne peut pas être inférieur à ${VALIDATION_RULES.order.min}`;
        }
        if (orderValue > VALIDATION_RULES.order.max) {
          return `L'ordre ne peut pas dépasser ${VALIDATION_RULES.order.max}`;
        }
        break;

      default:
        break;
    }
    return "";
  };

  // Validation complète du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<keyof GlossaryFormData, string> = {
      term: validateField("term", formData.term),
      description: validateField("description", formData.description),
      type: validateField("type", formData.type),
      order: validateField("order", formData.order),
      isActive: validateField("isActive", formData.isActive),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  // Soumission du formulaire
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Erreurs de validation", {
        description: "Veuillez corriger les erreurs dans le formulaire",
        icon: <XCircle className="h-4 w-4" />,
      });
      return;
    }

    try {
      setIsLoading(true);

      const url = term ? `/api/glossary/${term.id}` : "/api/glossary";
      const method = term ? "PUT" : "POST";

      const payload = {
        term: formData.term.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        order: formData.order,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Gestion des erreurs spécifiques
        if (response.status === 409) {
          setErrors((prev) => ({ ...prev, term: "Ce terme existe déjà" }));
          throw new Error("Ce terme existe déjà dans le glossaire");
        }
        throw new Error(
          result.error || `Erreur ${response.status}: ${response.statusText}`
        );
      }

      if (result.success && result.data) {
        onSuccess(result.data);
        onOpenChange(false);

        toast.success(term ? "Terme modifié" : "Terme créé", {
          description: `Le terme "${formData.term}" a été ${
            term ? "modifié" : "créé"
          } avec succès`,
          icon: <CheckCircle className="h-4 w-4" />,
        });
      } else {
        throw new Error("Réponse API invalide - données manquantes");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur de sauvegarde", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur inattendue est survenue",
        icon: <XCircle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion de l'annulation avec confirmation si le formulaire est modifié
  const handleCancel = (): void => {
    if (isDirty) {
      const confirm = window.confirm(
        "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir fermer ?"
      );
      if (!confirm) return;
    }
    onOpenChange(false);
  };

  // Calculs dérivés
  const isEditMode = !!term;
  const hasErrors = Object.values(errors).some((error) => error !== "");
  const selectedTypeConfig = GLOSSARY_TERM_TYPES.find(
    (t) => t.value === formData.type
  );
  const characterCounts = {
    term: formData.term.length,
    description: formData.description.length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span>
                {isEditMode ? "Modifier le terme" : "Créer un nouveau terme"}
              </span>
              {isEditMode && (
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  Modification de "{term?.term}"
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-base">
            {isEditMode
              ? "Modifiez les informations du terme existant"
              : "Ajoutez un nouveau terme au glossaire du projet"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations principales */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations principales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Terme */}
              <div className="space-y-3">
                <Label
                  htmlFor="term"
                  className="text-sm font-semibold flex items-center gap-2"
                >
                  Terme <span className="text-red-500">*</span>
                  {errors.term && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </Label>
                <Input
                  id="term"
                  placeholder="Ex: API, Scrum, User Story, Docker..."
                  value={formData.term}
                  onChange={(e) => handleInputChange("term", e.target.value)}
                  className={`text-base transition-all duration-200 ${
                    errors.term
                      ? "border-red-500 focus:ring-red-500 bg-red-50"
                      : "focus:ring-primary"
                  }`}
                  maxLength={VALIDATION_RULES.term.maxLength}
                  autoFocus={!isEditMode}
                />
                <div className="flex justify-between items-center">
                  {errors.term ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.term}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Utilisez un nom clair et concis
                    </p>
                  )}
                  <span
                    className={`text-xs ${
                      characterCounts.term >
                      VALIDATION_RULES.term.maxLength * 0.9
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.term}/{VALIDATION_RULES.term.maxLength}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label
                  htmlFor="description"
                  className="text-sm font-semibold flex items-center gap-2"
                >
                  Description
                  {errors.description && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le terme en détail, son contexte d'utilisation, ses avantages..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={5}
                  className={`resize-none text-base transition-all duration-200 ${
                    errors.description
                      ? "border-red-500 focus:ring-red-500 bg-red-50"
                      : "focus:ring-primary"
                  }`}
                  maxLength={VALIDATION_RULES.description.maxLength}
                />
                <div className="flex justify-between items-center">
                  {errors.description ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Optionnel - Ajoutez du contexte et des exemples
                    </p>
                  )}
                  <span
                    className={`text-xs ${
                      characterCounts.description >
                      VALIDATION_RULES.description.maxLength * 0.9
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {characterCounts.description}/
                    {VALIDATION_RULES.description.maxLength}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration avancée */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Type de terme */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Type de terme</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: GlossaryTermType) =>
                      handleInputChange("type", value)
                    }
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GLOSSARY_TERM_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-3 py-1">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedTypeConfig && (
                    <div className="flex items-center gap-2">
                      <Badge className={selectedTypeConfig.color}>
                        <selectedTypeConfig.icon className="h-3 w-3 mr-1" />
                        {selectedTypeConfig.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedTypeConfig.description}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ordre */}
                <div className="space-y-3">
                  <Label
                    htmlFor="order"
                    className="text-sm font-semibold flex items-center gap-2"
                  >
                    Ordre d'affichage
                    {errors.order && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    min={VALIDATION_RULES.order.min}
                    max={VALIDATION_RULES.order.max}
                    step="1"
                    placeholder="1000"
                    value={formData.order}
                    onChange={(e) =>
                      handleInputChange("order", parseInt(e.target.value) || 0)
                    }
                    className={`text-base ${
                      errors.order ? "border-red-500 bg-red-50" : ""
                    }`}
                  />
                  {errors.order ? (
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {errors.order}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Plus le nombre est petit, plus le terme apparaîtra en haut
                      (0-999999)
                    </p>
                  )}
                </div>
              </div>

              {/* Statut actif */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <ToggleLeft className="h-4 w-4" />
                        <Label className="text-sm font-semibold">
                          Statut de publication
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formData.isActive
                          ? "Ce terme sera visible et accessible à tous les utilisateurs"
                          : "Ce terme sera masqué et accessible uniquement aux administrateurs"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-medium ${
                          formData.isActive ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {formData.isActive ? "Actif" : "Inactif"}
                      </span>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          handleInputChange("isActive", checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Résumé des erreurs si nécessaire */}
          {hasErrors && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <h4 className="font-semibold">Erreurs de validation</h4>
                    <p className="text-sm">
                      Veuillez corriger les erreurs suivantes :
                    </p>
                  </div>
                </div>
                <ul className="mt-3 text-sm text-red-600 space-y-1">
                  {Object.entries(errors)
                    .filter(([_, error]) => error)
                    .map(([field, error]) => (
                      <li key={field} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full" />
                        <strong className="capitalize">{field}:</strong> {error}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto transition-all duration-200 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || hasErrors}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Modification..." : "Création..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? "Modifier le terme" : "Créer le terme"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GlossaryForm;
