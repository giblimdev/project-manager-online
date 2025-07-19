// components/files/FilesForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

// Interface basée exactement sur votre schéma Prisma
interface FileWithRelations {
  id: string;
  name: string;
  originalName: string | null;
  type:
    | "DOCUMENT"
    | "IMAGE"
    | "VIDEO"
    | "ARCHIVE"
    | "CODE"
    | "SPECIFICATION"
    | "DESIGN"
    | "TEST"
    | "OTHER";
  mimeType: string;
  size: number;
  url: string;
  path: string | null;
  description: string | null;
  import: any;
  export: any;
  script: string | null;
  version: number;
  isPublic: boolean;
  isFolder: boolean;
  metadata: any;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;

  uploader: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    isActive: boolean;
  };

  project?: {
    id: string;
    name: string;
    key: string;
    slug: string;
  } | null;

  feature?: {
    id: string;
    name: string;
  } | null;

  userStory?: {
    id: string;
    title: string;
  } | null;

  task?: {
    id: string;
    title: string;
  } | null;

  sprint?: {
    id: string;
    name: string;
  } | null;
}

const fileSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),

  description: z
    .string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional()
    .nullable(),

  // ✅ Syntaxe correcte pour z.enum() avec votre énumération FileType
  type: z.enum([
    "DOCUMENT",
    "IMAGE",
    "VIDEO",
    "ARCHIVE",
    "CODE",
    "SPECIFICATION",
    "DESIGN",
    "TEST",
    "OTHER",
  ]),

  isPublic: z.boolean().default(false),
  isFolder: z.boolean().default(false),

  tags: z
    .array(z.string().min(1).max(50))
    .max(20, "Maximum 20 tags autorisés")
    .default([]),

  script: z
    .string()
    .max(5000, "Le script ne peut pas dépasser 5000 caractères")
    .optional()
    .nullable(),

  projectId: z.string().optional().nullable(),
  featureId: z.string().optional().nullable(),
  userStoryId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),

  // ✅ Correction de z.record() avec keyType et valueType
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

type FileFormData = z.infer<typeof fileSchema>;

export interface FilesFormProps {
  file?: FileWithRelations | null;
  currentFolder?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FilesForm: React.FC<FilesFormProps> = ({
  file,
  currentFolder,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableProjects, setAvailableProjects] = useState<
    Array<{ id: string; name: string; key: string }>
  >([]);
  const [availableFeatures, setAvailableFeatures] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableUserStories, setAvailableUserStories] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [availableTasks, setAvailableTasks] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [availableSprints, setAvailableSprints] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // ✅ React Hook Form sans zodResolver
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: formErrors },
    reset,
  } = useForm<FileFormData>({
    defaultValues: {
      name: file?.name || "",
      description: file?.description || "",
      type: file?.type || "DOCUMENT",
      isPublic: file?.isPublic || false,
      isFolder: file?.isFolder || false,
      tags: file?.tags || [],
      script: file?.script || "",
      projectId: file?.project?.id || "",
      featureId: file?.feature?.id || "",
      userStoryId: file?.userStory?.id || "",
      taskId: file?.task?.id || "",
      sprintId: file?.sprint?.id || "",
      metadata: file?.metadata || {},
    },
  });

  const watchedTags = watch("tags") || [];
  const watchedIsFolder = watch("isFolder");
  const watchedProjectId = watch("projectId");

  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const projectsResponse = await fetch(
          "/api/projects?select=id,name,key"
        );
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setAvailableProjects(
            Array.isArray(projectsData)
              ? projectsData
              : projectsData.projects || []
          );
        }

        if (watchedProjectId) {
          const [featuresRes, userStoriesRes, tasksRes, sprintsRes] =
            await Promise.all([
              fetch(
                `/api/projects/${watchedProjectId}/features?select=id,name`
              ),
              fetch(
                `/api/projects/${watchedProjectId}/user-stories?select=id,title`
              ),
              fetch(`/api/projects/${watchedProjectId}/tasks?select=id,title`),
              fetch(`/api/projects/${watchedProjectId}/sprints?select=id,name`),
            ]);

          if (featuresRes.ok) {
            const featuresData = await featuresRes.json();
            setAvailableFeatures(
              Array.isArray(featuresData)
                ? featuresData
                : featuresData.features || []
            );
          }

          if (userStoriesRes.ok) {
            const userStoriesData = await userStoriesRes.json();
            setAvailableUserStories(
              Array.isArray(userStoriesData)
                ? userStoriesData
                : userStoriesData.userStories || []
            );
          }

          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            setAvailableTasks(
              Array.isArray(tasksData) ? tasksData : tasksData.tasks || []
            );
          }

          if (sprintsRes.ok) {
            const sprintsData = await sprintsRes.json();
            setAvailableSprints(
              Array.isArray(sprintsData)
                ? sprintsData
                : sprintsData.sprints || []
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    fetchRelatedData();
  }, [watchedProjectId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setUploadFile(selectedFile);

      const fileType = getFileTypeFromMimeType(selectedFile.type);
      setValue("type", fileType);

      if (!watch("name")) {
        setValue("name", selectedFile.name.replace(/\.[^/.]+$/, ""));
      }

      setValue("isFolder", false);
    }
  };

  const getFileTypeFromMimeType = (mimeType: string): FileFormData["type"] => {
    if (mimeType.match(/^image\/(jpeg|jpg|png|gif|svg|webp|bmp)/))
      return "IMAGE";
    if (mimeType.match(/^video\/(mp4|avi|mov|wmv|mkv|webm)/)) return "VIDEO";
    if (mimeType.match(/zip|rar|7z|tar|gzip/)) return "ARCHIVE";
    if (mimeType.match(/javascript|python|java|php|sql|json|xml|yaml/))
      return "CODE";
    if (mimeType.match(/pdf|document|text|rtf|odt/)) return "DOCUMENT";
    if (mimeType.match(/photoshop|sketch|figma|illustrator|indesign/))
      return "DESIGN";
    if (mimeType.match(/markdown|yaml|openapi|swagger/)) return "SPECIFICATION";
    return "OTHER";
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (
      trimmedTag &&
      !watchedTags.includes(trimmedTag) &&
      watchedTags.length < 20
    ) {
      setValue("tags", [...watchedTags, trimmedTag]);
      setTagInput("");
    } else if (watchedTags.length >= 20) {
      toast.error("Maximum 20 tags autorisés");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      watchedTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // ✅ Validation manuelle avec Zod
  const validateForm = (data: FileFormData) => {
    try {
      fileSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          newErrors[path] = issue.message;
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  };

  const onSubmit = async (data: FileFormData) => {
    try {
      setIsSubmitting(true);

      // Validation des données
      if (!validateForm(data)) {
        return;
      }

      if (!data.isFolder && !uploadFile && !file) {
        toast.error("Veuillez sélectionner un fichier ou créer un dossier");
        return;
      }

      const formData = new FormData();

      if (uploadFile) {
        formData.append("file", uploadFile);
      }

      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      formData.append("type", data.type);
      formData.append("isPublic", String(data.isPublic));
      formData.append("isFolder", String(data.isFolder));
      if (data.script) formData.append("script", data.script);

      if (data.projectId) formData.append("projectId", data.projectId);
      if (data.featureId) formData.append("featureId", data.featureId);
      if (data.userStoryId) formData.append("userStoryId", data.userStoryId);
      if (data.taskId) formData.append("taskId", data.taskId);
      if (data.sprintId) formData.append("sprintId", data.sprintId);

      formData.append("tags", JSON.stringify(data.tags));
      formData.append("metadata", JSON.stringify(data.metadata || {}));

      if (currentFolder) {
        formData.append("parentId", currentFolder);
      }

      const url = file ? `/api/files/${file.id}` : "/api/files";
      const method = file ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      toast.success(
        file ? "Fichier modifié avec succès" : "Fichier créé avec succès"
      );
      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {!file && !watchedIsFolder && (
        <div className="space-y-2">
          <Label htmlFor="file-upload">Fichier à uploader</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-500">
                Cliquez pour sélectionner un fichier
              </span>
              {uploadFile && (
                <span className="text-sm text-blue-600 font-medium">
                  {uploadFile.name}
                </span>
              )}
            </label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              placeholder="Nom du fichier ou dossier"
              {...register("name", { required: "Le nom est requis" })}
            />
            {(errors.name || formErrors.name) && (
              <p className="text-sm text-red-600">
                {errors.name || formErrors.name?.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du fichier"
              className="resize-none"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              onValueChange={(value) =>
                setValue("type", value as FileFormData["type"])
              }
              defaultValue={watch("type")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOCUMENT">
                  Document (PDF, DOC, DOCX, TXT, RTF, ODT)
                </SelectItem>
                <SelectItem value="IMAGE">
                  Image (JPG, PNG, GIF, SVG, WEBP, BMP)
                </SelectItem>
                <SelectItem value="VIDEO">
                  Vidéo (MP4, AVI, MOV, WMV, MKV, WEBM)
                </SelectItem>
                <SelectItem value="ARCHIVE">
                  Archive (ZIP, RAR, 7Z, TAR, GZ)
                </SelectItem>
                <SelectItem value="CODE">
                  Code (JS, TS, PY, JAVA, PHP, SQL, JSON, XML, YML)
                </SelectItem>
                <SelectItem value="SPECIFICATION">
                  Spécification (MD, YAML, OpenAPI, Swagger)
                </SelectItem>
                <SelectItem value="DESIGN">
                  Design (PSD, SKETCH, FIGMA, AI, XD, INDD)
                </SelectItem>
                <SelectItem value="TEST">
                  Test (Scripts de test, rapports, données)
                </SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type}</p>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Fichier public</Label>
                <div className="text-sm text-muted-foreground">
                  Accessible à tous les utilisateurs
                </div>
              </div>
              <Switch
                checked={watch("isPublic")}
                onCheckedChange={(checked) => setValue("isPublic", checked)}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Dossier</Label>
                <div className="text-sm text-muted-foreground">
                  Créer un dossier au lieu d'un fichier
                </div>
              </div>
              <Switch
                checked={watch("isFolder")}
                onCheckedChange={(checked) => setValue("isFolder", checked)}
                disabled={!!uploadFile}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Projet */}
          <div className="space-y-2">
            <Label>Projet</Label>
            <Select
              onValueChange={(value) => setValue("projectId", value || "")}
              value={watch("projectId") || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun projet</SelectItem>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.key} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feature */}
          {watchedProjectId && availableFeatures.length > 0 && (
            <div className="space-y-2">
              <Label>Feature</Label>
              <Select
                onValueChange={(value) => setValue("featureId", value || "")}
                value={watch("featureId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune feature</SelectItem>
                  {availableFeatures.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* User Story */}
          {watchedProjectId && availableUserStories.length > 0 && (
            <div className="space-y-2">
              <Label>User Story</Label>
              <Select
                onValueChange={(value) => setValue("userStoryId", value || "")}
                value={watch("userStoryId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une user story" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune user story</SelectItem>
                  {availableUserStories.map((story) => (
                    <SelectItem key={story.id} value={story.id}>
                      {story.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Task */}
          {watchedProjectId && availableTasks.length > 0 && (
            <div className="space-y-2">
              <Label>Tâche</Label>
              <Select
                onValueChange={(value) => setValue("taskId", value || "")}
                value={watch("taskId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une tâche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune tâche</SelectItem>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sprint */}
          {watchedProjectId && availableSprints.length > 0 && (
            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select
                onValueChange={(value) => setValue("sprintId", value || "")}
                value={watch("sprintId") || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun sprint</SelectItem>
                  {availableSprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ajouter un tag..."
            className="flex-1"
            maxLength={50}
          />
          <Button
            type="button"
            onClick={addTag}
            variant="outline"
            disabled={!tagInput.trim() || watchedTags.length >= 20}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
        {watchedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {watchedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-2 py-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {watchedTags.length}/20 tags
        </div>
        {errors.tags && <p className="text-sm text-red-600">{errors.tags}</p>}
      </div>

      {/* Script */}
      <div className="space-y-2">
        <Label htmlFor="script">Script</Label>
        <Textarea
          id="script"
          placeholder="Script ou commandes associées..."
          className="resize-none font-mono"
          rows={4}
          {...register("script")}
        />
        {errors.script && (
          <p className="text-sm text-red-600">{errors.script}</p>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {file ? "Modifier" : "Créer"}
        </Button>
      </div>
    </form>
  );
};
