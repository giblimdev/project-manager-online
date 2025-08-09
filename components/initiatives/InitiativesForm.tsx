// components/initiatives/InitiativesForm.tsx

/**
 * RÔLE : Formulaire de création et modification des initiatives avec design moderne amélioré
 * RESPONSABILITÉS :
 * - Design moderne avec shadcn/ui Dialog au lieu du modal custom
 * - Validation et soumission identiques à l'original
 * - Interface responsive avec meilleur styling Tailwind
 * - Icons lucide-react pour une UX moderne
 * - Progress bar visuelle et meilleur feedback utilisateur
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Input, Textarea, Select, Button, Progress
 * - lucide-react: Icons modernes pour l'interface
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, JSX
 * - Next.js 15 client component
 * - Tailwind CSS pour le design responsive moderne
 */

"use client";

import React, { useState, useEffect, JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Progress } from "@/components/ui/progress";
import {
  Save,
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Initiative } from "./InitiativesDisplay";

interface InitiativesFormProps {
  projectId: string;
  initiative?: Initiative | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  objective: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  budget: string;
  roi: string;
}

export default function InitiativesForm({
  projectId,
  initiative,
  onSuccess,
  onCancel,
}: InitiativesFormProps): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    objective: "",
    priority: "MEDIUM",
    status: "PLANNING",
    startDate: "",
    endDate: "",
    progress: 0,
    budget: "",
    roi: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initiative) {
      setFormData({
        name: initiative.name || "",
        description: initiative.description || "",
        objective: initiative.objective || "",
        priority: initiative.priority,
        status: initiative.status || "PLANNING",
        startDate: initiative.startDate
          ? new Date(initiative.startDate).toISOString().split("T")[0]
          : "",
        endDate: initiative.endDate
          ? new Date(initiative.endDate).toISOString().split("T")[0]
          : "",
        progress: initiative.progress || 0,
        budget: initiative.budget?.toString() || "",
        roi: initiative.roi?.toString() || "",
      });
    }
  }, [initiative]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value, type } = e.target;

    if (type === "number") {
      const numericValue = value === "" ? 0 : Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        name: formData.name,
        description: formData.description || null,
        objective: formData.objective || null,
        priority: formData.priority,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        progress: formData.progress,
        budget: formData.budget ? Number(formData.budget) : null,
        roi: formData.roi ? Number(formData.roi) : null,
        projectId: projectId,
      };

      const url = initiative
        ? `/api/initiatives/${initiative.id}`
        : "/api/initiatives";

      const method = initiative ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initiative;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🟠";
      case "CRITICAL":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PLANNING":
        return Clock;
      case "ACTIVE":
        return Target;
      case "ON_HOLD":
        return AlertCircle;
      case "COMPLETED":
        return CheckCircle2;
      case "CANCELLED":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Save className="h-5 w-5 text-blue-600" />
                Modifier l'initiative
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-green-600" />
                Créer une nouvelle initiative
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les détails de votre initiative."
              : "Remplissez les informations pour créer une nouvelle initiative."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
              Informations de base
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nom de l'initiative *
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nom de l'initiative"
                  className="font-medium"
                />
              </div>

              {/* Priorité */}
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Priorité *
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      priority: value as FormData["priority"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span>{getPriorityIcon(formData.priority)}</span>
                        <span>
                          {formData.priority === "LOW" && "Faible"}
                          {formData.priority === "MEDIUM" && "Moyenne"}
                          {formData.priority === "HIGH" && "Élevée"}
                          {formData.priority === "CRITICAL" && "Critique"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">🟢 Faible</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Moyenne</SelectItem>
                    <SelectItem value="HIGH">🟠 Élevée</SelectItem>
                    <SelectItem value="CRITICAL">🔴 Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statut */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Statut *
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {React.createElement(getStatusIcon(formData.status), {
                          className: "h-4 w-4",
                        })}
                        <span>
                          {formData.status === "PLANNING" && "Planification"}
                          {formData.status === "ACTIVE" && "Actif"}
                          {formData.status === "ON_HOLD" && "En pause"}
                          {formData.status === "COMPLETED" && "Terminé"}
                          {formData.status === "CANCELLED" && "Annulé"}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Planification
                      </div>
                    </SelectItem>
                    <SelectItem value="ACTIVE">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Actif
                      </div>
                    </SelectItem>
                    <SelectItem value="ON_HOLD">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        En pause
                      </div>
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Terminé
                      </div>
                    </SelectItem>
                    <SelectItem value="CANCELLED">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Annulé
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description et objectif */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
              Description et objectifs
            </h3>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description de l'initiative"
                className="resize-none"
              />
            </div>

            {/* Objectif */}
            <div>
              <label
                htmlFor="objective"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Objectif
              </label>
              <Textarea
                id="objective"
                name="objective"
                rows={2}
                value={formData.objective}
                onChange={handleInputChange}
                placeholder="Objectif de l'initiative"
                className="resize-none"
              />
            </div>
          </div>

          {/* Planification */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
              Planification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de début */}
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date de début
                </label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>

              {/* Date de fin */}
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date de fin
                </label>
                <Input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Métriques */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">
              Métriques et suivi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Progrès */}
              <div>
                <label
                  htmlFor="progress"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Progrès (%)
                </label>
                <Input
                  type="number"
                  id="progress"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleInputChange}
                  className="text-center font-medium"
                />
                <Progress value={formData.progress} className="w-full mt-2" />
              </div>

              {/* Budget */}
              <div>
                <label
                  htmlFor="budget"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Budget (€)
                </label>
                <Input
                  type="number"
                  id="budget"
                  name="budget"
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>

              {/* ROI */}
              <div>
                <label
                  htmlFor="roi"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  ROI (%)
                </label>
                <Input
                  type="number"
                  id="roi"
                  name="roi"
                  step="0.01"
                  value={formData.roi}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="order-2 sm:order-1"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEditing ? "Modification..." : "Création..."}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Modifier</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Créer</span>
                    </>
                  )}
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
