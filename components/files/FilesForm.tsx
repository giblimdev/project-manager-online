// components/files/FilesForm.tsx

/**
 * RÔLE : Formulaire moderne de création et modification des fichiers avec arborescence
 * RESPONSABILITÉS :
 * - Créer de nouveaux enregistrements File dans la table avec toutes les propriétés du schéma Prisma
 * - Modifier des fichiers existants avec validation complète react-hook-form + Zod
 * - Gestion intelligente de l'arborescence des fichiers avec sélecteur de parent
 * - Génération automatique des URLs et chemins basés sur la hiérarchie
 * - Valeurs par défaut intelligentes (mimeType, URL, chemin) selon le nom et parent
 * - Interface responsive moderne cohérente avec le design system
 * - Gestion des états de chargement et validation temps réel optimisée
 * - Support des nouveaux types de fichiers selon schéma Prisma mis à jour
 * - Gestion complète de la relation parent pour organisation hiérarchique
 * - Dialog moderne avec sections organisées et feedback utilisateur
 * - Logique conditionnelle pour dossiers (pas de mimeType requis)
 * - UX optimisée avec responsive design et bouton de validation toujours visible
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Dialog, Input, Textarea, Select, Button, Switch, Badge, Combobox, ScrollArea
 * - react-hook-form: Gestion formulaire avec validation temps réel et zodResolver
 * - zod: Schéma validation strict selon Prisma File avec messages français
 * - lucide-react: Icons modernes cohérentes (Save, Plus, File, Folder, FolderTree, etc.)
 * - sonner: Toast notifications feedback utilisateur avec durée adaptée
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - react-hook-form (^7.47.0) avec zodResolver et types stricts
 * - zod validation schema strict selon schéma Prisma File avec mimeType nullable
 * - Tailwind CSS responsive design moderne avec gradient et shadows
 *
 * PROPS reçues du parent :
 * - file: FileWithRelations | null - Fichier à éditer (null pour création)
 * - currentFolder: string | null - ID du dossier parent pour création
 * - onSuccess: () => void - Callback succès avec rechargement liste
 * - onCancel: () => void - Callback annulation avec fermeture modal
 * - isOpen: boolean - État d'ouverture du Dialog
 *
 * API :
 * - POST /api/files (création avec validation complète)
 * - PUT /api/files/[id] (modification avec validation et conversion types)
 * - GET /api/files/folders (récupération de l'arborescence des dossiers)
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save,
  Plus,
  File,
  FolderOpen,
  Link,
  Tag,
  Settings,
  Globe,
  Lock,
  Loader2,
  X,
  FolderTree,
  ChevronsUpDown,
  Check,
  Folder,
  Package,
  Layers,
  Database,
  Code2,
  FileText,
  Image,
  Video,
  Archive,
  Paintbrush,
  TestTube,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ✅ Interface FileWithRelations mise à jour selon le nouveau schéma Prisma
interface FileWithRelations {
  id: string;
  name: string;
  originalName: string | null;
  type:
    | "PAGE"
    | "COMPONENT"
    | "UTILS"
    | "LIB"
    | "STORE"
    | "HOOK"
    | "DOCUMENT"
    | "IMAGE"
    | "VIDEO"
    | "ARCHIVE"
    | "CODE"
    | "SPECIFICATION"
    | "DESIGN"
    | "TEST"
    | "OTHER";
  mimeType: string | null; // ✅ MimeType nullable selon le nouveau schéma
  size: number | null;
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
    bio?: string | null;
    timezone?: string | null;
    preferences?: any;
    isActive: boolean;
  };
  parent?: {
    id: string;
    name: string;
    isFolder: boolean;
  } | null;
  children?: FileWithRelations[];
  project?: {
    id: string;
    name: string;
    key: string;
    slug: string;
  } | null;
  feature?: {
    id: string;
    name: string;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } | null;
  userStory?: {
    id: string;
    title: string;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } | null;
  task?: {
    id: string;
    title: string;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  } | null;
  sprint?: {
    id: string;
    name: string;
    goal?: string | null;
    status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  } | null;
  versions?: Array<{
    id: string;
    version: number;
    url: string;
    size: number;
    checksum?: string | null;
    changelog?: string | null;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    mentions: string[];
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  items?: Array<{
    id: string;
    type: string;
    name: string;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";
  }>;
  _count?: {
    children?: number;
    versions?: number;
    comments?: number;
    items?: number;
  };
}

// Interface pour les dossiers de l'arborescence
interface FolderNode {
  id: string;
  name: string;
  path: string;
  level: number;
  parentId: string | null;
}

// Interface pour les props du composant
interface FilesFormProps {
  file?: FileWithRelations | null;
  currentFolder: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

// Interface pour la réponse API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ✅ Schéma Zod mis à jour avec mimeType nullable et logique conditionnelle pour dossiers
const fileFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Le nom est obligatoire")
      .max(255, "Le nom ne peut pas dépasser 255 caractères")
      .trim(),
    originalName: z
      .string()
      .max(255, "Le nom original ne peut pas dépasser 255 caractères")
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .max(2000, "La description ne peut pas dépasser 2000 caractères")
      .optional()
      .or(z.literal("")),
    type: z.enum(
      [
        "PAGE",
        "COMPONENT",
        "UTILS",
        "LIB",
        "STORE",
        "HOOK",
        "DOCUMENT",
        "IMAGE",
        "VIDEO",
        "ARCHIVE",
        "CODE",
        "SPECIFICATION",
        "DESIGN",
        "TEST",
        "OTHER",
      ],
      {
        message: "Veuillez sélectionner un type de fichier valide",
      }
    ),
    // ✅ MimeType nullable et conditionnel selon isFolder
    mimeType: z
      .string()
      .max(100, "Le type MIME ne peut pas dépasser 100 caractères")
      .nullable()
      .optional(),
    url: z
      .string()
      .url("L'URL doit être valide")
      .min(1, "L'URL est obligatoire"),
    path: z
      .string()
      .max(1000, "Le chemin ne peut pas dépasser 1000 caractères")
      .optional()
      .or(z.literal("")),
    size: z
      .number()
      .min(0, "La taille doit être positive")
      .max(1073741824, "La taille ne peut pas dépasser 1GB") // 1GB max
      .optional()
      .nullable(),
    isPublic: z.boolean(),
    isFolder: z.boolean(),
    tags: z
      .array(z.string().trim())
      .max(20, "Maximum 20 tags autorisés")
      .optional(),
    script: z
      .string()
      .max(50000, "Le script ne peut pas dépasser 50000 caractères")
      .optional()
      .or(z.literal("")),
    // ✅ Parent folder pour hiérarchie
    parentId: z.string().optional().nullable(),
    // Relations optionnelles
    projectId: z.string().optional(),
    featureId: z.string().optional(),
    userStoryId: z.string().optional(),
    taskId: z.string().optional(),
    sprintId: z.string().optional(),
    // Métadonnées
    metadata: z.record(z.string(), z.any()).optional(),
  })
  // ✅ Validation conditionnelle : mimeType requis seulement si ce n'est pas un dossier
  .refine(
    (data) => {
      if (data.isFolder) {
        return true; // Pas de validation mimeType pour les dossiers
      }
      return data.mimeType && data.mimeType.trim().length > 0;
    },
    {
      message: "Le type MIME est obligatoire pour les fichiers (non dossiers)",
      path: ["mimeType"],
    }
  );

type FileFormValues = z.infer<typeof fileFormSchema>;

export default function FilesForm({
  file = null,
  currentFolder,
  onSuccess,
  onCancel,
  isOpen,
}: FilesFormProps): JSX.Element {
  // États locaux
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>("");
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
  const [parentPickerOpen, setParentPickerOpen] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Mode édition ou création
  const isEditing = useMemo(() => Boolean(file?.id), [file]);

  // ✅ Fonction pour obtenir le mimeType par défaut selon l'extension et le type
  const getDefaultMimeType = useCallback(
    (
      fileName: string,
      fileType?: string,
      isFolder?: boolean
    ): string | null => {
      // ✅ Si c'est un dossier, pas de mimeType
      if (isFolder) return null;

      const extension = fileName.split(".").pop()?.toLowerCase() || "";

      // Mapping selon le type de fichier et l'extension
      const mimeTypeMap: Record<string, string> = {
        // Pages React/Next.js
        tsx: fileType === "PAGE" ? "text/typescript-jsx" : "text/typescript",
        jsx: fileType === "PAGE" ? "text/javascript-jsx" : "text/javascript",
        // TypeScript/JavaScript
        ts: "text/typescript",
        js: "text/javascript",
        // Web
        html: "text/html",
        css: "text/css",
        scss: "text/scss",
        sass: "text/sass",
        json: "application/json",
        // Documents
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
        md: "text/markdown",
        mdx: "text/mdx",
        // Images
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        webp: "image/webp",
        ico: "image/x-icon",
        // Vidéos
        mp4: "video/mp4",
        avi: "video/avi",
        mov: "video/quicktime",
        webm: "video/webm",
        // Archives
        zip: "application/zip",
        rar: "application/x-rar-compressed",
        "7z": "application/x-7z-compressed",
        tar: "application/x-tar",
        gz: "application/gzip",
      };

      return mimeTypeMap[extension] || "application/octet-stream";
    },
    []
  );

  // ✅ Fonction pour générer l'URL par défaut
  const generateDefaultUrl = useCallback(
    (fileName: string, parentPath: string = "", isFolder?: boolean): string => {
      const cleanFileName = fileName.trim();
      const cleanParentPath = parentPath.replace(/^\/+|\/+$/g, ""); // Supprime les "/" en début/fin

      const basePath = cleanParentPath ? `${cleanParentPath}/` : "";

      // ✅ Pour un dossier, pas d'extension dans l'URL
      if (isFolder) {
        return `http://localhost:3000/files/${basePath}${cleanFileName}/`;
      }

      return `http://localhost:3000/files/${basePath}${cleanFileName}`;
    },
    []
  );

  // ✅ Fonction pour générer le chemin par défaut
  const generateDefaultPath = useCallback(
    (fileName: string, parentPath: string = "", isFolder?: boolean): string => {
      const cleanFileName = fileName.trim();
      const cleanParentPath = parentPath.replace(/^@\/+|\/+$/g, ""); // Supprime @/ en début et / en fin

      const basePath = cleanParentPath ? `${cleanParentPath}/` : "";

      // ✅ Pour un dossier, ajouter un slash final
      if (isFolder) {
        return `@/${basePath}${cleanFileName}/`;
      }

      return `@/${basePath}${cleanFileName}`;
    },
    []
  );

  // ✅ Fonction pour obtenir le chemin complet d'un parent
  const getParentPath = useCallback(
    (parentId: string | null): string => {
      if (!parentId) return "";

      const buildPath = (folderId: string): string => {
        const folder = folders.find((f) => f.id === folderId);
        if (!folder) return "";

        if (folder.parentId) {
          const parentPath = buildPath(folder.parentId);
          return parentPath ? `${parentPath}/${folder.name}` : folder.name;
        }

        return folder.name;
      };

      return buildPath(parentId);
    },
    [folders]
  );

  // ✅ Fonction pour déterminer le type de fichier par défaut selon l'extension
  const getDefaultFileType = useCallback(
    (fileName: string, isFolder?: boolean): FileFormValues["type"] => {
      // ✅ Si c'est un dossier, type OTHER par défaut
      if (isFolder) return "OTHER";

      const extension = fileName.split(".").pop()?.toLowerCase() || "";
      const fullName = fileName.toLowerCase();

      const typeMap: Record<string, FileFormValues["type"]> = {
        // Pages Next.js - vérifier d'abord les noms complets
        "page.tsx": "PAGE",
        "page.ts": "PAGE",
        "page.jsx": "PAGE",
        "page.js": "PAGE",
        "layout.tsx": "PAGE",
        "layout.ts": "PAGE",
        "loading.tsx": "PAGE",
        "error.tsx": "PAGE",
        "not-found.tsx": "PAGE",
        // Composants React
        tsx: "COMPONENT",
        jsx: "COMPONENT",
        // Utils et librairies
        "utils.ts": "UTILS",
        "util.ts": "UTILS",
        "helpers.ts": "UTILS",
        "helper.ts": "UTILS",
        "lib.ts": "LIB",
        "config.ts": "LIB",
        "constants.ts": "LIB",
        // Store et hooks
        "store.ts": "STORE",
        use: "HOOK", // Pour les hooks commençant par "use"
        "hook.ts": "HOOK",
        "hooks.ts": "HOOK",
        // Code générique
        ts: "CODE",
        js: "CODE",
        // Documents
        md: "DOCUMENT",
        txt: "DOCUMENT",
        pdf: "DOCUMENT",
        doc: "DOCUMENT",
        docx: "DOCUMENT",
        // Images
        png: "IMAGE",
        jpg: "IMAGE",
        jpeg: "IMAGE",
        gif: "IMAGE",
        svg: "IMAGE",
        webp: "IMAGE",
        // Vidéos
        mp4: "VIDEO",
        avi: "VIDEO",
        mov: "VIDEO",
        webm: "VIDEO",
        // Archives
        zip: "ARCHIVE",
        rar: "ARCHIVE",
        "7z": "ARCHIVE",
        tar: "ARCHIVE",
        gz: "ARCHIVE",
        // Tests
        "test.ts": "TEST",
        "test.tsx": "TEST",
        "spec.ts": "TEST",
        "spec.tsx": "TEST",
        __tests__: "TEST",
      };

      // Vérifier d'abord les noms complets avec extension
      for (const [key, type] of Object.entries(typeMap)) {
        if (fullName.endsWith(key) || fullName.includes(key)) {
          return type;
        }
      }

      // Vérifier les hooks (fichiers commençant par "use")
      if (
        fullName.startsWith("use") &&
        (extension === "ts" || extension === "tsx")
      ) {
        return "HOOK";
      }

      // Puis vérifier l'extension simple
      return typeMap[extension] || "OTHER";
    },
    []
  );

  // ✅ Valeurs par défaut selon le mode (création/édition) avec gestion des dossiers
  const defaultValues: FileFormValues = useMemo(() => {
    if (isEditing && file) {
      return {
        name: file.name ?? "",
        originalName: file.originalName ?? "",
        description: file.description ?? "",
        type: file.type,
        mimeType: file.mimeType ?? null, // ✅ MimeType nullable
        url: file.url ?? "",
        path: file.path ?? "",
        size: file.size ?? null,
        isPublic: file.isPublic ?? false,
        isFolder: file.isFolder ?? false,
        tags: file.tags ?? [],
        script: file.script ?? "",
        parentId: file.parent?.id ?? null,
        projectId: file.project?.id ?? "",
        featureId: file.feature?.id ?? "",
        userStoryId: file.userStory?.id ?? "",
        taskId: file.task?.id ?? "",
        sprintId: file.sprint?.id ?? "",
        metadata: file.metadata ?? {},
      };
    }

    // ✅ Valeurs par défaut pour création avec détection intelligente du type
    const defaultFileName = "nouveau-dossier"; // Par défaut un dossier
    const defaultIsFolder = true;
    const parentPath = getParentPath(currentFolder);
    const defaultType = getDefaultFileType(defaultFileName, defaultIsFolder);

    return {
      name: defaultFileName,
      originalName: "",
      description: "",
      type: defaultType,
      mimeType: getDefaultMimeType(
        defaultFileName,
        defaultType,
        defaultIsFolder
      ), // ✅ null pour dossier
      url: generateDefaultUrl(defaultFileName, parentPath, defaultIsFolder),
      path: generateDefaultPath(defaultFileName, parentPath, defaultIsFolder),
      size: null,
      isPublic: false,
      isFolder: defaultIsFolder, // ✅ Par défaut un dossier
      tags: [],
      script: "",
      parentId: currentFolder ?? null,
      projectId: "",
      featureId: "",
      userStoryId: "",
      taskId: "",
      sprintId: "",
      metadata: {},
    };
  }, [
    isEditing,
    file,
    currentFolder,
    getDefaultMimeType,
    generateDefaultUrl,
    generateDefaultPath,
    getParentPath,
    getDefaultFileType,
  ]);

  // Configuration du formulaire react-hook-form
  const form = useForm<FileFormValues>({
    resolver: zodResolver(fileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // ✅ Chargement des dossiers pour l'arborescence
  const loadFolders = useCallback(async (): Promise<void> => {
    setIsLoadingFolders(true);
    try {
      const response = await fetch("/api/files/folders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des dossiers");
      }

      const result: ApiResponse<FolderNode[]> = await response.json();

      if (result.success && result.data) {
        setFolders(result.data);
      }
    } catch (error) {
      console.error("💥 Erreur chargement dossiers:", error);
      toast.error("Impossible de charger l'arborescence des dossiers");
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  // Chargement initial des dossiers
  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [loadFolders, isOpen]);

  // Reset du formulaire quand le fichier change
  useEffect(() => {
    console.log(
      "📋 FilesForm - Reset formulaire avec fichier:",
      file?.name ?? "Nouveau fichier"
    );
    form.reset(defaultValues);
  }, [file, defaultValues, form]);

  // ✅ Mise à jour automatique des champs quand le nom ou isFolder change
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (
        (name === "name" || name === "isFolder") &&
        values.name &&
        !isEditing
      ) {
        const fileName = values.name.trim();
        const isFolder = values.isFolder ?? false;
        const parentPath = getParentPath(values.parentId ?? null);
        const detectedType = getDefaultFileType(fileName, isFolder);

        // Mise à jour automatique du type si détection différente
        if (values.type === "OTHER" || !values.type) {
          form.setValue("type", detectedType);
        }

        // ✅ Mise à jour automatique du mimeType (null si dossier)
        const newMimeType = getDefaultMimeType(
          fileName,
          detectedType,
          isFolder
        );
        form.setValue("mimeType", newMimeType);

        // Mise à jour automatique de l'URL
        form.setValue(
          "url",
          generateDefaultUrl(fileName, parentPath, isFolder)
        );

        // Mise à jour automatique du chemin
        form.setValue(
          "path",
          generateDefaultPath(fileName, parentPath, isFolder)
        );
      }

      if (name === "parentId" && !isEditing) {
        const fileName = values.name || "nouveau-dossier";
        const isFolder = values.isFolder ?? false;
        const parentPath = getParentPath(values.parentId ?? null);

        // Mise à jour de l'URL et du chemin avec le nouveau parent
        form.setValue(
          "url",
          generateDefaultUrl(fileName, parentPath, isFolder)
        );
        form.setValue(
          "path",
          generateDefaultPath(fileName, parentPath, isFolder)
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [
    form,
    isEditing,
    getDefaultMimeType,
    generateDefaultUrl,
    generateDefaultPath,
    getParentPath,
    getDefaultFileType,
  ]);

  // ✅ Gestion de la soumission du formulaire avec mimeType nullable
  const onSubmit = useCallback(
    async (data: FileFormValues): Promise<void> => {
      console.log("📝 FilesForm - Soumission:", data);
      setIsSubmitting(true);

      try {
        const fileData = {
          name: data.name.trim(),
          originalName: data.originalName?.trim() ?? null,
          description: data.description?.trim() ?? null,
          type: data.type,
          mimeType: data.mimeType?.trim() ?? null, // ✅ MimeType nullable
          url: data.url.trim(),
          path: data.path?.trim() ?? null,
          size: data.size ?? null,
          isPublic: data.isPublic,
          isFolder: data.isFolder,
          tags: data.tags ?? [],
          script: data.script?.trim() ?? null,
          metadata: data.metadata ?? {},
          // ✅ Relations avec parent
          parentId: data.parentId ?? null,
          projectId: data.projectId ?? null,
          featureId: data.featureId ?? null,
          userStoryId: data.userStoryId ?? null,
          taskId: data.taskId ?? null,
          sprintId: data.sprintId ?? null,
        };

        const url = isEditing && file ? `/api/files/${file.id}` : "/api/files";
        const method = isEditing ? "PUT" : "POST";

        console.log(`🚀 FilesForm - ${method} ${url}`, fileData);

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fileData),
        });

        const result: ApiResponse<FileWithRelations> = await response.json();
        console.log("📡 FilesForm - Réponse API:", result);

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              `Échec ${isEditing ? "modification" : "création"} du fichier`
          );
        }

        if (!result.success) {
          throw new Error(result.error || "Opération échouée");
        }

        onSuccess();

        toast.success(
          isEditing
            ? `${data.isFolder ? "Dossier" : "Fichier"} "${
                data.name
              }" mis à jour avec succès`
            : `${data.isFolder ? "Dossier" : "Fichier"} "${
                data.name
              }" créé avec succès`,
          {
            duration: 3000,
          }
        );
      } catch (error) {
        console.error("💥 FilesForm - Erreur soumission:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        toast.error(`Erreur: ${errorMessage}`, {
          duration: 5000,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isEditing, file, onSuccess]
  );

  // ✅ Fonctions utilitaires pour les icônes selon les nouveaux types
  const getFileTypeIcon = useCallback((type: string): JSX.Element => {
    switch (type) {
      case "PAGE":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "COMPONENT":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "UTILS":
        return <Settings className="h-4 w-4 text-orange-600" />;
      case "LIB":
        return <Layers className="h-4 w-4 text-indigo-600" />;
      case "STORE":
        return <Database className="h-4 w-4 text-green-600" />;
      case "HOOK":
        return <Code2 className="h-4 w-4 text-teal-600" />;
      case "DOCUMENT":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "IMAGE":
        return <Image className="h-4 w-4 text-pink-600" />;
      case "VIDEO":
        return <Video className="h-4 w-4 text-red-600" />;
      case "ARCHIVE":
        return <Archive className="h-4 w-4 text-yellow-600" />;
      case "CODE":
        return <Code2 className="h-4 w-4 text-gray-600" />;
      case "SPECIFICATION":
        return <FileText className="h-4 w-4 text-cyan-600" />;
      case "DESIGN":
        return <Paintbrush className="h-4 w-4 text-rose-600" />;
      case "TEST":
        return <TestTube className="h-4 w-4 text-emerald-600" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  // ✅ Obtenir le label en français du type
  const getTypeLabel = useCallback((type: string): string => {
    switch (type) {
      case "PAGE":
        return "Page Next.js";
      case "COMPONENT":
        return "Composant React";
      case "UTILS":
        return "Utilitaires";
      case "LIB":
        return "Librairie";
      case "STORE":
        return "Store";
      case "HOOK":
        return "Hook React";
      case "DOCUMENT":
        return "Document";
      case "IMAGE":
        return "Image";
      case "VIDEO":
        return "Vidéo";
      case "ARCHIVE":
        return "Archive";
      case "CODE":
        return "Code";
      case "SPECIFICATION":
        return "Spécification";
      case "DESIGN":
        return "Design";
      case "TEST":
        return "Test";
      default:
        return "Autre";
    }
  }, []);

  // Gestion des tags
  const handleAddTag = useCallback(() => {
    if (tagInput.trim()) {
      const currentTags = form.watch("tags") ?? [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
        setTagInput("");
      }
    }
  }, [tagInput, form]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      const currentTags = form.watch("tags") ?? [];
      form.setValue(
        "tags",
        currentTags.filter((tag) => tag !== tagToRemove)
      );
    },
    [form]
  );

  const handleTagInputKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  // Formatage de la taille des fichiers
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // ✅ Obtenir le dossier sélectionné
  const selectedFolder = useMemo(() => {
    const parentId = form.watch("parentId");
    return folders.find((f) => f.id === parentId);
  }, [folders, form]);

  // ✅ Arborescence formatée pour affichage
  const formattedFolders = useMemo(() => {
    const getAllFolders = (
      parentId: string | null = null,
      level: number = 0
    ): FolderNode[] => {
      const children = folders
        .filter((f) => f.parentId === parentId)
        .map((folder) => ({ ...folder, level }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const result: FolderNode[] = [];

      for (const child of children) {
        result.push(child);
        result.push(...getAllFolders(child.id, level + 1));
      }

      return result;
    };

    return getAllFolders();
  }, [folders]);

  // ✅ Surveiller si c'est un dossier pour adapter l'interface
  const isFolder = form.watch("isFolder");

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      {/* ✅ Dialog responsive avec dimensions optimisées */}
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] flex flex-col p-0">
        {/* ✅ Header fixe et compact */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 border-b bg-white">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Save className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              ) : isFolder ? (
                <FolderPlus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              ) : (
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              )}
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {isEditing
                    ? `Modifier ${isFolder ? "le dossier" : "le fichier"}`
                    : `Nouveau ${isFolder ? "dossier" : "fichier"}`}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {isEditing
                    ? `Modifiez les propriétés de votre ${
                        isFolder ? "dossier" : "fichier"
                      }.`
                    : `Ajoutez un nouveau ${
                        isFolder ? "dossier" : "fichier"
                      } à votre projet.`}
                </p>
              </div>
            </div>
            {isEditing && file && (
              <Badge variant="outline" className="px-2 py-1 text-xs">
                v{file.version}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Contenu avec ScrollArea pour gérer le scroll */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 px-4 sm:px-6">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="py-4 space-y-4 sm:space-y-6"
            >
              {/* ✅ Section Type de contenu - Prioritaire */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">
                      Type de contenu
                    </h3>

                    {/* ✅ Switch isFolder en premier - UX prioritaire */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-3">
                        {isFolder ? (
                          <Folder className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <File className="h-5 w-5 text-gray-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Label
                            htmlFor="isFolder"
                            className="text-sm font-medium text-gray-900"
                          >
                            {isFolder
                              ? "🗂️ Créer un dossier"
                              : "📄 Créer un fichier"}
                          </Label>
                          <p className="text-xs text-gray-600">
                            {isFolder
                              ? "Les dossiers permettent d'organiser votre hiérarchie"
                              : "Les fichiers contiennent votre code et vos ressources"}
                          </p>
                        </div>
                      </div>
                      <Controller
                        name="isFolder"
                        control={form.control}
                        render={({ field }) => (
                          <Switch
                            id="isFolder"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    {/* ✅ Info contextuelle selon le type */}
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isFolder
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : "bg-green-50 text-green-800 border border-green-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          {isFolder ? (
                            <div>
                              <p className="font-medium">Mode dossier activé</p>
                              <p className="text-xs mt-1">
                                • Le type MIME n'est pas requis pour les
                                dossiers
                                <br />
                                • L'URL se terminera par "/" automatiquement
                                <br />• Parfait pour organiser vos fichiers par
                                catégories
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">Mode fichier activé</p>
                              <p className="text-xs mt-1">
                                • Le type MIME sera généré automatiquement
                                <br />
                                • Le type de fichier sera détecté selon
                                l'extension
                                <br />• Contiendra votre code, documentation ou
                                ressources
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ✅ Section Arborescence - Gestion de la relation parent */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FolderTree className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">
                        Emplacement dans l'arborescence
                      </span>
                      <span className="sm:hidden">Emplacement</span>
                    </h3>

                    <div className="space-y-2">
                      <Label
                        htmlFor="parentId"
                        className="text-sm font-medium text-gray-700"
                      >
                        Dossier parent
                      </Label>
                      <Controller
                        name="parentId"
                        control={form.control}
                        render={({ field }) => (
                          <Popover
                            open={parentPickerOpen}
                            onOpenChange={setParentPickerOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={parentPickerOpen}
                                className="w-full justify-between text-left"
                                disabled={isLoadingFolders}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <span className="truncate">
                                    {selectedFolder
                                      ? selectedFolder.name
                                      : "Racine du projet"}
                                  </span>
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Rechercher un dossier..." />
                                <CommandEmpty>
                                  Aucun dossier trouvé.
                                </CommandEmpty>
                                <CommandGroup className="max-h-48 sm:max-h-64 overflow-y-auto">
                                  {/* Option racine */}
                                  <CommandItem
                                    value=""
                                    onSelect={() => {
                                      field.onChange(null);
                                      setParentPickerOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        !field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <Folder className="mr-2 h-4 w-4 text-blue-600" />
                                    <span className="font-medium">
                                      Racine du projet
                                    </span>
                                  </CommandItem>

                                  {/* Dossiers de l'arborescence */}
                                  {formattedFolders.map((folder) => (
                                    <CommandItem
                                      key={folder.id}
                                      value={folder.id}
                                      onSelect={() => {
                                        field.onChange(folder.id);
                                        setParentPickerOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === folder.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div
                                        className="flex items-center gap-2 min-w-0"
                                        style={{
                                          paddingLeft: `${folder.level * 12}px`,
                                        }}
                                      >
                                        <Folder className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                        <span className="truncate">
                                          {folder.name}
                                        </span>
                                        {folder.level > 0 && (
                                          <span className="text-xs text-gray-500 hidden sm:inline">
                                            ({folder.path})
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      <div className="flex items-start gap-2 text-xs text-gray-500">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>
                          Sélectionnez le dossier parent pour organiser vos
                          fichiers en hiérarchie.
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ✅ Informations de base - Responsive grid */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">
                      Informations de base
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Nom du fichier/dossier */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-gray-700"
                        >
                          {isFolder ? "Nom du dossier *" : "Nom du fichier *"}
                        </Label>
                        <Input
                          id="name"
                          placeholder={
                            isFolder ? "mon-dossier" : "nom-fichier.tsx"
                          }
                          {...form.register("name")}
                          className="font-medium"
                        />
                        <p className="text-xs text-gray-500">
                          {isFolder
                            ? "Le nom d'affichage de votre dossier"
                            : "Le nom d'affichage de votre fichier (avec extension)"}
                        </p>
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{form.formState.errors.name.message}</span>
                          </p>
                        )}
                      </div>

                      {/* ✅ Type de fichier - Conditionnel selon isFolder */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="type"
                          className="text-sm font-medium text-gray-700"
                        >
                          {isFolder
                            ? "Catégorie du dossier"
                            : "Type de fichier *"}
                        </Label>
                        <Controller
                          name="type"
                          control={form.control}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue>
                                  <div className="flex items-center gap-2">
                                    {getFileTypeIcon(field.value)}
                                    <span className="truncate">
                                      {getTypeLabel(field.value)}
                                    </span>
                                  </div>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-60 sm:max-h-80">
                                {/* Section développement */}
                                {!isFolder && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                      Développement
                                    </div>
                                    <SelectItem value="PAGE">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-purple-600" />
                                        <span>Page Next.js</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="COMPONENT">
                                      <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-blue-600" />
                                        <span>Composant React</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="UTILS">
                                      <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-orange-600" />
                                        <span>Utilitaires</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="LIB">
                                      <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-indigo-600" />
                                        <span>Librairie</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="STORE">
                                      <div className="flex items-center gap-2">
                                        <Database className="h-4 w-4 text-green-600" />
                                        <span>Store</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="HOOK">
                                      <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4 text-teal-600" />
                                        <span>Hook React</span>
                                      </div>
                                    </SelectItem>

                                    {/* Section général */}
                                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                      Général
                                    </div>
                                  </>
                                )}

                                <SelectItem value="DOCUMENT">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span>Document</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="CODE">
                                  <div className="flex items-center gap-2">
                                    <Code2 className="h-4 w-4 text-gray-600" />
                                    <span>Code générique</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="SPECIFICATION">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-cyan-600" />
                                    <span>Spécification</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="TEST">
                                  <div className="flex items-center gap-2">
                                    <TestTube className="h-4 w-4 text-emerald-600" />
                                    <span>Test</span>
                                  </div>
                                </SelectItem>

                                {/* Section média */}
                                {!isFolder && (
                                  <>
                                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                                      Média
                                    </div>
                                    <SelectItem value="IMAGE">
                                      <div className="flex items-center gap-2">
                                        <Image className="h-4 w-4 text-pink-600" />
                                        <span>Image</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="VIDEO">
                                      <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4 text-red-600" />
                                        <span>Vidéo</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="DESIGN">
                                      <div className="flex items-center gap-2">
                                        <Paintbrush className="h-4 w-4 text-rose-600" />
                                        <span>Design</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="ARCHIVE">
                                      <div className="flex items-center gap-2">
                                        <Archive className="h-4 w-4 text-yellow-600" />
                                        <span>Archive</span>
                                      </div>
                                    </SelectItem>
                                  </>
                                )}

                                <SelectItem value="OTHER">
                                  <div className="flex items-center gap-2">
                                    <File className="h-4 w-4 text-gray-400" />
                                    <span>Autre</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {form.formState.errors.type && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{form.formState.errors.type.message}</span>
                          </p>
                        )}
                      </div>

                      {/* ✅ Type MIME - Conditionnel (caché si dossier) */}
                      {!isFolder && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="mimeType"
                            className="text-sm font-medium text-gray-700"
                          >
                            Type MIME *
                          </Label>
                          <Input
                            id="mimeType"
                            placeholder="text/typescript"
                            {...form.register("mimeType")}
                            value={form.watch("mimeType") || ""}
                          />
                          <p className="text-xs text-gray-500">
                            Type MIME généré automatiquement selon l'extension
                          </p>
                          {form.formState.errors.mimeType && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              <span>
                                {form.formState.errors.mimeType.message}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* ✅ Taille - Conditionnel (caché si dossier) */}
                      {!isFolder && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="size"
                            className="text-sm font-medium text-gray-700"
                          >
                            Taille (bytes)
                          </Label>
                          <Input
                            id="size"
                            type="number"
                            min="0"
                            placeholder="1024"
                            {...form.register("size", {
                              valueAsNumber: true,
                              setValueAs: (value) =>
                                value === "" ? null : Number(value),
                            })}
                          />
                          <p className="text-xs text-gray-500">
                            Taille du fichier (optionnel)
                            {form.watch("size") && form.watch("size")! > 0 && (
                              <span className="ml-2 font-medium">
                                ({formatFileSize(form.watch("size")!)})
                              </span>
                            )}
                          </p>
                          {form.formState.errors.size && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              <span>{form.formState.errors.size.message}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* URL */}
                      <div className="lg:col-span-2 space-y-2">
                        <Label
                          htmlFor="url"
                          className="text-sm font-medium text-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            URL {isFolder ? "du dossier" : "du fichier"} *
                          </div>
                        </Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="http://localhost:3000/files/..."
                          {...form.register("url")}
                        />
                        <p className="text-xs text-gray-500">
                          URL générée automatiquement basée sur le nom et le
                          parent
                        </p>
                        {form.formState.errors.url && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{form.formState.errors.url.message}</span>
                          </p>
                        )}
                      </div>

                      {/* Chemin */}
                      <div className="lg:col-span-2 space-y-2">
                        <Label
                          htmlFor="path"
                          className="text-sm font-medium text-gray-700"
                        >
                          Chemin local
                        </Label>
                        <Input
                          id="path"
                          placeholder="@/parent/fichier.tsx"
                          {...form.register("path")}
                        />
                        <p className="text-xs text-gray-500">
                          Chemin local généré automatiquement avec préfixe @/
                        </p>
                        {form.formState.errors.path && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>{form.formState.errors.path.message}</span>
                          </p>
                        )}
                      </div>

                      {/* Nom original */}
                      <div className="lg:col-span-2 space-y-2">
                        <Label
                          htmlFor="originalName"
                          className="text-sm font-medium text-gray-700"
                        >
                          Nom original
                        </Label>
                        <Input
                          id="originalName"
                          placeholder={
                            isFolder
                              ? "Nom original du dossier"
                              : "Nom original du fichier"
                          }
                          {...form.register("originalName")}
                        />
                        <p className="text-xs text-gray-500">
                          Le nom original{" "}
                          {isFolder ? "du dossier" : "du fichier"} (optionnel)
                        </p>
                        {form.formState.errors.originalName && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>
                              {form.formState.errors.originalName.message}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium text-gray-700"
                      >
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder={
                          isFolder
                            ? "Description du dossier..."
                            : "Description du fichier..."
                        }
                        className="resize-none min-h-[60px] sm:min-h-[80px]"
                        {...form.register("description")}
                      />
                      <p className="text-xs text-gray-500">
                        Description détaillée{" "}
                        {isFolder ? "du dossier" : "du fichier"} (optionnel)
                      </p>
                      {form.formState.errors.description && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          <span>
                            {form.formState.errors.description.message}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ✅ Propriétés - Responsive */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">
                      Propriétés
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Est public */}
                      <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {form.watch("isPublic") ? (
                            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <Label
                              htmlFor="isPublic"
                              className="text-sm font-medium text-gray-900"
                            >
                              {isFolder ? "Dossier public" : "Fichier public"}
                            </Label>
                            <p className="text-xs text-gray-500">
                              {isFolder
                                ? "Rendre le dossier accessible publiquement"
                                : "Rendre le fichier accessible publiquement"}
                            </p>
                          </div>
                        </div>
                        <Controller
                          name="isPublic"
                          control={form.control}
                          render={({ field }) => (
                            <Switch
                              id="isPublic"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ✅ Tags - Responsive */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                        Tags
                      </div>
                    </h3>

                    <div className="space-y-4">
                      {/* Ajout de tags */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ajouter un tag..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagInputKeyPress}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim()}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Affichage des tags */}
                      {form.watch("tags") && form.watch("tags")!.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {form.watch("tags")!.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1 px-2 py-1 text-xs"
                            >
                              <span className="truncate max-w-[120px]">
                                {tag}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-red-600 flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ✅ Section avancée responsive */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                          Options avancées
                        </div>
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                      >
                        <span className="hidden sm:inline">
                          {showAdvanced ? "Masquer" : "Afficher"}
                        </span>
                        {showAdvanced ? (
                          <ChevronUp className="h-4 w-4 sm:ml-2" />
                        ) : (
                          <ChevronDown className="h-4 w-4 sm:ml-2" />
                        )}
                      </Button>
                    </div>

                    {showAdvanced && (
                      <div className="space-y-4 border-t pt-4">
                        {/* Script */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="script"
                            className="text-sm font-medium text-gray-700"
                          >
                            Code de script
                          </Label>
                          <Textarea
                            id="script"
                            placeholder="Code JavaScript, Shell, ou autre..."
                            className="resize-none min-h-[80px] sm:min-h-[120px] font-mono text-sm"
                            {...form.register("script")}
                          />
                          <p className="text-xs text-gray-500">
                            Code de script associé{" "}
                            {isFolder ? "au dossier" : "au fichier"} (optionnel)
                          </p>
                          {form.formState.errors.script && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              <span>
                                {form.formState.errors.script.message}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ✅ Espace pour les boutons flottants */}
              <div className="h-16 sm:h-20" aria-hidden="true" />
            </form>
          </ScrollArea>

          {/* ✅ Actions sticky bottom - Toujours visible */}
          <div className="flex-shrink-0 border-t bg-white p-4 sm:p-6">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                size="sm"
              >
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isEditing ? `Modification...` : `Création...`}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {isFolder
                            ? "Modifier le dossier"
                            : "Modifier le fichier"}
                        </span>
                        <span className="sm:hidden">Modifier</span>
                      </>
                    ) : (
                      <>
                        {isFolder ? (
                          <FolderPlus className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {isFolder ? "Créer le dossier" : "Créer le fichier"}
                        </span>
                        <span className="sm:hidden">Créer</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
