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

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Save,
  Calendar as CalendarIcon,
  AlertTriangle,
  Target,
  Clock,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";

import { toast } from "sonner";

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

const epicFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom est requis")
      .min(3, "Le nom doit contenir au moins 3 caractères")
      .max(255, "Le nom ne peut pas dépasser 255 caractères"),
    description: z.string().optional(),
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
  { label: string; color: string; bgColor: string; icon: React.ComponentType }
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
  { value: "COMPLETED", label: "Terminé", icon: CheckCircle2, color: "text-green-600" },
  { value: "ON_HOLD", label: "En pause", icon: Clock, color: "text-orange-600" },
  { value: "CANCELLED", label: "Annulé", icon: AlertTriangle, color: "text-red-600" },
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
      description: "",
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
          description: epic.description ?? "",
          priority: epic.priority,
          status: epic.status,
          startDate: epic.startDate,
          endDate: epic.endDate,
          progress: epic.progress,
          order: epic.order,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          priority: "MEDIUM",
          status: "ACTIVE",
          startDate: null,
          endDate: null,
          progress: 0,
          order: 1000,
        });
      }
    }
  }, [isOpen, epic, form]);

  const onSubmit = async (data: EpicFormValues) => {
    try {
      const payload = {
        ...data,
        description: data.description || null,
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }

      toast.success(epic ? "Épic modifié" : "Épic créé", {
        description: `"${data.name}" a été ${epic ? "modifié" : "créé"} avec succès`,
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
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
      <DialogContent className="w-[95vw] max-w-[800px] h-[95vh] flex flex-col p-0 gap-0">
        {/* Header fixe */}
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {epic ? "Modifier l'épic" : "Nouvel épic"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {epic
              ? `Modifiez les informations de l'épic "${epic.name}"`
              : "Créez un nouvel épic pour structurer votre initiative"}
          </DialogDescription>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nom */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nom de l'épic *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nom clair et descriptif" 
                        className="w-full"
                        {...field} 
                      />
                    </FormControl>
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
                    <FormLabel className="text-sm font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Description détaillée (optionnel)" 
                        className="min-h-[100px] resize-y"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priorité et Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Priorité *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner la priorité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PRIORITY_CONFIG).map(([value, config]) => {
                            const IconComp = config.icon;
                            return (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <IconComp  />
                                  <span>{config.label}</span>
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Statut *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner le statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map(({ value, label, icon: IconComp }) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <IconComp className="h-4 w-4" />
                                <span>{label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Date de début</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? format(field.value, "PPP", { locale: fr })
                                : "Sélectionner une date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Date de fin</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? format(field.value, "PPP", { locale: fr })
                                : "Sélectionner une date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const startDate = form.getValues("startDate");
                              return startDate ? date < startDate : false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Progression et Ordre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Progression (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="w-full"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 0 : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Ordre d'affichage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          className="w-full"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? 1000 : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Footer fixe */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50 shrink-0 flex flex-col sm:flex-row gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="w-full sm:w-auto"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {epic ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
