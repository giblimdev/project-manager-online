/*
app/projects/[id]/features/page.tsx qui utilisera les commposants  :
FeatureDisplay.tsx (liste, card, branch)
FeatureFilter.tsx (by name, by type, by date)
FeatureList.tsx (pours chaque fichier les boutons up dawn edit, delete)
FeatureForm.tsx (creation / modification de fichier)

views/FeaturewiewList.tsx 
views/FeatureViewCard.tsx
views/FeatureViewBranch.tsx

 et les fichier suivant deja existant : 

// lib/auth/auth-client.ts de better auth useSession pour verifier si l'utilisat eur est connecté et utiliser l'id pour cree une feature



// lib/prisma.ts


*/
"use client";

import { useState, useEffect, useCallback } from "react";
import { feature } from "@/lib/generated/prisma/client";
import FeatureFilter from "@/components/features/FeatureFilter";
import FeatureList from "@/components/features/FeatureList";
import FeatureForm from "@/components/features/FeatureForm";
import FeatureDisplay from "@/components/features/FeatureDisplay";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "branch">("grid");

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/files");
        const data = await response.json();
        setFiles(data);
        setFilteredFiles(data);
      } catch (error) {
        toast.error("Failed to load files");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const handleFilter = useCallback(
    (filters: {
      name?: string;
      type?: FileType;
      startDate?: Date;
      endDate?: Date;
    }) => {
      let result = [...files];

      if (filters.name) {
        result = result.filter((file) =>
          file.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }

      if (filters.type) {
        result = result.filter((file) => file.type === filters.type);
      }

      if (filters.startDate && filters.endDate) {
        result = result.filter((file) => {
          const fileDate = new Date(file.createdAt);
          return fileDate >= filters.startDate! && fileDate <= filters.endDate!;
        });
      }

      setFilteredFiles(result);
    },
    [files]
  );

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      setFiles(files.filter((file) => file.id !== id));
      setFilteredFiles(filteredFiles.filter((file) => file.id !== id));
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const handleFormSuccess = (file: File) => {
    if (selectedFile) {
      setFiles(files.map((f) => (f.id === file.id ? file : f)));
      setFilteredFiles(filteredFiles.map((f) => (f.id === file.id ? file : f)));
    } else {
      setFiles([...files, file]);
      setFilteredFiles([...filteredFiles, file]);
    }
    setIsFormOpen(false);
    setSelectedFile(null);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Files Management</h1>
        <Button
          onClick={() => {
            setSelectedFile(null);
            setIsFormOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New File
        </Button>
      </div>

      <FeatureFilter onFilter={handleFilter} />

      <FeatureDisplay viewMode={viewMode} onViewModeChange={setViewMode} />

      <FeatureList
        files={filteredFiles}
        loading={loading}
        onEdit={(file) => {
          setSelectedFile(file);
          setIsFormOpen(true);
        }}
        onDelete={handleDelete}
        viewMode={viewMode}
      />

      <FeatureForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        file={selectedFile}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
