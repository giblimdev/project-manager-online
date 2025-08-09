// components/files/FilesForm.tsx

/**
 * RÔLE : Formulaire modal corrigé pour création et édition de métadonnées de fichiers
 * RESPONSABILITÉS :
 * - Formulaire modal Dialog avec support création et édition de métadonnées fichiers/dossiers
 * - Validation avec Zod selon schéma Prisma FileType enum avec types TypeScript stricts
 * - Support des types de fichiers (PAGE, COMPONENT, UTILS, LIB, STORE, HOOK, etc.)
 * - Interface responsive moderne avec design épuré et accessible
 * - Relations avec projet selon schéma Prisma avec uploaderId et projectId requis
 * - Types strictement typés pour performance optimale avec TypeScript strict mode
 * - Actions CRUD sécurisées avec validation côté client et serveur
 * - CORRECTION : Types react-hook-form compatibles avec schéma Zod strict
 *
 * COMPOSANTS UTILISÉS :
 * - Dialog, DialogContent, DialogHeader, DialogTitle: Composants modal shadcn/ui
 * - Form, FormControl, FormField, FormItem, FormLabel, FormMessage: Composants de formulaire
 * - Input, Textarea, Select, Switch: Composants de saisie responsive
 * - Button: Composant de soumission avec états loading
 * - Card, CardContent: Composants de structuration
 * - ScrollArea: Composant de défilement pour contenu long
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useCallback, useEffect, JSX
 * - Next.js 15 client component avec TypeScript strict mode
 * - react-hook-form: Gestion des formulaires avec validation stricte
 * - @hookform/resolvers/zod: Intégration Zod avec react-hook-form
 * - zod: Validation des données selon schéma Prisma FileType enum
 * - shadcn/ui: Composants UI modernes avec accessibilité
 * - Tailwind CSS: Design responsive mobile-first
 * - lucide-react: Icons cohérentes pour actions et types de fichiers
 * - sonner: Toast notifications pour feedback utilisateur temps réel
 *
 * TYPES UTILISÉS :
 * - FileMetadata avec métadonnées centralisées depuis @/types/files
 * - FilesFormProps interface pour props du composant avec types corrects
 * - FormData avec types Zod stricts pour validation
 */

"use client";

import React, { JSX, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Package,
  Settings,
  Layers,
  Database,
  Code2,
  Image,
  Video,
  Archive,
  Paintbrush,
  TestTube,
  File,
  Folder,
  Save,
  X,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import type { FileMetadata, FilesFormProps } from "@/types/files";

// ✅ CORRECTION PRINCIPALE : Schema Zod avec valeurs par défaut strictes pour compatibilité react-hook-form
const fileFormSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(255),
  type: z.enum([
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
  ]),
  url: z.string().url("L'URL doit être valide"),
  description: z.string().optional(),
  isPublic: z.boolean(), // ✅ Requis sans .default() pour éviter les erreurs de type
  isFolder: z.boolean(), // ✅ Requis sans .default() pour éviter les erreurs de type
});

// ✅ Type inféré strictement depuis le schema Zod
type FormData = z.infer<typeof fileFormSchema>;

export default function FilesForm({
  file,
  currentFolder,
  onSuccess,
  onCancel,
  isOpen,
}: FilesFormProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Configuration du formulaire avec types stricts et valeurs par défaut explicites
  const form = useForm<FormData>({
    resolver: zodResolver(fileFormSchema),
    defaultValues: {
      name: "",
      type: "DOCUMENT",
      url: "",
      description: "",
      isPublic: false, // ✅ Valeur par défaut explicite
      isFolder: false, // ✅ Valeur par défaut explicite
    },
  });

  // ✅ Reset du formulaire avec gestion stricte des types
  useEffect(() => {
    if (file) {
      form.reset({
        name: file.name,
        type: file.type,
        url: file.url,
        description: file.description || "",
        isPublic: file.isPublic,
        isFolder: file.isFolder,
      });
    } else {
      form.reset({
        name: "",
        type: "DOCUMENT",
        url: "",
        description: "",
        isPublic: false,
        isFolder: false,
      });
    }
  }, [file, form]);

  // ✅ Fonction de soumission avec types stricts
  const onSubmit = useCallback(
    async (data: FormData) => {
      setIsSubmitting(true);

      try {
        const method = file ? "PUT" : "POST";
        const url = file ? `/api/files/${file.id}` : "/api/files";

        // ✅ Construction des données avec types explicites selon schéma Prisma
        const requestData = {
          ...data,
          // Données requises selon votre schéma Prisma
          uploaderId: "current-user-id", // À remplacer par l'ID utilisateur réel depuis session
          projectId: "current-project-id", // À remplacer par l'ID projet réel
          parentId: currentFolder,
          // Données optionnelles avec valeurs par défaut
          originalName: data.name, // Utiliser le nom comme originalName par défaut
          mimeType: null, // Nullable selon schéma
          size: null, // Nullable selon schéma
          path: null, // Nullable selon schéma
          script: null, // Nullable selon schéma
          tags: [], // Tableau vide par défaut
          import: null, // Json nullable
          export: null, // Json nullable
          // Relations optionnelles
          featureId: null,
          userStoryId: null,
          taskId: null,
          sprintId: null,
        };

        console.log("📤 Envoi des données:", requestData);

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Erreur ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la sauvegarde");
        }

        toast.success(
          file
            ? "Métadonnées mises à jour avec succès"
            : "Fichier référencé avec succès",
          {
            description: `Le fichier "${data.name}" a été ${
              file ? "modifié" : "ajouté"
            } dans le référentiel`,
          }
        );

        onSuccess();
      } catch (error) {
        console.error("💥 Erreur lors de la sauvegarde:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la sauvegarde",
          {
            description: "Vérifiez les données saisies et réessayez",
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [file, currentFolder, onSuccess]
  );

  // ✅ Fonction pour obtenir l'icône selon le type avec gestion complète
  const getTypeIcon = useCallback((type: string): JSX.Element => {
    const iconMap: Record<string, JSX.Element> = {
      PAGE: <FileText className="h-4 w-4 text-purple-600" />,
      COMPONENT: <Package className="h-4 w-4 text-blue-600" />,
      UTILS: <Settings className="h-4 w-4 text-orange-600" />,
      LIB: <Layers className="h-4 w-4 text-indigo-600" />,
      STORE: <Database className="h-4 w-4 text-green-600" />,
      HOOK: <Code2 className="h-4 w-4 text-teal-600" />,
      DOCUMENT: <FileText className="h-4 w-4 text-blue-600" />,
      IMAGE: <Image className="h-4 w-4 text-pink-600" />,
      VIDEO: <Video className="h-4 w-4 text-red-600" />,
      ARCHIVE: <Archive className="h-4 w-4 text-yellow-600" />,
      CODE: <Code2 className="h-4 w-4 text-gray-600" />,
      SPECIFICATION: <FileText className="h-4 w-4 text-cyan-600" />,
      DESIGN: <Paintbrush className="h-4 w-4 text-rose-600" />,
      TEST: <TestTube className="h-4 w-4 text-emerald-600" />,
      OTHER: <File className="h-4 w-4 text-gray-400" />,
    };
    return iconMap[type] || <File className="h-4 w-4 text-gray-400" />;
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {form.watch("isFolder") ? (
              <Folder className="h-5 w-5 text-blue-600" />
            ) : (
              getTypeIcon(form.watch("type"))
            )}
            {file ? "Modifier les métadonnées" : "Référencer un fichier"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informations essentielles */}
              <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Informations essentielles
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Nom du fichier *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="exemple: UserProfile.tsx"
                              className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Type *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500">
                                <SelectValue placeholder="Sélectionner un type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PAGE">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-purple-600" />
                                  Page Next.js
                                </div>
                              </SelectItem>
                              <SelectItem value="COMPONENT">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-blue-600" />
                                  Composant React
                                </div>
                              </SelectItem>
                              <SelectItem value="UTILS">
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4 text-orange-600" />
                                  Utilitaires
                                </div>
                              </SelectItem>
                              <SelectItem value="LIB">
                                <div className="flex items-center gap-2">
                                  <Layers className="h-4 w-4 text-indigo-600" />
                                  Librairie
                                </div>
                              </SelectItem>
                              <SelectItem value="STORE">
                                <div className="flex items-center gap-2">
                                  <Database className="h-4 w-4 text-green-600" />
                                  Store
                                </div>
                              </SelectItem>
                              <SelectItem value="HOOK">
                                <div className="flex items-center gap-2">
                                  <Code2 className="h-4 w-4 text-teal-600" />
                                  Hook React
                                </div>
                              </SelectItem>
                              <SelectItem value="DOCUMENT">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  Document
                                </div>
                              </SelectItem>
                              <SelectItem value="IMAGE">
                                <div className="flex items-center gap-2">
                                  <Image className="h-4 w-4 text-pink-600" />
                                  Image
                                </div>
                              </SelectItem>
                              <SelectItem value="VIDEO">
                                <div className="flex items-center gap-2">
                                  <Video className="h-4 w-4 text-red-600" />
                                  Vidéo
                                </div>
                              </SelectItem>
                              <SelectItem value="ARCHIVE">
                                <div className="flex items-center gap-2">
                                  <Archive className="h-4 w-4 text-yellow-600" />
                                  Archive
                                </div>
                              </SelectItem>
                              <SelectItem value="CODE">
                                <div className="flex items-center gap-2">
                                  <Code2 className="h-4 w-4 text-gray-600" />
                                  Code
                                </div>
                              </SelectItem>
                              <SelectItem value="SPECIFICATION">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-cyan-600" />
                                  Spécification
                                </div>
                              </SelectItem>
                              <SelectItem value="DESIGN">
                                <div className="flex items-center gap-2">
                                  <Paintbrush className="h-4 w-4 text-rose-600" />
                                  Design
                                </div>
                              </SelectItem>
                              <SelectItem value="TEST">
                                <div className="flex items-center gap-2">
                                  <TestTube className="h-4 w-4 text-emerald-600" />
                                  Test
                                </div>
                              </SelectItem>
                              <SelectItem value="OTHER">
                                <div className="flex items-center gap-2">
                                  <File className="h-4 w-4 text-gray-400" />
                                  Autre
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          URL/Chemin *
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                              <Link className="h-4 w-4 text-gray-500" />
                            </div>
                            <Input
                              placeholder="https://github.com/repo/file.tsx ou /src/components/Button.tsx"
                              className="rounded-l-none transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-gray-500 mt-1">
                          💡 Conseil: URL GitHub, chemin local ou lien vers le
                          fichier
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description du rôle et de l'utilité du fichier dans le projet..."
                            className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isFolder"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">
                              Dossier
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Ce fichier représente un dossier
                            </div>
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

                    <FormField
                      control={form.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">
                              Public
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Accessible à tous les membres
                            </div>
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
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? "Sauvegarde..."
                    : file
                    ? "Mettre à jour"
                    : "Créer"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
