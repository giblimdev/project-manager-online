// @/components/features/FeatureForm.tsx
// RÔLE : Formulaire complet pour créer et modifier des features avec validation stricte, hiérarchie et intégration API optimisée

import React, { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder
} from "lucide-react";
import { Priority } from "@/lib/generated/prisma/client";
import type { 
  SimpleFeature, 
  FeatureWithHierarchy,
  FeatureFormData 
} from "@/types/feature";

interface FeatureFormProps {
  feature?: FeatureWithHierarchy | null;
  availableParents?: SimpleFeature[];
  projectId: string;
  epicId?: string | null;
  onSubmit: (data: FeatureFormData) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  className?: string;
  showHierarchy?: boolean;
}

const initialFormData: Omit<FeatureFormData, "projectId"> = {
  name: "",
  description: null,
  acceptanceCriteria: null,
  priority: Priority.MEDIUM,
  status: "ACTIVE",
  storyPoints: null,
  businessValue: null,
  technicalRisk: null,
  effort: null,
  startDate: null,
  endDate: null,
  parentId: null,
};

const statusOptions = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "CANCELLED", label: "Annulé" },
];

const priorityOptions = [
  { value: Priority.CRITICAL, label: "Critique" },
  { value: Priority.HIGH, label: "Élevée" },
  { value: Priority.MEDIUM, label: "Moyenne" },
  { value: Priority.LOW, label: "Faible" },
];

const featureToFormData = (
    feature: FeatureWithHierarchy,
    projectId: string,
    epicId?: string | null
): FeatureFormData => ({
  name: feature.name,
  description: feature.description,
  acceptanceCriteria: feature.acceptanceCriteria,
  priority: feature.priority,
  status: feature.status,
  storyPoints: feature.storyPoints,
  businessValue: feature.businessValue,
  technicalRisk: feature.technicalRisk,
  effort: feature.effort,
  startDate: feature.startDate
    ? (typeof feature.startDate === "string"
        ? feature.startDate
        : feature.startDate.toISOString().split("T")[0])
    : null,
  endDate: feature.endDate
    ? (typeof feature.endDate === "string"
        ? feature.endDate
        : feature.endDate.toISOString().split("T")[0])
    : null,
  parentId: feature.parentId,
  projectId,
  epicId: typeof epicId !== "undefined" ? epicId : feature.epicId,
});

const FeatureHierarchyDisplay: React.FC<{
  feature: FeatureWithHierarchy;
  className?: string;
}> = ({ feature, className }) => {
  const [expandedChildren, setExpandedChildren] = useState<boolean>(false);
  const toggleExpanded = useCallback(
    () => setExpandedChildren((prev) => !prev),
    []
  );
  return (
    <div className={`space-y-3 ${className}`}>
      {feature.parent && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Feature Parent
          </Label>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">
                  {feature.parent.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  Parent
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {feature.children && feature.children.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Features Enfants ({feature.children.length})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="h-6 w-6 p-0"
              type="button"
            >
              {expandedChildren ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </div>
          {expandedChildren && (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="py-3">
                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {feature.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 py-1"
                      >
                        <FileText className="h-3 w-3 text-green-600" />
                        <span className="text-sm">{child.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {child.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export const FeatureForm: React.FC<FeatureFormProps> = ({
  feature,
  availableParents = [],
  projectId,
  epicId,
  onSubmit,
  onCancel,
  isSubmitting,
  showHierarchy = true,
  className = "",
}) => {
  const [formData, setFormData] = useState<Omit<FeatureFormData, "projectId">>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (feature) {
      setFormData(featureToFormData(feature, projectId, epicId));
    } else {
      setFormData(initialFormData);
    }
    setValidationErrors({});
  }, [feature, projectId, epicId]);

  const handleInputChange = (
    field: keyof typeof initialFormData,
    value: any
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validation obligatoire : nom
    if (!formData.name.trim()) {
      errors.name = "Le nom de la feature est requis";
    }
    
    // Validation hiérarchie
    if (formData.parentId === feature?.id) {
      errors.parentId = "Une feature ne peut pas être son propre parent";
    }
    
    // Validation story points
    if (
      formData.storyPoints !== null &&
      (formData.storyPoints < 0 || formData.storyPoints > 100)
    ) {
      errors.storyPoints = "Les story points doivent être entre 0 et 100";
    }
    
    // Validation valeur business
    if (
      formData.businessValue !== null &&
      (formData.businessValue < 0 || formData.businessValue > 100)
    ) {
      errors.businessValue = "La valeur business doit être entre 0 et 100";
    }
    
    // Validation risque technique
    if (
      formData.technicalRisk !== null &&
      (formData.technicalRisk < 0 || formData.technicalRisk > 100)
    ) {
      errors.technicalRisk = "Le risque technique doit être entre 0 et 100";
    }
    
    // Validation effort
    if (formData.effort !== null && formData.effort < 0) {
      errors.effort = "L'effort ne peut pas être négatif";
    }
    
    // Validation dates
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      errors.endDate =
        "La date de fin doit être postérieure à la date de début";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.warn('Validation failed:', validationErrors);
      return;
    }
    
    if (!projectId) {
      console.error('ProjectId is required but missing');
      return;
    }

    const cleanedData: FeatureFormData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      acceptanceCriteria: formData.acceptanceCriteria?.trim() || null,
      parentId: formData.parentId || null,
      projectId: projectId,
      ...(epicId !== undefined ? { epicId } : {}),
    };

    // Debug log pour vérifier les données envoyées
    console.log('Submitting feature data:', cleanedData);
    
    await onSubmit(cleanedData);
  };

  // Filtrer les parents (pas self et pas enfants directs)
  const filteredParents = availableParents.filter((parent) => {
    if (!feature) return true;
    if (parent.id === feature.id) return false;
    if (feature.children?.some((child) => child.id === parent.id)) return false;
    return true;
  });

  const isEditing = !!feature;

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${className}`}>
      {/* Hiérarchie existante */}
      {isEditing && showHierarchy && feature && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">Hiérarchie Actuelle</Label>
            <Badge variant="outline" className="text-xs">
              Lecture seule
            </Badge>
          </div>
          <FeatureHierarchyDisplay feature={feature} />
          <Separator />
        </div>
      )}

      {/* Informations de base */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Label className="text-lg font-semibold">Informations de Base</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Nom de la feature"
            className={validationErrors.name ? "border-red-500" : ""}
            disabled={isSubmitting}
          />
          {validationErrors.name && (
            <p className="text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Description de la feature"
            rows={3}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acceptanceCriteria">Critères d'acceptation</Label>
          <Textarea
            id="acceptanceCriteria"
            value={formData.acceptanceCriteria || ""}
            onChange={(e) =>
              handleInputChange("acceptanceCriteria", e.target.value)
            }
            placeholder="Définissez les critères d'acceptation"
            rows={4}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Section Hiérarchie */}
      {showHierarchy && (
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">Hiérarchie</Label>
            <Badge variant="secondary" className="text-xs">
              Optionnel
            </Badge>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentId">Feature Parent</Label>
            <Select
              value={formData.parentId || "none"}
              onValueChange={(value) =>
                handleInputChange("parentId", value === "none" ? null : value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger
                className={validationErrors.parentId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Sélectionner un parent (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Aucun parent (feature racine)</span>
                  </div>
                </SelectItem>
                {filteredParents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>{parent.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {parent.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.parentId && (
              <p className="text-sm text-red-600">
                {validationErrors.parentId}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Sélectionnez une feature parent pour organiser hiérarchiquement vos features
            </p>
          </div>
        </div>
      )}

      <Separator />

      {/* Priority and Status */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Configuration</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: Priority) => handleInputChange("priority", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Métriques</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="storyPoints">Story Points</Label>
            <Input
              id="storyPoints"
              type="number"
              min="0"
              max="100"
              value={formData.storyPoints || ""}
              onChange={(e) =>
                handleInputChange(
                  "storyPoints",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="0-100"
              className={validationErrors.storyPoints ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {validationErrors.storyPoints && (
              <p className="text-xs text-red-600">
                {validationErrors.storyPoints}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessValue">Valeur Business</Label>
            <Input
              id="businessValue"
              type="number"
              min="0"
              max="100"
              value={formData.businessValue || ""}
              onChange={(e) =>
                handleInputChange(
                  "businessValue",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="0-100"
              className={validationErrors.businessValue ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {validationErrors.businessValue && (
              <p className="text-xs text-red-600">
                {validationErrors.businessValue}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="technicalRisk">Risque Technique</Label>
            <Input
              id="technicalRisk"
              type="number"
              min="0"
              max="100"
              value={formData.technicalRisk || ""}
              onChange={(e) =>
                handleInputChange(
                  "technicalRisk",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="0-100"
              className={validationErrors.technicalRisk ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {validationErrors.technicalRisk && (
              <p className="text-xs text-red-600">
                {validationErrors.technicalRisk}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="effort">Effort</Label>
            <Input
              id="effort"
              type="number"
              min="0"
              value={formData.effort || ""}
              onChange={(e) =>
                handleInputChange(
                  "effort",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              placeholder="Heures"
              className={validationErrors.effort ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {validationErrors.effort && (
              <p className="text-xs text-red-600">{validationErrors.effort}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Planification</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Date de début</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate || ""}
              onChange={(e) =>
                handleInputChange("startDate", e.target.value || null)
              }
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate || ""}
              onChange={(e) =>
                handleInputChange("endDate", e.target.value || null)
              }
              className={validationErrors.endDate ? "border-red-500" : ""}
              disabled={isSubmitting}
            />
            {validationErrors.endDate && (
              <p className="text-xs text-red-600">{validationErrors.endDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:w-auto">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? "Mettre à jour" : "Créer"}
        </Button>
      </div>
    </form>
  );
};
