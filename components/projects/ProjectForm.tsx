// components/projects/ProjectForm.tsx

/**
 * RÔLE : Formulaire de création et modification des projets avec validation complète
 * RESPONSABILITÉS :
 * - Créer de nouveaux projets avec userId du propriétaire
 * - Modifier des projets existants avec chargement paresseux des données
 * - Validation complète des champs selon le schéma Prisma Project
 * - Gestion des états de chargement pour les données du projet
 * - Interface responsive et moderne avec feedback utilisateur
 * - Génération automatique de slug et validation des contraintes
 * - Gestion des dates avec validation croisée et calendrier intuitif
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Form, Input, Textarea, Select, Button, Calendar, Popover, Badge
 * - react-hook-form: Gestion des formulaires avec validation
 * - zod: Schéma de validation strict
 * - date-fns: Formatage et manipulation des dates
 * - lucide-react: Icons pour l'interface
 * - sonner: Toast notifications pour le feedback
 *
 * LIBS UTILISÉS :
 * - React hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 client component
 * - TypeScript strict mode avec validation Zod
 * - react-hook-form (^7.47.0) avec zodResolver
 * - date-fns pour les dates
 * - Tailwind CSS pour le styling responsive
 *
 * PROPS de @/app/projects/page.tsx :
 * - open: boolean - État d'ouverture du dialog
 * - onOpenChange: (open: boolean) => void - Callback de changement d'état
 * - project: ProjectSimple | null - Projet à éditer (null pour création)
 * - projectLoading: boolean - État de chargement du projet
 * - onSuccess: (result: ApiResponse<ProjectSimple>) => void - Callback de succès
 * - userId: string - ID utilisateur pour la création de projet
 *
 * API :
 * - POST /api/projects (création avec userId)
 * - PUT /api/projects/[id] (modification de projet)
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  Save,
  Plus,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  Activity,
  Pause,
  Archive,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types basés sur le schéma Prisma Project (sans relations)
interface ProjectSimple {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ✅ CORRECTION: Schéma Zod avec gestion correcte des enum sans required_error
const projectFormSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .trim(),
    description: z
      .string()
      .max(1000, "La description ne peut pas dépasser 1000 caractères")
      .optional()
      .or(z.literal("")),
    slug: z
      .string()
      .min(2, "Le slug doit contenir au moins 2 caractères")
      .max(50, "Le slug ne peut pas dépasser 50 caractères")
      .regex(
        /^[a-z0-9-]+$/,
        "Le slug ne doit contenir que des lettres minuscules, chiffres et tirets"
      )
      .trim(),
    key: z
      .string()
      .min(2, "La clé doit contenir au moins 2 caractères")
      .max(10, "La clé ne peut pas dépasser 10 caractères")
      .regex(
        /^[A-Z][A-Z0-9]*$/,
        "La clé doit commencer par une lettre majuscule et ne contenir que des lettres majuscules et chiffres"
      )
      .trim(),
    order: z
      .number()
      .int("L'ordre doit être un nombre entier")
      .min(0, "L'ordre doit être positif")
      .max(99999, "L'ordre ne peut pas dépasser 99999"),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    // ✅ CORRECTION: z.enum sans required_error, utilisation de message d'erreur par défaut
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"], {
      message: "Veuillez sélectionner un statut valide",
    }),
    visibility: z.enum(["PRIVATE", "PUBLIC", "INTERNAL"], {
      message: "Veuillez sélectionner une visibilité valide",
    }),
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

type ProjectFormValues = z.infer<typeof projectFormSchema>;

// Interface pour les props du composant selon app/projects/page.tsx
interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectSimple | null;
  projectLoading?: boolean;
  onSuccess: (result: ApiResponse<ProjectSimple>) => void;
  userId?: string;
}

export default function ProjectForm({
  open,
  onOpenChange,
  project = null,
  projectLoading = false,
  onSuccess,
  userId,
}: ProjectFormProps): JSX.Element {
  // États locaux
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [slugGenerated, setSlugGenerated] = useState<boolean>(false);

  // Mode édition ou création
  const isEditing = useMemo(() => Boolean(project?.id), [project?.id]);

  /**
   * Valeurs par défaut selon le mode (création/édition)
   */
  const defaultValues: Partial<ProjectFormValues> = useMemo(() => {
    if (isEditing && project) {
      return {
        name: project.name || "",
        description: project.description || "",
        slug: project.slug || "",
        key: project.key || "",
        order: project.order || 1000,
        status:
          (project.status as "ACTIVE" | "INACTIVE" | "ARCHIVED") || "ACTIVE",
        visibility:
          (project.visibility as "PRIVATE" | "PUBLIC" | "INTERNAL") ||
          "PRIVATE",
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
      };
    }

    // Valeurs par défaut pour la création
    return {
      name: "",
      description: "",
      slug: "",
      key: "",
      order: 1000,
      status: "ACTIVE",
      visibility: "PRIVATE",
      startDate: undefined,
      endDate: undefined,
    };
  }, [isEditing, project]);

  // Configuration du formulaire react-hook-form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: "onChange",
  });

  /**
   * Reset du formulaire quand le projet change
   */
  useEffect(() => {
    if (open) {
      console.log(
        "📋 ProjectForm - Reset formulaire avec projet:",
        project?.name
      );
      form.reset(defaultValues);
      setSlugGenerated(false);
    }
  }, [open, project, defaultValues, form]);

  /**
   * Génération automatique du slug depuis le nom
   */
  const generateSlug = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Supprimer caractères spéciaux
      .replace(/\s+/g, "-") // Remplacer espaces par tirets
      .replace(/-+/g, "-") // Supprimer tirets multiples
      .replace(/^-|-$/g, ""); // Supprimer tirets début/fin
  }, []);

  /**
   * Génération automatique de la clé depuis le nom
   */
  const generateKey = useCallback((name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 4).toUpperCase();
    }
    // Prendre première lettre de chaque mot (max 4 lettres)
    return words
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 4)
      .toUpperCase();
  }, []);

  /**
   * Surveillance du champ nom pour génération automatique
   */
  const watchName = form.watch("name");
  useEffect(() => {
    if (watchName && !isEditing && !slugGenerated) {
      const newSlug = generateSlug(watchName);
      const newKey = generateKey(watchName);

      if (newSlug && !form.getValues("slug")) {
        form.setValue("slug", newSlug, { shouldValidate: true });
      }

      if (newKey && !form.getValues("key")) {
        form.setValue("key", newKey, { shouldValidate: true });
      }
    }
  }, [watchName, isEditing, slugGenerated, generateSlug, generateKey, form]);

  /**
   * Gestion de la soumission du formulaire
   */
  const onSubmit = useCallback(
    async (data: ProjectFormValues): Promise<void> => {
      if (!userId && !isEditing) {
        toast.error("ID utilisateur manquant pour la création");
        return;
      }

      console.log("📝 ProjectForm - Soumission:", data);
      setIsSubmitting(true);

      try {
        // Préparation des données avec conversion undefined vers null pour Prisma
        const projectData = {
          ...data,
          description: data.description?.trim() || null,
          startDate: data.startDate ? data.startDate.toISOString() : null,
          endDate: data.endDate ? data.endDate.toISOString() : null,
          settings: {},
          metadata: {},
          isActive: true,
          ...(isEditing ? {} : { userId }), // userId seulement pour la création
        };

        // Configuration de la requête
        const url = isEditing
          ? `/api/projects/${project!.id}`
          : "/api/projects";
        const method = isEditing ? "PUT" : "POST";

        console.log(`🚀 ProjectForm - ${method} ${url}`, projectData);

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        });

        const result: ApiResponse<ProjectSimple> = await response.json();
        console.log("📡 ProjectForm - Réponse API:", result);

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              `Échec ${isEditing ? "modification" : "création"} du projet`
          );
        }

        if (!result.success) {
          throw new Error(result.error || "Opération échouée");
        }

        // Callback de succès
        onSuccess(result);

        // Toast de succès
        toast.success(
          isEditing
            ? `Projet "${data.name}" mis à jour avec succès`
            : `Projet "${data.name}" créé avec succès`,
          {
            duration: 3000,
          }
        );

        // Fermeture du dialog
        onOpenChange(false);
      } catch (error) {
        console.error("💥 ProjectForm - Erreur soumission:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        toast.error(`Erreur: ${errorMessage}`, {
          duration: 5000,
        });

        // Callback d'erreur
        onSuccess({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, isEditing, project, onSuccess, onOpenChange]
  );

  /**
   * Fonctions utilitaires pour les icônes et couleurs
   */
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "ACTIVE":
        return Activity;
      case "INACTIVE":
        return Pause;
      case "ARCHIVED":
        return Archive;
      default:
        return Activity;
    }
  }, []);

  const getVisibilityIcon = useCallback((visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return Globe;
      case "PRIVATE":
        return Lock;
      case "INTERNAL":
        return Users;
      default:
        return Eye;
    }
  }, []);

  /**
   * Validation de date personnalisée
   */
  const isDateDisabled = useCallback(
    (date: Date, compareDate?: Date, isBefore = true): boolean => {
      if (!compareDate) return date < new Date("1900-01-01");
      return isBefore ? date < compareDate : date > compareDate;
    },
    []
  );

  // Affichage du skeleton pendant le chargement du projet
  if (projectLoading && isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="flex justify-end gap-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Save className="h-5 w-5 text-blue-600" />
                Modifier le projet
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-green-600" />
                Créer un nouveau projet
              </>
            )}

            {isEditing && project && (
              <Badge variant="outline" className="ml-2">
                {project.key}
              </Badge>
            )}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Modifiez les détails de votre projet ci-dessous."
              : "Remplissez les informations pour créer un nouveau projet."}
            {!isEditing && (
              <span className="block mt-1 text-xs text-amber-600">
                Les champs slug et clé seront générés automatiquement depuis le
                nom.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                Informations de base
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        Nom du projet
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mon super projet"
                          {...field}
                          className="font-medium"
                        />
                      </FormControl>
                      <FormDescription>
                        Le nom principal de votre projet (2-100 caractères)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Clé du projet
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PROJ"
                          {...field}
                          className="font-mono uppercase"
                          onChange={(e) => {
                            const upperValue = e.target.value.toUpperCase();
                            field.onChange(upperValue);
                            if (upperValue && !isEditing) {
                              setSlugGenerated(true);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Identifiant court (2-10 caractères, majuscules)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Slug URL
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="mon-super-projet"
                          {...field}
                          className="font-mono"
                          onChange={(e) => {
                            const slugValue = e.target.value.toLowerCase();
                            field.onChange(slugValue);
                            if (slugValue && !isEditing) {
                              setSlugGenerated(true);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        URL conviviale (minuscules, tirets autorisés)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Position dans la liste (0-99999)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                Configuration
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Statut
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut">
                              {field.value && (
                                <div className="flex items-center gap-2">
                                  {React.createElement(
                                    getStatusIcon(field.value),
                                    {
                                      className: "h-4 w-4",
                                    }
                                  )}
                                  <span>
                                    {field.value === "ACTIVE" && "Actif"}
                                    {field.value === "INACTIVE" && "Inactif"}
                                    {field.value === "ARCHIVED" && "Archivé"}
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-green-600" />
                              <span>Actif</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <Pause className="h-4 w-4 text-orange-600" />
                              <span>Inactif</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="ARCHIVED">
                            <div className="flex items-center gap-2">
                              <Archive className="h-4 w-4 text-gray-600" />
                              <span>Archivé</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>État actuel du projet</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Visibilité
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner la visibilité">
                              {field.value && (
                                <div className="flex items-center gap-2">
                                  {React.createElement(
                                    getVisibilityIcon(field.value),
                                    {
                                      className: "h-4 w-4",
                                    }
                                  )}
                                  <span>
                                    {field.value === "PRIVATE" && "Privé"}
                                    {field.value === "PUBLIC" && "Public"}
                                    {field.value === "INTERNAL" && "Interne"}
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRIVATE">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-purple-600" />
                              <span>Privé</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="PUBLIC">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-blue-600" />
                              <span>Public</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="INTERNAL">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              <span>Interne</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Qui peut voir ce projet</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                Planification
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de début</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date)}
                            disabled={(date) =>
                              isDateDisabled(
                                date,
                                form.getValues("endDate"),
                                false
                              )
                            }
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Date de commencement du projet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date de fin</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date)}
                            disabled={(date) =>
                              isDateDisabled(
                                date,
                                form.getValues("startDate"),
                                true
                              )
                            }
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Date de fin prévue du projet
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
                Description
              </h3>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description détaillée</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre projet, ses objectifs, son contexte..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Description complète du projet (optionnel, max 1000
                      caractères)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="order-2 sm:order-1"
              >
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isEditing ? "Modification..." : "Création..."}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Modifier le projet</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Créer le projet</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
