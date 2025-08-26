// components/glossary/GlossaryForm.tsx

/**
 * RÔLE : Formulaire de création/modification d'un terme de glossaire
 * RESPONSABILITÉS :
 * - Validation des données en temps réel
 * - Gestion des erreurs utilisateur
 * - Interface moderne et responsive
 * - Support du champ JSON éditable pour métadonnées
 * - Intégration avec l'API de glossaire
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Form, Input, Textarea, Select, Switch, Button
 * - React Hook Form pour la validation
 * - Zod pour la validation de schéma
 * - JSON Editor pour les métadonnées
 */

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Save,
  X,
  FileText,
  Tag,
  Hash,
  Code,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";

// Types basés sur le schéma Prisma
interface GlossaryTerm {
  id: string;
  term: string;
  order: number;
  description: string | null;
  type: string;
  category?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Configuration des types
const GLOSSARY_TERM_TYPES = [
  { value: "TERM", label: "Terme", description: "Définition générale", icon: FileText },
  { value: "ACRONYM", label: "Acronyme", description: "Abréviation", icon: Tag },
  { value: "CONCEPT", label: "Concept", description: "Notion abstraite", icon: Hash },
  { value: "TOOL", label: "Outil", description: "Logiciel ou plateforme", icon: Code },
  { value: "PROCESS", label: "Processus", description: "Méthode ou procédure", icon: FileText },
  { value: "ROLE", label: "Rôle", description: "Fonction ou responsabilité", icon: Tag },
  { value: "METHODOLOGY", label: "Méthodologie", description: "Approche structurée", icon: Hash },
  { value: "FRAMEWORK", label: "Framework", description: "Cadre de travail", icon: Code },
  { value: "TECHNOLOGY", label: "Technologie", description: "Stack technique", icon: Code },
] as const;

// Schéma de validation avec Zod
const formSchema = z.object({
  term: z
    .string()
    .min(1, "Le terme est obligatoire")
    .max(255, "Le terme ne peut pas dépasser 255 caractères")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_\.]+$/, "Caractères non autorisés"),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .optional(),
  type: z.string().min(1, "Le type est obligatoire"),
  category: z
    .string()
    .max(100, "La catégorie ne peut pas dépasser 100 caractères")
    .optional(),
  order: z
    .number()
    .min(0, "L'ordre doit être positif")
    .max(999999, "L'ordre ne peut pas dépasser 999999"),
  isActive: z.boolean(),
  metadata: z.string().optional(), // JSON sous forme de string
});

type FormData = z.infer<typeof formSchema>;

interface GlossaryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: GlossaryTerm | null;
  onSuccess: (term: GlossaryTerm) => void;
}

export const GlossaryForm: React.FC<GlossaryFormProps> = ({
  open,
  onOpenChange,
  term,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [previewJson, setPreviewJson] = useState<any>(null);

  const isEditing = !!term;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: "",
      description: "",
      type: "TERM",
      category: "",
      order: 1000,
      isActive: true,
      metadata: "{}",
    },
  });

  // Réinitialiser le formulaire quand le terme change
  useEffect(() => {
    if (open) {
      if (term) {
        form.reset({
          term: term.term,
          description: term.description || "",
          type: term.type,
          category: term.category || "",
          order: term.order,
          isActive: term.isActive,
          metadata: "{}",
        });
      } else {
        form.reset({
          term: "",
          description: "",
          type: "TERM",
          category: "",
          order: 1000,
          isActive: true,
          metadata: "{}",
        });
      }
      setJsonError(null);
      setPreviewJson(null);
    }
  }, [open, term, form]);

  // Validation JSON en temps réel
  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setJsonError(null);
      setPreviewJson(null);
      return true;
    }

    try {
      const parsed = JSON.parse(jsonString);
      setJsonError(null);
      setPreviewJson(parsed);
      return true;
    } catch (error) {
      setJsonError("JSON invalide : " + (error as Error).message);
      setPreviewJson(null);
      return false;
    }
  };

  // Soumission du formulaire
const onSubmit = async (data: FormData) => {
  try {
    setIsLoading(true);

    // Validation JSON
    if (data.metadata && !validateJson(data.metadata)) {
      toast.error("Veuillez corriger les erreurs JSON");
      return;
    }

    const url = isEditing ? `/api/glossary/${term!.id}` : "/api/glossary";
    const method = isEditing ? "PUT" : "POST";

    const payload = {
      term: data.term.trim(),
      description: data.description?.trim() || null,
      type: data.type,
      category: data.category?.trim() || null,
      order: data.order,
      isActive: data.isActive,
      metadata: data.metadata ? JSON.parse(data.metadata) : {},
    };

    // ✅ Ajout d'await ici
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erreur lors de la sauvegarde");
    }

    if (result.success && result.data) {
      toast.success(
        isEditing ? "Terme mis à jour" : "Terme créé",
        {
          description: `Le terme "${data.term}" a été ${
            isEditing ? "modifié" : "créé"
          } avec succès`,
        }
      );
      onSuccess(result.data);
      onOpenChange(false);
    } else {
      throw new Error("Réponse invalide du serveur");
    }
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error);
    toast.error("Erreur de sauvegarde", {
      description:
        error instanceof Error
          ? error.message
          : "Impossible de sauvegarder le terme",
    });
  } finally {
    setIsLoading(false);
  }
};
  // Formatage JSON
  const formatJson = () => {
    const currentValue = form.getValues("metadata");
    try {
      const parsed = JSON.parse(currentValue || "{}");
      const formatted = JSON.stringify(parsed, null, 2);
      form.setValue("metadata", formatted);
      validateJson(formatted);
    } catch (error) {
      toast.error("Impossible de formater le JSON invalide");
    }
  };

  // Réinitialiser JSON
  const resetJson = () => {
    form.setValue("metadata", "{}");
    setJsonError(null);
    setPreviewJson({});
  };

  const selectedType = GLOSSARY_TERM_TYPES.find(
    (t) => t.value === form.watch("type")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {selectedType?.icon && <selectedType.icon className="h-6 w-6" />}
            {isEditing ? "Modifier le terme" : "Ajouter un terme"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du terme ci-dessous"
              : "Remplissez les informations pour créer un nouveau terme"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche - Informations principales */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informations principales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Terme */}
                    <FormField
                      control={form.control}
                      name="term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terme *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: API, Scrum, Sprint..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Nom du terme (lettres, chiffres, espaces, tirets autorisés)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez le terme en détail..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Description détaillée du terme (optionnel)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Type */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GLOSSARY_TERM_TYPES.map((type) => {
                                const Icon = type.icon;
                                return (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      <div>
                                        <div className="font-medium">
                                          {type.label}
                                        </div>
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
                          <FormDescription>
                            Catégorisez le type de terme
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Catégorie */}
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Technique, Business, Agile..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Catégorie libre pour organiser vos termes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Colonne droite - Paramètres et métadonnées */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Paramètres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ordre */}
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ordre</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="999999"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Ordre d'affichage (0-999999)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Statut actif */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Terme actif</FormLabel>
                            <FormDescription>
                              Les termes inactifs sont masqués par défaut
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Aperçu du type sélectionné */}
                    {selectedType && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <selectedType.icon className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800 dark:text-blue-200">
                            {selectedType.label}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {selectedType.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Métadonnées JSON */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Métadonnées JSON
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metadata"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Données structurées</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{"tags": ["api", "rest"], "version": "v1"}'
                              rows={8}
                              className="font-mono text-sm"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                validateJson(e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Métadonnées au format JSON (optionnel)
                          </FormDescription>
                          {jsonError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm">
                              <AlertCircle className="h-4 w-4" />
                              {jsonError}
                            </div>
                          )}
                          {!jsonError && previewJson && (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              JSON valide
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Actions JSON */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={formatJson}
                        className="flex items-center gap-2"
                      >
                        <Code className="h-4 w-4" />
                        Formater
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetJson}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Réinitialiser
                      </Button>
                    </div>

                    {/* Aperçu JSON */}
                    {previewJson && Object.keys(previewJson).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            Aperçu
                          </span>
                        </div>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                          {JSON.stringify(previewJson, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading || !!jsonError}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? "Mettre à jour" : "Créer"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default GlossaryForm;
