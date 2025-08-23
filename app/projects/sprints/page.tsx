// app/projects/sprints/page.tsx
/**
 * Rôle: Page principale de gestion des sprints pour un projet
 * Responsabilités:
 * - Interface CRUD complète pour les sprints
 * - Affichage des sprints en liste/cards responsives
 * - Intégration avec le store Zustand du projet sélectionné
 * - Gestion des états de chargement et d'erreur
 * - Drag & drop pour réorganiser les sprints
 * 
 * Composants utilisés:
 * - shadcn/ui: Button, Card, Dialog, Form, Input, Select, Textarea
 * - lucide-react: Plus, Edit, Trash2, Calendar, Users, Target
 * - React Hook Form avec Zod validation
 * - Date-fns pour formatage des dates
 * - Store Zustand pour l'état global du projet
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar, Users, Target, Edit, Trash2, GripVertical, Clock, BarChart3 } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Store et types
import { useProjectStore } from '@/stores/useSelectedProjectStore';
import { SprintFormDialog } from '@/components/sprints/SprintForm';
import { DeleteSprintDialog } from '@/components/sprints/delete-sprint-dialog';
 
// Types basés sur le schéma Prisma
type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface Sprint {
  id: string;
  name: string;
  order: number;
  goal: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity: number | null;
  velocity: number | null;
  burndownData: Record<string, any> | null;
  retrospective: Record<string, any> | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const SprintsPage: React.FC = () => {
  // État local
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Store Zustand
  const { selectedProjectId, projectData, isHydrated } = useProjectStore();

  // Chargement initial des sprints
  const loadSprints = useCallback(async () => {
    if (!selectedProjectId || !isHydrated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sprints?projectId=${selectedProjectId}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<Sprint[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors du chargement des sprints');
      }

      const sprintsData = result.data || [];
      
      // Normalisation des dates
      const normalizedSprints = sprintsData.map(sprint => ({
        ...sprint,
        startDate: new Date(sprint.startDate),
        endDate: new Date(sprint.endDate),
        createdAt: new Date(sprint.createdAt),
        updatedAt: new Date(sprint.updatedAt),
      }));

      // Tri par ordre puis par date de création
      normalizedSprints.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      setSprints(normalizedSprints);
    } catch (err) {
      console.error('Erreur chargement sprints:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, isHydrated]);

  // Effet pour charger les sprints
  useEffect(() => {
    loadSprints();
  }, [loadSprints]);

  // Création d'un nouveau sprint
  const handleCreateSprint = async (sprintData: Partial<Sprint>) => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sprintData,
          projectId: selectedProjectId,
          order: sprints.length + 1,
        }),
      });

      const result: ApiResponse<Sprint> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      await loadSprints();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Erreur création sprint:', err);
      setError(err instanceof Error ? err.message : 'Erreur création');
    }
  };

  // Modification d'un sprint
  const handleUpdateSprint = async (sprintData: Partial<Sprint>) => {
    if (!selectedSprint) return;

    try {
      const response = await fetch(`/api/sprints/${selectedSprint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sprintData),
      });

      const result: ApiResponse<Sprint> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification');
      }

      await loadSprints();
      setIsFormOpen(false);
      setSelectedSprint(null);
    } catch (err) {
      console.error('Erreur modification sprint:', err);
      setError(err instanceof Error ? err.message : 'Erreur modification');
    }
  };

  // Suppression d'un sprint
  const handleDeleteSprint = async () => {
    if (!selectedSprint) return;

    try {
      const response = await fetch(`/api/sprints/${selectedSprint.id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      await loadSprints();
      setIsDeleteOpen(false);
      setSelectedSprint(null);
    } catch (err) {
      console.error('Erreur suppression sprint:', err);
      setError(err instanceof Error ? err.message : 'Erreur suppression');
    }
  };

  // Modification de l'ordre d'un sprint
  const handleUpdateSprintOrder = async (sprintId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/order`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la réorganisation');
      }

      await loadSprints();
    } catch (err) {
      console.error('Erreur réorganisation:', err);
      setError(err instanceof Error ? err.message : 'Erreur réorganisation');
    }
  };

  // Utilitaires d'affichage
  const getStatusColor = (status: SprintStatus): string => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: SprintStatus): string => {
    switch (status) {
      case 'PLANNED': return 'Planifié';
      case 'ACTIVE': return 'Actif';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  const calculateSprintProgress = (sprint: Sprint): number => {
    if (sprint.status === 'COMPLETED') return 100;
    if (sprint.status === 'CANCELLED') return 0;
    
    const now = new Date();
    const total = differenceInDays(sprint.endDate, sprint.startDate);
    const elapsed = differenceInDays(now, sprint.startDate);
    
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  // Composant Card Sprint
  const SprintCard: React.FC<{ sprint: Sprint }> = ({ sprint }) => {
    const progress = calculateSprintProgress(sprint);
    const daysRemaining = differenceInDays(sprint.endDate, new Date());
    const isOverdue = isAfter(new Date(), sprint.endDate) && sprint.status === 'ACTIVE';

    return (
      <Card className={`transition-all hover:shadow-lg ${isOverdue ? 'border-red-300' : ''}`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-start space-x-3 flex-1">
            <div className="p-1 cursor-grab hover:bg-gray-100 rounded">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{sprint.name}</CardTitle>
              {sprint.goal && (
                <p className="text-sm text-gray-600 mt-1">{sprint.goal}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(sprint.status)}>
              {getStatusLabel(sprint.status)}
            </Badge>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedSprint(sprint);
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sprint.description && (
            <p className="text-sm text-gray-700">{sprint.description}</p>
          )}
          
          {/* Dates et durée */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {format(sprint.startDate, 'dd MMM', { locale: fr })} - {' '}
                {format(sprint.endDate, 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{Math.abs(daysRemaining)} jour{Math.abs(daysRemaining) > 1 ? 's' : ''}</span>
              {isOverdue && <span className="text-red-500 font-medium">(en retard)</span>}
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Capacité</p>
                <p className="font-medium">{sprint.capacity || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Vélocité</p>
                <p className="font-medium">{sprint.velocity || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Affichage conditionnel
  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedProjectId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Aucun projet sélectionné. Veuillez sélectionner un projet pour gérer les sprints.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprints</h1>
          <p className="text-gray-600 mt-1">
            Gérez les sprints de {projectData?.name}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'cards')}>
            <TabsList>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="list">Liste</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsFormOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouveau Sprint</span>
          </Button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contenu principal */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : sprints.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun sprint trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Créez votre premier sprint pour commencer à organiser votre travail.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un Sprint
            </Button>
          </div>
        ) : (
          <Tabs value={viewMode} className="w-full">
            <TabsContent value="cards" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="list" className="space-y-4">
              {/* Vue liste - à implémenter si nécessaire */}
              <div className="space-y-3">
                {sprints.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      <SprintFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sprint={selectedSprint}
        onSubmit={selectedSprint ? handleUpdateSprint : handleCreateSprint}
      />

      <DeleteSprintDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        sprint={selectedSprint}
        onConfirm={handleDeleteSprint}
      />
    </div>
  );
};

export default SprintsPage;
