// components/projects/ProjectForm.tsx

/**
 * RÔLE : Formulaire de création et modification des projets avec validation complète
 * RESPONSABILITÉS :
 * - Créer de nouveaux projets avec userId automatique depuis Better Auth
 * - Modifier des projets existants avec chargement depuis le store Zustand
 * - Validation complète des champs selon le schéma Prisma Project
 * - Gestion des états de chargement et d'hydratation du store
 * - Interface responsive et moderne avec feedback utilisateur optimisé
 * - Génération automatique de slug et validation des contraintes
 * - Gestion des dates avec validation croisée et calendrier intuitif
 * - Synchronisation avec le store useSelectedProjectStore
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Form, Input, Textarea, Select, Button, Calendar, Popover, Badge, Skeleton
 * - react-hook-form: Gestion des formulaires avec validation (^7.47.0)
 * - zod: Schéma de validation strict basé sur Prisma
 * - date-fns: Formatage et manipulation des dates avec locale française
 * - lucide-react: Icons modernes pour l'interface
 * - sonner: Toast notifications pour le feedback utilisateur
 *
 * LIBS UTILISÉS :
 * - React hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - Better Auth: useSession pour récupérer userId automatiquement
 * - Zustand: useSelectedProjectStore pour l'état du projet sélectionné
 * - react-hook-form avec zodResolver pour validation
 * - Tailwind CSS pour le styling responsive moderne
 *
 * PROPS de @/app/projects/page.tsx :
 * - projectId: string | null - ID du projet à éditer (null pour création)
 * - onSuccess: (result: ApiResponse<ProjectSimple>) => void - Callback de succès
 * - onCancel: () => void - Callback d'annulation
 *
 * API :
 * - POST /api/projects (création avec userId automatique)
 * - PUT /api/projects/[id] (modification de projet existant)
 * - GET /api/projects/[id] (récupération données via store)
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  X,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/auth-client";

// ✅ CORRECTION: Import du store cohérent avec la page
import {
  useSelectedProjectId,
  useSelectedProjectData,
  useProjectLoading,
  useProjectError,
  useProjectActions,
  useProjectStoreHydration,
} from "@/stores/useSelectedProjectStore";

// Types basés sur le schéma Prisma Project cohérents avec la page
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

// ✅ CORRECTION: Schéma Zod strict basé sur le schéma Prisma
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

// ✅ CORRECTION: Interface selon les props de app/projects/page.tsx
interface ProjectFormProps {
  projectId?: string | null;
  onSuccess: (result: ApiResponse<ProjectSimple>) => void;
  onCancel: () => void;
}

export default function ProjectForm({
  projectId,
  onSuccess,
  onCancel,
}: ProjectFormProps): JSX.Element {
  // ✅ CORRECTION: Authentification Better Auth pour userId automatique
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // ✅ CORRECTION: Store Zustand cohérent avec la page
  const projectData = useSelectedProjectData();
  const isProjectLoading = useProjectLoading();
  const projectError = useProjectError();
  const { loadProjectData, setSelectedProjectId } = useProjectActions();
  const isHydrated = useProjectStoreHydration();

  // États locaux
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [slugGenerated, setSlugGenerated] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Mode édition basé sur projectId
  const isEditing = useMemo(() => Boolean(projectId), [projectId]);

  /**
   * ✅ CORRECTION: Chargement du projet via le store si nécessaire
   */
  useEffect(() => {
    let mounted = true;

    const loadProject = async () => {
      if (!isHydrated || !projectId || !mounted) return;

      try {
        setLoadError(null);

        // Charger les données si pas déjà disponibles ou si différent projet
        if (!projectData || projectData.id !== projectId) {
          console.log("📥 ProjectForm - Chargement projet:", projectId);
          await loadProjectData(projectId);
        }
      } catch (error) {
        console.error("💥 ProjectForm - Erreur chargement:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur de chargement";
        setLoadError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
      }
    };

    loadProject();

    return () => {
      mounted = false;
    };
  }, [isHydrated, projectId, projectData, loadProjectData]);

  /**
   * ✅ CORRECTION: Valeurs par défaut optimisées
   */
  const defaultValues: Partial<ProjectFormValues> = useMemo(() => {
    if (isEditing && projectData && projectData.id === projectId) {
      return {
        name: projectData.name || "",
        description: projectData.description || "",
        slug: projectData.slug || "",
        key: projectData.key || "",
        order: projectData.order || 1000,
        status:
          (projectData.status as "ACTIVE" | "INACTIVE" | "ARCHIVED") ||
          "ACTIVE",
        visibility:
          (projectData.visibility as "PRIVATE" | "PUBLIC" | "INTERNAL") ||
          "PRIVATE",
        startDate: projectData.startDate
          ? new Date(projectData.startDate)
          : undefined,
        endDate: projectData.endDate
          ? new Date(projectData.endDate)
          : undefined,
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
  }, [isEditing, projectData, projectId]);

  // Configuration du formulaire react-hook-form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues,
    mode: "onChange",
  });

  /**
   * ✅ CORRECTION: Reset du formulaire quand les données changent
   */
  useEffect(() => {
    console.log(
      "🔄 ProjectForm - Reset formulaire avec données:",
      defaultValues
    );
    form.reset(defaultValues);
    setSlugGenerated(false);
    setLoadError(null);
  }, [defaultValues, form]);

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
   * ✅ CORRECTION: Gestion de la soumission avec userId automatique
   */
  const onSubmit = useCallback(
    async (data: ProjectFormValues): Promise<void> => {
      if (!userId && !isEditing) {
        toast.error("Vous devez être connecté pour créer un projet");
        return;
      }

      console.log("📝 ProjectForm - Soumission:", data);
      setIsSubmitting(true);

      try {
        // Préparation des données avec conversion pour Prisma
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
        const url = isEditing ? `/api/projects/${projectId}` : "/api/projects";
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

        // Toast de succès
        toast.success(
          isEditing
            ? `Projet "${data.name}" mis à jour avec succès`
            : `Projet "${data.name}" créé avec succès`,
          {
            duration: 3000,
          }
        );

        // Callback de succès vers la page
        onSuccess(result);

        console.log("✅ ProjectForm - Succès opération");
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
    [userId, isEditing, projectId, onSuccess]
  );

  /**
   * Gestion de l'annulation
   */
  const handleCancel = useCallback(() => {
    console.log("❌ ProjectForm - Annulation");
    form.reset();
    onCancel();
  }, [form, onCancel]);

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

  // ✅ CORRECTION: Gestion des états de chargement et d'erreur
  if (!isHydrated) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex justify-end gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing && isProjectLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              <CardTitle>Chargement du projet...</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing && (projectError || loadError)) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-900">
                Erreur de chargement
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                Impossible de charger les données du projet
              </p>
              <p className="text-red-600 text-sm mt-1">
                {projectError || loadError}
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => projectId && loadProjectData(projectId, true)}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Retour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userId && !isEditing) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-900">
                Authentification requise
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">
                Vous devez être connecté pour créer un projet
              </p>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
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

                {isEditing && projectData && (
                  <Badge variant="outline" className="ml-2">
                    {projectData.key}
                  </Badge>
                )}
              </CardTitle>

              <p className="text-sm text-gray-600 mt-1">
                {isEditing
                  ? "Modifiez les détails de votre projet ci-dessous."
                  : "Remplissez les informations pour créer un nouveau projet."}
                {!isEditing && (
                  <span className="block mt-1 text-xs text-amber-600">
                    <Info className="h-3 w-3 inline mr-1" />
                    Les champs slug et clé seront générés automatiquement depuis
                    le nom.
                  </span>
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
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
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 flex items-center gap-2">
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
                        <FormDescription>
                          Qui peut voir ce projet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-purple-600" />
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
                <h3 className="text-sm font-medium text-gray-700 border-b pb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
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
                          className="resize-none min-h-[120px]"
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
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="order-2 sm:order-1"
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[160px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {isEditing ? "Modification..." : "Création..."}
                      </span>
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
        </CardContent>
      </Card>
    </div>
  );
}

// Export des types pour la réutilisabilité
export type { ProjectFormProps, ProjectSimple, ApiResponse };
