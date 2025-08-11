// 📄 /app/blog/page.tsx
// 🎯 Rôle : Page principale du blog avec affichage des articles et fonctionnalités de recherche
// 📦 Responsabilités : Récupération des articles, filtrage, pagination, gestion des commentaires
// 🔧 Composants utilisés : Card, Button, Input, Select, Badge, Pagination de shadcn/ui, Next.js Image
// 🌐 API : /api/blog/comments (GET), Prisma avec modèles Comment, categories, blog_tags
// 🎨 Design : Interface moderne responsive avec animations et dark mode

"use client";

import { useState, useEffect, useMemo, useCallback, JSX } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  MessageCircle,
  BookOpen,
  Clock,
  Eye,
  ChevronRight,
  Grid3X3,
  List,
  Loader2,
  RefreshCw,
  TrendingUp,
  Star,
  ArrowUpRight,
  Bookmark,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { toast } from "sonner";

// 🔧 Interfaces TypeScript basées sur votre schéma Prisma
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

// 🎨 Configuration des options de tri
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

export default function BlogPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 🎨 États principaux
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 12,
    hasNext: false,
    hasPrev: false,
  });

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

  // 🎨 États pour les options de filtre
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string | null }>
  >([]);
  const [tags, setTags] = useState<
    Array<{ id: string; name: string; color: string | null }>
  >([]);
  const [authors, setAuthors] = useState<
    Array<{ id: string; name: string | null; email: string }>
  >([]);

  // 🔄 Initialisation des filtres depuis l'URL
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

  // 📡 Fonction de récupération des articles du blog
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
    []
  );

  // 🔍 Gestion de la recherche et filtres
  const handleSearch = useCallback(() => {
    const queryParams = new URLSearchParams({
      ...filters,
      page: "1", // Reset à la première page
    });

    queryParams.forEach((value, key) => {
      if (!value || value === "ALL") {
        queryParams.delete(key);
      }
    });

    router.push(`/blog?${queryParams.toString()}`);
  }, [filters, router]);

  // 📄 Gestion changement de page
  const handlePageChange = useCallback(
    (page: number) => {
      const queryParams = new URLSearchParams({
        ...filters,
        page: page.toString(),
      });

      queryParams.forEach((value, key) => {
        if (!value || value === "ALL") {
          queryParams.delete(key);
        }
      });

      router.push(`/blog?${queryParams.toString()}`);
    },
    [filters, router]
  );

  // 🔄 Actualisation manuelle
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBlogPosts({
      ...filters,
      page: pagination.currentPage,
      limit: pagination.pageSize,
    });
  }, [filters, pagination.currentPage, pagination.pageSize, fetchBlogPosts]);

  // 🎯 Calcul des statistiques
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

  // 🎨 Fonction pour formater la date
  const formatDate = (date: Date | string | null): string => {
    if (!date) return "Date inconnue";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // 🎨 Fonction pour obtenir la couleur du statut
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

  return (
    <div className="container mx-auto py-6 lg:py-8 space-y-8">
      {/* 📱 Header avec statistiques */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            Blog du Projet
          </h1>
          <p className="text-muted-foreground text-lg">
            Découvrez les derniers articles, tutoriels et actualités de notre
            équipe
          </p>
        </div>

        {/* 📊 Statistiques rapides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {pagination.totalCount}
                </div>
                <div className="text-xs text-muted-foreground">Articles</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalComments}
                </div>
                <div className="text-xs text-muted-foreground">
                  Commentaires
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.avgReadingTime}
                </div>
                <div className="text-xs text-muted-foreground">Min lecture</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.published}
                </div>
                <div className="text-xs text-muted-foreground">Publiés</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 🔍 Barre de recherche et filtres */}
      <Card className="border-2 border-dashed border-muted hover:border-primary/30 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Recherche et filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Barre de recherche principale */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article par titre ou contenu..."
                  className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  className="transition-all duration-200"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Actualiser
                </Button>

                <Button
                  onClick={handleSearch}
                  className="transition-all duration-200"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Options de filtrage */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.visibility}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, visibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Visibilité" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
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

              <div className="flex items-center gap-2">
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
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  ) : (
                    <ChevronRight className="h-4 w-4 -rotate-90" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Toggle
                  pressed={viewMode === "grid"}
                  onPressedChange={(pressed) =>
                    setViewMode(pressed ? "grid" : "list")
                  }
                  aria-label="Vue en grille"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={viewMode === "list"}
                  onPressedChange={(pressed) =>
                    setViewMode(pressed ? "list" : "grid")
                  }
                  aria-label="Vue en liste"
                >
                  <List className="h-4 w-4" />
                </Toggle>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📋 Contenu principal */}
      <div className="space-y-6">
        {loading ? (
          // 💀 Skeleton de chargement
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          // 📭 État vide
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-6 text-muted-foreground">
              <div className="p-6 bg-muted/30 rounded-full">
                <BookOpen className="h-16 w-16 opacity-50" />
              </div>
              <div className="space-y-3 max-w-md">
                <h3 className="text-xl font-medium text-foreground">
                  Aucun article trouvé
                </h3>
                <p className="text-sm leading-relaxed">
                  Aucun article ne correspond à vos critères de recherche.
                  Essayez de modifier vos filtres ou consultez tous les
                  articles.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: "",
                    status: "PUBLISHED",
                    visibility: "PUBLIC",
                    category: "",
                    tag: "",
                    author: "",
                    sortBy: "publishedAt",
                    sortOrder: "desc",
                  });
                  handleSearch();
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* 📝 Articles */}
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
                  className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/30"
                >
                  {/* Image de l'article */}
                  {post.blogImage && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.blogImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {post.isPinned && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-yellow-500 text-white border-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Épinglé
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <CardContent className="p-6 space-y-4">
                    {/* Titre et statut */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(
                            post.status
                          )} text-xs flex-shrink-0`}
                        >
                          {post.status}
                        </Badge>
                      </div>

                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Métadonnées */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author.name || post.author.email}
                      </div>

                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt || post.createdAt)}
                      </div>

                      {post.readingTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} min
                        </div>
                      )}

                      {post._count?.replies && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post._count.replies}
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
                            style={
                              category.color
                                ? {
                                    backgroundColor: category.color + "20",
                                    color: category.color,
                                  }
                                : {}
                            }
                          >
                            {category.name}
                          </Badge>
                        ))}
                        {post.blog_tags?.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                            style={
                              tag.color
                                ? { borderColor: tag.color, color: tag.color }
                                : {}
                            }
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      <Link href={`/blog/${post.slug || post.id}`}>
                        <Button variant="ghost" size="sm" className="h-8">
                          Lire l'article
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 📄 Pagination */}
            {pagination.totalPages > 1 && (
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage de{" "}
                    {(pagination.currentPage - 1) * pagination.pageSize + 1} à{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.totalCount
                    )}{" "}
                    sur {pagination.totalCount} articles
                  </div>

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
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from({
                        length: Math.min(5, pagination.totalPages),
                      }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={page === pagination.currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

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
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
