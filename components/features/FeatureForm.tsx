/*
<FeaturesForm
          userId={userId}
          projectId={projectId}
          feature={editingFeature}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false); 
            setEditingFeature(null);   
          }}
        />
*/
// @/components/features/FeaturesForm.tsx
// Formulaire de création/édition des features avec validation complète et typage strict
// Rôle : Modal form pour CRUD des features avec validation Zod et gestion d'erreurs via Sonner
// Composants utilisés : Dialog, Form, Input, Textarea, Select de shadcn/ui avec validation react-hook-form
// API : Appels POST/PATCH pour création/modification avec gestion d'erreurs robuste
// Validation : Schéma Zod complet avec tous les champs selon le modèle Prisma Feature
// Props : Mode new/edit, feature data, projectId, userId et callbacks success/cancel
// Hooks : useForm avec zodResolver, useEffect pour chargement des données d'édition
// TypeScript : Mode strict avec interfaces complètes et typage des callbacks - Résolution des conflits de typage générique
// Toast : Utilise Sonner pour les notifications utilisateur avec descriptions détaillées

"use client";

import { JSX, useEffect, useState } from "react";
import { useForm, Control, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  Save,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Schéma Zod avec validation stricte selon le modèle Prisma
const featureSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    description: z.string().optional().or(z.literal("")),
    acceptanceCriteria: z.string().optional().or(z.literal("")),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    status: z.string().min(1, "Status is required"),
    storyPoints: z
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal(undefined)),
    businessValue: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .or(z.literal(undefined)),
    technicalRisk: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .or(z.literal(undefined)),
    effort: z.number().int().min(1).max(10).optional().or(z.literal(undefined)),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    progress: z.number().min(0).max(100),
    epicId: z.string().min(1, "Epic is required"),
    parentId: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

// Type inféré du schéma Zod
type FeatureFormData = z.infer<typeof featureSchema>;

// Interface pour les données de feature existante
interface Feature {
  id: string;
  name: string;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  position: number;
  order: number;
  epicId: string;
  parentId: string | null;
  projectId: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Props du composant
interface FeaturesFormProps {
  mode: "new" | "edit";
  feature?: Feature | null;
  projectId: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FeaturesForm({
  mode,
  feature,
  projectId,
  userId,
  onSuccess,
  onCancel,
}: FeaturesFormProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Configuration du formulaire avec typage strict
  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: "",
      description: "",
      acceptanceCriteria: "",
      priority: "MEDIUM",
      status: "ACTIVE",
      storyPoints: undefined,
      businessValue: undefined,
      technicalRisk: undefined,
      effort: undefined,
      startDate: "",
      endDate: "",
      progress: 0,
      epicId: "",
      parentId: "",
    } as FeatureFormData,
    mode: "onChange",
  });

  // Chargement des données pour le mode édition
  useEffect(() => {
    if (mode === "edit" && feature) {
      const formData: FeatureFormData = {
        name: feature.name,
        description: feature.description || "",
        acceptanceCriteria: feature.acceptanceCriteria || "",
        priority: feature.priority,
        status: feature.status,
        storyPoints: feature.storyPoints || undefined,
        businessValue: feature.businessValue || undefined,
        technicalRisk: feature.technicalRisk || undefined,
        effort: feature.effort || undefined,
        startDate: feature.startDate ? feature.startDate.split("T")[0] : "",
        endDate: feature.endDate ? feature.endDate.split("T")[0] : "",
        progress: feature.progress,
        epicId: feature.epicId,
        parentId: feature.parentId || "",
      };
      form.reset(formData);
    }
  }, [mode, feature, form]);

  // Soumission du formulaire
  const onSubmit = async (data: FeatureFormData): Promise<void> => {
    try {
      setIsSubmitting(true);

      // Transformation des données pour l'API
      const payload = {
        ...data,
        projectId,
        userId,
        description: data.description || null,
        acceptanceCriteria: data.acceptanceCriteria || null,
        storyPoints: data.storyPoints || null,
        businessValue: data.businessValue || null,
        technicalRisk: data.technicalRisk || null,
        effort: data.effort || null,
        startDate: data.startDate
          ? new Date(data.startDate).toISOString()
          : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        parentId: data.parentId || null,
      };

      const url =
        mode === "edit"
          ? `/api/projects/${projectId}/features/${feature?.id}`
          : `/api/projects/${projectId}/features`;

      const response = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save feature");
      }

      const savedFeature = await response.json();

      toast.success(
        `Feature ${mode === "edit" ? "updated" : "created"} successfully`,
        {
          description: `"${savedFeature.name}" has been ${
            mode === "edit" ? "updated" : "added to your project"
          }.`,
        }
      );

      onSuccess();
    } catch (error) {
      console.error("Error saving feature:", error);
      toast.error(
        `Failed to ${mode === "edit" ? "update" : "create"} feature`,
        {
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction utilitaire pour les couleurs de priorité
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "orange";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // Validation des entrées numériques
  const handleNumberInput = (value: string): number | undefined => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0 ? num : undefined;
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-6 w-6 text-primary" />
            <span>
              {mode === "edit" ? "Edit Feature" : "Create New Feature"}
            </span>
            {mode === "edit" && feature && (
              <Badge
                variant={getPriorityColor(feature.priority) as any}
                className="ml-2"
              >
                {feature.priority}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section Information de base */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nom */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-base font-medium">
                          Feature Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a descriptive feature name"
                            className="text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, concise name that describes what this feature
                          does
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Priorité */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Priority
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CRITICAL">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                Critical
                              </div>
                            </SelectItem>
                            <SelectItem value="HIGH">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                High
                              </div>
                            </SelectItem>
                            <SelectItem value="MEDIUM">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                Medium
                              </div>
                            </SelectItem>
                            <SelectItem value="LOW">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                Low
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Statut */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="ON_HOLD">On Hold</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control as Control<FeatureFormData>}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what this feature does and its purpose..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description of the feature and its
                        functionality
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Critères d'acceptation */}
                <FormField
                  control={form.control as Control<FeatureFormData>}
                  name="acceptanceCriteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Acceptance Criteria
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Define the criteria that must be met for this feature to be considered complete..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear, testable conditions that define when this feature
                        is done
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section Estimation & Métriques */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    Estimation & Metrics
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Story Points */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="storyPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <TrendingUp className="h-4 w-4" />
                          Story Points
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1, 2, 3, 5, 8..."
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(handleNumberInput(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Relative sizing (Fibonacci)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valeur métier */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="businessValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Business Value
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="1-10"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(handleNumberInput(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Impact score (1-10)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Risque technique */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="technicalRisk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          Tech Risk
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="1-10"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(handleNumberInput(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Complexity score (1-10)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Effort */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="effort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Effort
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="1-10"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(handleNumberInput(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Effort estimate (1-10)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Progression */}
                <FormField
                  control={form.control as Control<FeatureFormData>}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Progress (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0-100"
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            field.onChange(
                              !isNaN(value)
                                ? Math.max(0, Math.min(100, value))
                                : 0
                            );
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Current completion percentage (0-100%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Section Timeline & Relations */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    Timeline & Relationships
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date de début */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <Calendar className="h-4 w-4 text-green-600" />
                          Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          When work on this feature begins
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date de fin */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1 text-base font-medium">
                          <Calendar className="h-4 w-4 text-red-600" />
                          End Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Target completion date
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Epic ID */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="epicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Epic *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Epic ID" {...field} />
                        </FormControl>
                        <FormDescription>
                          The epic this feature belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Feature parent */}
                  <FormField
                    control={form.control as Control<FeatureFormData>}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Parent Feature
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Parent Feature ID (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Make this a sub-feature of another feature
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === "edit" ? "Update Feature" : "Create Feature"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
