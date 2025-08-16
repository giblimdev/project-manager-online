// app/files/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileTable } from "@/components/files/FileTable";
import { FileForm } from "@/components/files/FileForm";
import { useProjectStore } from "@/stores/useSelectedProjectStore";
import { useSession } from "@/lib/auth/auth-client";
import { FileType } from "@/lib/generated/prisma/client";
import { Skeleton } from "@/components/ui/skeleton";

// Utilitaire pour extraire les dossiers existants d'une liste de fichiers
function getAvailableFolders(files: any[]) {
  // Uniquement les dossiers qui ne sont pas supprimés et qui appartiennent au projet courant
  return files.filter(file => file.isFolder).map(f => ({
    id: f.id,
    name: f.name,
    isFolder: true,
    path: f.path ?? "",
  }));
}

export default function FilesPage() {
  const { projectData, isLoading: isProjectLoading } = useProjectStore();
  const sessionQuery = useSession();
  const sessionData = sessionQuery.data;
  const isSessionLoading = sessionQuery.isPending;

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [currentFile, setCurrentFile] = useState<any>(null);

  const projectId = projectData?.id;
  const userId = sessionData?.user?.id;

  // Dossiers disponibles pour la hiérarchie (sauf si édition: pas le fichier actuel lui-même)
  const availableParents = useMemo(
    () =>
      files
        .filter(
          (file) =>
            file.isFolder &&
            (!currentFile || !currentFile.id || file.id !== currentFile.id)
        )
        .map((file) => ({
          id: file.id,
          name: file.name,
          isFolder: true,
          path: file.path ?? "",
        })),
    [files, currentFile]
  );

  const fetchFiles = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/files?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Files fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleFileAction = (action: string, file?: any) => {
    if (action === "create") {
      setCurrentFile({
        name: "",
        type: "PAGE" as FileType,
        description: "",
        isFolder: false,
        version: 1,
        path: "",
        import: "",
        use: "",
        export: "",
        script: "",
        tags: [],
        metadata: "",
        parentId: null,
        projectId,
      });
      setOpenForm(true);
    } else if (action === "edit" && file) {
      setCurrentFile({ ...file });
      setOpenForm(true);
    } else if (action === "delete" && file) {
      handleDeleteFile(file.id);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (isSessionLoading || isProjectLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please select a project first</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Files</h1>
        <Button onClick={() => handleFileAction("create")}>
          Create New File
        </Button>
      </div>

      <FileTable
        files={files}
        loading={loading}
        onAction={handleFileAction}
      />

      <FileForm
        open={openForm}
        onOpenChange={setOpenForm}
        file={currentFile}
        projectId={projectId}
        userId={userId}
        availableParents={availableParents}
        onSuccess={() => {
          fetchFiles();
          setOpenForm(false);
        }}
      />
    </div>
  );
}
