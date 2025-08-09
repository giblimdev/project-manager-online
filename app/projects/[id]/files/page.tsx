// app/projects/[id]/files/page.tsx

/**
 * RÔLE : Page de gestion du référentiel de métadonnées de fichiers d'un projet
 * RESPONSABILITÉS :
 * - Utilise correctement l'ID de l'URL via params (route dynamique Next.js 15)
 * - Affichage des métadonnées de fichiers avec mode vue liste simplifié
 * - Gestion des filtres par nom et type de fichier via interface simple
 * - FilesList pour affichage avec toutes les actions CRUD
 * - FilesForm en modal avec Dialog géré par isOpen pour création/édition
 * - Gestion des permissions et authentification Better Auth
 * - Interface responsive moderne avec design épuré
 * - API avec projectId dans les paramètres d'URL selon nouvelle spécification
 * - Types simplifiés via fichier central types/files.ts
 *
 * COMPOSANTS UTILISÉS :
 * - FilesForm: Formulaire en Dialog modal avec prop isOpen et callbacks
 * - Card, CardContent, Button: Composants UI shadcn/ui
 * - Skeleton: Composant de loading state
 * - Table: Composant d'affichage des données
 *
 * LIBS UTILISÉS :
 * - React 19 hooks: useState, useEffect, useCallback, useMemo, JSX
 * - Next.js 15 avec route dynamique et nouvelles API routes
 * - Better Auth: Authentification et gestion des sessions utilisateur
 * - TypeScript strict mode avec interfaces selon types/files.ts
 * - Tailwind CSS: Design moderne responsive
 * - lucide-react: Icons modernes
 * - sonner: Toast notifications pour les actions utilisateur
 *
 * API :
 * - GET /api/files?projectId=xxx : Récupération des métadonnées de fichiers
 * - POST /api/files : Création d'une nouvelle entrée de métadonnées
 * - PUT /api/files/[id] : Mise à jour des métadonnées d'un fichier
 * - DELETE /api/files/[id] : Suppression d'une entrée de métadonnées
 */

"use client";

import React, { JSX, useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  Database,
  Plus,
  Search,
  Filter,
  FileText,
  Package,
  Settings,
  Layers,
  Code2,
  Image,
  Video,
  Archive,
  Paintbrush,
  TestTube,
  File,
  Folder,
  Edit,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/auth-client";
import FilesForm from "@/components/files/FilesForm";
import type { FileMetadata, FilterType, FilesApiResponse } from "@/types/files";

// Props de la page Next.js 15 avec params Promise-based
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FilesPage({ params }: PageProps): JSX.Element {
  // États de la page
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<FilterType>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileMetadata | null>(null);

  // Session Better Auth
  const { data: session, isPending: isPendingSession } = useSession();

  // ✅ Résolution des paramètres Next.js 15
  useEffect(() => {
    params.then((resolvedParams) => {
      console.log("📋 FilesPage - ID du projet depuis URL:", resolvedParams.id);
      setProjectId(resolvedParams.id);
    });
  }, [params]);

  // ✅ Fonction de chargement des fichiers
  const loadFiles = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files?projectId=${projectId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result: FilesApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement");
      }

      setFiles(result.data || []);
      toast.success(`${result.data?.length || 0} fichier(s) chargé(s)`);
    } catch (error) {
      console.error("💥 Erreur chargement fichiers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Chargement automatique
  useEffect(() => {
    if (projectId && !isLoading) {
      loadFiles(projectId);
    }
  }, [projectId, loadFiles, isLoading]);

  // ✅ Filtrage des fichiers
  const filteredFiles = useMemo(() => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== "ALL") {
      filtered = filtered.filter((file) => file.type === selectedType);
    }

    return filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [files, searchTerm, selectedType]);

  // ✅ Handlers
  const handleCreateFile = useCallback(() => {
    setEditingFile(null);
    setIsFormOpen(true);
  }, []);

  const handleEditFile = useCallback((file: FileMetadata) => {
    setEditingFile(file);
    setIsFormOpen(true);
  }, []);

  const handleFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
    if (projectId) {
      loadFiles(projectId);
    }
  }, [projectId, loadFiles]);

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false);
    setEditingFile(null);
  }, []);

  // ✅ Fonction pour obtenir l'icône selon le type
  const getTypeIcon = useCallback(
    (type: string, isFolder: boolean): JSX.Element => {
      if (isFolder) return <Folder className="h-4 w-4 text-blue-600" />;

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
        DESIGN: <Paintbrush className="h-4 w-4 text-rose-600" />,
        TEST: <TestTube className="h-4 w-4 text-emerald-600" />,
        OTHER: <File className="h-4 w-4 text-gray-400" />,
      };
      return iconMap[type] || <File className="h-4 w-4 text-gray-400" />;
    },
    []
  );

  // Gestion des états de chargement et d'erreur
  if (isPendingSession || !projectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Chargement...</h2>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Authentification requise
        </h2>
        <p className="text-gray-600 text-center mt-2">
          Veuillez vous connecter pour accéder au référentiel de fichiers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <Database className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Référentiel de fichiers
                <span className="ml-3 text-base sm:text-lg font-normal text-gray-500">
                  {filteredFiles.length} / {files.length}
                </span>
              </h1>
              <p className="text-sm text-gray-600">
                Métadonnées et références des fichiers du projet
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => projectId && loadFiles(projectId)}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>

          <Button
            onClick={handleCreateFile}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Référencer un fichier
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as FilterType)}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type de fichier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value="PAGE">Pages</SelectItem>
                  <SelectItem value="COMPONENT">Composants</SelectItem>
                  <SelectItem value="UTILS">Utilitaires</SelectItem>
                  <SelectItem value="LIB">Librairies</SelectItem>
                  <SelectItem value="STORE">Stores</SelectItem>
                  <SelectItem value="HOOK">Hooks</SelectItem>
                  <SelectItem value="DOCUMENT">Documents</SelectItem>
                  <SelectItem value="CODE">Code</SelectItem>
                  <SelectItem value="TEST">Tests</SelectItem>
                  <SelectItem value="OTHER">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-800">
                  Erreur de chargement
                </h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Database className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Aucun fichier référencé</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        {getTypeIcon(file.type, file.isFolder)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{file.name}</div>
                          {file.originalName &&
                            file.originalName !== file.name && (
                              <div className="text-sm text-gray-500">
                                Origine: {file.originalName}
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{file.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-xs truncate text-sm text-gray-600">
                          {file.description || "Aucune description"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditFile(file)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Formulaire modal */}
      <FilesForm
        file={editingFile}
        currentFolder={null}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />
    </div>
  );
}
