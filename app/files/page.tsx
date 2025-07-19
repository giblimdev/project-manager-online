/*
je veux que tu me donnes le code complet du fichiers suivant :   
app/files/page.tsx qui utilisera les commposants  :
FilesDisplay.tsx (liste, card, branch)
FilesFilter.tsx (by name, by type, by date)
FilesList.tsx (pours chaque fichier les boutons up dawn edit, delete)
FilesForm.tsx (creation / modification de fichier)

views/FileswiewList.tsx 
views/FilesViewCard.tsx
views/FilesViewBranch.tsx

 et les fichier suivant deja existant : 

// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;



// lib/prisma.ts
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  prisma = globalForPrisma.prisma;
}

export default prisma;


 // utils/delete-item.ts
// Fonction utilitaire pour supprimer un item
export const deleteItemUtil = async (
  tableName: string,
  itemId: string
): Promise<void> => {
  const response = await fetch(`/api/${tableName}/${itemId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete ${tableName} item`);
  }
};

// utils/reorder-items.ts
// Fonction utilitaire pour réorganiser les items
import type { Item } from "@/types/item";

export const reorderItemsUtil = async (
  items: Item[],
  itemId: string,
  direction: "up" | "down"
): Promise<void> => {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  if (currentIndex === -1) return;

  const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0 || newIndex >= items.length) return;

  const response = await fetch(`/api/items/${itemId}/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction, newIndex }),
  });

  if (!response.ok) {
    throw new Error("Failed to reorder item");
  }
};


*/

// app/files/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FolderOpen,
  AlertCircle,
  Files as FilesIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilesDisplay } from "@/components/files/FilesDisplay";
import { FilesFilter } from "@/components/files/FilesFilter";
import { FilesList } from "@/components/files/FilesList";
import { FilesForm } from "@/components/files/FilesForm";
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

  // Relations selon votre schéma Prisma
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

type ViewMode = "list" | "card" | "branch";
type FilterType =
  | "ALL"
  | "DOCUMENT"
  | "IMAGE"
  | "VIDEO"
  | "ARCHIVE"
  | "CODE"
  | "SPECIFICATION"
  | "DESIGN"
  | "TEST"
  | "OTHER";
type SortBy = "name" | "type" | "size" | "date" | "uploader";
type SortOrder = "asc" | "desc";

export default function FilesPage() {
  const { data: session, isPending } = useSession();
  const [files, setFiles] = useState<FileWithRelations[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileWithRelations[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileWithRelations | null>(
    null
  );
  const [filterValue, setFilterValue] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [currentFolder]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [files, filterValue, filterType, sortBy, sortOrder]);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentFolder) {
        params.append("parentId", currentFolder);
      }

      const response = await fetch(`/api/files?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data && typeof data === "object") {
        let filesData: any[] = [];

        if (data.files && Array.isArray(data.files)) {
          filesData = data.files;
        } else if (Array.isArray(data)) {
          filesData = data;
        } else {
          console.error("Structure de données inattendue:", data);
          throw new Error("Format de données inattendu reçu du serveur");
        }

        // Normalisation des données selon le schéma Prisma
        const normalizedFiles: FileWithRelations[] = filesData.map((file) => ({
          ...file,
          uploader: {
            id: file.uploader?.id || "",
            name: file.uploader?.name || null,
            email: file.uploader?.email || "",
            emailVerified: file.uploader?.emailVerified ?? false,
            image: file.uploader?.image || null,
            username: file.uploader?.username || null,
            firstName: file.uploader?.firstName || null,
            lastName: file.uploader?.lastName || null,
            bio: file.uploader?.bio || null,
            timezone: file.uploader?.timezone || "UTC",
            preferences: file.uploader?.preferences || {},
            isActive: file.uploader?.isActive ?? true,
          },
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.updatedAt),
          tags: file.tags || [],
          metadata: file.metadata || {},
          versions: (file.versions || []).map((version: any) => ({
            ...version,
            createdAt: new Date(version.createdAt),
          })),
          comments: (file.comments || []).map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          })),
          _count: file._count || {
            children: file.children?.length || 0,
            versions: file.versions?.length || 0,
            comments: file.comments?.length || 0,
            items: file.items?.length || 0,
          },
        }));

        setFiles(normalizedFiles);

        // Mise à jour des breadcrumbs
        if (data.breadcrumbs) {
          setBreadcrumbs(data.breadcrumbs);
        }
      } else {
        throw new Error("Données invalides reçues du serveur");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des fichiers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      setFiles([]);
      setFilteredFiles([]);
      toast.error("Impossible de charger les fichiers");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...files];

    // Filtrage par recherche textuelle
    if (filterValue) {
      const searchTerm = filterValue.toLowerCase();
      filtered = filtered.filter((file) => {
        const matchesBasicFields =
          file.name.toLowerCase().includes(searchTerm) ||
          file.originalName?.toLowerCase().includes(searchTerm) ||
          file.description?.toLowerCase().includes(searchTerm) ||
          file.tags.some((tag) => tag.toLowerCase().includes(searchTerm));

        const matchesUploader =
          file.uploader.name?.toLowerCase().includes(searchTerm) ||
          file.uploader.email.toLowerCase().includes(searchTerm) ||
          file.uploader.firstName?.toLowerCase().includes(searchTerm) ||
          file.uploader.lastName?.toLowerCase().includes(searchTerm);

        const matchesRelations =
          file.project?.name.toLowerCase().includes(searchTerm) ||
          file.feature?.name.toLowerCase().includes(searchTerm) ||
          file.userStory?.title.toLowerCase().includes(searchTerm) ||
          file.task?.title.toLowerCase().includes(searchTerm) ||
          file.sprint?.name.toLowerCase().includes(searchTerm);

        return matchesBasicFields || matchesUploader || matchesRelations;
      });
    }

    // Filtrage par type
    if (filterType !== "ALL") {
      filtered = filtered.filter((file) => file.type === filterType);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "date":
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case "uploader":
          aValue = getUserDisplayName(a.uploader).toLowerCase();
          bValue = getUserDisplayName(b.uploader).toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Trier les dossiers avant les fichiers
    filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return 0;
    });

    setFilteredFiles(filtered);
  };

  const handleFormSuccess = () => {
    setIsAddModalOpen(false);
    setEditingFile(null);
    fetchFiles();
    toast.success(
      editingFile ? "Fichier modifié avec succès" : "Fichier ajouté avec succès"
    );
  };

  const handleEdit = (file: FileWithRelations) => {
    setEditingFile(file);
    setIsAddModalOpen(true);
  };

  const handleFolderNavigation = (
    folderId: string | null,
    folderName?: string
  ) => {
    setCurrentFolder(folderId);
    if (folderId && folderName) {
      setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
    } else {
      setBreadcrumbs([]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root folder
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      const folder = breadcrumbs[index];
      setCurrentFolder(folder.id);
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    }
  };

  const getUserDisplayName = (user: {
    name: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
  }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.name || user.email;
  };

  const getFileStats = () => {
    if (!Array.isArray(filteredFiles))
      return { total: 0, folders: 0, files: 0, totalSize: 0 };

    const folders = filteredFiles.filter((f) => f.isFolder).length;
    const files = filteredFiles.filter((f) => !f.isFolder).length;
    const totalSize = filteredFiles.reduce((acc, f) => acc + (f.size || 0), 0);

    return {
      total: filteredFiles.length,
      folders,
      files,
      totalSize,
      byType: filteredFiles.reduce((acc, file) => {
        if (!file.isFolder) {
          acc[file.type] = (acc[file.type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const stats = getFileStats();

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des fichiers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Erreur de chargement
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button
              onClick={fetchFiles}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Réessayer
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Actualiser la page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FilesIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Fichiers</h1>
                  <p className="text-sm text-gray-600">
                    Gérez vos fichiers et documents de projet
                  </p>
                </div>
              </div>

              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center space-x-2 text-sm text-gray-500">
                  <button
                    onClick={() => handleBreadcrumbClick(-1)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Racine
                  </button>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id}>
                      <span className="text-gray-300">/</span>
                      <button
                        onClick={() => handleBreadcrumbClick(index)}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {crumb.name}
                      </button>
                    </React.Fragment>
                  ))}
                </nav>
              )}

              {/* Statistics */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {stats.total} élément{stats.total !== 1 ? "s" : ""}
                </Badge>
                {stats.folders > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-1 bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                  >
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {stats.folders} dossier{stats.folders !== 1 ? "s" : ""}
                  </Badge>
                )}
                {stats.files > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-1 bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    <FilesIcon className="h-3 w-3 mr-1" />
                    {stats.files} fichier{stats.files !== 1 ? "s" : ""}
                  </Badge>
                )}
                {stats.totalSize > 0 && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-1 bg-gray-50 text-gray-700 border-gray-200 text-xs"
                  >
                    {formatFileSize(stats.totalSize)}
                  </Badge>
                )}
              </div>
            </div>

            {session?.user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span>Connecté en tant que</span>
                </div>
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                  <Avatar className="h-8 w-8 ring-2 ring-white">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm">
                      {session.user.name?.charAt(0) ||
                        session.user.email?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {getUserDisplayName({
                        name: session.user.name,

                        email: session.user.email,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session.user.email}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1 max-w-md">
                <FilesFilter
                  value={filterValue}
                  onChange={setFilterValue}
                  selectedType={filterType}
                  onTypeChange={setFilterType}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  placeholder="Rechercher par nom, description, uploader, tags ou relations..."
                />
              </div>
              <FilesDisplay
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-10 px-6"
                  onClick={() => setEditingFile(null)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau fichier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0">
                <DialogHeader className="p-8 pb-0">
                  <DialogTitle className="text-3xl font-bold">
                    {editingFile
                      ? "Modifier le fichier"
                      : "Ajouter un nouveau fichier"}
                  </DialogTitle>
                </DialogHeader>
                <div className="p-8">
                  <FilesForm
                    file={editingFile}
                    currentFolder={currentFolder}
                    onSuccess={handleFormSuccess}
                    onCancel={() => {
                      setIsAddModalOpen(false);
                      setEditingFile(null);
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Files List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          {filteredFiles.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FilesIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun fichier trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                {filterValue
                  ? "Aucun fichier ne correspond à votre recherche."
                  : currentFolder
                  ? "Ce dossier est vide."
                  : "Commencez par ajouter votre premier fichier."}
              </p>
              {!filterValue && (
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un fichier
                </Button>
              )}
            </div>
          ) : (
            <FilesList
              files={filteredFiles}
              viewMode={viewMode}
              currentFolder={currentFolder}
              onEdit={handleEdit}
              onRefresh={fetchFiles}
              onFolderNavigate={handleFolderNavigation}
            />
          )}
        </div>
      </div>
    </div>
  );
}
