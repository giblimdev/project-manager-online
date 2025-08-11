// 📄 /app/glossary/page.tsx
// 🎯 Rôle : Page principale de gestion du glossaire
// 📦 Responsabilités : Affichage, filtrage, pagination, CRUD des termes du glossaire
// 🔧 Composants utilisés : Button, Input, Card, Select, Switch, Badge, Skeleton, Pagination, GlossaryForm de shadcn/ui
// 🌐 API : /api/glossary (GET, POST), /api/glossary/[id] (PUT, DELETE)

"use client";

import { useState, useEffect, useCallback, useMemo, JSX } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import GlossaryForm from "@/components/glossary/GlossaryForm";
import DeleteConfirmation from "@/components/glossary/DeleteConfirmation";
import {
  GlossaryTerm,
  PaginationData,
  GLOSSARY_TERM_TYPES,
  TERM_TYPE_COLORS,
} from "@/types/glossary";

// 🎨 Interface pour l'état des filtres
interface FiltersState {
  search: string;
  type: string;
  isActive: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS = [
  { value: "term", label: "Nom du terme" },
  { value: "order", label: "Ordre" },
  { value: "type", label: "Type" },
  { value: "createdAt", label: "Date de création" },
  { value: "updatedAt", label: "Dernière modification" },
] as const;

export default function GlossaryPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🎨 États principaux
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 20,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    type: "ALL",
    isActive: true,
    sortBy: "order",
    sortOrder: "asc",
  });

  // 🎨 États pour les modals
  const [openForm, setOpenForm] = useState<boolean>(false);
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [viewingTerm, setViewingTerm] = useState<GlossaryTerm | null>(null);

  // 🔄 Initialisation des filtres depuis les paramètres URL
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

  // 📡 Fonction de récupération des termes
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
          icon: <XCircle className="h-4 w-4" />,
        });
        setTerms([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // 🔍 Gestion de la recherche
  const handleSearch = useCallback(() => {
    const queryParams = new URLSearchParams({
      ...filters,
      isActive: filters.isActive.toString(),
      page: "1",
    });

    queryParams.forEach((value, key) => {
      if (!value || value === "ALL") {
        queryParams.delete(key);
      }
    });

    router.push(`/glossary?${queryParams.toString()}`);
  }, [filters, router]);

  // 📄 Gestion changement de page
  const handlePageChange = useCallback(
    (page: number) => {
      const queryParams = new URLSearchParams({
        ...filters,
        isActive: filters.isActive.toString(),
        page: page.toString(),
      });

      queryParams.forEach((value, key) => {
        if (!value || value === "ALL") {
          queryParams.delete(key);
        }
      });

      router.push(`/glossary?${queryParams.toString()}`);
    },
    [filters, router]
  );

  // 🔄 Actualisation manuelle
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTerms({
      ...filters,
      page: pagination.currentPage,
      limit: pagination.pageSize,
    });
  }, [filters, pagination.currentPage, pagination.pageSize, fetchTerms]);

  // ➕ Gestion création terme
  const handleTermCreated = useCallback((newTerm: GlossaryTerm) => {
    setTerms((prevTerms) => [newTerm, ...prevTerms]);
    setOpenForm(false);
    toast.success("Terme créé", {
      description: `Le terme "${newTerm.term}" a été ajouté avec succès`,
      icon: <CheckCircle className="h-4 w-4" />,
    });
  }, []);

  // ✏️ Gestion modification terme
  const handleTermUpdated = useCallback((updatedTerm: GlossaryTerm) => {
    setTerms((prevTerms) =>
      prevTerms.map((term) => (term.id === updatedTerm.id ? updatedTerm : term))
    );
    setOpenForm(false);
    setSelectedTerm(null);
    toast.success("Terme mis à jour", {
      description: `Le terme "${updatedTerm.term}" a été modifié avec succès`,
      icon: <CheckCircle className="h-4 w-4" />,
    });
  }, []);

  // 🗑️ Gestion suppression
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
          icon: <CheckCircle className="h-4 w-4" />,
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
        icon: <XCircle className="h-4 w-4" />,
      });
    } finally {
      setOpenDelete(false);
      setSelectedTerm(null);
    }
  }, [selectedTerm]);

  // 🔄 Reset filtres
  const resetFilters = useCallback(() => {
    const defaultFilters: FiltersState = {
      search: "",
      type: "ALL",
      isActive: true,
      sortBy: "order",
      sortOrder: "asc",
    };

    setFilters(defaultFilters);
    router.push("/glossary");
  }, [router]);

  // 📊 Statistiques calculées
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
    <div className="container mx-auto py-6 lg:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            Glossaire du Projet
          </h1>
          <p className="text-muted-foreground">
            Gérez les termes, acronymes et concepts de votre projet
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>

          <Button
            onClick={() => {
              setSelectedTerm(null);
              setOpenForm(true);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un terme
          </Button>
        </div>
      </div>

      {/* Le reste du composant reste identique... */}
      {/* Statistiques, filtres, résultats, etc. */}

      {/* Modals */}
      <GlossaryForm
        open={openForm}
        onOpenChange={(open) => {
          setOpenForm(open);
          if (!open) setSelectedTerm(null);
        }}
        term={selectedTerm}
        onSuccess={selectedTerm ? handleTermUpdated : handleTermCreated}
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
    </div>
  );
}
