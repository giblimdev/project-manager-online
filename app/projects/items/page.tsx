// /app/projects/items/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ListIcon,
  GridIcon,
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";

// Import des composants
import { ItemsByType } from "@/components/items/ItemsByType";
import { DisplayView } from "@/components/items/DisplayView";
import { ItemFilter } from "@/components/items/ItemFilter";
import { ItemList } from "@/components/items/ItemList";
import { ItemForm } from "@/components/items/ItemForm";

import type { ViewMode, Item } from "@/types/item";

interface ItemsPageState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  viewMode: ViewMode;
  totalItems: number;
  showItemForm: boolean;
  editingItem: Item | null;
  activeTab: string;
}

const ItemsPage: React.FC = () => {
  const router = useRouter();
  const { data: session, isPending, error: sessionError } = useSession();

  const [state, setState] = useState<ItemsPageState>({
    items: [],
    isLoading: true,
    error: null,
    searchTerm: "",
    viewMode: "list",
    totalItems: 0,
    showItemForm: false,
    editingItem: null,
    activeTab: "by-type",
  });

  // Redirection si pas d'utilisateur connecté
  useEffect(() => {
    if (!isPending && !session?.user) {
      console.log("User not authenticated, redirecting to /");
      router.push("/");
      return;
    }
  }, [session, isPending, router]);

  // Fonction pour charger les items
  const loadItems = async (): Promise<void> => {
    if (!session?.user) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(
        `/api/projects/items?userId=${session.user.id}&limit=100`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load items");
      }

      const items = Array.isArray(data.data) ? data.data : [];

      setState((prev) => ({
        ...prev,
        items,
        isLoading: false,
        error: null,
        totalItems: data.pagination?.total || items.length,
      }));
    } catch (error) {
      console.error("Error loading items:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
        isLoading: false,
        items: [],
      }));
    }
  };

  // Fonction pour filtrer les items
  const getFilteredItems = (): Item[] => {
    if (!Array.isArray(state.items)) return [];

    if (!state.searchTerm) return state.items;

    return state.items.filter(
      (item) =>
        item.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  };

  // Handlers
  const handleAddItem = (): void => {
    setState((prev) => ({
      ...prev,
      showItemForm: true,
      editingItem: null,
    }));
  };

  const handleEditItem = (item: Item): void => {
    setState((prev) => ({
      ...prev,
      showItemForm: true,
      editingItem: item,
    }));
  };

  const handleCloseItemForm = (): void => {
    setState((prev) => ({
      ...prev,
      showItemForm: false,
      editingItem: null,
    }));
  };

  const handleSaveItem = async (itemData: any): Promise<void> => {
    if (!session?.user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const isEditing = state.editingItem !== null;
      const url = isEditing
        ? `/api/projects/items/${state.editingItem!.id}`
        : "/api/projects/items";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...itemData,
        userId: session.user.id,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Erreur lors de la sauvegarde"
        );
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error || "Réponse API non réussie");
      }

      setState((prev) => ({
        ...prev,
        showItemForm: false,
        editingItem: null,
      }));

      await loadItems();
    } catch (error) {
      console.error("Error saving item:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const handleDeleteItem = async (itemId: string): Promise<void> => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet item ?")) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const response = await fetch(`/api/projects/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      await loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Erreur lors de la suppression de l'item");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleReorderItem = async (
    itemId: string,
    direction: "up" | "down"
  ): Promise<void> => {
    // Implémentation du réordonnancement si nécessaire
    console.log("Reorder not implemented yet:", itemId, direction);
  };

  const handleSearchChange = (term: string): void => {
    setState((prev) => ({ ...prev, searchTerm: term }));
  };

  const handleViewModeChange = (mode: ViewMode): void => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  };

  const handleTabChange = (tab: string): void => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  };

  // Chargement initial des items
  useEffect(() => {
    if (!isPending && session?.user) {
      loadItems();
    }
  }, [session, isPending]);

  // Affichage pendant le chargement de la session
  if (isPending) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <RefreshCwIcon className="animate-spin h-6 w-6 mr-2" />
        Vérification de l'authentification...
      </div>
    );
  }

  // Gestion des erreurs de session
  if (sessionError) {
    return (
      <Alert>
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Erreur d'authentification: {sessionError.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Sécurité : ne pas afficher si pas d'utilisateur
  if (!session?.user) {
    return null;
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Items</h1>
          <p className="text-gray-600">
            Items de {session.user.name || session.user.email} (
            {state.totalItems} items)
          </p>
        </div>
        <Button onClick={handleAddItem} disabled={state.isLoading}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvel Item
        </Button>
      </div>

      {/* Onglets de navigation */}
      <Tabs
        value={state.activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="by-type" className="flex items-center gap-2">
            <GridIcon className="h-4 w-4" />
            Vue par Type
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ListIcon className="h-4 w-4" />
            Vue Liste
          </TabsTrigger>
        </TabsList>

        {/* Contenu de l'onglet "Vue par Type" */}
        <TabsContent value="by-type" className="space-y-4">
          <ItemsByType onItemUpdate={loadItems} />
        </TabsContent>

        {/* Contenu de l'onglet "Vue Liste" */}
        <TabsContent value="list" className="space-y-4">
          {/* Barre d'outils */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <ItemFilter
              searchTerm={state.searchTerm}
              onFilterChange={handleSearchChange}
            />
            <DisplayView
              currentView={state.viewMode}
              onViewChange={handleViewModeChange}
            />
          </div>

          {/* Contenu principal */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Items</CardTitle>
            </CardHeader>
            <CardContent>
              {state.isLoading && (
                <div className="flex justify-center items-center p-8">
                  <RefreshCwIcon className="animate-spin h-6 w-6 mr-2" />
                  Chargement des items...
                </div>
              )}

              {state.error && (
                <Alert>
                  <AlertTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Erreur: {state.error}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadItems}
                      className="ml-2"
                    >
                      <RefreshCwIcon className="h-4 w-4 mr-1" />
                      Réessayer
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!state.isLoading && !state.error && (
                <ItemList
                  items={filteredItems}
                  viewMode={state.viewMode}
                  onAdd={handleAddItem}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onReorder={handleReorderItem}
                />
              )}
            </CardContent>
          </Card>

          {/* Footer avec statistiques */}
          {!state.isLoading && !state.error && filteredItems.length > 0 && (
            <div className="text-sm text-gray-600 text-center">
              Affichage de {filteredItems.length} item
              {filteredItems.length > 1 ? "s" : ""}
              {state.searchTerm && ` (filtrés sur "${state.searchTerm}")`}• Vue:{" "}
              {state.viewMode} • Total: {state.totalItems}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Formulaire d'ajout/édition */}
      {state.showItemForm && (
        <ItemForm
          isOpen={state.showItemForm}
          onClose={handleCloseItemForm}
          onSave={handleSaveItem}
          mode={state.editingItem ? "edit" : "create"}
          initialData={state.editingItem}
        />
      )}
    </div>
  );
};

export default ItemsPage;
