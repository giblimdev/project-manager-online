// components/glossary/GlossaryContent.tsx

/**
 * RÔLE : Composant principal du contenu du glossaire avec paramètres de recherche
 * RESPONSABILITÉS :
 * - Gestion des paramètres de recherche et filtres via useSearchParams
 * - CRUD complet des termes du glossaire (individuel et en masse)
 * - Filtrage par type, statut actif/inactif, recherche textuelle
 * - Pagination et tri configurable
 * - Interface responsive avec modals de création/modification/suppression
 * - Réorganisation des termes par glisser-déposer
 * - Modification d'ordre par valeurs numériques
 * - Intégration du tableau d'édition en masse
 *
 * COMPOSANTS UTILISÉS :
 * - useSearchParams, useRouter, usePathname (Next.js 15)
 * - shadcn/ui: Card, Input, Button, Select, Switch, Badge, Pagination, Dialog
 * - lucide-react: Icons pour interface
 * - GlossaryForm, GlossaryTable, DeleteConfirmation pour modals
 * - Types basés sur schema Prisma: Glossary
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
  BookOpen,
  Tag,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Copy,
  ExternalLink,
  FileText,
  ArrowUp,
  ArrowDown,
  Move,
  Hash,
  Save,
  X,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Import des composants personnalisés
import GlossaryForm from "@/components/glossary/GlossaryForm";
import GlossaryTable from "@/components/glossary/GlossaryTable";
import { DeleteConfirmation } from "@/components/glossary/DeleteConfirmation";

// Types basés sur votre schéma Prisma
interface GlossaryTerm {
  id: string;
  term: string;
  order: number;
  description: string | null;
  type: string;
  category?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FiltersState {
  search: string;
  type: string;
  isActive: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
}
// 📄 /app/api/glossary/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1, "Au moins un ID requis"),
});

// 📋 POST - Réorganiser l'ordre des termes
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validation = reorderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderedIds } = validation.data;

    // Mise à jour de l'ordre pour chaque terme
    const updates = orderedIds.map((id, index) =>
      prisma.glossary.update({
        where: { id },
        data: { order: index + 1 },
      })
    );

    await Promise.all(updates);

    return NextResponse.json(
      {
        success: true,
        message: "Ordre mis à jour avec succès",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/glossary/reorder error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la réorganisation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// Configuration des types de termes
const GLOSSARY_TERM_TYPES = [
  { value: "TERM", label: "Terme", description: "Définition générale" },
  { value: "ACRONYM", label: "Acronyme", description: "Abréviation" },
  { value: "CONCEPT", label: "Concept", description: "Notion abstraite" },
  { value: "TOOL", label: "Outil", description: "Logiciel ou plateforme" },
  { value: "PROCESS", label: "Processus", description: "Méthode ou procédure" },
  { value: "ROLE", label: "Rôle", description: "Fonction ou responsabilité" },
  { value: "METHODOLOGY", label: "Méthodologie", description: "Approche structurée" },
  { value: "FRAMEWORK", label: "Framework", description: "Cadre de travail" },
  { value: "TECHNOLOGY", label: "Technologie", description: "Stack technique" },
] as const;

const TERM_TYPE_COLORS = {
  TERM: "bg-blue-100 text-blue-800 border-blue-300",
  ACRONYM: "bg-green-100 text-green-800 border-green-300",
  CONCEPT: "bg-purple-100 text-purple-800 border-purple-300",
  TOOL: "bg-orange-100 text-orange-800 border-orange-300",
  PROCESS: "bg-teal-100 text-teal-800 border-teal-300",
  ROLE: "bg-pink-100 text-pink-800 border-pink-300",
  METHODOLOGY: "bg-indigo-100 text-indigo-800 border-indigo-300",
  FRAMEWORK: "bg-cyan-100 text-cyan-800 border-cyan-300",
  TECHNOLOGY: "bg-yellow-100 text-yellow-800 border-yellow-300",
} as const;

const SORT_OPTIONS = [
  { value: "term", label: "Nom du terme", icon: BookOpen },
  { value: "order", label: "Ordre", icon: Tag },
  { value: "type", label: "Type", icon: Filter },
  { value: "createdAt", label: "Date de création", icon: Calendar },
  { value: "updatedAt", label: "Dernière modification", icon: Calendar },
] as const;

interface GlossaryContentProps {
  initialTerms?: GlossaryTerm[];
}

export const GlossaryContent: React.FC<GlossaryContentProps> = ({
  initialTerms = [],
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // États principaux
  const [terms, setTerms] = useState<GlossaryTerm[]>(initialTerms);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20,
    hasNext: false,
    hasPrev: false,
  });

  // États des filtres
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    type: "ALL",
    isActive: true,
    sortBy: "order",
    sortOrder: "asc",
  });

  // États pour les modals
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openBulkDelete, setOpenBulkDelete] = useState(false);
  const [openOrderEdit, setOpenOrderEdit] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [viewingTerm, setViewingTerm] = useState<GlossaryTerm | null>(null);

  // États pour l'édition en masse
  const [openBulkEdit, setOpenBulkEdit] = useState(false);

  // États pour la sélection multiple et l'ordre
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [tempOrder, setTempOrder] = useState<number>(0);
  const [bulkOrderMode, setBulkOrderMode] = useState(false);

  // Initialisation des filtres depuis l'URL
  useEffect(() => {
    const urlFilters: FiltersState = {
      search: searchParams.get("search") || "",
      type: searchParams.get("type") || "ALL",
      isActive: searchParams.get("isActive") !== "false",
      sortBy: searchParams.get("sortBy") || "order",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "asc",
    };

    setFilters(urlFilters);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("limit") || "20", 10);

    fetchTerms({
      ...urlFilters,
      page: currentPage,
      limit: pageSize,
    });
  }, [searchParams]);

  // Fonction de récupération des termes
  const fetchTerms = useCallback(
    async (params: FiltersState & { page: number; limit: number }) => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          search: params.search,
          type: params.type !== "ALL" ? params.type : "",
          isActive: params.isActive.toString(),
          page: params.page.toString(),
          limit: params.limit.toString(),
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });

        // Supprime les paramètres vides
        queryParams.forEach((value, key) => {
          if (!value || value === "ALL") {
            queryParams.delete(key);
          }
        });

        const response = await fetch(`/api/glossary?${queryParams.toString()}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors du chargement");
        }

        if (result.success && result.data) {
          setTerms(result.data.terms || []);
          setPagination(
            result.data.pagination || {
              totalCount: 0,
              totalPages: 1,
              currentPage: 1,
              pageSize: 20,
              hasNext: false,
              hasPrev: false,
            }
          );
        } else {
          throw new Error("Format de réponse invalide");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des termes:", error);
        toast.error("Erreur de chargement", {
          description:
            error instanceof Error
              ? error.message
              : "Impossible de charger les termes",
        });
        setTerms([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Mise à jour des paramètres URL
  const updateUrlParams = useCallback(
    (newFilters: Partial<FiltersState & { page?: number }>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === "ALL"
        ) {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      // Reset page si on change les filtres (sauf si on change explicitement la page)
      if (!("page" in newFilters) && Object.keys(newFilters).length > 0) {
        params.set("page", "1");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Gestion de la recherche
  const handleSearch = useCallback(() => {
    updateUrlParams(filters);
  }, [filters, updateUrlParams]);

  // Gestion changement de page
  const handlePageChange = useCallback(
    (page: number) => {
      updateUrlParams({ page });
    },
    [updateUrlParams]
  );

  // Actualisation manuelle
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTerms({
      ...filters,
      page: pagination.currentPage,
      limit: pagination.pageSize,
    });
  }, [filters, pagination.currentPage, pagination.pageSize, fetchTerms]);

  // Gestion création terme
  const handleTermCreated = useCallback((newTerm: GlossaryTerm) => {
    setTerms((prevTerms) => [newTerm, ...prevTerms]);
    setOpenForm(false);
    toast.success("Terme créé", {
      description: `Le terme "${newTerm.term}" a été ajouté avec succès`,
    });
  }, []);

  // Gestion modification terme
  const handleTermUpdated = useCallback((updatedTerm: GlossaryTerm) => {
    setTerms((prevTerms) =>
      prevTerms.map((term) => (term.id === updatedTerm.id ? updatedTerm : term))
    );
    setOpenForm(false);
    setSelectedTerm(null);
    toast.success("Terme mis à jour", {
      description: `Le terme "${updatedTerm.term}" a été modifié avec succès`,
    });
  }, []);

  // Gestion de l'édition en masse - NOUVEAU
  const handleBulkEditSuccess = useCallback((updatedTerms: GlossaryTerm[]) => {
    setTerms((prevTerms) => {
      // Fusionner les termes mis à jour avec l'état existant
      const termMap = new Map(prevTerms.map(term => [term.id, term]));
      updatedTerms.forEach(term => {
        termMap.set(term.id, term);
      });
      return Array.from(termMap.values()).sort((a, b) => a.order - b.order);
    });
    setOpenBulkEdit(false);
    toast.success("Édition en masse terminée", {
      description: `${updatedTerms.length} terme(s) traité(s) avec succès`,
    });
  }, []);

  // Gestion suppression unique
  const handleDelete = useCallback(async () => {
    if (!selectedTerm) return;

    try {
      const response = await fetch(`/api/glossary/${selectedTerm.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }

      if (result.success) {
        setTerms((prevTerms) =>
          prevTerms.filter((term) => term.id !== selectedTerm.id)
        );
        toast.success("Terme supprimé", {
          description: `Le terme "${selectedTerm.term}" a été supprimé avec succès`,
        });
      } else {
        throw new Error("Échec de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur de suppression", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le terme",
      });
    } finally {
      setOpenDelete(false);
      setSelectedTerm(null);
    }
  }, [selectedTerm]);

  // Gestion suppression multiple
  const handleBulkDelete = useCallback(async () => {
    if (selectedTerms.size === 0) return;

    try {
      const termIds = Array.from(selectedTerms);
      const response = await fetch("/api/glossary/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ termIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }

      if (result.success) {
        setTerms((prevTerms) =>
          prevTerms.filter((term) => !selectedTerms.has(term.id))
        );
        toast.success("Termes supprimés", {
          description: `${selectedTerms.size} terme(s) supprimé(s) avec succès`,
        });
        setSelectedTerms(new Set());
      } else {
        throw new Error("Échec de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression multiple:", error);
      toast.error("Erreur de suppression", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer les termes",
      });
    } finally {
      setOpenBulkDelete(false);
    }
  }, [selectedTerms]);

  // Modification de l'ordre d'un terme
  const handleUpdateOrder = useCallback(async (termId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/glossary/${termId}/order`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: newOrder }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }

      if (result.success && result.data) {
        setTerms((prevTerms) =>
          prevTerms.map((term) =>
            term.id === termId ? { ...term, order: newOrder } : term
          )
        );
        toast.success("Ordre mis à jour", {
          description: "L'ordre du terme a été modifié avec succès",
        });
      } else {
        throw new Error("Échec de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'ordre:", error);
      toast.error("Erreur de mise à jour", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible de modifier l'ordre",
      });
    }
  }, []);

  // Déplacement rapide de l'ordre
  const handleQuickOrderChange = useCallback(
    async (termId: string, direction: "up" | "down") => {
      const term = terms.find((t) => t.id === termId);
      if (!term) return;

      const newOrder = direction === "up" ? term.order - 1 : term.order + 1;
      if (newOrder < 1) return;

      await handleUpdateOrder(termId, newOrder);
    },
    [terms, handleUpdateOrder]
  );

  // Modification de l'ordre par saisie directe
  const handleDirectOrderEdit = useCallback(
    (termId: string) => {
      const term = terms.find((t) => t.id === termId);
      if (term) {
        setEditingOrder(termId);
        setTempOrder(term.order);
      }
    },
    [terms]
  );

  const saveOrderEdit = useCallback(async () => {
    if (editingOrder && tempOrder > 0) {
      await handleUpdateOrder(editingOrder, tempOrder);
      setEditingOrder(null);
      setTempOrder(0);
    }
  }, [editingOrder, tempOrder, handleUpdateOrder]);

  const cancelOrderEdit = useCallback(() => {
    setEditingOrder(null);
    setTempOrder(0);
  }, []);

  // Gestion sélection multiple
  const handleSelectTerm = useCallback((termId: string) => {
    setSelectedTerms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(termId)) {
        newSet.delete(termId);
      } else {
        newSet.add(termId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTerms.size === terms.length) {
      setSelectedTerms(new Set());
    } else {
      setSelectedTerms(new Set(terms.map((term) => term.id)));
    }
  }, [selectedTerms.size, terms]);

  // Reset filtres
  const resetFilters = useCallback(() => {
    const defaultFilters: FiltersState = {
      search: "",
      type: "ALL",
      isActive: true,
      sortBy: "order",
      sortOrder: "asc",
    };
    setFilters(defaultFilters);
    router.push(pathname);
  }, [router, pathname]);

  // Copier terme dans le presse-papiers
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copié", {
        description: "Le terme a été copié dans le presse-papiers",
      });
    });
  }, []);

  // Statistiques calculées
  const stats = useMemo(() => {
    const activeTerms = terms.filter((term) => term.isActive);
    const inactiveTerms = terms.filter((term) => !term.isActive);
    const typeStats = terms.reduce((acc, term) => {
      acc[term.type] = (acc[term.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: terms.length,
      active: activeTerms.length,
      inactive: inactiveTerms.length,
      byType: typeStats,
    };
  }, [terms]);

  return (
    <div className="space-y-8">
      {/* Statistiques */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {pagination.totalCount}
              </div>
              <div className="text-blue-100">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{stats.active}</div>
              <div className="text-blue-100">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{stats.inactive}</div>
              <div className="text-blue-100">Inactifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {Object.keys(stats.byType).length}
              </div>
              <div className="text-blue-100">Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Recherche et filtres
            </div>
            <div className="flex items-center gap-2">
              {selectedTerms.size > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedTerms.size} sélectionné(s)
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setOpenBulkDelete(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTerms(new Set())}
                  >
                    Désélectionner
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button
                onClick={() => {
                  setSelectedTerm(null);
                  setOpenForm(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un terme
              </Button>
              {/* NOUVEAU : Bouton édition en masse */}
              <Button
                onClick={() => setOpenBulkEdit(true)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Édition en masse
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de recherche principale */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des termes..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Options de filtrage */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Type */}
            <Select
              value={filters.type}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les types</SelectItem>
                {GLOSSARY_TERM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Statut actif */}
            <div className="flex items-center space-x-2 px-3 py-2 border rounded-md">
              <Switch
                id="isActive"
                checked={filters.isActive}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive" className="text-sm">
                Actifs seulement
              </Label>
            </div>

            {/* Tri */}
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                  }))
                }
                title={`Trier par ordre ${
                  filters.sortOrder === "asc" ? "décroissant" : "croissant"
                }`}
              >
                {filters.sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Mode gestion d'ordre */}
            <div className="flex items-center space-x-2 px-3 py-2 border rounded-md">
              <Switch
                id="bulkOrderMode"
                checked={bulkOrderMode}
                onCheckedChange={setBulkOrderMode}
              />
              <Label htmlFor="bulkOrderMode" className="text-sm">
                Gérer ordre
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 md:col-span-2">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="flex-1"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Types populaires */}
          <div>
            <p className="text-sm font-medium mb-3">Types populaires :</p>
            <div className="flex flex-wrap gap-2">
              {GLOSSARY_TERM_TYPES.map((type) => {
                const count = stats.byType[type.value] || 0;
                return (
                  <Badge
                    key={type.value}
                    variant={
                      filters.type === type.value ? "default" : "outline"
                    }
                    className="cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        type: prev.type === type.value ? "ALL" : type.value,
                      }))
                    }
                  >
                    {type.label} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="h-6 bg-gray-200 rounded w-32" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : terms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun terme trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Aucun terme ne correspond à vos critères de recherche. Créez votre
              premier terme ou modifiez vos filtres.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={resetFilters} variant="outline">
                Réinitialiser les filtres
              </Button>
              <Button onClick={() => setOpenForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un terme
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Actions de sélection multiple */}
          {terms.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedTerms.size === terms.length}
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Tout sélectionner
                  </Label>
                </div>
                {selectedTerms.size > 0 && (
                  <Badge variant="secondary">
                    {selectedTerms.size} terme(s) sélectionné(s)
                  </Badge>
                )}
              </div>
              {bulkOrderMode && (
                <div className="text-sm text-muted-foreground">
                  Mode gestion d'ordre activé - Utilisez les contrôles d'ordre
                  sur chaque terme
                </div>
              )}
            </div>
          )}

          {/* Résultats */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Affichage de{" "}
              <span className="font-medium">
                {(pagination.currentPage - 1) * pagination.pageSize + 1} à{" "}
                {Math.min(
                  pagination.currentPage * pagination.pageSize,
                  pagination.totalCount
                )}
              </span>{" "}
              sur <span className="font-medium">{pagination.totalCount}</span>{" "}
              termes
            </p>
          </div>

          {/* Grille des termes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {terms.map((term) => (
              <Card
                key={term.id}
                className={`group hover:shadow-lg transition-all duration-200 ${
                  selectedTerms.has(term.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Checkbox de sélection */}
                      <Checkbox
                        checked={selectedTerms.has(term.id)}
                        onCheckedChange={() => handleSelectTerm(term.id)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold truncate group-hover:text-blue-600 transition-colors">
                          {term.term}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            className={
                              TERM_TYPE_COLORS[
                                term.type as keyof typeof TERM_TYPE_COLORS
                              ] || TERM_TYPE_COLORS.TERM
                            }
                          >
                            {GLOSSARY_TERM_TYPES.find(
                              (t) => t.value === term.type
                            )?.label || term.type}
                          </Badge>
                          {!term.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactif
                            </Badge>
                          )}
                          {/* Affichage de l'ordre */}
                          <div className="flex items-center gap-1">
                            {editingOrder === term.id ? (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                <Input
                                  type="number"
                                  value={tempOrder}
                                  onChange={(e) =>
                                    setTempOrder(parseInt(e.target.value) || 0)
                                  }
                                  className="h-6 w-16 text-xs px-1"
                                  min="1"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") saveOrderEdit();
                                    if (e.key === "Escape") cancelOrderEdit();
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={saveOrderEdit}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={cancelOrderEdit}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer"
                                onClick={() =>
                                  bulkOrderMode && handleDirectOrderEdit(term.id)
                                }
                              >
                                <Hash className="h-3 w-3 mr-1" />
                                {term.order}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingTerm(term)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(term.term)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {bulkOrderMode && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleQuickOrderChange(term.id, "up")
                              }
                            >
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Monter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleQuickOrderChange(term.id, "down")
                              }
                            >
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Descendre
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDirectOrderEdit(term.id)}
                            >
                              <Hash className="h-4 w-4 mr-2" />
                              Modifier ordre
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTerm(term);
                            setOpenForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTerm(term);
                            setOpenDelete(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3rem]">
                    {term.description || "Aucune description disponible"}
                  </p>

                  {/* Métadonnées */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(term.createdAt), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <span>#{term.order}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewingTerm(term)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedTerm(term);
                        setOpenForm(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    {bulkOrderMode && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2"
                          onClick={() =>
                            handleQuickOrderChange(term.id, "up")
                          }
                          title="Monter"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2"
                          onClick={() =>
                            handleQuickOrderChange(term.id, "down")
                          }
                          title="Descendre"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasPrev) {
                          handlePageChange(pagination.currentPage - 1);
                        }
                      }}
                      className={
                        !pagination.hasPrev
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={page === pagination.currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasNext) {
                          handlePageChange(pagination.currentPage + 1);
                        }
                      }}
                      className={
                        !pagination.hasNext
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <GlossaryForm
        open={openForm}
        onOpenChange={(open: boolean | ((prevState: boolean) => boolean)) => {
          setOpenForm(open);
          if (!open) setSelectedTerm(null);
        }}
        term={selectedTerm}
        onSuccess={selectedTerm ? handleTermUpdated : handleTermCreated}
      />

      {/* NOUVEAU : Modal d'édition en masse */}
      <GlossaryTable
        open={openBulkEdit}
        onOpenChange={setOpenBulkEdit}
        onSuccess={handleBulkEditSuccess}
        initialTerms={terms}
      />



      <DeleteConfirmation
        open={openDelete}
        onOpenChange={(open) => {
          setOpenDelete(open);
          if (!open) setSelectedTerm(null);
        }}
        onConfirm={handleDelete}
        title="Supprimer le terme"
        message={
          selectedTerm
            ? `Êtes-vous sûr de vouloir supprimer le terme "${selectedTerm.term}" ? Cette action est irréversible.`
            : ""
        }
      />

      <DeleteConfirmation
        open={openBulkDelete}
        onOpenChange={setOpenBulkDelete}
        onConfirm={handleBulkDelete}
        title="Supprimer les termes sélectionnés"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedTerms.size} terme(s) ? Cette action est irréversible.`}
      />

      {/* Modal de visualisation */}
      {viewingTerm && (
        <Dialog open={!!viewingTerm} onOpenChange={() => setViewingTerm(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                {viewingTerm.term}
                <Badge
                  className={
                    TERM_TYPE_COLORS[
                      viewingTerm.type as keyof typeof TERM_TYPE_COLORS
                    ] || TERM_TYPE_COLORS.TERM
                  }
                >
                  {GLOSSARY_TERM_TYPES.find(
                    (t) => t.value === viewingTerm.type
                  )?.label || viewingTerm.type}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Détails du terme #{viewingTerm.order}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="mt-1 text-sm text-gray-600">
                  {viewingTerm.description || "Aucune description disponible"}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Statut</Label>
                  <p className="flex items-center gap-1 mt-1">
                    {viewingTerm.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {viewingTerm.isActive ? "Actif" : "Inactif"}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Ordre</Label>
                  <p className="mt-1">#{viewingTerm.order}</p>
                </div>
                <div>
                  <Label className="font-medium">Créé le</Label>
                  <p className="mt-1">
                    {format(
                      new Date(viewingTerm.createdAt),
                      "dd MMMM yyyy à HH:mm",
                      { locale: fr }
                    )}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Modifié le</Label>
                  <p className="mt-1">
                    {format(
                      new Date(viewingTerm.updatedAt),
                      "dd MMMM yyyy à HH:mm",
                      { locale: fr }
                    )}
                  </p>
                </div>
              </div>
            </div>




            <DialogFooter className="gap-2">
              <Button
                onClick={() => {
                  setSelectedTerm(viewingTerm);
                  setViewingTerm(null);
                  setOpenForm(true);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(viewingTerm.term)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GlossaryContent;
