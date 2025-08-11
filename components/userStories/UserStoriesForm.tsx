// @/components/userStories/UserStoriesForm.tsx

/*
 * Formulaire de création/modification des User Stories (CORRIGÉ)
 * Rôle : Interface de saisie et validation des données user stories
 * Responsabilités :
 * - Formulaire réactif avec validation en temps réel
 * - Gestion des états de création et modification
 * - Intégration avec react-hook-form et zod pour la validation
 * - Interface responsive et moderne avec shadcn/ui
 * - Gestion des assignations multiples et des relations
 * - Support TypeScript strict mode Next.js 15
 * - Sauvegarde optimiste avec gestion d'erreurs
 *
 * Composants utilisés :
 * - React Hook Form : Gestion des formulaires
 * - Zod : Validation des schémas
 * - shadcn/ui : Dialog, Form, Input, Select, Textarea, Badge, Button
 * - Lucide React : Icônes modernes
 * - Sonner : Notifications toast
 * - Types : @/types/userStories.ts (interfaces centralisées)
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Save,
  X,
  Loader2,
  AlertCircle,
  Users,
  Target,
  Calendar,
  Hash,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  Tag,
  CheckCircle2,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Import des types centralisés
import {
  UserStoriesFormProps,
  UserStoryData,
  FeatureData,
  ProjectMemberData,
  SprintData,
  Priority,
  TaskStatus,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  createEmptyUserStory,
  validateUserStoryData,
} from "@/types/userStories";

// ✅ Schéma de validation Zod (CORRIGÉ)
const userStoryFormSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre ne peut pas dépasser 255 caractères")
    .trim(),
  description: z.string().optional().nullable(),
  acceptanceCriteria: z.string().optional().nullable(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  status: z.enum([
    "TODO",
    "IN_PROGRESS",
    "CODE_REVIEW",
    "TESTING",
    "DONE",
    "BLOCKED",
    "CANCELLED",
  ]),
  storyPoints: z
    .number()
    .min(0, "Les story points ne peuvent pas être négatifs")
    .max(100, "Les story points ne peuvent pas dépasser 100")
    .optional()
    .nullable(),
  businessValue: z
    .number()
    .min(0, "La valeur business ne peut pas être négative")
    .max(100, "La valeur business ne peut pas dépasser 100")
    .optional()
    .nullable(),
  technicalRisk: z
    .number()
    .min(0, "Le risque technique ne peut pas être négatif")
    .max(100, "Le risque technique ne peut pas dépasser 100")
    .optional()
    .nullable(),
  effort: z
    .number()
    .min(0, "L'effort ne peut pas être négatif")
    .max(100, "L'effort ne peut pas dépasser 100")
    .optional()
    .nullable(),
  estimatedHours: z
    .number()
    .min(0, "Les heures estimées ne peuvent pas être négatives")
    .optional()
    .nullable(),
  featureId: z.string().min(1, "Une feature doit être sélectionnée"),
  assigneeIds: z.array(z.string()),
  sprintIds: z.array(z.string()),
  labels: z.array(z.string()),
  tags: z.array(z.string()),
});

// ✅ Type dérivé du schéma Zod
type UserStoryFormData = z.infer<typeof userStoryFormSchema>;

const UserStoriesForm: React.FC<UserStoriesFormProps> = ({
  userStory,
  projectId,
  features = [],
  projectMembers = [],
  sprints = [],
  onSave,
  onCancel,
  isOpen,
}) => {
  // États locaux
  const [isLoading, setIsLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newTag, setNewTag] = useState("");
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [sprintsOpen, setSprintsOpen] = useState(false);

  // ✅ Configuration du formulaire avec types corrects
  const form = useForm<UserStoryFormData>({
    resolver: zodResolver(userStoryFormSchema),
    defaultValues: {
      title: "",
      description: null,
      acceptanceCriteria: null,
      priority: "MEDIUM",
      status: "TODO",
      storyPoints: null,
      businessValue: null,
      technicalRisk: null,
      effort: null,
      estimatedHours: null,
      featureId: "",
      assigneeIds: [],
      sprintIds: [],
      labels: [],
      tags: [],
    },
  });

  // Mise à jour du formulaire quand userStory change
  useEffect(() => {
    if (userStory) {
      form.reset({
        title: userStory.title,
        description: userStory.description,
        acceptanceCriteria: userStory.acceptanceCriteria,
        priority: userStory.priority,
        status: userStory.status,
        storyPoints: userStory.storyPoints,
        businessValue: userStory.businessValue,
        technicalRisk: userStory.technicalRisk,
        effort: userStory.effort,
        estimatedHours: userStory.estimatedHours,
        featureId: userStory.featureId,
        assigneeIds: userStory.UserStoryAssignees.map((ua) => ua.users.id),
        sprintIds: userStory.sprints.map((s) => s.id),
        labels: [...userStory.labels],
        tags: [...userStory.tags],
      });
    } else {
      form.reset({
        title: "",
        description: null,
        acceptanceCriteria: null,
        priority: "MEDIUM",
        status: "TODO",
        storyPoints: null,
        businessValue: null,
        technicalRisk: null,
        effort: null,
        estimatedHours: null,
        featureId: "",
        assigneeIds: [],
        sprintIds: [],
        labels: [],
        tags: [],
      });
    }
  }, [userStory, form]);

  // Fonction utilitaire pour les appels API
  const apiCall = useCallback(
    async (url: string, options: RequestInit = {}): Promise<any> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: `Erreur HTTP: ${response.status}` }));
        throw new Error(error.error || error.message);
      }

      return response.json();
    },
    []
  );

  // ✅ Soumission du formulaire avec type correct
  const onSubmit: SubmitHandler<UserStoryFormData> = async (data) => {
    setIsLoading(true);
    try {
      // Validation côté client
      const validationErrors = validateUserStoryData({
        ...data,
        creatorId: "temp", // Sera géré côté serveur
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach((error) => toast.error(error));
        return;
      }

      const payload = {
        ...data,
        projectId,
      };

      const url = userStory
        ? `/api/user-stories/${userStory.id}`
        : `/api/user-stories`;

      const method = userStory ? "PUT" : "POST";

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.success) {
        onSave(response.data);
        form.reset();
        toast.success(
          userStory
            ? "User story modifiée avec succès"
            : "User story créée avec succès"
        );
      } else {
        throw new Error(response.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur de sauvegarde", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des labels
  const handleAddLabel = useCallback(() => {
    if (
      newLabel.trim() &&
      !form.getValues("labels").includes(newLabel.trim())
    ) {
      form.setValue("labels", [...form.getValues("labels"), newLabel.trim()]);
      setNewLabel("");
    }
  }, [newLabel, form]);

  const handleRemoveLabel = useCallback(
    (label: string) => {
      form.setValue(
        "labels",
        form.getValues("labels").filter((l) => l !== label)
      );
    },
    [form]
  );

  // Gestion des tags
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      form.setValue("tags", [...form.getValues("tags"), newTag.trim()]);
      setNewTag("");
    }
  }, [newTag, form]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      form.setValue(
        "tags",
        form.getValues("tags").filter((t) => t !== tag)
      );
    },
    [form]
  );

  // Calcul du score de priorité
  const priorityScore = useMemo(() => {
    const businessValue = form.watch("businessValue") || 0;
    const technicalRisk = form.watch("technicalRisk") || 0;
    const priority = form.watch("priority");

    const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const riskScore = 100 - technicalRisk; // Inverser le risque

    return (businessValue + riskScore) * priorityWeight[priority];
  }, [form]);

  // Assignés sélectionnés
  const selectedAssignees = useMemo(() => {
    const assigneeIds = form.watch("assigneeIds");
    return projectMembers.filter((member) =>
      assigneeIds.includes(member.userId)
    );
  }, [form, projectMembers]);

  // Sprints sélectionnés
  const selectedSprints = useMemo(() => {
    const sprintIds = form.watch("sprintIds");
    return sprints.filter((sprint) => sprintIds.includes(sprint.id));
  }, [form, sprints]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {userStory ? "Modifier la user story" : "Créer une user story"}
          </DialogTitle>
          <DialogDescription>
            {userStory
              ? "Modifiez les informations de cette user story"
              : "Créez une nouvelle user story pour votre projet"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-1"
            >
              {/* Informations de base */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Titre */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Titre</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Titre de la user story..."
                            {...field}
                            className="text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Feature */}
                  <FormField
                    control={form.control}
                    name="featureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="required">Feature</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une feature" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {features.map((feature) => (
                              <SelectItem key={feature.id} value={feature.id}>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      PRIORITY_CONFIG[feature.priority].variant
                                    }
                                    className="text-xs"
                                  >
                                    {PRIORITY_CONFIG[feature.priority].label}
                                  </Badge>
                                  {feature.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Priorité et Statut */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priorité</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(PRIORITY_CONFIG).map(
                                ([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={config.variant}
                                        className="text-xs"
                                      >
                                        {config.label}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                )
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
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(
                                ([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={config.variant}
                                        className="text-xs"
                                      >
                                        {config.label}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Score de priorité calculé */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Score de priorité
                      </label>
                      <Badge variant="outline">
                        {Math.round(priorityScore)}
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min(priorityScore, 100)}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculé selon la valeur business, le risque technique et
                      la priorité
                    </p>
                  </div>

                  {/* Story Points */}
                  <FormField
                    control={form.control}
                    name="storyPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Story Points
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Estimation de la complexité (0-100)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Heures estimées */}
                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Heures estimées
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Temps estimé en heures
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Métriques avancées */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Métriques</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Valeur Business */}
                  <FormField
                    control={form.control}
                    name="businessValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Valeur Business
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              value={[field.value || 0]}
                              onValueChange={([value]) => field.onChange(value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0</span>
                              <span className="font-medium">
                                {field.value || 0}
                              </span>
                              <span>100</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Risque Technique */}
                  <FormField
                    control={form.control}
                    name="technicalRisk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Risque Technique
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              value={[field.value || 0]}
                              onValueChange={([value]) => field.onChange(value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0</span>
                              <span className="font-medium">
                                {field.value || 0}
                              </span>
                              <span>100</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Effort */}
                  <FormField
                    control={form.control}
                    name="effort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Effort
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              value={[field.value || 0]}
                              onValueChange={([value]) => field.onChange(value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0</span>
                              <span className="font-medium">
                                {field.value || 0}
                              </span>
                              <span>100</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Description et critères d'acceptation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description détaillée de la user story..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Décrivez le contexte et les objectifs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptanceCriteria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Critères d'acceptation</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="- Critère 1&#10;- Critère 2&#10;- Critère 3"
                          className="min-h-[120px] resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Conditions à remplir pour considérer la story terminée
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Assignations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Assignations</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Assignés */}
                  <FormField
                    control={form.control}
                    name="assigneeIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Assignés
                        </FormLabel>
                        <Popover
                          open={assigneesOpen}
                          onOpenChange={setAssigneesOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {selectedAssignees.length > 0
                                  ? `${selectedAssignees.length} assigné(s)`
                                  : "Sélectionner des assignés"}
                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Rechercher un membre..." />
                              <CommandEmpty>Aucun membre trouvé.</CommandEmpty>
                              <CommandGroup>
                                {projectMembers.map((member) => (
                                  <CommandItem
                                    key={member.userId}
                                    onSelect={() => {
                                      const currentAssignees = field.value;
                                      const isSelected =
                                        currentAssignees.includes(
                                          member.userId
                                        );

                                      if (isSelected) {
                                        field.onChange(
                                          currentAssignees.filter(
                                            (id) => id !== member.userId
                                          )
                                        );
                                      } else {
                                        field.onChange([
                                          ...currentAssignees,
                                          member.userId,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={field.value.includes(
                                        member.userId
                                      )}
                                      className="mr-2"
                                    />
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                        {member.user.name?.charAt(0) || "?"}
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {member.user.name ||
                                            member.user.email}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {member.role
                                            .replace("_", " ")
                                            .toLowerCase()}
                                        </div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedAssignees.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedAssignees.map((member) => (
                              <Badge
                                key={member.userId}
                                variant="secondary"
                                className="text-xs"
                              >
                                {member.user.name || member.user.email}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== member.userId
                                      )
                                    );
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Sprints */}
                  <FormField
                    control={form.control}
                    name="sprintIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Sprints
                        </FormLabel>
                        <Popover
                          open={sprintsOpen}
                          onOpenChange={setSprintsOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {selectedSprints.length > 0
                                  ? `${selectedSprints.length} sprint(s)`
                                  : "Sélectionner des sprints"}
                                <Calendar className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Rechercher un sprint..." />
                              <CommandEmpty>Aucun sprint trouvé.</CommandEmpty>
                              <CommandGroup>
                                {sprints.map((sprint) => (
                                  <CommandItem
                                    key={sprint.id}
                                    onSelect={() => {
                                      const currentSprints = field.value;
                                      const isSelected =
                                        currentSprints.includes(sprint.id);

                                      if (isSelected) {
                                        field.onChange(
                                          currentSprints.filter(
                                            (id) => id !== sprint.id
                                          )
                                        );
                                      } else {
                                        field.onChange([
                                          ...currentSprints,
                                          sprint.id,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={field.value.includes(sprint.id)}
                                      className="mr-2"
                                    />
                                    <div>
                                      <div className="font-medium">
                                        {sprint.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(
                                          sprint.startDate
                                        ).toLocaleDateString()}{" "}
                                        -{" "}
                                        {new Date(
                                          sprint.endDate
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedSprints.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedSprints.map((sprint) => (
                              <Badge
                                key={sprint.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {sprint.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(
                                      field.value.filter(
                                        (id) => id !== sprint.id
                                      )
                                    );
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Labels et Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Organisation</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Labels */}
                  <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Labels
                        </FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nouveau label..."
                              value={newLabel}
                              onChange={(e) => setNewLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddLabel();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={handleAddLabel}
                              disabled={!newLabel.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {field.value.map((label) => (
                                <Badge
                                  key={label}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {label}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLabel(label)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          Tags
                        </FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nouveau tag..."
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddTag();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={handleAddTag}
                              disabled={!newTag.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {field.value.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  #{tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {userStory ? "Modifier" : "Créer"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserStoriesForm;
