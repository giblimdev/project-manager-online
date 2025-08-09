// components/epics/EpicsForm.tsx

/**
 * RÔLE : Formulaire moderne de création et modification des épics avec design cohérent
 * RESPONSABILITÉS :
 * - Créer de nouveaux épics avec projectId du projet parent
 * - Modifier des épics existants avec validation complète react-hook-form + Zod
 * - Interface responsive moderne cohérente avec le design system
 * - Gestion des états de chargement et validation temps réel optimisée
 * - Conversion correcte des types pour éviter les erreurs TypeScript strictes
 * - Design Dialog moderne avec sections organisées et feedback utilisateur
 * - Gestion des dates avec Calendar picker et validation croisée française
 * - Progress bar visuelle et métriques avec icons lucide-react cohérentes
 * - Sélection d'initiative parente obligatoire selon le schéma Prisma
 * - CORRECTION: Gestion stricte des types pour Select avec as const et casting
 * - AJOUT: Astérisques (*) sur les champs obligatoires pour UX améliorée
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Input, Textarea, Select, Button, Calendar, Progress
 * - react-hook-form: Gestion formulaire avec validation temps réel et zodResolver
 * - zod: Schéma validation strict selon Prisma Epic avec messages français
 * - date-fns: Formatage dates françaises et manipulation timestamps
 * - lucide-react: Icons modernes cohérentes (Save, Plus, Target, Calendar, etc.)
 * - sonner: Toast notifications feedback utilisateur avec durée adaptée
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - react-hook-form (^7.47.0) avec zodResolver et types stricts
 * - zod validation schema strict selon schéma Prisma Epic
 * - Tailwind CSS responsive design moderne avec gradient et shadows
 * - date-fns (^2.30.0) pour locale française et formatage dates
 *
 * API :
 * - GET /api/initiatives?projectId=[id] (liste des initiatives disponibles)
 * - POST /api/epics (création avec projectId et initiativeId)
 * - PUT /api/epics/[id] (modification avec validation et conversion types)
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  Loader2,
  Save,
  Plus,
  Target,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Epic } from "./EpicsDisplay";

// Interface pour les props du composant
interface EpicsFormProps {
  projectId: string;
  epic?: Epic | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Interface pour les initiatives disponibles
interface Initiative {
  id: string;
  name: string;
  priority: string;
  status: string;
}

// ✅ CORRECTION: Interface flexible pour la réponse API
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  // Permet aussi les réponses directes
  [key: string]: any;
}

// ✅ CORRECTION: Types stricts pour les enums selon Prisma
const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STATUS_VALUES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

type PriorityType = (typeof PRIORITY_VALUES)[number];
type StatusType = (typeof STATUS_VALUES)[number];

// Schéma Zod avec validation complète selon le schéma Prisma Epic
const epicFormSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(200, "Le nom ne peut pas dépasser 200 caractères")
      .trim(),
    description: z
      .string()
      .max(2000, "La description ne peut pas dépasser 2000 caractères")
      .optional()
      .or(z.literal("")),
    priority: z.enum(PRIORITY_VALUES, {
      message: "Veuillez sélectionner une priorité valide",
    }),
    status: z.enum(STATUS_VALUES, {
      message: "Veuillez sélectionner un statut valide",
    }),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    progress: z
      .number()
      .min(0, "Le progrès doit être entre 0 et 100")
      .max(100, "Le progrès doit être entre 0 et 100"),
    initiativeId: z.string().min(1, "Veuillez sélectionner une initiative"),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endDate"],
    }
  );

type EpicFormValues = z.infer<typeof epicFormSchema>;

export default function EpicsForm({
  projectId,
  epic = null,
  onSuccess,
  onCancel,
}: EpicsFormProps): JSX.Element {
  // États locaux
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoadingInitiatives, setIsLoadingInitiatives] = useState(true);

  // Mode édition ou création
  const isEditing = useMemo(() => Boolean(epic?.id), [epic?.id]);

  // Valeurs par défaut selon le mode (création/édition)
  const defaultValues: EpicFormValues = useMemo(() => {
    if (isEditing && epic) {
      return {
        name: epic.name || "",
        description: epic.description || "",
        priority: epic.priority as PriorityType,
        status: epic.status as StatusType,
        startDate: epic.startDate ? new Date(epic.startDate) : undefined,
        endDate: epic.endDate ? new Date(epic.endDate) : undefined,
        progress: epic.progress || 0,
        initiativeId: epic.initiativeId || "",
      };
    }

    return {
      name: "",
      description: "",
      priority: "MEDIUM" as PriorityType,
      status: "PLANNING" as StatusType,
      startDate: undefined,
      endDate: undefined,
      progress: 0,
      initiativeId: "",
    };
  }, [isEditing, epic]);

  // Configuration du formulaire react-hook-form
  const form = useForm<EpicFormValues>({
    resolver: zodResolver(epicFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Chargement des initiatives disponibles
  useEffect(() => {
    const loadInitiatives = async () => {
      try {
        const response = await fetch(`/api/initiatives?projectId=${projectId}`);
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des initiatives");
        }

        const result = await response.json();
        let initiativesData: Initiative[];

        if (result.success !== undefined) {
          if (!result.success) {
            throw new Error(result.error || "Erreur lors du chargement");
          }
          initiativesData = result.data || [];
        } else if (Array.isArray(result)) {
          initiativesData = result;
        } else {
          initiativesData = result.initiatives || [];
        }

        setInitiatives(initiativesData);
      } catch (error) {
        console.error("Erreur chargement initiatives:", error);
        toast.error("Impossible de charger les initiatives");
        setInitiatives([]);
      } finally {
        setIsLoadingInitiatives(false);
      }
    };

    loadInitiatives();
  }, [projectId]);

  // Reset du formulaire quand l'épic change
  useEffect(() => {
    console.log("📋 EpicsForm - Reset formulaire avec épic:", epic?.name);
    form.reset(defaultValues);
  }, [epic, defaultValues, form]);

  // ✅ CORRECTION PRINCIPALE: Gestion de la soumission avec support multiple formats API
  const onSubmit = useCallback(
    async (data: EpicFormValues): Promise<void> => {
      console.log("📝 EpicsForm - Soumission:", data);
      setIsSubmitting(true);

      try {
        const epicData = {
          name: data.name,
          description: data.description?.trim() || null,
          priority: data.priority,
          status: data.status,
          startDate: data.startDate ? data.startDate.toISOString() : null,
          endDate: data.endDate ? data.endDate.toISOString() : null,
          progress: data.progress,
          initiativeId: data.initiativeId,
        };

        const url = isEditing ? `/api/epics/${epic!.id}` : "/api/epics";
        const method = isEditing ? "PUT" : "POST";

        console.log(`🚀 EpicsForm - ${method} ${url}`, epicData);

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(epicData),
        });

        const result = await response.json();
        console.log("📡 EpicsForm - Réponse API:", result);

        // ✅ CORRECTION: Vérification du statut HTTP en premier
        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              `Erreur HTTP ${response.status}: ${response.statusText}`
          );
        }

        // ✅ CORRECTION: Gestion flexible des formats de réponse API
        let isSuccess = false;
        let errorMessage: string | null = null;

        if (result.success !== undefined) {
          // Format avec propriété 'success'
          isSuccess = result.success;
          errorMessage = result.error || result.message || null;
        } else if (result.id) {
          // Format direct avec objet créé/modifié (contient un ID)
          isSuccess = true;
        } else if (response.status >= 200 && response.status < 300) {
          // Statut HTTP 2xx considéré comme succès
          isSuccess = true;
        }

        if (!isSuccess && errorMessage) {
          throw new Error(errorMessage);
        }

        console.log("✅ EpicsForm - Opération réussie");
        onSuccess();

        toast.success(
          isEditing
            ? `Épic "${data.name}" mis à jour avec succès`
            : `Épic "${data.name}" créé avec succès`,
          {
            duration: 3000,
          }
        );
      } catch (error) {
        console.error("💥 EpicsForm - Erreur soumission:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        toast.error(`Erreur: ${errorMessage}`, {
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditing, epic, onSuccess]
  );

  // Fonctions utilitaires pour les icônes et couleurs
  const getPriorityIcon = useCallback((priority: string) => {
    switch (priority) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🟠";
      case "CRITICAL":
        return "🔴";
      default:
        return "⚪";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "PLANNING":
        return Clock;
      case "ACTIVE":
        return Target;
      case "ON_HOLD":
        return AlertTriangle;
      case "COMPLETED":
        return CheckCircle2;
      case "CANCELLED":
        return AlertTriangle;
      default:
        return Clock;
    }
  }, []);

  // ✅ Fonction utilitaire pour formater les dates avec protection null
  const formatDateSafely = useCallback((date: Date | undefined): string => {
    if (!date) return "Sélectionner une date";
    return format(date, "PPP", { locale: fr });
  }, []);

  // Surveillance du progrès pour la barre
  const watchProgress = form.watch("progress");
  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            {isEditing ? (
              <>
                <Save className="h-6 w-6 text-blue-600" />
                Modifier l'épic
              </>
            ) : (
              <>
                <Plus className="h-6 w-6 text-green-600" />
                Créer un nouvel épic
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les détails de votre épic ci-dessous."
              : "Remplissez les informations pour créer un nouvel épic."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Informations de base */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Informations de base
            </h3>

            {/* Nom de l'épic */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nom de l'épic <span className="text-red-500">*</span>
              </label>
              <Input
                {...form.register("name")}
                placeholder="Ex: Système d'authentification"
                className="focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Le nom principal de votre épic (2-200 caractères)
              </p>
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Initiative parente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Initiative parente <span className="text-red-500">*</span>
              </label>
              {isLoadingInitiatives ? (
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">
                    Chargement des initiatives...
                  </span>
                </div>
              ) : (
                <Select
                  value={form.watch("initiativeId")}
                  onValueChange={(value: string) =>
                    form.setValue("initiativeId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une initiative">
                      {form.watch("initiativeId") && initiatives.length > 0 && (
                        <span>
                          {
                            initiatives.find(
                              (i) => i.id === form.watch("initiativeId")
                            )?.name
                          }
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {initiatives.length === 0 ? (
                      <SelectItem value="" disabled>
                        Aucune initiative disponible
                      </SelectItem>
                    ) : (
                      initiatives.map((initiative) => (
                        <SelectItem key={initiative.id} value={initiative.id}>
                          {initiative.name}
                          <span className="text-xs text-gray-500 ml-2">
                            ({initiative.priority})
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-gray-500">
                L'initiative à laquelle cet épic appartient
              </p>
              {form.formState.errors.initiativeId && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.initiativeId.message}
                </p>
              )}
            </div>

            {/* Priorité */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Priorité <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.watch("priority")}
                onValueChange={(value: string) =>
                  form.setValue("priority", value as PriorityType)
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {form.watch("priority") && (
                      <span className="flex items-center gap-2">
                        {getPriorityIcon(form.watch("priority"))}
                        {form.watch("priority") === "LOW" && "Faible"}
                        {form.watch("priority") === "MEDIUM" && "Moyenne"}
                        {form.watch("priority") === "HIGH" && "Élevée"}
                        {form.watch("priority") === "CRITICAL" && "Critique"}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="flex items-center gap-2">🟢 Faible</span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">🟡 Moyenne</span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="flex items-center gap-2">🟠 Élevée</span>
                  </SelectItem>
                  <SelectItem value="CRITICAL">
                    <span className="flex items-center gap-2">🔴 Critique</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Niveau de priorité de l'épic
              </p>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Statut <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: string) =>
                  form.setValue("status", value as StatusType)
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {form.watch("status") && (
                      <span className="flex items-center gap-2">
                        {React.createElement(
                          getStatusIcon(form.watch("status")),
                          {
                            className: "h-4 w-4",
                          }
                        )}
                        {form.watch("status") === "PLANNING" && "Planification"}
                        {form.watch("status") === "ACTIVE" && "Actif"}
                        {form.watch("status") === "ON_HOLD" && "En pause"}
                        {form.watch("status") === "COMPLETED" && "Terminé"}
                        {form.watch("status") === "CANCELLED" && "Annulé"}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Planification
                    </span>
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" /> Actif
                    </span>
                  </SelectItem>
                  <SelectItem value="ON_HOLD">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> En pause
                    </span>
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Terminé
                    </span>
                  </SelectItem>
                  <SelectItem value="CANCELLED">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Annulé
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">État actuel de l'épic</p>
              {form.formState.errors.status && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Planification */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Planification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date de début */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Date de début
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateSafely(watchStartDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchStartDate}
                      onSelect={(date) => form.setValue("startDate", date)}
                      disabled={(date) =>
                        watchEndDate
                          ? date > watchEndDate
                          : date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">
                  Date de commencement de l'épic
                </p>
                {form.formState.errors.startDate && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              {/* Date de fin */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Date de fin
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateSafely(watchEndDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchEndDate}
                      onSelect={(date) => form.setValue("endDate", date)}
                      disabled={(date) =>
                        watchStartDate
                          ? date < watchStartDate
                          : date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500">
                  Date de fin prévue de l'épic
                </p>
                {form.formState.errors.endDate && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Métriques et suivi */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Métriques et suivi
            </h3>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">
                Progrès (%) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>0%</span>
                  <span className="font-medium">{watchProgress}%</span>
                  <span>100%</span>
                </div>
                <Progress value={watchProgress} className="w-full" />
                <Input
                  {...form.register("progress", { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  className="text-center font-medium"
                />
              </div>
              <p className="text-xs text-gray-500">
                Pourcentage d'avancement de l'épic (0-100)
              </p>
              {form.formState.errors.progress && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.progress.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Description détaillée
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description<span className="text-red-500">*</span>
              </label>
              <Textarea
                {...form.register("description")}
                placeholder="Décrivez l'objectif et les fonctionnalités de cet épic..."
                rows={4}
                className="resize-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Description complète de l'épic (optionnel, max 2000 caractères)
              </p>
              {form.formState.errors.description && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Modification..." : "Création..."}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Modifier l'épic
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer l'épic
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
