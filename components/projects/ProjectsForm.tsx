// /components/projects/ProjectsForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  CalendarIcon,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Settings,
  Calendar as CalendarIconLarge,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
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
  settings: any;
  metadata: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }>;
}

export interface ProjectsFormProps {
  project?: Project | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProjectsForm: React.FC<ProjectsFormProps> = ({
  project,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    key: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: "ACTIVE",
    visibility: "PRIVATE",
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || "",
        key: project.key,
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        status: project.status,
        visibility: project.visibility,
        isActive: project.isActive,
      });
    }
  }, [project]);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du projet est requis";
    } else if (formData.name.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (formData.name.length > 100) {
      newErrors.name = "Le nom ne peut pas dépasser 100 caractères";
    }

    if (!formData.key.trim()) {
      newErrors.key = "La clé du projet est requise";
    } else if (formData.key.length < 2) {
      newErrors.key = "La clé doit contenir au moins 2 caractères";
    } else if (formData.key.length > 10) {
      newErrors.key = "La clé ne peut pas dépasser 10 caractères";
    } else if (!/^[A-Z0-9]+$/.test(formData.key)) {
      newErrors.key =
        "La clé ne peut contenir que des lettres majuscules et des chiffres";
    }

    if (formData.startDate && formData.endDate) {
      if (formData.startDate >= formData.endDate) {
        newErrors.endDate =
          "La date de fin doit être postérieure à la date de début";
      }
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description =
        "La description ne peut pas dépasser 1000 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsLoading(true);

    try {
      const slug = generateSlug(formData.name);
      const payload = {
        ...formData,
        slug,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
        settings: project?.settings || {},
        metadata: project?.metadata || {},
      };

      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const method = project ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la sauvegarde");
      }

      toast.success(`Projet ${project ? "modifié" : "créé"} avec succès`, {
        description: `Le projet "${formData.name}" a été ${
          project ? "mis à jour" : "créé"
        }.`,
      });

      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        {
          description:
            "Veuillez vérifier les informations saisies et réessayer.",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleKeyChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    handleInputChange("key", upperValue);
  };

  const statusOptions = [
    {
      value: "ACTIVE",
      label: "Actif",
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: "Le projet est en cours de développement",
    },
    {
      value: "COMPLETED",
      label: "Terminé",
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: "Le projet a été finalisé avec succès",
    },
    {
      value: "CANCELLED",
      label: "Annulé",
      icon: <X className="h-4 w-4" />,
      description: "Le projet a été annulé",
    },
    {
      value: "ON_HOLD",
      label: "En pause",
      icon: <AlertCircle className="h-4 w-4" />,
      description: "Le projet est temporairement suspendu",
    },
  ];

  const visibilityOptions = [
    {
      value: "PRIVATE",
      label: "Privé",
      description: "Visible uniquement par les membres du projet",
    },
    {
      value: "PUBLIC",
      label: "Public",
      description: "Visible par tous les utilisateurs",
    },
    {
      value: "INTERNAL",
      label: "Interne",
      description: "Visible par l'organisation",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Informations principales */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              Informations principales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Nom du projet *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nom du projet"
                maxLength={100}
                className={cn("text-sm", errors.name && "border-red-500")}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="key"
                className="text-sm font-medium text-gray-700"
              >
                Clé du projet *
              </Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="Ex: ECOM"
                maxLength={10}
                className={cn(
                  "text-sm font-mono",
                  errors.key && "border-red-500"
                )}
                required
              />
              {errors.key && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.key}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Description du projet"
                rows={4}
                maxLength={1000}
                className={cn(
                  "text-sm",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section: Configuration */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="status"
                className="text-sm font-medium text-gray-700"
              >
                Statut
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem
                      key={status.value}
                      value={status.value}
                      className="text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {status.icon}
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="visibility"
                className="text-sm font-medium text-gray-700"
              >
                Visibilité
              </Label>
              <Select
                value={formData.visibility}
                onValueChange={(value) =>
                  handleInputChange("visibility", value)
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((visibility) => (
                    <SelectItem
                      key={visibility.value}
                      value={visibility.value}
                      className="text-sm"
                    >
                      {visibility.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Projet actif
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Section: Planification */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarIconLarge className="h-5 w-5 text-purple-500" />
              Planification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Date de début
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-sm",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) =>
                        handleInputChange("startDate", date || null)
                      }
                      locale={fr}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Date de fin
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left text-sm",
                        !formData.endDate && "text-muted-foreground",
                        errors.endDate && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "PPP", { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) =>
                        handleInputChange("endDate", date || null)
                      }
                      locale={fr}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="text-sm"
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="text-sm bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Enregistrement..." : project ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </div>
  );
};
