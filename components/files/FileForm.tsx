// app/files/components/FileForm.tsx
/**
 * Rôle : Formulaire complet typé pour création & édition de fichiers (modèle File Prisma)
 * Responsabilités :
 * - Gestion de tous les champs Prisma incluant la hiérarchie (parentId)
 * - Typage strict pour Next.js 15 et Prisma généré
 * - Responsive & moderne (utilisation composants UI et CSS Tailwind)
 * - Gère création/édition avec feedbacks loading/erreur
 * - Validation via Zod avec gestion de la hiérarchie parent/enfant
 * - Utilise react-hook-form, Zod, composants UI, FileType enum
 * - Conformité Next.js 15 app/client components
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useForm, Control, FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileType } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// ✅ Schéma Zod avec gestion de la hiérarchie
const fileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(FileType),
  mimeType: z.string().nullable().optional(),
  path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  import: z.string().nullable().optional(),
  use: z.string().nullable().optional(),
  export: z.string().nullable().optional(),
  script: z.string().nullable().optional(),
  version: z.number().int().min(1),
  isFolder: z.boolean(),
  metadata: z.string().optional(),
  tags: z.array(z.string()),
  parentId: z.string().nullable().optional(), // ✅ Ajout du champ parentId pour la hiérarchie
});

// ✅ Type explicite avec parentId
type FileFormValues = {
  name: string;
  type: FileType;
  mimeType?: string | null;
  path?: string | null;
  description?: string | null;
  import?: string | null;
  use?: string | null;
  export?: string | null;
  script?: string | null;
  version: number;
  isFolder: boolean;
  metadata?: string;
  tags: string[];
  parentId?: string | null; // ✅ Support de la hiérarchie
};

// ✅ Interface pour les fichiers parents (pour le select)
interface ParentFile {
  id: string;
  name: string;
  isFolder: boolean;
  path?: string;
}

interface FileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file?: Partial<FileFormValues> & { id?: string };
  projectId: string;
  userId?: string;
  availableParents?: ParentFile[]; // ✅ Liste des parents possibles
  onSuccess: () => void;
}

export function FileForm({
  open,
  onOpenChange,
  file,
  projectId,
  userId,
  availableParents = [],
  onSuccess,
}: FileFormProps) {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<FileFormValues>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      name: "",
      type: FileType.PAGE,
      mimeType: "",
      path: "",
      description: "",
      import: "",
      use: "",
      export: "",
      script: "",
      version: 1,
      isFolder: false,
      metadata: "",
      tags: [],
      parentId: null, // ✅ Valeur par défaut pour le parent
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (file) {
      form.reset({
        name: file.name || "",
        type: file.type || FileType.PAGE,
        mimeType: file.mimeType ?? "",
        path: file.path ?? "",
        description: file.description ?? "",
        import: file.import ?? "",
        use: file.use ?? "",
        export: file.export ?? "",
        script: file.script ?? "",
        version: file.version ?? 1,
        isFolder: file.isFolder ?? false,
        metadata: typeof file.metadata === "object" ? JSON.stringify(file.metadata) : (file.metadata as string) ?? "",
        tags: file.tags ?? [],
        parentId: file.parentId ?? null, // ✅ Reset du parentId
      });
    } else {
      form.reset();
    }
  }, [file, open, form]);

  const onSubmit = async (values: FileFormValues) => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = file?.id ? `/api/files/${file.id}` : "/api/files";
      const method = file?.id ? "PUT" : "POST";
      
      // Parse metadata si c'est une string JSON
      let metadataFinal = {};
      if (values.metadata) {
        try {
          metadataFinal = JSON.parse(values.metadata);
        } catch {
          metadataFinal = {};
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          metadata: metadataFinal,
          projectId,
          userId,
          parentId: values.parentId || null, // ✅ Envoi du parentId
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save file");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      // TODO: afficher dans le UI avec un toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {file?.id ? "Edit File" : "Create New File"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="File name" {...field} />
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
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(FileType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ✅ NOUVEAU CHAMP : Parent File pour la hiérarchie */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Folder</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent folder (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        📁 Root (No parent)
                      </SelectItem>
                      {availableParents
                        .filter(parent => parent.isFolder && parent.id !== file?.id) // ✅ Éviter l'auto-référence
                        .map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          📂 {parent.name} {parent.path && `(${parent.path})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choisir un dossier parent pour organiser la hiérarchie
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mimeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MIME Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="text/plain" 
                        {...field} 
                        value={field.value ?? ""} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="/app/components" 
                        {...field} 
                        value={field.value ?? ""} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description du fichier" 
                      {...field} 
                      value={field.value ?? ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="import"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Import</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="React, useState..." 
                        {...field} 
                        value={field.value ?? ""} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="use"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="component, hook, util..." 
                        {...field} 
                        value={field.value ?? ""} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="export"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="default, named..." 
                      {...field} 
                      value={field.value ?? ""} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="script"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Script Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contenu du fichier (script/code)"
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[120px] font-mono text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isFolder"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 h-10">
                    <FormLabel className="mr-2">Is Folder</FormLabel>
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

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="react, typescript, component" 
                      value={field.value?.join(', ') ?? ''} 
                      onChange={(e) => field.onChange(
                        e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      )} 
                    />
                  </FormControl>
                  <FormDescription>
                    Tags séparés par des virgules
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metadata (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{"key": "value"}'
                      {...field}
                      value={field.value ?? ""}
                      className="font-mono text-xs min-h-[70px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Métadonnées au format JSON (optionnel)
                  </FormDescription>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-32"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="w-32">
                {loading ? "Saving..." : "Save File"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
