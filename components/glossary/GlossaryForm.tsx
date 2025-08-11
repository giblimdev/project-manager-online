// 📄 /components/glossary/GlossaryForm.tsx
// 🎯 Rôle : Formulaire de création/modification des termes du glossaire
// 📦 Responsabilités : Validation, soumission, gestion d'état du formulaire
// 🔧 Composants utilisés : Dialog, Form, Input, Textarea, Select, Button, toast de shadcn/ui
// 🌐 API : /api/glossary (POST), /api/glossary/[id] (PUT)

"use client";

import { useState, useEffect, JSX } from "react";
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Save,
  X,
  Loader2,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  GlossaryTerm,
  GlossaryFormData,
  GlossaryTermType,
  GLOSSARY_TERM_TYPES,
  TERM_TYPE_COLORS,
} from "@/types/glossary";

// 🔧 Interface pour les props du composant
interface GlossaryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: GlossaryTerm | null;
  onSuccess: (term: GlossaryTerm) => void;
}

export default function GlossaryForm({
  open,
  onOpenChange,
  term,
  onSuccess,
}: GlossaryFormProps): JSX.Element {
  // 🎨 États du formulaire avec valeurs par défaut
  const [formData, setFormData] = useState<GlossaryFormData>({
    term: "",
    description: "",
    type: "TERM",
    order: 1000,
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 🔄 Initialisation du formulaire
  useEffect(() => {
    if (open) {
      if (term) {
        // Mode édition
        setFormData({
          term: term.term,
          description: term.description || "",
          type: term.type,
          order: term.order,
          isActive: term.isActive,
        });
      } else {
        // Mode création - reset
        setFormData({
          term: "",
          description: "",
          type: "TERM",
          order: 1000,
          isActive: true,
        });
      }
      // Reset des erreurs
      setErrors({});
    }
  }, [open, term]);

  // 🔧 Gestion des changements de champs
  const handleInputChange = <K extends keyof GlossaryFormData>(
    field: K,
    value: GlossaryFormData[K]
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Supprime l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // 🔍 Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du terme (obligatoire)
    if (!formData.term.trim()) {
      newErrors.term = "Le terme est obligatoire";
    } else if (formData.term.trim().length < 2) {
      newErrors.term = "Le terme doit faire au moins 2 caractères";
    } else if (formData.term.trim().length > 255) {
      newErrors.term = "Le terme ne peut pas dépasser 255 caractères";
    }

    // Validation de la description (optionnelle mais limitée)
    if (formData.description && formData.description.length > 1000) {
      newErrors.description =
        "La description ne peut pas dépasser 1000 caractères";
    }

    // Validation de l'ordre
    if (formData.order < 0) {
      newErrors.order = "L'ordre ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 📤 Soumission du formulaire
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

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term: formData.term.trim(),
          description: formData.description?.trim() || null,
          type: formData.type,
          order: formData.order,
          isActive: formData.isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
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
        throw new Error("Réponse API invalide");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur de sauvegarde", {
        description:
          error instanceof Error ? error.message : "Une erreur est survenue",
        icon: <XCircle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🚫 Annulation
  const handleCancel = (): void => {
    onOpenChange(false);
  };

  const isEditMode = !!term;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            {isEditMode ? "Modifier le terme" : "Créer un nouveau terme"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 📝 Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Informations principales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Terme */}
              <div className="space-y-2">
                <Label
                  htmlFor="term"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  Terme <span className="text-red-500">*</span>
                  {errors.term && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </Label>
                <Input
                  id="term"
                  placeholder="Ex: API, Scrum, User Story..."
                  value={formData.term}
                  onChange={(e) => handleInputChange("term", e.target.value)}
                  className={`transition-colors ${
                    errors.term ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  maxLength={255}
                />
                {errors.term && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.term}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.term.length}/255 caractères
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  Description
                  {errors.description && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le terme en détail..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  className={`resize-none transition-colors ${
                    errors.description
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {(formData.description || "").length}/1000 caractères
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 🎯 Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type de terme</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: GlossaryTermType) =>
                      handleInputChange("type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GLOSSARY_TERM_TYPES.filter(
                        (type) => type.value !== "ALL"
                      ).map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-3">
                            <div
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                TERM_TYPE_COLORS[type.value]
                              }`}
                            >
                              {type.label}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ordre */}
                <div className="space-y-2">
                  <Label
                    htmlFor="order"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    Ordre d'affichage
                    {errors.order && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="1000"
                    value={formData.order}
                    onChange={(e) =>
                      handleInputChange("order", parseInt(e.target.value) || 0)
                    }
                    className={errors.order ? "border-red-500" : ""}
                  />
                  {errors.order && (
                    <p className="text-sm text-red-500">{errors.order}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Plus le nombre est petit, plus le terme apparaîtra en haut
                  </p>
                </div>
              </div>

              {/* Statut actif */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Statut du terme</Label>
                  <p className="text-xs text-muted-foreground">
                    Les termes inactifs ne seront pas affichés publiquement
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* 🚨 Résumé des erreurs */}
          {hasErrors && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <h4 className="font-medium">
                    Veuillez corriger les erreurs suivantes :
                  </h4>
                </div>
                <ul className="mt-2 text-sm text-red-600 list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* 🎯 Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || hasErrors}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105"
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
}
