// app/files/page.tsx 
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { FileForm } from "@/components/files/FileForm";
import { useProjectStore } from "@/stores/useSelectedProjectStore";
import { useSession } from "@/lib/auth/auth-client";
import { FileType } from "@/lib/generated/prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Folder, FileText, Plus, Edit, Trash2 } from "lucide-react";

// Utilitaire pour organiser les fichiers en structure arborescente
function buildFileTree(files: any[]) {
  const fileMap = new Map();
  const tree: any[] = [];

  // Créer un map pour chaque fichier
  files.forEach((file) => {
    fileMap.set(file.id, { ...file, children: [] });
  });

  // Parcourir à nouveau pour assigner les enfants
  files.forEach((file) => {
    if (file.parentId) {
      const parent = fileMap.get(file.parentId);
      if (parent) {
        parent.children.push(fileMap.get(file.id));
      }
    } else {
      tree.push(fileMap.get(file.id));
    }
  });

  return tree;
}

// Composant pour afficher un élément de fichier/dossier
const FileItem = ({ file, level = 0, onAction }: { file: any; level?: number; onAction: (action: string, file?: any) => void }) => {
  const marginLeft = Math.min(level, 6) * 16; // Limiter l'indentation pour les petits écrans

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md group" style={{ marginLeft: `${marginLeft}px` }}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {file.isFolder ? (
          <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
        ) : (
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
        )}
        <span className="truncate text-sm sm:text-base">{file.name}</span>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onAction("edit", file)}
          className="h-7 w-7 p-0 hidden xs:inline-flex"
          title="Edit"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onAction("delete", file)}
          className="h-7 w-7 p-0 text-destructive hidden xs:inline-flex"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        
        {/* Menu déroulant pour tous les écrans mais prioritaire sur mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 xs:ml-1">
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onAction("edit", file)} className="cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction("delete", file)}
              className="text-destructive cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Composant récursif pour afficher l'arborescence
const FileTree = ({ files, level = 0, onAction }: { files: any[]; level?: number; onAction: (action: string, file?: any) => void }) => {
  return (
    <>
      {files.map((file) => (
        <div key={file.id}>
          {file.isFolder ? (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value={file.id} className="border-b-0">
                <div className="flex items-center justify-between">
                  <AccordionTrigger className="hover:no-underline py-2 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">{file.name}</span>
                    </div>
                  </AccordionTrigger>
                  
                  <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction("edit", file);
                      }}
                      className="h-7 w-7 p-0 hidden xs:inline-flex"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction("delete", file);
                      }}
                      className="h-7 w-7 p-0 text-destructive hidden xs:inline-flex"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 xs:ml-1">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onAction("edit", file)} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onAction("delete", file)}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <AccordionContent className="ml-2">
                  <FileTree 
                    files={file.children} 
                    level={level + 1} 
                    onAction={onAction} 
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <FileItem file={file} level={level} onAction={onAction} />
          )}
        </div>
      ))}
    </>
  );
};

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

  // Construire l'arborescence des fichiers
  const fileTree = useMemo(() => buildFileTree(files), [files]);

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
      <div className="container mx-auto py-6 px-4 sm:px-6">
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
      <div className="container mx-auto py-8 px-4 sm:px-6 text-center">
        <p className="text-muted-foreground">Please select a project first</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Project Files</h1>
        <Button 
          onClick={() => handleFileAction("create")} 
          className="w-full sm:w-auto flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-card">
          {fileTree.length > 0 ? (
            <FileTree files={fileTree} onAction={handleFileAction} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p>No files found.</p>
              <p className="text-sm mt-1">Create your first file or folder to get started.</p>
            </div>
          )}
        </div>
      )}

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