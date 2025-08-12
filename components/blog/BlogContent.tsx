// components/blog/BlogContent.tsx

/**
 * RÔLE : Composant principal du contenu du blog avec paramètres de recherche
 * RESPONSABILITÉS :
 * - Gestion des paramètres de recherche et filtres via useSearchParams
 * - Récupération des articles depuis l'API basée sur le modèle Comment
 * - Filtrage par statut, visibilité, catégories et tags
 * - Pagination et tri des articles
 * - Interface responsive avec modes grille/liste
 *
 * COMPOSANTS UTILISÉS :
 * - useSearchParams, useRouter, usePathname (Next.js 15)
 * - shadcn/ui: Card, Input, Button, Select, Badge, Pagination
 * - lucide-react: Icons pour interface
 * - date-fns: Formatage des dates
 * - Types basés sur schema Prisma: Comment, User, categories, blog_tags
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  MessageCircle,
  Clock,
  Eye,
  Grid3X3,
  List,
  RefreshCw,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
  SortAsc,
  SortDesc,
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
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types basés sur votre schéma Prisma
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  slug: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PRIVATE" | "PUBLIC" | "INTERNAL";
  blogImage: string | null;
  readingTime: number | null;
  order: number;
  isPinned: boolean;
  isResolved: boolean;
  publishedAt: Date | null;
  metadata: any;
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    image: string | null;
  };
  replies?: BlogPost[];
  categories?: Array<{
    id: string;
    name: string;
    slug: string | null;
    color?: string | null;
  }>;
  blog_tags?: Array<{
    id: string;
    name: string;
    color: string | null;
  }>;
  _count?: {
    replies: number;
  };
}

interface PaginationData {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterState {
  search: string;
  status: string;
  visibility: string;
  category: string;
  tag: string;
  author: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// Configuration des options
const SORT_OPTIONS = [
  { value: "publishedAt", label: "Date de publication", icon: Calendar },
  { value: "title", label: "Titre alphabétique", icon: BookOpen },
  { value: "readingTime", label: "Temps de lecture", icon: Clock },
  { value: "order", label: "Ordre personnalisé", icon: List },
] as const;

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tous les statuts", color: "default" },
  { value: "PUBLISHED", label: "Publié", color: "success" },
  { value: "DRAFT", label: "Brouillon", color: "warning" },
  { value: "ARCHIVED", label: "Archivé", color: "secondary" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "ALL", label: "Toutes visibilités", color: "default" },
  { value: "PUBLIC", label: "Public", color: "success" },
  { value: "INTERNAL", label: "Interne", color: "warning" },
  { value: "PRIVATE", label: "Privé", color: "destructive" },
] as const;

export const BlogContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // États principaux
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 12,
    hasNext: false,
    hasPrev: false,
  });

  // États pour les filtres
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "PUBLISHED",
    visibility: "PUBLIC",
    category: "",
    tag: "",
    author: "",
    sortBy: "publishedAt",
    sortOrder: "desc",
  });

  // États pour les options de filtre
  const [categories, setCategories] = useState<
    Array<{
      id: string;
      name: string;
      slug: string | null;
      color?: string | null;
    }>
  >([]);

  const [tags, setTags] = useState<
    Array<{
      id: string;
      name: string;
      color: string | null;
    }>
  >([]);

  const [authors, setAuthors] = useState<
    Array<{
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string;
    }>
  >([]);

  // Initialisation des filtres depuis l'URL
  useEffect(() => {
    const urlFilters: FilterState = {
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "PUBLISHED",
      visibility: searchParams.get("visibility") || "PUBLIC",
      category: searchParams.get("category") || "",
      tag: searchParams.get("tag") || "",
      author: searchParams.get("author") || "",
      sortBy: searchParams.get("sortBy") || "publishedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    setFilters(urlFilters);

    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("limit") || "12", 10);

    fetchBlogPosts({
      ...urlFilters,
      page: currentPage,
      limit: pageSize,
    });
  }, [searchParams]);

  // Fonction de récupération des articles
  const fetchBlogPosts = useCallback(
    async (params: FilterState & { page: number; limit: number }) => {
      try {
        setLoading(true);

        const queryParams = new URLSearchParams({
          search: params.search,
          status: params.status !== "ALL" ? params.status : "",
          visibility: params.visibility !== "ALL" ? params.visibility : "",
          page: params.page.toString(),
          limit: params.limit.toString(),
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        });

        // Ajout des filtres optionnels
        if (params.category) queryParams.set("categoryId", params.category);
        if (params.tag) queryParams.set("tagId", params.tag);
        if (params.author) queryParams.set("authorId", params.author);

        // Supprime les paramètres vides
        queryParams.forEach((value, key) => {
          if (!value || value === "ALL") {
            queryParams.delete(key);
          }
        });

        const response = await fetch(
          `/api/blog/comments?${queryParams.toString()}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors du chargement");
        }

        if (result.success && result.data) {
          setPosts(result.data.comments || []);
          setPagination(
            result.data.pagination || {
              totalCount: 0,
              totalPages: 1,
              currentPage: 1,
              pageSize: 12,
              hasNext: false,
              hasPrev: false,
            }
          );

          // Charger les options de filtrage si pas encore fait
          if (categories.length === 0) {
            setCategories(result.data.categories || []);
          }
          if (tags.length === 0) {
            setTags(result.data.tags || []);
          }
          if (authors.length === 0) {
            setAuthors(result.data.authors || []);
          }
        } else {
          throw new Error("Format de réponse invalide");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des articles:", error);
        toast.error("Erreur de chargement", {
          description:
            error instanceof Error
              ? error.message
              : "Impossible de charger les articles",
        });
        setPosts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [categories.length, tags.length, authors.length]
  );

  // Mise à jour des paramètres URL
  const updateUrlParams = useCallback(
    (newFilters: Partial<FilterState & { page?: number }>) => {
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
    fetchBlogPosts({
      ...filters,
      page: pagination.currentPage,
      limit: pagination.pageSize,
    });
  }, [filters, pagination.currentPage, pagination.pageSize, fetchBlogPosts]);

  // Réinitialisation des filtres
  const resetFilters = useCallback(() => {
    const defaultFilters: FilterState = {
      search: "",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      category: "",
      tag: "",
      author: "",
      sortBy: "publishedAt",
      sortOrder: "desc",
    };
    setFilters(defaultFilters);
    updateUrlParams({ ...defaultFilters, page: 1 });
  }, [updateUrlParams]);

  // Fonction utilitaires
  const getAuthorDisplayName = (author: BlogPost["author"]): string => {
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`;
    }
    return author.name || author.email;
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "Date inconnue";
    const d = new Date(date);
    return format(d, "dd MMMM yyyy", { locale: fr });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800 border-green-300";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  // Calcul des statistiques
  const stats = useMemo(() => {
    const published = posts.filter(
      (post) => post.status === "PUBLISHED"
    ).length;
    const drafts = posts.filter((post) => post.status === "DRAFT").length;
    const totalComments = posts.reduce(
      (sum, post) => sum + (post._count?.replies || 0),
      0
    );
    const avgReadingTime =
      posts.length > 0
        ? Math.round(
            posts.reduce((sum, post) => sum + (post.readingTime || 0), 0) /
              posts.length
          )
        : 0;

    return { published, drafts, totalComments, avgReadingTime };
  }, [posts]);

  // Rendu du composant
  return (
    <div className="space-y-8">
      {/* Statistiques et header */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {pagination.totalCount}
              </div>
              <div className="text-blue-100">Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {stats.totalComments}
              </div>
              <div className="text-blue-100">Commentaires</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">
                {stats.avgReadingTime}
              </div>
              <div className="text-blue-100">Min lecture</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{stats.published}</div>
              <div className="text-blue-100">Publiés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Recherche et filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de recherche principale */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des articles..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Options de filtrage */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Statut */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Visibilité */}
            <Select
              value={filters.visibility}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, visibility: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Catégorie */}
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
          </div>

          {/* Mode d'affichage et actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode d'affichage:</span>
              <div className="flex rounded-lg border">
                <Toggle
                  pressed={viewMode === "grid"}
                  onPressedChange={(pressed) =>
                    setViewMode(pressed ? "grid" : "list")
                  }
                  aria-label="Vue en grille"
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={viewMode === "list"}
                  onPressedChange={(pressed) =>
                    setViewMode(pressed ? "list" : "grid")
                  }
                  aria-label="Vue en liste"
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Toggle>
              </div>
            </div>

            <Button variant="outline" onClick={resetFilters}>
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>

          {/* Tags actifs */}
          {tags.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">Tags populaires :</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={filters.tag === tag.id ? "default" : "outline"}
                      className="cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          tag: prev.tag === tag.id ? "" : tag.id,
                        }))
                      }
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Contenu principal */}
      {loading ? (
        <div
          className={`grid gap-6 ${
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun article trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Aucun article ne correspond à vos critères de recherche. Essayez
              de modifier vos filtres ou consultez tous les articles.
            </p>
            <Button onClick={resetFilters}>Réinitialiser les filtres</Button>
          </CardContent>
        </Card>
      ) : (
        <>
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
              articles
            </p>
          </div>

          {/* Grille d'articles */}
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {posts.map((post) => (
              <Card
                key={post.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => router.push(`/blog/${post.slug || post.id}`)}
              >
                {/* Image de l'article */}
                {post.blogImage && (
                  <div className="aspect-video relative overflow-hidden">
                    <Image
                      src={post.blogImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {post.isPinned && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-500 text-white">
                          Épinglé
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </CardTitle>
                    <Badge className={getStatusColor(post.status)}>
                      {post.status}
                    </Badge>
                  </div>

                  {post.excerpt && (
                    <p className="text-gray-600 line-clamp-3 text-sm">
                      {post.excerpt}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Métadonnées */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{getAuthorDisplayName(post.author)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDate(post.publishedAt || post.createdAt)}
                      </span>
                    </div>
                    {post.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readingTime} min</span>
                      </div>
                    )}
                    {post._count?.replies && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{post._count.replies}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags et catégories */}
                  {(post.categories?.length || post.blog_tags?.length) && (
                    <div className="flex flex-wrap gap-2">
                      {post.categories?.map((category) => (
                        <Badge
                          key={category.id}
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: category.color
                              ? `${category.color}20`
                              : undefined,
                            borderColor: category.color || undefined,
                          }}
                        >
                          {category.name}
                        </Badge>
                      ))}
                      {post.blog_tags?.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            color: tag.color || undefined,
                            borderColor: tag.color || undefined,
                          }}
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-between group"
                    >
                      Lire l'article
                      <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const page = i + 1;
                    const isActive = page === pagination.currentPage;

                    return (
                      <Button
                        key={page}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  }
                )}

                {pagination.totalPages > 5 && (
                  <span className="px-2 flex items-center">...</span>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
