// /components/items/ItemForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Save, X, RefreshCwIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Item } from "@/types/item";

interface ItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: CreateItemData) => Promise<void>;
  mode: "create" | "edit";
  initialData?: Item | null;
  defaultType?: string | null;
}

interface CreateItemData {
  type: string;
  name: string;
  description?: string;
  objective?: string;
  slug: string;
  key?: string;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  acceptanceCriteria?: string;
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  progress?: number;
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";
  visibility?: "PRIVATE" | "PUBLIC" | "INTERNAL";
  startDate?: string;
  endDate?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  text?: Record<string, any>;
  backlogPosition?: number;
  DoD?: string;
  isActive?: boolean;
  estimatedHours?: number;
  actualHours?: number;
  parentId?: string;
  sprintId?: string;
  assigneeIds?: string[];
  userId: string;
}

interface FormState {
  type: string;
  name: string;
  description: string;
  objective: string;
  slug: string;
  key: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  acceptanceCriteria: string;
  storyPoints: string;
  businessValue: string;
  technicalRisk: string;
  effort: string;
  progress: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";
  visibility: "PRIVATE" | "PUBLIC" | "INTERNAL";
  startDate: string;
  endDate: string;
  backlogPosition: string;
  DoD: string;
  isActive: boolean;
  estimatedHours: string;
  actualHours: string;
  parentId: string;
  sprintId: string;
  assigneeIds: string[];
  isSubmitting: boolean;
  errors: Record<string, string>;
}

interface ReferenceData {
  availableItems: Item[];
  availableSprints: any[];
  availableUsers: any[];
}

// Types d'items selon le schéma unifié
const ITEM_TYPES = [
  { value: "INITIATIVE", label: "Initiative" },
  { value: "EPIC", label: "Epic" },
  { value: "FEATURE", label: "Feature" },
  { value: "USER_STORY", label: "User Story" },
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "SUBTASK", label: "Subtask" },
];

// Priorités selon l'enum Priority
const PRIORITIES = [
  { value: "CRITICAL", label: "Critique" },
  { value: "HIGH", label: "Élevé" },
  { value: "MEDIUM", label: "Moyen" },
  { value: "LOW", label: "Faible" },
];

// Statuts selon l'enum ItemStatus
const ITEM_STATUSES = [
  { value: "ACTIVE", label: "Actif" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "ON_HOLD", label: "En attente" },
];

// Visibilité selon l'enum Visibility
const VISIBILITY_OPTIONS = [
  { value: "PRIVATE", label: "Privé" },
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Interne" },
];

// Fonction pour générer un slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// Fonction pour générer une clé unique
const generateKey = (name: string): string => {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 10);
};

export const ItemForm: React.FC<ItemFormProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  initialData,
  defaultType,
}) => {
  const { data: session } = useSession();

  const [formState, setFormState] = useState<FormState>({
    type: defaultType || "TASK",
    name: "",
    description: "",
    objective: "",
    slug: "",
    key: "",
    priority: "MEDIUM",
    acceptanceCriteria: "",
    storyPoints: "",
    businessValue: "",
    technicalRisk: "",
    effort: "",
    progress: "0",
    status: "ACTIVE",
    visibility: "PRIVATE",
    startDate: "",
    endDate: "",
    backlogPosition: "",
    DoD: "",
    isActive: true,
    estimatedHours: "",
    actualHours: "",
    parentId: "",
    sprintId: "",
    assigneeIds: [],
    isSubmitting: false,
    errors: {},
  });

  const [referenceData, setReferenceData] = useState<ReferenceData>({
    availableItems: [],
    availableSprints: [],
    availableUsers: [],
  });

  const [loadingReferences, setLoadingReferences] = useState(false);

  // Chargement des données de référence
  const loadReferenceData = async (): Promise<void> => {
    if (!session?.user) return;

    try {
      setLoadingReferences(true);

      // Chargement des items pour la hiérarchie
      const itemsResponse = await fetch(
        `/api/projects/items?userId=${session.user.id}&limit=100`
      );
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        if (itemsData.success) {
          const items = itemsData.data.filter(
            (item: Item) => mode === "create" || item.id !== initialData?.id
          );
          setReferenceData((prev) => ({ ...prev, availableItems: items }));
        }
      }

      // Chargement des sprints actifs
      const sprintsResponse = await fetch(
        `/api/projects/sprints?status=ACTIVE,PLANNED&limit=50`
      );
      if (sprintsResponse.ok) {
        const sprintsData = await sprintsResponse.json();
        if (sprintsData.success) {
          setReferenceData((prev) => ({
            ...prev,
            availableSprints: sprintsData.data,
          }));
        }
      }

      // Chargement des utilisateurs actifs
      const usersResponse = await fetch(`/api/users?isActive=true&limit=100`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setReferenceData((prev) => ({
            ...prev,
            availableUsers: usersData.data,
          }));
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données de référence:",
        error
      );
    } finally {
      setLoadingReferences(false);
    }
  };

  // Initialisation du formulaire
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormState({
          type: initialData.type || "TASK",
          name: initialData.name || "",
          description: initialData.description || "",
          objective: initialData.objective || "",
          slug: initialData.slug || "",
          key: initialData.key || "",
          priority: (initialData.priority as any) || "MEDIUM",
          acceptanceCriteria: initialData.acceptanceCriteria || "",
          storyPoints: initialData.storyPoints?.toString() || "",
          businessValue: initialData.businessValue?.toString() || "",
          technicalRisk: initialData.technicalRisk?.toString() || "",
          effort: initialData.effort?.toString() || "",
          progress: initialData.progress?.toString() || "0",
          status: (initialData.status as any) || "ACTIVE",
          visibility: (initialData.visibility as any) || "PRIVATE",
          startDate: initialData.startDate
            ? new Date(initialData.startDate).toISOString().split("T")[0]
            : "",
          endDate: initialData.endDate
            ? new Date(initialData.endDate).toISOString().split("T")[0]
            : "",
          backlogPosition: initialData.backlogPosition?.toString() || "",
          DoD: initialData.DoD || "",
          isActive: initialData.isActive ?? true,
          estimatedHours: initialData.estimatedHours?.toString() || "",
          actualHours: initialData.actualHours?.toString() || "",
          parentId: initialData.parentId || "",
          sprintId: initialData.sprintId || "",
          assigneeIds:
            initialData.assignees?.map((a: { id: any }) => a.id) || [],
          isSubmitting: false,
          errors: {},
        });
      } else {
        setFormState({
          type: defaultType || "TASK",
          name: "",
          description: "",
          objective: "",
          slug: "",
          key: "",
          priority: "MEDIUM",
          acceptanceCriteria: "",
          storyPoints: "",
          businessValue: "",
          technicalRisk: "",
          effort: "",
          progress: "0",
          status: "ACTIVE",
          visibility: "PRIVATE",
          startDate: "",
          endDate: "",
          backlogPosition: "",
          DoD: "",
          isActive: true,
          estimatedHours: "",
          actualHours: "",
          parentId: "",
          sprintId: "",
          assigneeIds: [],
          isSubmitting: false,
          errors: {},
        });
      }

      loadReferenceData();
    }
  }, [mode, initialData, defaultType, isOpen, session]);

  // Génération automatique du slug et de la clé
  useEffect(() => {
    if (formState.name && mode === "create") {
      const slug = generateSlug(formState.name);
      const key = generateKey(formState.name);
      setFormState((prev) => ({ ...prev, slug, key }));
    }
  }, [formState.name, mode]);

  // Filtrage des parents selon la hiérarchie
  const getAvailableParents = (): Item[] => {
    const currentType = formState.type;

    return referenceData.availableItems.filter((item) => {
      switch (currentType) {
        case "EPIC":
          return item.type === "INITIATIVE";
        case "FEATURE":
          return item.type === "EPIC";
        case "USER_STORY":
          return item.type === "FEATURE";
        case "TASK":
          return item.type === "USER_STORY";
        case "SUBTASK":
          return item.type === "TASK";
        case "BUG":
          return ["FEATURE", "USER_STORY", "TASK"].includes(item.type);
        default:
          return true;
      }
    });
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validation obligatoire
    if (!formState.name.trim()) {
      errors.name = "Le nom est requis";
    } else if (formState.name.length < 3) {
      errors.name = "Le nom doit contenir au moins 3 caractères";
    } else if (formState.name.length > 255) {
      errors.name = "Le nom ne peut pas dépasser 255 caractères";
    }

    if (!formState.type) {
      errors.type = "Le type est requis";
    }

    // Validation des nombres
    if (
      formState.storyPoints &&
      (isNaN(parseInt(formState.storyPoints)) ||
        parseInt(formState.storyPoints) < 0)
    ) {
      errors.storyPoints = "Les story points doivent être un nombre positif";
    }

    if (
      formState.businessValue &&
      (isNaN(parseInt(formState.businessValue)) ||
        parseInt(formState.businessValue) < 1 ||
        parseInt(formState.businessValue) > 10)
    ) {
      errors.businessValue = "La valeur métier doit être entre 1 et 10";
    }

    if (
      formState.technicalRisk &&
      (isNaN(parseInt(formState.technicalRisk)) ||
        parseInt(formState.technicalRisk) < 1 ||
        parseInt(formState.technicalRisk) > 10)
    ) {
      errors.technicalRisk = "Le risque technique doit être entre 1 et 10";
    }

    if (
      formState.effort &&
      (isNaN(parseInt(formState.effort)) ||
        parseInt(formState.effort) < 1 ||
        parseInt(formState.effort) > 10)
    ) {
      errors.effort = "L'effort doit être entre 1 et 10";
    }

    if (
      formState.progress &&
      (isNaN(parseInt(formState.progress)) ||
        parseInt(formState.progress) < 0 ||
        parseInt(formState.progress) > 100)
    ) {
      errors.progress = "Le progrès doit être entre 0 et 100";
    }

    if (
      formState.estimatedHours &&
      (isNaN(parseInt(formState.estimatedHours)) ||
        parseInt(formState.estimatedHours) < 0)
    ) {
      errors.estimatedHours =
        "Les heures estimées doivent être un nombre positif";
    }

    if (
      formState.actualHours &&
      (isNaN(parseInt(formState.actualHours)) ||
        parseInt(formState.actualHours) < 0)
    ) {
      errors.actualHours = "Les heures réelles doivent être un nombre positif";
    }

    if (
      formState.backlogPosition &&
      (isNaN(parseInt(formState.backlogPosition)) ||
        parseInt(formState.backlogPosition) < 0)
    ) {
      errors.backlogPosition =
        "La position backlog doit être un nombre positif";
    }

    // Validation des dates
    if (formState.startDate && formState.endDate) {
      const startDate = new Date(formState.startDate);
      const endDate = new Date(formState.endDate);
      if (startDate >= endDate) {
        errors.endDate =
          "La date de fin doit être postérieure à la date de début";
      }
    }

    // Validation du parent
    if (formState.parentId && formState.parentId !== "none") {
      const availableParents = getAvailableParents();
      if (!availableParents.some((p) => p.id === formState.parentId)) {
        errors.parentId =
          "Ce parent n'est pas compatible avec le type d'item sélectionné";
      }
    }

    setFormState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  };

  // Gestion des changements
  const handleChange = (field: keyof FormState, value: any): void => {
    // Gestion spéciale pour les sélections optionnelles
    if (field === "parentId" && value === "none") {
      value = "";
    }
    if (field === "sprintId" && value === "none") {
      value = "";
    }

    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: "" },
    }));
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm() || !session?.user) return;

    setFormState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const itemData: CreateItemData = {
        type: formState.type,
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        objective: formState.objective.trim() || undefined,
        slug: formState.slug || generateSlug(formState.name),
        key: formState.key || generateKey(formState.name),
        priority: formState.priority,
        acceptanceCriteria: formState.acceptanceCriteria.trim() || undefined,
        storyPoints: formState.storyPoints
          ? parseInt(formState.storyPoints)
          : undefined,
        businessValue: formState.businessValue
          ? parseInt(formState.businessValue)
          : undefined,
        technicalRisk: formState.technicalRisk
          ? parseInt(formState.technicalRisk)
          : undefined,
        effort: formState.effort ? parseInt(formState.effort) : undefined,
        progress: formState.progress ? parseInt(formState.progress) : undefined,
        status: formState.status,
        visibility: formState.visibility,
        startDate: formState.startDate || undefined,
        endDate: formState.endDate || undefined,
        backlogPosition: formState.backlogPosition
          ? parseInt(formState.backlogPosition)
          : undefined,
        DoD: formState.DoD.trim() || undefined,
        isActive: formState.isActive,
        estimatedHours: formState.estimatedHours
          ? parseInt(formState.estimatedHours)
          : undefined,
        actualHours: formState.actualHours
          ? parseInt(formState.actualHours)
          : undefined,
        parentId: formState.parentId || undefined,
        sprintId: formState.sprintId || undefined,
        assigneeIds:
          formState.assigneeIds.length > 0 ? formState.assigneeIds : undefined,
        userId: session.user.id,
      };

      await onSave(itemData);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        errors: { submit: "Erreur lors de la sauvegarde" },
      }));
    }
  };

  const handleClose = (): void => {
    if (!formState.isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Créer un nouvel item" : "Modifier l'item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erreur générale */}
          {formState.errors.submit && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formState.errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nom de l'item"
                className={formState.errors.name ? "border-red-500" : ""}
                disabled={formState.isSubmitting}
              />
              {formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formState.type}
                onValueChange={(value) => handleChange("type", value)}
                disabled={formState.isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formState.priority}
                onValueChange={(value) => handleChange("priority", value)}
                disabled={formState.isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formState.status}
                onValueChange={(value) => handleChange("status", value)}
                disabled={formState.isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visibility">Visibilité</Label>
              <Select
                value={formState.visibility}
                onValueChange={(value) => handleChange("visibility", value)}
                disabled={formState.isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la visibilité" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((visibility) => (
                    <SelectItem key={visibility.value} value={visibility.value}>
                      {visibility.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Identifiants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formState.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="slug-automatique"
                disabled={formState.isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="key">Clé</Label>
              <Input
                id="key"
                value={formState.key}
                onChange={(e) => handleChange("key", e.target.value)}
                placeholder="CLE_AUTO"
                disabled={formState.isSubmitting}
              />
            </div>
          </div>

          {/* Relations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentId">Item Parent</Label>
              <Select
                value={formState.parentId || "none"}
                onValueChange={(value) => handleChange("parentId", value)}
                disabled={formState.isSubmitting || loadingReferences}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun parent</SelectItem>
                  {getAvailableParents().map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      [{item.type}] {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formState.errors.parentId && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.parentId}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="sprintId">Sprint</Label>
              <Select
                value={formState.sprintId || "none"}
                onValueChange={(value) => handleChange("sprintId", value)}
                disabled={formState.isSubmitting || loadingReferences}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun sprint</SelectItem>
                  {referenceData.availableSprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name} ({sprint.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min="0"
                value={formState.storyPoints}
                onChange={(e) => handleChange("storyPoints", e.target.value)}
                placeholder="0"
                className={formState.errors.storyPoints ? "border-red-500" : ""}
                disabled={formState.isSubmitting}
              />
              {formState.errors.storyPoints && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.storyPoints}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="businessValue">Valeur métier (1-10)</Label>
              <Input
                id="businessValue"
                type="number"
                min="1"
                max="10"
                value={formState.businessValue}
                onChange={(e) => handleChange("businessValue", e.target.value)}
                placeholder="5"
                className={
                  formState.errors.businessValue ? "border-red-500" : ""
                }
                disabled={formState.isSubmitting}
              />
              {formState.errors.businessValue && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.businessValue}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="technicalRisk">Risque technique (1-10)</Label>
              <Input
                id="technicalRisk"
                type="number"
                min="1"
                max="10"
                value={formState.technicalRisk}
                onChange={(e) => handleChange("technicalRisk", e.target.value)}
                placeholder="5"
                className={
                  formState.errors.technicalRisk ? "border-red-500" : ""
                }
                disabled={formState.isSubmitting}
              />
              {formState.errors.technicalRisk && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.technicalRisk}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="effort">Effort (1-10)</Label>
              <Input
                id="effort"
                type="number"
                min="1"
                max="10"
                value={formState.effort}
                onChange={(e) => handleChange("effort", e.target.value)}
                placeholder="5"
                className={formState.errors.effort ? "border-red-500" : ""}
                disabled={formState.isSubmitting}
              />
              {formState.errors.effort && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.effort}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="progress">Progrès (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formState.progress}
                onChange={(e) => handleChange("progress", e.target.value)}
                placeholder="0"
                className={formState.errors.progress ? "border-red-500" : ""}
                disabled={formState.isSubmitting}
              />
              {formState.errors.progress && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.progress}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="estimatedHours">Heures estimées</Label>
              <Input
                id="estimatedHours"
                type="number"
                min="0"
                value={formState.estimatedHours}
                onChange={(e) => handleChange("estimatedHours", e.target.value)}
                placeholder="0"
                className={
                  formState.errors.estimatedHours ? "border-red-500" : ""
                }
                disabled={formState.isSubmitting}
              />
              {formState.errors.estimatedHours && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.estimatedHours}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="actualHours">Heures réelles</Label>
              <Input
                id="actualHours"
                type="number"
                min="0"
                value={formState.actualHours}
                onChange={(e) => handleChange("actualHours", e.target.value)}
                placeholder="0"
                className={formState.errors.actualHours ? "border-red-500" : ""}
                disabled={formState.isSubmitting}
              />
              {formState.errors.actualHours && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.actualHours}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="backlogPosition">Position backlog</Label>
              <Input
                id="backlogPosition"
                type="number"
                min="0"
                value={formState.backlogPosition}
                onChange={(e) =>
                  handleChange("backlogPosition", e.target.value)
                }
                placeholder="1000"
                className={
                  formState.errors.backlogPosition ? "border-red-500" : ""
                }
                disabled={formState.isSubmitting}
              />
              {formState.errors.backlogPosition && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.backlogPosition}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formState.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                disabled={formState.isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formState.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={formState.errors.endDate ? "border-red-500" : ""}
                disabled={formState.isSubmitting}
              />
              {formState.errors.endDate && (
                <p className="text-red-500 text-sm mt-1">
                  {formState.errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Assignés */}
          <div>
            <Label>Assignés</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {loadingReferences ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCwIcon className="animate-spin h-4 w-4 mr-2" />
                  Chargement...
                </div>
              ) : (
                referenceData.availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assignee-${user.id}`}
                      checked={formState.assigneeIds.includes(user.id)}
                      onCheckedChange={(checked) => {
                        const newAssignees = checked
                          ? [...formState.assigneeIds, user.id]
                          : formState.assigneeIds.filter(
                              (id) => id !== user.id
                            );
                        handleChange("assigneeIds", newAssignees);
                      }}
                      disabled={formState.isSubmitting}
                    />
                    <label
                      htmlFor={`assignee-${user.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {user.name || user.email}
                    </label>
                  </div>
                ))
              )}
            </div>
            {formState.errors.assigneeIds && (
              <p className="text-red-500 text-sm mt-1">
                {formState.errors.assigneeIds}
              </p>
            )}
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="objective">Objectif</Label>
              <Textarea
                id="objective"
                value={formState.objective}
                onChange={(e) => handleChange("objective", e.target.value)}
                placeholder="Objectif de l'item"
                rows={2}
                disabled={formState.isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Description détaillée"
                rows={3}
                disabled={formState.isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="acceptanceCriteria">Critères d'acceptation</Label>
              <Textarea
                id="acceptanceCriteria"
                value={formState.acceptanceCriteria}
                onChange={(e) =>
                  handleChange("acceptanceCriteria", e.target.value)
                }
                placeholder="Critères d'acceptation"
                rows={3}
                disabled={formState.isSubmitting}
              />
            </div>

            <div>
              <Label htmlFor="DoD">Definition of Done</Label>
              <Textarea
                id="DoD"
                value={formState.DoD}
                onChange={(e) => handleChange("DoD", e.target.value)}
                placeholder="Definition of Done"
                rows={2}
                disabled={formState.isSubmitting}
              />
            </div>
          </div>

          {/* Checkbox actif */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formState.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
              disabled={formState.isSubmitting}
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Item actif
            </label>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={formState.isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Créer" : "Modifier"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
