// components/files/FilesForm.tsx

"use client";

import React, { JSX, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "next/navigation";
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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Package,
  Settings,
  Layers,
  Database,
  Code2,
  File,
  Folder,
  Save,
  X,
  Link,
  Globe,
  TestTube,
  Plus,
  Trash2,
  BookOpen,
  Download,
  Upload,
  Tag,
  AlertCircle,
  Info,
  Bug,
  CheckCircle,
  ChevronsUpDown,
  Check,
  FolderTree,
  Home,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import type { FileWithRelations, ApiResponse } from "@/types/files";
import type {FileType} from "@/lib/generated/prisma/client"
interface FileFormData {
  name: string;
  type: FileType;
  path?: string | null;
  description?: string | null;
  import?: string | null;
  use?: string | null;
  export?: string | null;
  script?: string | null;
  isFolder: boolean;
  tags: string[];
  metadata: Record<string, any>;
  projectId: string;
  parentId?: string | null;
  featureId?: string | null;
  userStoryId?: string | null;
  taskId?: string | null;
  sprintId?: string | null;
}

interface FolderOption {
  id: string;
  name: string;
  path: string[];
  level: number;
  parentId: string | null;
}

const fileFormSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(255),
  type: z.enum([
    "DOSSIER",
    "PAGE",
    "COMPONENT",
    "UTILS",
    "LIB",
    "STORE",
    "HOOK",
    "ENV",
    "SYSTEM",
    "TEST",
    "OTHER",
  ]),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  import: z.string().nullable().optional(),
  use: z.string().nullable().optional(),
  export: z.string().nullable().optional(),
  script: z.string().nullable().optional(),
  isFolder: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({}),
  projectId: z.string().cuid("Le projectId doit être un CUID valide"),
  parentId: z
    .string()
    .cuid("Le parentId doit être un CUID valide")
    .nullable()
    .optional(),
  featureId: z
    .string()
    .cuid("Le featureId doit être un CUID valide")
    .nullable()
    .optional(),
  userStoryId: z
    .string()
    .cuid("Le userStoryId doit être un CUID valide")
    .nullable()
    .optional(),
  taskId: z
    .string()
    .cuid("Le taskId doit être un CUID valide")
    .nullable()
    .optional(),
  sprintId: z
    .string()
    .cuid("Le sprintId doit être un CUID valide")
    .nullable()
    .optional(),
}) satisfies z.ZodType<FileFormData>;

interface FilesFormProps {
  file?: FileWithRelations | null;
  currentFolder?: string | null;
  projectId?: string;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function FilesForm({
  file,
  currentFolder,
  projectId: propProjectId,
  onSuccess,
  onCancel,
  isOpen,
}: FilesFormProps): JSX.Element {
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [availableFolders, setAvailableFolders] = useState<FolderOption[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);
  const [selectedParentPath, setSelectedParentPath] = useState<string[]>([]);

  const projectId = propProjectId || (params?.id as string) || "";

  const form = useForm<FileFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      type: "OTHER",
      path: null,
      description: null,
      import: null,
      use: null,
      export: null,
      script: null,
      isFolder: false,
      tags: [],
      metadata: {},
      projectId: "",
      parentId: null,
      featureId: null,
      userStoryId: null,
      taskId: null,
      sprintId: null,
    },
  });

  const fetchAvailableFolders = useCallback(async () => {
    if (!projectId) {
      console.log("⏹️ Pas de projectId, skip fetchAvailableFolders");
      return;
    }

    setIsLoadingFolders(true);
    console.log("📁 Début fetchAvailableFolders pour projectId:", projectId);

    try {
      const params = new URLSearchParams({
        projectId: projectId,
      });

      if (file?.id) {
        params.append("excludeId", file.id);
      }

      const url = `/api/files/folders?${params.toString()}`;
      console.log("🌐 URL de requête:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("📥 Résultat complet de l'API:", result);

      if (!result.success) {
        throw new Error(
          result.error || "Erreur lors du chargement des dossiers"
        );
      }

      const foldersData = result.data || [];
      console.log("📂 Dossiers reçus:", foldersData.length);

      const folderOptions: FolderOption[] = [
        {
          id: "",
          name: "Racine",
          path: [],
          level: 0,
          parentId: null,
        },
      ];

      foldersData.forEach((folder: any) => {
        folderOptions.push({
          id: folder.id,
          name: folder.name,
          path: folder.path || [],
          level: folder.level || 0,
          parentId: folder.parentId,
        });
      });

      setAvailableFolders(folderOptions);

      toast.success("Dossiers chargés", {
        description: `${foldersData.length} dossier(s) disponible(s)`,
      });
    } catch (error) {
      console.error("💥 Erreur lors du chargement des dossiers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      setAvailableFolders([
        {
          id: "",
          name: "Racine",
          path: [],
          level: 0,
          parentId: null,
        },
      ]);

      toast.error("Erreur de chargement des dossiers", {
        description: errorMessage,
      });
    } finally {
      setIsLoadingFolders(false);
    }
  }, [projectId, file?.id]);

  const getParentPathDisplay = useCallback(() => {
    const watchedParentId = form.watch("parentId");

    if (!watchedParentId) {
      return (
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Home className="h-4 w-4" />
          <span>Racine</span>
        </div>
      );
    }

    const parentFolder = availableFolders.find((f) => f.id === watchedParentId);

    if (!parentFolder) {
      return (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Dossier parent introuvable</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-1 text-sm text-gray-700">
        <FolderTree className="h-4 w-4 text-blue-500" />
        {parentFolder.path.length > 0 ? (
          parentFolder.path.map((segment, index) => (
            <React.Fragment key={index}>
              <span className="font-medium">{segment}</span>
              {index < parentFolder.path.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              )}
            </React.Fragment>
          ))
        ) : (
          <span className="font-medium">Racine</span>
        )}
        {parentFolder.level > 0 && (
          <Badge variant="outline" className="ml-2 text-xs">
            Niveau {parentFolder.level}
          </Badge>
        )}
      </div>
    );
  }, [availableFolders, form]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchAvailableFolders();
    }
  }, [isOpen, projectId, fetchAvailableFolders]);

  const validateForm = (data: FileFormData): string[] => {
    const result = fileFormSchema.safeParse(data);
    if (result.success) return [];

    return result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
  };

  useEffect(() => {
    if (file) {
      const resetData: FileFormData = {
        name: file.name,
        type: file.type,
        path: file.path,
        description: file.description,
        import: file.import,
        use: file.use,
        export: file.export,
        script: file.script,
        isFolder: file.isFolder,
        tags: file.tags || [],
        metadata: (file.metadata as Record<string, any>) || {},
        projectId: projectId,
        parentId: file.parentId || currentFolder || null,
        featureId: file.featureId || null,
        userStoryId: file.userStoryId || null,
        taskId: file.taskId || null,
        sprintId: file.sprintId || null,
      };

      if (file.parentId && availableFolders.length > 0) {
        const parentFolder = availableFolders.find(
          (f) => f.id === file.parentId
        );
        setSelectedParentPath(parentFolder?.path || []);
      } else {
        setSelectedParentPath([]);
      }

      form.reset(resetData);
    } else {
      const defaultData: FileFormData = {
        name: "",
        type: "OTHER",
        path: null,
        description: null,
        import: null,
        use: null,
        export: null,
        script: null,
        isFolder: false,
        tags: [],
        metadata: {},
        projectId: projectId,
        parentId: currentFolder || null,
        featureId: null,
        userStoryId: null,
        taskId: null,
        sprintId: null,
      };

      if (currentFolder && availableFolders.length > 0) {
        const parentFolder = availableFolders.find(
          (f) => f.id === currentFolder
        );
        setSelectedParentPath(parentFolder?.path || []);
      } else {
        setSelectedParentPath([]);
      }

      form.reset(defaultData);
    }

    setValidationErrors([]);
  }, [file, currentFolder, form, projectId, availableFolders]);

  const onSubmit = useCallback(
    async (data: FileFormData) => {
      console.log("🚀 DÉBUT SOUMISSION FORMULAIRE");
      console.log("📋 Données du formulaire reçues:", data);

      if (!data.projectId) {
        const errorMsg = "ProjectId manquant - impossible de continuer";
        console.error("❌ ERREUR CRITIQUE:", errorMsg);
        toast.error("Erreur de configuration", {
          description: errorMsg,
        });
        return;
      }

      const cuidRegex = /^[cC][a-zA-Z0-9]{24,}$/;
      if (!cuidRegex.test(data.projectId)) {
        const errorMsg = `ProjectId invalide (pas un CUID): ${data.projectId}`;
        console.error("❌ VALIDATION CUID ÉCHOUÉE:", errorMsg);
        toast.error("Erreur de validation", {
          description: "L'ID du projet n'est pas au format CUID valide",
        });
        return;
      }

      if (data.parentId && !cuidRegex.test(data.parentId)) {
        const errorMsg = `ParentId invalide (pas un CUID): ${data.parentId}`;
        console.error("❌ VALIDATION PARENT CUID ÉCHOUÉE:", errorMsg);
        toast.error("Erreur de validation", {
          description: "L'ID du dossier parent n'est pas au format CUID valide",
        });
        return;
      }

      if (file && data.parentId === file.id) {
        const errorMsg = "Un dossier ne peut pas être son propre parent";
        console.error("❌ RÉFÉRENCE CIRCULAIRE DÉTECTÉE:", errorMsg);
        toast.error("Erreur de hiérarchie", {
          description: errorMsg,
        });
        return;
      }

      const errors = validateForm(data);
      if (errors.length > 0) {
        console.error("❌ ERREURS DE VALIDATION Zod:", errors);
        setValidationErrors(errors);
        toast.error("Erreurs de validation", {
          description:
            errors.slice(0, 2).join(", ") + (errors.length > 2 ? "..." : ""),
        });
        return;
      }

      setValidationErrors([]);
      setIsSubmitting(true);

      try {
        const method = file ? "PUT" : "POST";
        const url = file ? `/api/files/${file.id}` : "/api/files";

        const requestData = {
          ...data,
          path: data.path?.trim() || null,
          description: data.description?.trim() || null,
          import: data.import?.trim() || null,
          use: data.use?.trim() || null,
          export: data.export?.trim() || null,
          script: data.script?.trim() || null,
          parentId: data.parentId?.trim() || null,
          version: file?.version || 1,
          mimeType: null,
          order: file?.order || 1000,
        };

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ ERREUR HTTP:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });

          let errorMessage = `Erreur ${response.status}: ${response.statusText}`;

          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const result: ApiResponse<FileWithRelations> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la sauvegarde");
        }

        toast.success(
          file
            ? "Métadonnées mises à jour avec succès"
            : "Référence ajoutée avec succès",
          {
            description: `La référence "${data.name}" a été ${
              file ? "modifiée" : "ajoutée"
            } dans le référentiel`,
          }
        );

        onSuccess();
      } catch (error) {
        console.error("💥 ERREUR LORS DE LA SAUVEGARDE:", error);

        let errorMessage = "Erreur lors de la sauvegarde";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(errorMessage, {
          description: "Vérifiez les données saisies et réessayez",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [file, onSuccess, validateForm]
  );

  const getTypeIcon = useCallback((type: FileType): JSX.Element => {
    const iconProps = "h-4 w-4";

    switch (type) {
      case "DOSSIER":
        return <Folder className={`${iconProps} text-blue-500`} />;
      case "PAGE":
        return <FileText className={`${iconProps} text-green-500`} />;
      case "COMPONENT":
        return <Package className={`${iconProps} text-blue-500`} />;
      case "UTILS":
        return <Settings className={`${iconProps} text-gray-500`} />;
      case "LIB":
        return <Layers className={`${iconProps} text-purple-500`} />;
      case "STORE":
        return <Database className={`${iconProps} text-orange-500`} />;
      case "HOOK":
        return <Code2 className={`${iconProps} text-pink-500`} />;
      case "ENV":
        return <Settings className={`${iconProps} text-yellow-500`} />;
      case "SYSTEM":
        return <Globe className={`${iconProps} text-red-500`} />;
      case "TEST":
        return <TestTube className={`${iconProps} text-green-600`} />;
      case "OTHER":
      default:
        return <File className={`${iconProps} text-gray-400`} />;
    }
  }, []);

  const getTypeLabel = useCallback((type: FileType): string => {
    const labelMap: Record<FileType, string> = {
      DOSSIER: "Dossier",
      PAGE: "Page Next.js",
      COMPONENT: "Composant React",
      UTILS: "Utilitaires",
      LIB: "Librairie",
      STORE: "Store",
      HOOK: "Hook React",
      ENV: "Environment",
      SYSTEM: "Système",
      TEST: "Test",
      OTHER: "Autre",
    };
    return labelMap[type] || "Autre";
  }, []);

  const handleParentSelection = useCallback(
    (folderId: string) => {
      const selectedFolder = availableFolders.find((f) => f.id === folderId);

      form.setValue("parentId", folderId || null, { shouldValidate: true });
      setSelectedParentPath(selectedFolder?.path || []);
      setIsFolderSelectorOpen(false);

      toast.success("Dossier parent sélectionné", {
        description: selectedFolder
          ? `Placé dans: ${selectedFolder.path.join(" / ")}`
          : "Placé à la racine du projet",
      });
    },
    [availableFolders, form]
  );

  const addTag = useCallback(() => {
    const trimmedTag = currentTag.trim();
    const currentTags = form.getValues("tags") || [];

    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      const newTags = [...currentTags, trimmedTag];
      form.setValue("tags", newTags);
      setCurrentTag("");
    }
  }, [currentTag, form]);

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const currentTags = form.getValues("tags") || [];
      const newTags = currentTags.filter((tag) => tag !== tagToRemove);
      form.setValue("tags", newTags);
    },
    [form]
  );

  const watchedIsFolder = form.watch("isFolder");
  const watchedType = form.watch("type");
  const watchedTags = form.watch("tags") || [];
  const watchedParentId = form.watch("parentId");
  const isProjectIdValid =
    projectId && /^[cC][a-zA-Z0-9]{24,}$/.test(projectId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {watchedIsFolder ? (
              <Folder className="h-5 w-5 text-blue-500" />
            ) : (
              getTypeIcon(watchedType)
            )}
            <span>
              {file ? "Modifier la référence" : "Ajouter une référence"}
            </span>
            <div className="flex items-center space-x-2">
              <Badge
                variant={file ? "secondary" : "default"}
                className="text-xs"
              >
                <Bug className="h-3 w-3 mr-1" />
                {file ? "EDIT" : "CREATE"}
              </Badge>
              <Badge
                variant={isProjectIdValid ? "default" : "destructive"}
                className="text-xs"
              >
                {isProjectIdValid ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                Project:{" "}
                {projectId ? projectId.substring(0, 8) + "..." : "MANQUANT"}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-120px)] overflow-y-auto">
          {!isProjectIdValid && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Configuration requise manquante
                </span>
              </div>
              <p className="text-sm text-red-600">
                L'ID du projet est manquant ou invalide. Assurez-vous d'être sur
                une page de projet valide.
              </p>
              <div className="text-xs text-red-500 mt-1">
                ProjectId reçu: <code>{projectId || "null"}</code>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Erreurs de validation
                </span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-1"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Informations essentielles</span>
                    <Badge variant="secondary" className="text-xs">
                      model File - champs de base
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la référence *</FormLabel>
                          <FormControl>
                            <Input placeholder="nom-du-fichier" {...field} />
                          </FormControl>
                          <FormDescription>
                            → File.name (String) dans le schéma Prisma
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un type">
                                  {field.value && (
                                    <span className="flex items-center">
                                      {getTypeIcon(field.value)}
                                      <span className="ml-2">
                                        {getTypeLabel(field.value)}
                                      </span>
                                    </span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                                Développement
                              </div>
                              {[
                                {
                                  value: "DOSSIER",
                                  icon: Folder,
                                  label: "Dossier",
                                  color: "text-blue-500",
                                },
                                {
                                  value: "PAGE",
                                  icon: FileText,
                                  label: "Page Next.js",
                                  color: "text-green-500",
                                },
                                {
                                  value: "COMPONENT",
                                  icon: Package,
                                  label: "Composant React",
                                  color: "text-blue-500",
                                },
                                {
                                  value: "UTILS",
                                  icon: Settings,
                                  label: "Utilitaires",
                                  color: "text-gray-500",
                                },
                                {
                                  value: "LIB",
                                  icon: Layers,
                                  label: "Librairie",
                                  color: "text-purple-500",
                                },
                                {
                                  value: "STORE",
                                  icon: Database,
                                  label: "Store",
                                  color: "text-orange-500",
                                },
                                {
                                  value: "HOOK",
                                  icon: Code2,
                                  label: "Hook React",
                                  color: "text-pink-500",
                                },
                              ].map(({ value, icon: Icon, label, color }) => (
                                <SelectItem key={value} value={value}>
                                  <span className="flex items-center">
                                    <Icon className={`h-4 w-4 mr-2 ${color}`} />
                                    {label}
                                  </span>
                                </SelectItem>
                              ))}

                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                                Système
                              </div>
                              {[
                                {
                                  value: "ENV",
                                  icon: Settings,
                                  label: "Environment",
                                  color: "text-yellow-500",
                                },
                                {
                                  value: "SYSTEM",
                                  icon: Globe,
                                  label: "Système",
                                  color: "text-red-500",
                                },
                                {
                                  value: "TEST",
                                  icon: TestTube,
                                  label: "Test",
                                  color: "text-green-600",
                                },
                                {
                                  value: "OTHER",
                                  icon: File,
                                  label: "Autre",
                                  color: "text-gray-400",
                                },
                              ].map(({ value, icon: Icon, label, color }) => (
                                <SelectItem key={value} value={value}>
                                  <span className="flex items-center">
                                    <Icon className={`h-4 w-4 mr-2 ${color}`} />
                                    {label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            → File.type (FileType enum) dans le schéma Prisma
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dossier parent</FormLabel>
                        <Popover
                          open={isFolderSelectorOpen}
                          onOpenChange={setIsFolderSelectorOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                                disabled={isLoadingFolders}
                              >
                                {getParentPathDisplay()}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Rechercher un dossier..." />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingFolders
                                    ? "Chargement des dossiers..."
                                    : "Aucun dossier trouvé."}
                                </CommandEmpty>
                                {availableFolders.map((folder) => (
                                  <CommandItem
                                    key={folder.id || "root"}
                                    value={folder.id}
                                    onSelect={() =>
                                      handleParentSelection(folder.id)
                                    }
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        field.value === folder.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex items-center space-x-2 flex-1">
                                      {folder.id === "" ? (
                                        <Home className="h-4 w-4 text-blue-500" />
                                      ) : (
                                        <Folder className="h-4 w-4 text-yellow-500" />
                                      )}

                                      <div
                                        className="flex items-center space-x-1"
                                        style={{
                                          marginLeft: `${folder.level * 16}px`,
                                        }}
                                      >
                                        {folder.level > 0 && (
                                          <span className="text-gray-400 text-xs">
                                            {"└─ ".repeat(1)}
                                          </span>
                                        )}
                                        <span className="font-medium">
                                          {folder.name}
                                        </span>
                                      </div>

                                      {folder.level > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs ml-auto"
                                        >
                                          Niveau {folder.level}
                                        </Badge>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          → File.parentId (String?) - Dossier parent pour
                          l'organisation hiérarchique
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chemin/URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://github.com/repo/file.tsx ou /src/components/file.tsx"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          → File.path (String?) - Chemin GitHub, local ou URL
                          vers le fichier
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
                            placeholder="Description du fichier, de son rôle et de ses responsabilités..."
                            className="min-h-[80px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          → File.description (String?) - Description du rôle et
                          responsabilités
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFolder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Dossier virtuel
                          </FormLabel>
                          <FormDescription>
                            → File.isFolder (Boolean) - Cette référence
                            représente un dossier d'organisation
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {!watchedIsFolder && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Code2 className="h-5 w-5" />
                      <span>Aide au développement</span>
                      <Badge variant="secondary" className="text-xs">
                        Champs spécialisés développement
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="import"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Download className="h-4 w-4" />
                              <span>Imports</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="import { useState } from 'react'&#10;import { Button } from '@/components/ui/button'"
                                className="min-h-[100px] font-mono text-sm"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              → File.import (String?) - Imports utilisés par ce
                              fichier (un par ligne)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="export"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Upload className="h-4 w-4" />
                              <span>Exports</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="export { Component } from './Component'&#10;export default MyComponent"
                                className="min-h-[100px] font-mono text-sm"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormDescription>
                              → File.export (String?) - Exports fournis par ce
                              fichier (un par ligne)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="use"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Link className="h-4 w-4" />
                            <span>Utilisation/Dépendances</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="biblioteque, lib, utils, store, hook, shadcn/ui, lucide-react..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            → File.use (String?) - Librairies, outils ou
                            dépendances utilisées
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="script"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Code2 className="h-4 w-4" />
                            <span>Script/Code</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="// Code TypeScript, fonction principale, configuration..."
                              className="min-h-[120px] font-mono text-sm"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            → File.script (String?) - Code principal,
                            configuration ou script du fichier
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Tags</span>
                    <Badge variant="secondary" className="text-xs">
                      File.tags (String[])
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Ajouter un tag..."
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        disabled={!currentTag.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {watchedTags.map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{tag}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTag(tag)}
                              className="h-auto p-0 hover:bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      → File.tags (String[]) - Tags pour classification et
                      recherche ({watchedTags.length} tag
                      {watchedTags.length !== 1 ? "s" : ""})
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Info className="h-4 w-4" />
                  <span>
                    {file ? "Modification" : "Création"} d'une référence{" "}
                    {watchedType.toLowerCase()}
                  </span>
                  {watchedParentId && (
                    <Badge variant="outline" className="text-xs">
                      <FolderTree className="h-3 w-3 mr-1" />
                      Parent:{" "}
                      {availableFolders.find((f) => f.id === watchedParentId)
                        ?.name || "Inconnu"}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isProjectIdValid}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting
                      ? "Sauvegarde..."
                      : file
                      ? "Mettre à jour"
                      : "Ajouter"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
