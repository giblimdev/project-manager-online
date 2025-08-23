// components/sprints/SprintForm.tsx
/**
 * RÔLE : Dialog complet pour créer ou modifier un sprint (formulaire validé, typé strict)
 * RESPONSABILITÉS :
 *   - Affiche un formulaire validé avec react-hook-form et zod (mode strict)
 *   - Permet la saisie, la modification des dates avec calendrier
 *   - Validation et transformation robustes sur toutes les entrées
 *   - Composants UI : shadcn/ui (Dialog, Button, Input, Select, Textarea, etc.)
 *   - Icônes Lucide (Calendar)
 *   - Le composant ne fait aucun fetch HTTP, tout est passé en props/callback
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface SprintFormValues {
  name: string;
  goal?: string | null;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity?: number | null;
  velocity?: number | null;
}

export interface Sprint {
  id: string;
  name: string;
  order: number;
  goal: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity: number | null;
  velocity: number | null;
  burndownData: Record<string, unknown> | null;
  retrospective: Record<string, unknown> | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SprintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint?: Sprint | null;
  onSubmit: (data: SprintFormValues) => Promise<void> | void;
}

const sprintFormSchema = z.object({
  name: z.string().min(1, 'Le nom du sprint est requis').max(100),
  goal: z.string().max(255).optional().nullable(),
  description: z.string().max(1024).optional().nullable(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  capacity: z
    .number({ message: "La capacité doit être un nombre" })
    .min(0, { message: "Capacité ≥ 0" })
    .optional()
    .nullable(),
  velocity: z
    .number({ message: "La vélocité doit être un nombre" })
    .min(0, { message: "Vélocité ≥ 0" })
    .optional()
    .nullable(),
}).refine((data) => data.endDate > data.startDate, {
  path: ['endDate'],
  message: 'La date de fin doit être après la date de début',
});

export const SprintFormDialog: React.FC<SprintFormDialogProps> = ({
  open,
  onOpenChange,
  sprint,
  onSubmit,
}) => {
  const isEditing = !!sprint;
  const defaultStart = sprint?.startDate ? new Date(sprint.startDate) : new Date();
  const defaultEnd = sprint?.endDate
    ? new Date(sprint.endDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const form = useForm<SprintFormValues>({
    resolver: zodResolver(sprintFormSchema),
    defaultValues: {
      name: sprint?.name ?? '',
      goal: sprint?.goal ?? '',
      description: sprint?.description ?? '',
      startDate: defaultStart,
      endDate: defaultEnd,
      status: sprint?.status ?? 'PLANNED',
      capacity: sprint?.capacity ?? null,
      velocity: sprint?.velocity ?? null,
    },
    mode: 'onChange',
  });

  React.useEffect(() => {
    if (isEditing) {
      form.reset({
        name: sprint?.name ?? '',
        goal: sprint?.goal ?? '',
        description: sprint?.description ?? '',
        startDate: sprint?.startDate ? new Date(sprint.startDate) : new Date(),
        endDate: sprint?.endDate ? new Date(sprint.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: sprint?.status ?? 'PLANNED',
        capacity: sprint?.capacity ?? null,
        velocity: sprint?.velocity ?? null,
      });
    } else {
      form.reset({
        name: '',
        goal: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PLANNED',
        capacity: null,
        velocity: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditing, sprint]);

  const handleSubmit = async (values: SprintFormValues) => {
    await onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le sprint' : 'Créer un nouveau sprint'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations du sprint et cliquez sur "Enregistrer".'
              : 'Remplissez les informations pour créer un nouveau sprint.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Nom du sprint */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du sprint</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sprint 1, Release Q2, etc." autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            type="button"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: fr })
                              : 'Sélectionner une date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
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
                    <FormLabel>Date de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            type="button"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value
                              ? format(field.value, 'dd MMM yyyy', { locale: fr })
                              : 'Sélectionner une date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Objectif */}
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectif</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                      placeholder="Objectif du sprint…"
                    />
                  </FormControl>
                  <FormDescription>
                    But principal pour guider l’équipe durant ce sprint.
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
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : e.target.value)}
                      placeholder="Détail du contenu, lien drive, notes d’organisation…"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacité & Vélocité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité (nb/h pts)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        placeholder="ex: 42"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre de points ou d’heures disponibles pour le sprint.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="velocity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vélocité</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.01}
                        placeholder="ex: 24"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Vélocité moyenne cible attendue (optionnel).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Statut */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Statut du sprint" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planifié</SelectItem>
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ✅ double export : nommé + par défaut
export default SprintFormDialog;
