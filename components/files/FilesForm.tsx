// components/files/FilesForm.tsx

/**
 * RÔLE : Formulaire modal pour création et édition de métadonnées de fichiers selon schéma Prisma EXACT
 * RESPONSABILITÉS :
 * - Formulaire modal Dialog avec support création et édition de métadonnées fichiers/dossiers
 * - Validation avec Zod selon schéma Prisma FileType enum EXACT (DOSSIER, PAGE, COMPONENT, etc.)
 * - Support spécifique à l'aide au développement : import, export, use, script, path
 * - NOUVEAU : Gestion hiérarchique parent/enfant pour organisation en dossiers/sous-dossiers
 * - Interface responsive moderne avec design épuré et accessible
 * - Relations avec projet selon schéma Prisma avec author[] et relations requises
 * - Types strictement typés pour performance optimale avec TypeScript strict mode
 * - Actions CRUD sécurisées avec validation côté client et serveur
 * - Gestion des métadonnées JSON pour données développement avancées
 * - CORRECTION MAJEURE : Récupération correcte du projectId depuis les paramètres de route
 * - AJOUT : Sélecteur de dossier parent avec navigation hiérarchique
 *
 * COMPOSANTS UTILISÉS :
 * - Dialog, DialogContent, DialogHeader, DialogTitle: Composants modal shadcn/ui
 * - Form, FormControl, FormField, FormItem, FormLabel, FormMessage: Composants de formulaire
 * - Input, Textarea, Select, Switch: Composants de saisie responsive
 * - Button: Composant de soumission avec états loading
 * - Card, CardContent: Composants de structuration
 * - ScrollArea: Composant de défilement pour contenu long
 * - Badge: Affichage des tags avec gestion interactive
 * - Command, CommandInput, CommandItem, CommandList, Popover: Sélecteur de parent
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useCallback, useEffect, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - react-hook-form v7+: Gestion des formulaires SANS conflits de génériques
 * - zod v3+: Validation des données avec propriété 'issues' CORRECTE
 * - shadcn/ui: Composants UI modernes avec accessibilité
 * - Tailwind CSS: Design responsive mobile-first
 * - lucide-react: Icons cohérentes pour actions et types de fichiers
 * - sonner: Toast notifications pour feedback utilisateur temps réel
 */

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

// ✅ Import des types centralisés
import type { FileWithRelations, ApiResponse, FileType } from "@/types/files";

// ✅ Type explicite complet selon schéma Prisma model File
interface FileFormData {
  // Champs de base du modèle File
  name: string; // File.name - Nom du fichier/dossier
  type: FileType; // File.type - Type de fichier selon enum
  path?: string | null; // File.path - Chemin GitHub/local
  description?: string | null; // File.description - Description du rôle
  import?: string | null; // File.import - Imports utilisés
  use?: string | null; // File.use - Dépendances/librairies
  export?: string | null; // File.export - Exports fournis
  script?: string | null; // File.script - Code principal
  isFolder: boolean; // File.isFolder - Dossier virtuel ou fichier
  tags: string[]; // File.tags - Tags de classification
  metadata: Record<string, any>; // File.metadata - Métadonnées JSON

  // Relations Prisma
  projectId: string; // File.projectId - OBLIGATOIRE
  parentId?: string | null; // ✅ NOUVEAU : File.parentId - Dossier parent pour hiérarchie
  featureId?: string | null; // File.featureId - Feature associée
  userStoryId?: string | null; // File.userStoryId - User Story associée
  taskId?: string | null; // File.taskId - Task associée
  sprintId?: string | null; // File.sprintId - Sprint associé
}

// ✅ Interface pour les dossiers parents disponibles
interface FolderOption {
  id: string;
  name: string;
  path: string[];
  level: number;
  parentId: string | null;
}

// ✅ CORRECTION MAJEURE : Schema Zod avec validation CUID correcte
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
  // ✅ CORRECTION : projectId OBLIGATOIRE avec validation CUID stricte
  projectId: z.string().cuid("Le projectId doit être un CUID valide"),
  // ✅ NOUVEAU : parentId avec validation pour hiérarchie
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

// ✅ Interface pour les props du composant - CORRIGÉE avec projectId
interface FilesFormProps {
  file?: FileWithRelations | null;
  currentFolder?: string | null;
  projectId?: string; // ✅ AJOUT : projectId passé explicitement depuis la page parente
  onSuccess: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

export default function FilesForm({
  file,
  currentFolder,
  projectId: propProjectId, // ✅ Récupération du projectId depuis les props
  onSuccess,
  onCancel,
  isOpen,
}: FilesFormProps): JSX.Element {
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTag, setCurrentTag] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ✅ NOUVEAU : États pour la gestion des dossiers parents
  const [availableFolders, setAvailableFolders] = useState<FolderOption[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isFolderSelectorOpen, setIsFolderSelectorOpen] = useState(false);
  const [selectedParentPath, setSelectedParentPath] = useState<string[]>([]);

  // ✅ CORRECTION MAJEURE : Récupération correcte du projectId
  const projectId = propProjectId || (params?.id as string) || "";

  // ✅ useForm SANS resolver pour éviter les conflits
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
      projectId: "", // Sera rempli dans useEffect
      parentId: null,
      featureId: null,
      userStoryId: null,
      taskId: null,
      sprintId: null,
    },
  });

  // ✅ NOUVEAU : Récupération des dossiers disponibles pour le sélecteur parent
  const fetchAvailableFolders = useCallback(async () => {
    if (!projectId) return;

    setIsLoadingFolders(true);
    try {
      const response = await fetch(`/api/files/folders?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<FileWithRelations[]> = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Erreur lors du chargement des dossiers"
        );
      }

      // ✅ Construction de l'arbre hiérarchique des dossiers
      const folders = result.data || [];
      const folderOptions: FolderOption[] = [];

      // Fonction récursive pour construire les chemins hiérarchiques
      const buildFolderPaths = (
        folderId: string | null,
        currentPath: string[] = [],
        level: number = 0
      ) => {
        const children = folders.filter(
          (f) => f.parentId === folderId && f.isFolder
        );

        children.forEach((folder) => {
          const newPath = [...currentPath, folder.name];

          // Exclure le fichier en cours d'édition pour éviter les références circulaires
          if (!file || folder.id !== file.id) {
            folderOptions.push({
              id: folder.id,
              name: folder.name,
              path: newPath,
              level,
              parentId: folder.parentId,
            });

            // Récursion pour les sous-dossiers
            buildFolderPaths(folder.id, newPath, level + 1);
          }
        });
      };

      // Construire l'arbre à partir de la racine
      buildFolderPaths(null);

      // Ajouter l'option "Racine" en premier
      setAvailableFolders([
        {
          id: "",
          name: "Racine",
          path: [],
          level: 0,
          parentId: null,
        },
        ...folderOptions,
      ]);

      console.log(
        "📁 Dossiers disponibles chargés:",
        folderOptions.length,
        "dossiers"
      );
    } catch (error) {
      console.error("💥 Erreur lors du chargement des dossiers:", error);
      toast.error("Erreur de chargement", {
        description: "Impossible de charger les dossiers disponibles",
      });
      setAvailableFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  }, [projectId, file]);

  // ✅ Chargement des dossiers disponibles au montage
  useEffect(() => {
    if (isOpen && projectId) {
      fetchAvailableFolders();
    }
  }, [isOpen, projectId, fetchAvailableFolders]);

  // ✅ Validation manuelle avec 'issues' et messages détaillés
  const validateForm = (data: FileFormData): string[] => {
    const result = fileFormSchema.safeParse(data);
    if (result.success) return [];

    return result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
  };

  // ✅ CORRECTION : Reset du formulaire avec projectId et parentId VALIDES
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
        // ✅ CORRECTION : Utilisation du projectId récupéré
        projectId: projectId,
        // ✅ NOUVEAU : Gestion du parentId depuis le fichier existant
        parentId: file.parentId || currentFolder || null,
        featureId: file.featureId || null,
        userStoryId: file.userStoryId || null,
        taskId: file.taskId || null,
        sprintId: file.sprintId || null,
      };

      // ✅ Mise à jour du chemin parent affiché
      if (file.parentId && availableFolders.length > 0) {
        const parentFolder = availableFolders.find(
          (f) => f.id === file.parentId
        );
        setSelectedParentPath(parentFolder?.path || []);
      } else {
        setSelectedParentPath([]);
      }

      console.log("🔄 RESET FORMULAIRE (Mode Édition):", {
        fileId: file.id,
        projectIdUsed: projectId,
        parentId: resetData.parentId,
        resetData,
      });

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
        // ✅ CORRECTION CRITIQUE : Utilisation du projectId VALIDE
        projectId: projectId,
        // ✅ NOUVEAU : parentId depuis currentFolder ou null
        parentId: currentFolder || null,
        featureId: null,
        userStoryId: null,
        taskId: null,
        sprintId: null,
      };

      // ✅ Mise à jour du chemin parent affiché pour nouveau fichier
      if (currentFolder && availableFolders.length > 0) {
        const parentFolder = availableFolders.find(
          (f) => f.id === currentFolder
        );
        setSelectedParentPath(parentFolder?.path || []);
      } else {
        setSelectedParentPath([]);
      }

      console.log("🆕 RESET FORMULAIRE (Mode Création):", {
        projectIdUsed: projectId,
        currentFolder,
        parentIdUsed: defaultData.parentId,
        defaultData,
      });

      form.reset(defaultData);
    }

    // Reset des erreurs de validation
    setValidationErrors([]);
  }, [file, currentFolder, form, projectId, availableFolders]);

  // ✅ Gestion de la soumission avec VALIDATION RENFORCÉE
  const onSubmit = useCallback(
    async (data: FileFormData) => {
      console.log("🚀 DÉBUT SOUMISSION FORMULAIRE");
      console.log("📋 Données du formulaire reçues:", data);

      // ✅ VALIDATION PRÉLIMINAIRE du projectId
      if (!data.projectId) {
        const errorMsg = "ProjectId manquant - impossible de continuer";
        console.error("❌ ERREUR CRITIQUE:", errorMsg);
        toast.error("Erreur de configuration", {
          description: errorMsg,
        });
        return;
      }

      // ✅ Validation CUID du projectId
      const cuidRegex = /^[cC][a-zA-Z0-9]{24,}$/;
      if (!cuidRegex.test(data.projectId)) {
        const errorMsg = `ProjectId invalide (pas un CUID): ${data.projectId}`;
        console.error("❌ VALIDATION CUID ÉCHOUÉE:", errorMsg);
        toast.error("Erreur de validation", {
          description: "L'ID du projet n'est pas au format CUID valide",
        });
        return;
      }

      // ✅ NOUVEAU : Validation de la hiérarchie parent
      if (data.parentId && !cuidRegex.test(data.parentId)) {
        const errorMsg = `ParentId invalide (pas un CUID): ${data.parentId}`;
        console.error("❌ VALIDATION PARENT CUID ÉCHOUÉE:", errorMsg);
        toast.error("Erreur de validation", {
          description: "L'ID du dossier parent n'est pas au format CUID valide",
        });
        return;
      }

      // ✅ NOUVEAU : Vérification de référence circulaire
      if (file && data.parentId === file.id) {
        const errorMsg = "Un dossier ne peut pas être son propre parent";
        console.error("❌ RÉFÉRENCE CIRCULAIRE DÉTECTÉE:", errorMsg);
        toast.error("Erreur de hiérarchie", {
          description: errorMsg,
        });
        return;
      }

      console.log("✅ ProjectId et ParentId CUID valides:", {
        projectId: data.projectId,
        parentId: data.parentId,
      });

      // ✅ Validation manuelle avec Zod
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

      console.log("✅ Validation Zod réussie");

      // Clear validation errors si succès
      setValidationErrors([]);
      setIsSubmitting(true);

      try {
        const method = file ? "PUT" : "POST";
        const url = file ? `/api/files/${file.id}` : "/api/files";

        console.log("🌐 Configuration de la requête:", {
          method,
          url,
          isEditing: !!file,
          fileId: file?.id,
        });

        // ✅ Construction des données VALIDÉES selon schéma Prisma
        const requestData = {
          // Données du formulaire nettoyées
          ...data,
          // Conversion des chaînes vides en null selon schéma Prisma
          path: data.path?.trim() || null,
          description: data.description?.trim() || null,
          import: data.import?.trim() || null,
          use: data.use?.trim() || null,
          export: data.export?.trim() || null,
          script: data.script?.trim() || null,
          // ✅ NOUVEAU : Conversion parentId vide en null
          parentId: data.parentId?.trim() || null,
          // Valeurs par défaut selon schéma Prisma
          version: file?.version || 1,
          mimeType: null, // Toujours null pour les métadonnées virtuelles
          order: file?.order || 1000, // Ordre par défaut
        };

        console.log("📤 DONNÉES ENVOYÉES À L'API:");
        console.log("═══════════════════════════════════════");
        console.log("🏷️  CHAMPS DE BASE:");
        console.log("   name:", requestData.name);
        console.log("   type:", requestData.type);
        console.log("   isFolder:", requestData.isFolder);
        console.log("   version:", requestData.version);
        console.log("   order:", requestData.order);
        console.log("   mimeType:", requestData.mimeType);

        console.log("\n📝 MÉTADONNÉES DE DÉVELOPPEMENT:");
        console.log("   path:", requestData.path);
        console.log("   description:", requestData.description);
        console.log("   import:", requestData.import);
        console.log("   use:", requestData.use);
        console.log("   export:", requestData.export);
        console.log("   script:", requestData.script);

        console.log("\n🏷️  CLASSIFICATION:");
        console.log("   tags:", requestData.tags);
        console.log("   metadata:", requestData.metadata);

        console.log("\n🔗 RELATIONS PRISMA:");
        console.log(
          "   projectId:",
          requestData.projectId,
          "(OBLIGATOIRE - CUID VALIDÉ)"
        );
        console.log(
          "   parentId:",
          requestData.parentId,
          "(✅ NOUVEAU - Dossier parent hiérarchique)"
        );
        console.log(
          "   featureId:",
          requestData.featureId,
          "(Feature associée)"
        );
        console.log(
          "   userStoryId:",
          requestData.userStoryId,
          "(User Story associée)"
        );
        console.log("   taskId:", requestData.taskId, "(Task associée)");
        console.log("   sprintId:", requestData.sprintId, "(Sprint associé)");

        console.log("\n📦 PAYLOAD COMPLET:");
        console.log(JSON.stringify(requestData, null, 2));
        console.log("═══════════════════════════════════════");

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        console.log("📡 Réponse HTTP:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
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
            console.error("📋 Détail de l'erreur:", errorData);
          } catch {
            errorMessage = errorText || errorMessage;
          }

          throw new Error(errorMessage);
        }

        const result: ApiResponse<FileWithRelations> = await response.json();

        console.log("✅ RÉPONSE API:", result);

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la sauvegarde");
        }

        console.log("🎉 SUCCÈS:", {
          action: file ? "mise à jour" : "création",
          fileName: data.name,
          fileType: data.type,
          parentId: data.parentId,
          resultData: result.data,
        });

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

        console.error("📋 Détail de l'erreur:", {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        });

        toast.error(errorMessage, {
          description: "Vérifiez les données saisies et réessayez",
        });
      } finally {
        setIsSubmitting(false);
        console.log("🏁 FIN SOUMISSION FORMULAIRE");
      }
    },
    [file, onSuccess, validateForm, availableFolders]
  );

  // ✅ Fonction pour obtenir l'icône selon le type
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

  // ✅ Fonction pour obtenir le label du type
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

  // ✅ NOUVEAU : Gestionnaire de sélection du dossier parent
  const handleParentSelection = useCallback(
    (folderId: string) => {
      const selectedFolder = availableFolders.find((f) => f.id === folderId);

      console.log("📁 SÉLECTION PARENT:", {
        folderId: folderId || "null (racine)",
        folderName: selectedFolder?.name || "Racine",
        folderPath: selectedFolder?.path || [],
      });

      // Mettre à jour le formulaire
      form.setValue("parentId", folderId || null, { shouldValidate: true });

      // Mettre à jour l'affichage du chemin
      setSelectedParentPath(selectedFolder?.path || []);

      // Fermer le sélecteur
      setIsFolderSelectorOpen(false);

      toast.success("Dossier parent sélectionné", {
        description: selectedFolder
          ? `Placé dans: ${selectedFolder.path.join(" / ")}`
          : "Placé à la racine du projet",
      });
    },
    [availableFolders, form]
  );

  // ✅ Gestion des tags avec types stricts et LOGS
  const addTag = useCallback(() => {
    const trimmedTag = currentTag.trim();
    const currentTags = form.getValues("tags") || [];

    console.log("🏷️ AJOUT TAG:", {
      newTag: trimmedTag,
      currentTags,
      alreadyExists: currentTags.includes(trimmedTag),
    });

    if (trimmedTag && !currentTags.includes(trimmedTag)) {
      const newTags = [...currentTags, trimmedTag];
      form.setValue("tags", newTags);
      setCurrentTag("");

      console.log("✅ Tag ajouté:", {
        addedTag: trimmedTag,
        newTagsList: newTags,
      });
    }
  }, [currentTag, form]);

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const currentTags = form.getValues("tags") || [];
      const newTags = currentTags.filter((tag) => tag !== tagToRemove);

      console.log("🗑️ SUPPRESSION TAG:", {
        removedTag: tagToRemove,
        beforeTags: currentTags,
        afterTags: newTags,
      });

      form.setValue("tags", newTags);
    },
    [form]
  );

  // ✅ Variables pour watch avec sécurité et LOGS
  const watchedIsFolder = form.watch("isFolder");
  const watchedType = form.watch("type");
  const watchedTags = form.watch("tags") || [];
  const watchedParentId = form.watch("parentId");

  // ✅ Validation du projectId en temps réel
  const isProjectIdValid =
    projectId && /^[cC][a-zA-Z0-9]{24,}$/.test(projectId);

  // ✅ NOUVEAU : Construction de l'affichage du chemin parent
  const getParentPathDisplay = useCallback(() => {
    if (!watchedParentId) {
      return (
        <div className="flex items-center text-gray-500">
          <Home className="h-4 w-4 mr-1" />
          <span>Racine</span>
        </div>
      );
    }

    const parentFolder = availableFolders.find((f) => f.id === watchedParentId);
    if (!parentFolder) {
      return (
        <div className="flex items-center text-gray-400">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span>Dossier parent introuvable</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-gray-700">
        <Home className="h-4 w-4 mr-1" />
        {parentFolder.path.map((segment, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="h-3 w-3 mx-1" />
            <span className="text-sm">{segment}</span>
          </React.Fragment>
        ))}
      </div>
    );
  }, [watchedParentId, availableFolders]);

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
            {/* ✅ Indicateurs de validation */}
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
          {/* ✅ Alerte ProjectId manquant */}
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

          {/* ✅ Affichage des erreurs de validation */}
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
              {/* ✅ Informations essentielles - CHAMPS DE BASE DU MODÈLE FILE */}
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
                    {/* ✅ File.name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de la référence *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="nom-du-fichier"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                console.log("📝 NAME changé:", e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            → File.name (String) dans le schéma Prisma
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ✅ File.type */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              console.log("🎯 TYPE changé:", value);
                            }}
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
                              {/* ✅ Section développement */}
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

                              {/* ✅ Section système */}
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

                  {/* ✅ NOUVEAU : File.parentId - Sélecteur de dossier parent */}
                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <FolderTree className="h-4 w-4" />
                          <span>Dossier parent</span>
                        </FormLabel>
                        <Popover
                          open={isFolderSelectorOpen}
                          onOpenChange={setIsFolderSelectorOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isFolderSelectorOpen}
                                className="w-full justify-between h-auto py-3"
                                disabled={isLoadingFolders}
                              >
                                <div className="flex flex-col items-start space-y-1">
                                  {getParentPathDisplay()}
                                  {selectedParentPath.length > 0 && (
                                    <div className="text-xs text-gray-400">
                                      Niveau {selectedParentPath.length}
                                    </div>
                                  )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Rechercher un dossier..."
                                disabled={isLoadingFolders}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingFolders
                                    ? "Chargement..."
                                    : "Aucun dossier trouvé."}
                                </CommandEmpty>
                                {availableFolders.map((folder) => (
                                  <CommandItem
                                    key={folder.id || "root"}
                                    value={`${folder.name} ${folder.path.join(
                                      " "
                                    )}`}
                                    onSelect={() =>
                                      handleParentSelection(folder.id)
                                    }
                                    className="cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-2 w-full">
                                      <div className="flex items-center">
                                        {folder.id === "" ? (
                                          <Home className="h-4 w-4 text-blue-500" />
                                        ) : (
                                          <Folder className="h-4 w-4 text-blue-500" />
                                        )}
                                        <div
                                          className="ml-2"
                                          style={{
                                            marginLeft: `${
                                              folder.level * 12 + 8
                                            }px`,
                                          }}
                                        >
                                          {folder.level > 0 && (
                                            <span className="text-gray-400 mr-2">
                                              {"└ ".repeat(1)}
                                            </span>
                                          )}
                                          <span>{folder.name}</span>
                                        </div>
                                      </div>
                                      <div className="ml-auto">
                                        <Check
                                          className={`h-4 w-4 ${
                                            field.value === folder.id ||
                                            (!field.value && folder.id === "")
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                      </div>
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

                  {/* ✅ File.path */}
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
                            onChange={(e) => {
                              field.onChange(e);
                              console.log("🛤️ PATH changé:", e.target.value);
                            }}
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

                  {/* ✅ File.description */}
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
                            onChange={(e) => {
                              field.onChange(e);
                              console.log(
                                "📝 DESCRIPTION changée:",
                                e.target.value.substring(0, 50) + "..."
                              );
                            }}
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

                  {/* ✅ File.isFolder */}
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
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              console.log("📁 ISFOLDER changé:", checked);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* ✅ Métadonnées de développement - CHAMPS SPÉCIALISÉS */}
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
                      {/* ✅ File.import */}
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
                                onChange={(e) => {
                                  field.onChange(e);
                                  console.log(
                                    "📥 IMPORT changé:",
                                    e.target.value.split("\n").length,
                                    "lignes"
                                  );
                                }}
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

                      {/* ✅ File.export */}
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
                                onChange={(e) => {
                                  field.onChange(e);
                                  console.log(
                                    "📤 EXPORT changé:",
                                    e.target.value.split("\n").length,
                                    "lignes"
                                  );
                                }}
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

                    {/* ✅ File.use */}
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
                              onChange={(e) => {
                                field.onChange(e);
                                console.log("🔗 USE changé:", e.target.value);
                              }}
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

                    {/* ✅ File.script */}
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
                              onChange={(e) => {
                                field.onChange(e);
                                console.log(
                                  "💻 SCRIPT changé:",
                                  e.target.value.length,
                                  "caractères"
                                );
                              }}
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

              {/* ✅ Tags - File.tags */}
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
                        onChange={(e) => {
                          setCurrentTag(e.target.value);
                          console.log(
                            "🏷️ Tag en cours de saisie:",
                            e.target.value
                          );
                        }}
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

              {/* ✅ Actions */}
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
                    onClick={() => {
                      console.log("🎯 BOUTON AJOUTER/MODIFIER CLIQUÉ");
                      console.log(
                        "📋 État actuel du formulaire:",
                        form.getValues()
                      );
                    }}
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
