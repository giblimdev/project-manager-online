// @/components/epics/EpicsForm.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Save,
  X,
  Calendar as CalendarIcon,
  AlertTriangle,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// Types alignés avec le schéma Prisma
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface Epic {
  id: string;
  name: string;
  order: number;
  description: string | null;
  priority: Priority;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  initiativeId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Zod strictement aligné avec le modèle Prisma
const epicFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom est requis")
      .min(3, "Le nom doit contenir au moins 3 caractères")
      .max(255, "Le nom ne peut pas dépasser 255 caractères"),
    description: z.string().nullable(),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    status: z.string().min(1, "Le statut est requis"),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
    progress: z
      .number()
      .min(0, "La progression ne peut pas être négative")
      .max(100, "La progression ne peut pas dépasser 100%"),
    order: z.number().int().positive(),
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

interface EpicsFormProps {
  isOpen: boolean;
  epic: Epic | null;
  initiativeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<any>;
  }
> = {
  CRITICAL: {
    label: "Critique",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: AlertTriangle,
  },
  HIGH: {
    label: "Haute",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    icon: TrendingUp,
  },
  MEDIUM: {
    label: "Moyenne",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    icon: Target,
  },
  LOW: {
    label: "Basse",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
    icon: Clock,
  },
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Actif", icon: Target, color: "text-blue-600" },
  {
    value: "COMPLETED",
    label: "Terminé",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    value: "ON_HOLD",
    label: "En pause",
    icon: Clock,
    color: "text-orange-600",
  },
  {
    value: "CANCELLED",
    label: "Annulé",
    icon: AlertTriangle,
    color: "text-red-600",
  },
];

export function EpicsForm({
  isOpen,
  epic,
  initiativeId,
  onSuccess,
  onCancel,
}: EpicsFormProps) {
  const form = useForm<EpicFormValues>({
    resolver: zodResolver(epicFormSchema),
    defaultValues: {
      name: "",
      description: null,
      priority: "MEDIUM",
      status: "ACTIVE",
      startDate: null,
      endDate: null,
      progress: 0,
      order: 1000,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      if (epic) {
        form.reset({
          name: epic.name,
          description: epic.description,
          priority: epic.priority,
          status: epic.status,
          startDate: epic.startDate,
          endDate: epic.endDate,
          progress: epic.progress,
          order: epic.order,
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, epic, form]);

  const onSubmit = async (data: EpicFormValues) => {
    try {
      const payload = {
        ...data,
        initiativeId,
        startDate: data.startDate?.toISOString() || null,
        endDate: data.endDate?.toISOString() || null,
      };

      const url = epic ? `/api/epics/${epic.id}` : "/api/epics";
      const method = epic ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      toast.success(epic ? "Épic modifié" : "Épic créé", {
        description: `"${data.name}" a été ${
          epic ? "modifié" : "créé"
        } avec succès`,
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error("Erreur de sauvegarde", {
        description: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>{epic ? "Modifier l'épic" : "Nouvel épic"}</span>
          </DialogTitle>
          <DialogDescription>
            {epic
              ? `Modifiez les informations de l'épic "${epic.name}"`
              : "Créez un nouvel épic pour structurer votre initiative"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Nom de l'épic *</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Système d'authentification utilisateur..."
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormDescription>
                    Un nom clair et descriptif pour votre épic (3-255
                    caractères)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez l'objectif et le périmètre de cet épic..."
                      className="min-h-[100px] resize-none"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Description détaillée de l'épic (optionnel)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Target className="h-4 w-4" />
                      <span>Priorité *</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(
                          ([value, config]) => {
                            const IconComponent = config.icon;
                            return (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="h-4 w-4" />
                                  <span>{config.label}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${config.color} ${config.bgColor}`}
                                  >
                                    {value}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          }
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => {
                          const IconComponent = status.icon;
                          return (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center space-x-2">
                                <IconComponent
                                  className={`h-4 w-4 ${status.color}`}
                                />
                                <span>{status.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Date prévue de début des travaux (optionnel)
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
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate ? date < startDate : false;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Date prévue de fin des travaux (optionnel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Progression (%)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Pourcentage d'avancement (0-100%)
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
                        min="1"
                        step="1"
                        placeholder="1000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 1000)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Position dans la liste (plus petit = plus haut)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={form.formState.isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {epic ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
