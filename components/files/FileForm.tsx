// app/files/components/FileForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileType } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(FileType),
  description: z.string().optional(),
  import: z.string().optional(),
  use: z.string().optional(),
  export: z.string().optional(),
  script: z.string().optional(),
});

type FileFormValues = z.infer<typeof fileSchema>;

export function FileForm({ 
  open, 
  onOpenChange, 
  file, 
  projectId,
  userId,
  onSuccess
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: any;
  projectId: string;
  userId?: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FileFormValues>({
    resolver: zodResolver(fileSchema),
    defaultValues: {
      name: "",
      type: "PAGE",
      description: "",
      import: "",
      use: "",
      export: "",
      script: "",
    },
  });

  useEffect(() => {
    if (file) {
      form.reset({
        name: file.name,
        type: file.type,
        description: file.description || "",
        import: file.import || "",
        use: file.use || "",
        export: file.export || "",
        script: file.script || "",
      });
    } else {
      form.reset({
        name: "",
        type: "PAGE",
        description: "",
        import: "",
        use: "",
        export: "",
        script: "",
      });
    }
  }, [file, form, open]);

  const onSubmit = async (values: FileFormValues) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const url = file?.id ? `/api/files/${file.id}` : "/api/files";
      const method = file?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          projectId,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      onSuccess();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="File description" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    <Input placeholder="e.g. component, hook, util" {...field} />
                  </FormControl>
                  <FormDescription>
                    How this file is used in the project
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
                  <FormLabel>Script Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="File content" 
                      {...field} 
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save File"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}