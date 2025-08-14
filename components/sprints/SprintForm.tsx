// @/components/sprints/SprintForm.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form"; 
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sprint, SprintStatus } from "@/lib/generated/prisma/client";

const sprintSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis").max(100, "Nom trop long"),
    goal: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(SprintStatus),
    startDate: z.date({
      message: "La date de début est requise",
    }),
    endDate: z.date({
      message: "La date de fin est requise",
    }),
    capacity: z
      .number()
      .min(0, "La capacité doit être positive")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "La date de fin doit être postérieure à la date de début",
      path: ["endDate"],
    }
  );

type SprintFormData = z.infer<typeof sprintSchema>;

interface SprintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sprint?: Sprint | null;
  onSuccess: () => void;
}

export default function SprintForm({
  open,
  onOpenChange,
  projectId,
  sprint,
  onSuccess,
}: SprintFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!sprint;

  const form = useForm<SprintFormData>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: "",
      goal: "",
      description: "",
      status: SprintStatus.PLANNED,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 jours
      capacity: null,
    },
  });

  // Réinitialisation du formulaire
  useEffect(() => {
    if (open) {
      if (sprint) {
        form.reset({
          name: sprint.name,
          goal: sprint.goal || "",
          description: sprint.description || "",
          status: sprint.status,
          startDate: new Date(sprint.startDate),
          endDate: new Date(sprint.endDate),
          capacity: sprint.capacity,
        });
      } else {
        form.reset({
          name: "",
          goal: "",
          description: "",
          status: SprintStatus.PLANNED,
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          capacity: null,
        });
      }
    }
  }, [open, sprint, form]);

  const onSubmit = async (data: SprintFormData) => {
    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/sprints/${sprint!.id}` : "/api/sprints";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...data,
        projectId,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(
          isEdit ? "Sprint modifié avec succès" : "Sprint créé avec succès"
        );
        onSuccess();
      } else {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: SprintStatus) => {
    switch (status) {
      case SprintStatus.PLANNED:
        return "📋 Planifié";
      case SprintStatus.ACTIVE:
        return "🚀 Actif";
      case SprintStatus.COMPLETED:
        return "✅ Terminé";
      case SprintStatus.CANCELLED:
        return "❌ Annulé";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le sprint" : "Créer un nouveau sprint"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du sprint *</FormLabel>
                  <FormControl>
                    <Input placeholder="Sprint 1.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Objectif */}
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectif du sprint</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Objectif principal du sprint..."
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description détaillée du sprint..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Statut et Capacité */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SprintStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {getStatusLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité (heures)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="40"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : null;
                          field.onChange(value);
                        }}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de début *</FormLabel>
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
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de fin *</FormLabel>
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
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEdit ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
