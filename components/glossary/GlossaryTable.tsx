// components/glossary/GlossaryTable.tsx

/**
 * RÔLE : Composant de tableau éditable pour ajout/modification en masse des termes
 * RESPONSABILITÉS :
 * - Affichage des termes existants dans un tableau éditable
 * - Ajout de nouvelles lignes pour saisie multiple
 * - Sauvegarde en masse des modifications
 * - Validation en temps réel des données
 * - Gestion des erreurs et feedback utilisateur
 * - Import/Export CSV pour gestion en masse
 * - Fonctionnalités avancées d'édition (duplication, réorganisation)
 *
 * COMPOSANTS UTILISÉS :
 * - shadcn/ui: Table, Button, Input, Select, Switch, Card, Badge, Dialog
 * - lucide-react: Icons pour l'interface
 * - React hooks pour la gestion d'état
 * - TypeScript strict mode avec interfaces complètes
 * - Intégration avec API endpoints de glossaire
 * - Prisma models: Glossary
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { toast } from "sonner";
import {
  Plus,
  Save,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Edit3,
  Copy,
  Undo,
  X,
  ArrowUp,
  ArrowDown,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  FileText,
  Settings,
  Info,
  Loader2,
} from "lucide-react";

// Types basés sur le schéma Prisma
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

interface EditableGlossaryTerm {
  id?: string; // Optionnel pour les nouveaux termes
  term: string;
  order: number;
  description: string;
  type: string;
  category?: string;
  isActive: boolean;
  isNew?: boolean; // Flag pour identifier les nouveaux termes
  hasChanges?: boolean; // Flag pour identifier les modifications
  errors?: Record<string, string>; // Erreurs de validation
  isSelected?: boolean; // Pour la sélection multiple
}

// Configuration des types avec descriptions enrichies
const GLOSSARY_TERM_TYPES = [
  { value: "TERM", label: "Terme", description: "Définition générale", color: "blue" },
  { value: "ACRONYM", label: "Acronyme", description: "Abréviation", color: "green" },
  { value: "CONCEPT", label: "Concept", description: "Notion abstraite", color: "purple" },
  { value: "TOOL", label: "Outil", description: "Logiciel ou plateforme", color: "orange" },
  { value: "PROCESS", label: "Processus", description: "Méthode ou procédure", color: "teal" },
  { value: "ROLE", label: "Rôle", description: "Fonction ou responsabilité", color: "pink" },
  { value: "METHODOLOGY", label: "Méthodologie", description: "Approche structurée", color: "indigo" },
  { value: "FRAMEWORK", label: "Framework", description: "Cadre de travail", color: "cyan" },
  { value: "TECHNOLOGY", label: "Technologie", description: "Stack technique", color: "yellow" },
] as const;

// Options de tri
const SORT_OPTIONS = [
  { value: "term", label: "Terme" },
  { value: "type", label: "Type" },
  { value: "order", label: "Ordre" },
  { value: "category", label: "Catégorie" },
] as const;

interface GlossaryTableProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (terms: GlossaryTerm[]) => void;
  initialTerms?: GlossaryTerm[];
}

export const GlossaryTable: React.FC<GlossaryTableProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialTerms = [],
}) => {
  // États principaux
  const [terms, setTerms] = useState<EditableGlossaryTerm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");

  // États de filtrage et tri
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortBy, setSortBy] = useState<string>("order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // ✅ Helper pour gérer les CheckedState -> boolean
  const handleCheckedStateChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<boolean>>) => 
    (checked: CheckedState) => {
      setter(checked === true);
    }, 
    []
  );

  // ✅ Filtrage et tri des termes DÉCLARÉ EN PREMIER - avant les callbacks qui l'utilisent
  const filteredAndSortedTerms = useMemo(() => {
    let filtered = terms.filter(term => {
      // Filtrage par recherche
      if (searchTerm && !term.term.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !term.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(term.category || '').toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtrage par type
      if (filterType !== "ALL" && term.type !== filterType) {
        return false;
      }

      // Filtrage par modifications
      if (showOnlyModified && !term.hasChanges) {
        return false;
      }

      // Filtrage par erreurs
      if (showOnlyErrors && Object.keys(term.errors || {}).length === 0) {
        return false;
      }

      return true;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue = (a as any)[sortBy] || '';
      let bValue = (b as any)[sortBy] || '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [terms, searchTerm, filterType, sortBy, sortOrder, showOnlyModified, showOnlyErrors]);

  // Initialisation des termes
  useEffect(() => {
    if (open) {
      const editableTerms: EditableGlossaryTerm[] = initialTerms.map((term) => ({
        id: term.id,
        term: term.term,
        order: term.order,
        description: term.description || "",
        type: term.type,
        category: term.category || "",
        isActive: term.isActive,
        isNew: false,
        hasChanges: false,
        errors: {},
        isSelected: false,
      }));

      // Ajouter quelques lignes vides pour nouveaux termes
      for (let i = 0; i < 5; i++) {
        editableTerms.push(createEmptyTerm(1000 + i * 10));
      }

      setTerms(editableTerms);
      setHasChanges(false);
      setSearchTerm("");
      setFilterType("ALL");
      setSortBy("order");
      setSortOrder("asc");
      setShowOnlyModified(false);
      setShowOnlyErrors(false);
    }
  }, [open, initialTerms]);

  // Créer un terme vide
  const createEmptyTerm = (order: number): EditableGlossaryTerm => ({
    term: "",
    order,
    description: "",
    type: "TERM",
    category: "",
    isActive: true,
    isNew: true,
    hasChanges: false,
    errors: {},
    isSelected: false,
  });

  // Validation d'un terme
  const validateTerm = useCallback((term: EditableGlossaryTerm, allTerms: EditableGlossaryTerm[]): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (term.term.trim()) {
      if (term.term.trim().length < 1) {
        errors.term = "Le terme est obligatoire";
      } else if (term.term.trim().length > 255) {
        errors.term = "Le terme ne peut pas dépasser 255 caractères";
      } else if (!/^[a-zA-ZÀ-ÿ0-9\s\-_\.]+$/.test(term.term.trim())) {
        errors.term = "Caractères non autorisés";
      }

      // Vérifier les doublons
      const duplicates = allTerms.filter(
        t => t.term.trim().toLowerCase() === term.term.trim().toLowerCase() && t !== term
      );
      if (duplicates.length > 0) {
        errors.term = "Ce terme existe déjà";
      }
    }

    if (term.description && term.description.length > 2000) {
      errors.description = "La description ne peut pas dépasser 2000 caractères";
    }

    if (term.order < 0 || term.order > 999999) {
      errors.order = "L'ordre doit être entre 0 et 999999";
    }

    if (term.category && term.category.length > 100) {
      errors.category = "La catégorie ne peut pas dépasser 100 caractères";
    }

    return errors;
  }, []);

  // Mise à jour d'un terme
  const updateTerm = useCallback((index: number, field: keyof EditableGlossaryTerm, value: any) => {
    setTerms((prevTerms) => {
      const newTerms = [...prevTerms];
      const term = { ...newTerms[index] };
      
      (term as any)[field] = value;
      term.hasChanges = true;
      term.errors = validateTerm(term, newTerms);
      
      newTerms[index] = term;
      setHasChanges(true);
      
      return newTerms;
    });
  }, [validateTerm]);

  // Ajouter une nouvelle ligne
  const addNewRow = useCallback(() => {
    const maxOrder = Math.max(...terms.map(t => t.order), 0);
    const newTerm = createEmptyTerm(maxOrder + 10);
    setTerms([...terms, newTerm]);
  }, [terms]);

  // Ajouter plusieurs lignes
  const addMultipleRows = useCallback((count: number) => {
    const maxOrder = Math.max(...terms.map(t => t.order), 0);
    const newTerms = [];
    for (let i = 0; i < count; i++) {
      newTerms.push(createEmptyTerm(maxOrder + 10 + (i * 10)));
    }
    setTerms([...terms, ...newTerms]);
  }, [terms]);

  // Supprimer une ligne
  const removeRow = useCallback((index: number) => {
    setTerms(terms.filter((_, i) => i !== index));
    setHasChanges(true);
  }, [terms]);

  // Supprimer les lignes sélectionnées
  const removeSelectedRows = useCallback(() => {
    const selectedCount = terms.filter(t => t.isSelected).length;
    if (selectedCount === 0) return;

    if (window.confirm(`Supprimer ${selectedCount} ligne(s) sélectionnée(s) ?`)) {
      setTerms(terms.filter(t => !t.isSelected));
      setHasChanges(true);
    }
  }, [terms]);

  // Dupliquer une ligne
  const duplicateRow = useCallback((index: number) => {
    const termToDuplicate = terms[index];
    const newTerm: EditableGlossaryTerm = {
      ...termToDuplicate,
      id: undefined,
      term: termToDuplicate.term ? `${termToDuplicate.term} (copie)` : "",
      order: termToDuplicate.order + 1,
      isNew: true,
      hasChanges: false,
      isSelected: false,
    };
    
    const newTerms = [...terms];
    newTerms.splice(index + 1, 0, newTerm);
    setTerms(newTerms);
    setHasChanges(true);
  }, [terms]);

  // Déplacer une ligne
  const moveRow = useCallback((index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= terms.length) return;

    const newTerms = [...terms];
    [newTerms[index], newTerms[newIndex]] = [newTerms[newIndex], newTerms[index]];
    setTerms(newTerms);
    setHasChanges(true);
  }, [terms]);

  // ✅ Sélection/Désélection - maintenant que filteredAndSortedTerms est déclaré
  const toggleSelectAll = useCallback(() => {
    const allSelected = filteredAndSortedTerms.every(t => t.isSelected);
    setTerms(prevTerms => 
      prevTerms.map(term => ({
        ...term,
        isSelected: filteredAndSortedTerms.includes(term) ? !allSelected : term.isSelected
      }))
    );
  }, [filteredAndSortedTerms]);

  const toggleSelectTerm = useCallback((index: number) => {
    updateTerm(index, 'isSelected', !terms[index].isSelected);
  }, [terms, updateTerm]);

  // Réinitialiser les modifications
  const resetChanges = useCallback(() => {
    if (window.confirm("Annuler toutes les modifications ?")) {
      const editableTerms: EditableGlossaryTerm[] = initialTerms.map((term) => ({
        id: term.id,
        term: term.term,
        order: term.order,
        description: term.description || "",
        type: term.type,
        category: term.category || "",
        isActive: term.isActive,
        isNew: false,
        hasChanges: false,
        errors: {},
        isSelected: false,
      }));

      for (let i = 0; i < 5; i++) {
        editableTerms.push(createEmptyTerm(1000 + i * 10));
      }

      setTerms(editableTerms);
      setHasChanges(false);
    }
  }, [initialTerms]);

  // Sauvegarde en masse - ✅ Corrigée pour utiliser l'API simple
  const handleBulkSave = async () => {
    try {
      setIsLoading(true);

      // Filtrer les termes avec du contenu et valides
      const termsToSave = terms.filter(term => {
        const hasContent = term.term.trim() || term.description.trim();
        const hasNoErrors = Object.keys(term.errors || {}).length === 0;
        return hasContent && hasNoErrors && term.hasChanges;
      });

      if (termsToSave.length === 0) {
        toast.error("Aucune modification à sauvegarder");
        return;
      }

      const results: GlossaryTerm[] = [];

      // Traiter chaque terme individuellement
      for (const term of termsToSave) {
        try {
          if (term.isNew && !term.id) {
            // Créer un nouveau terme
            const response = await fetch('/api/glossary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                term: term.term.trim(),
                description: term.description.trim() || null,
                type: term.type,
                category: term.category?.trim() || null,
                order: term.order,
                isActive: term.isActive,
                metadata: {},
              })
            });

            const result = await response.json();
            if (response.ok && result.success) {
              results.push(result.data);
            }
          } else if (term.id) {
            // Mettre à jour un terme existant
            const response = await fetch(`/api/glossary/${term.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                term: term.term.trim(),
                description: term.description.trim() || null,
                type: term.type,
                category: term.category?.trim() || null,
                order: term.order,
                isActive: term.isActive,
                metadata: {},
              })
            });

            const result = await response.json();
            if (response.ok && result.success) {
              results.push(result.data);
            }
          }
        } catch (error) {
          console.error(`Erreur pour le terme ${term.term}:`, error);
        }
      }

      toast.success("Modifications sauvegardées", {
        description: `${results.length} terme(s) traité(s) avec succès`,
      });

      onSuccess(results);
      onOpenChange(false);

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur de sauvegarde", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Export CSV - maintenant que filteredAndSortedTerms est déclaré
  const exportToCSV = useCallback(() => {
    const visibleTerms = filteredAndSortedTerms.filter(term => term.term.trim());
    const csvContent = [
      ['Terme', 'Description', 'Type', 'Catégorie', 'Ordre', 'Actif'],
      ...visibleTerms.map(term => [
        term.term,
        term.description,
        term.type,
        term.category || '',
        term.order.toString(),
        term.isActive ? 'Oui' : 'Non'
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glossaire_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredAndSortedTerms]);

  // Import CSV
  const handleImportCSV = useCallback(() => {
    if (!csvContent.trim()) {
      toast.error("Veuillez coller le contenu CSV");
      return;
    }

    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      
      const expectedHeaders = ['terme', 'description', 'type', 'catégorie', 'ordre', 'actif'];
      const hasValidHeaders = expectedHeaders.every(h => headers.includes(h));
      
      if (!hasValidHeaders) {
        toast.error("Format CSV invalide. En-têtes attendus: Terme, Description, Type, Catégorie, Ordre, Actif");
        return;
      }

      const maxOrder = Math.max(...terms.map(t => t.order), 0);
      const importedTerms: EditableGlossaryTerm[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length >= 6 && values[0]) {
          const newTerm: EditableGlossaryTerm = {
            term: values[0],
            description: values[1] || "",
            type: GLOSSARY_TERM_TYPES.find(t => t.label === values[2])?.value || "TERM",
            category: values[3] || "",
            order: parseInt(values[4]) || (maxOrder + (i * 10)),
            isActive: values[5].toLowerCase() === 'oui' || values[5].toLowerCase() === 'true',
            isNew: true,
            hasChanges: true,
            errors: {},
            isSelected: false,
          };

          newTerm.errors = validateTerm(newTerm, [...terms, ...importedTerms]);
          importedTerms.push(newTerm);
        }
      }

      if (importedTerms.length > 0) {
        setTerms([...terms, ...importedTerms]);
        setHasChanges(true);
        setImportDialogOpen(false);
        setCsvContent("");
        toast.success(`${importedTerms.length} terme(s) importé(s)`);
      } else {
        toast.error("Aucun terme valide trouvé dans le CSV");
      }

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast.error("Erreur lors de l'import CSV");
    }
  }, [csvContent, terms, validateTerm]);

  if (!open) return null;

  // Statistiques
  const stats = useMemo(() => {
    const changedTermsCount = terms.filter(term => term.hasChanges).length;
    const validTermsCount = terms.filter(term => 
      term.term.trim() && Object.keys(term.errors || {}).length === 0
    ).length;
    const invalidTermsCount = terms.filter(term => 
      term.term.trim() && Object.keys(term.errors || {}).length > 0
    ).length;
    const selectedCount = terms.filter(term => term.isSelected).length;

    return { changedTermsCount, validTermsCount, invalidTermsCount, selectedCount };
  }, [terms]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-7xl h-[95vh] flex flex-col">
          <CardHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6" />
                  Éditeur de glossaire en masse
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Gérez plusieurs termes simultanément dans ce tableau éditable
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Statistiques */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <Badge variant="outline" className="gap-2">
                <Edit3 className="h-4 w-4" />
                {stats.changedTermsCount} modification(s)
              </Badge>
              <Badge variant="outline" className="gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                {stats.validTermsCount} valide(s)
              </Badge>
              {stats.invalidTermsCount > 0 && (
                <Badge variant="outline" className="gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {stats.invalidTermsCount} erreur(s)
                </Badge>
              )}
              {stats.selectedCount > 0 && (
                <Badge variant="secondary" className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {stats.selectedCount} sélectionné(s)
                </Badge>
              )}
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="gap-2"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                {sortOrder === "asc" ? "Croissant" : "Décroissant"}
              </Button>

              {/* ✅ Checkbox corrigée - Modifiés seulement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showModified"
                  checked={showOnlyModified}
                  onCheckedChange={handleCheckedStateChange(setShowOnlyModified)}
                />
                <Label htmlFor="showModified" className="text-sm">
                  Modifiés seulement
                </Label>
              </div>

              {/* ✅ Checkbox corrigée - Erreurs seulement */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showErrors"
                  checked={showOnlyErrors}
                  onCheckedChange={handleCheckedStateChange(setShowOnlyErrors)}
                />
                <Label htmlFor="showErrors" className="text-sm">
                  Erreurs seulement
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button
                onClick={addNewRow}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>

              <Button
                onClick={() => addMultipleRows(10)}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter 10 lignes
              </Button>

              {stats.selectedCount > 0 && (
                <Button
                  onClick={removeSelectedRows}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer sélection
                </Button>
              )}

              <Separator orientation="vertical" className="h-6" />

              <Button
                onClick={exportToCSV}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter CSV
              </Button>

              <Button
                onClick={() => setImportDialogOpen(true)}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer CSV
              </Button>

              <Button
                onClick={resetChanges}
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={!hasChanges}
              >
                <Undo className="h-4 w-4" />
                Réinitialiser
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <Button
                onClick={handleBulkSave}
                size="sm"
                disabled={isLoading || stats.invalidTermsCount > 0 || !hasChanges}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder tout
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      {/* ✅ Checkbox corrigée - Sélection globale */}
                      <Checkbox
                        checked={filteredAndSortedTerms.length > 0 && filteredAndSortedTerms.every(t => t.isSelected)}
                        onCheckedChange={(checked: CheckedState) => {
                          const allSelected = filteredAndSortedTerms.every(t => t.isSelected);
                          setTerms(prevTerms => 
                            prevTerms.map(term => ({
                              ...term,
                              isSelected: filteredAndSortedTerms.includes(term) ? (checked === true) : term.isSelected
                            }))
                          );
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[200px]">Terme *</TableHead>
                    <TableHead className="w-[300px]">Description</TableHead>
                    <TableHead className="w-[130px]">Type</TableHead>
                    <TableHead className="w-[120px]">Catégorie</TableHead>
                    <TableHead className="w-[80px]">Ordre</TableHead>
                    <TableHead className="w-[80px]">Actif</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTerms.map((term, index) => {
                    const originalIndex = terms.findIndex(t => t === term);
                    return (
                      <TableRow 
                        key={`${term.id || 'new'}-${originalIndex}`}
                        className={`
                          ${term.hasChanges ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                          ${term.isNew && term.term.trim() ? 'bg-green-50 dark:bg-green-950/20' : ''}
                          ${Object.keys(term.errors || {}).length > 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}
                          ${term.isSelected ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                        `}
                      >
                        <TableCell>
                          {/* ✅ Checkbox corrigée - Sélection individuelle */}
                          <Checkbox
                            checked={term.isSelected || false}
                            onCheckedChange={(checked: CheckedState) => 
                              updateTerm(originalIndex, 'isSelected', checked === true)
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            value={term.term}
                            onChange={(e) => updateTerm(originalIndex, 'term', e.target.value)}
                            placeholder="Nom du terme..."
                            className={`text-sm ${
                              term.errors?.term ? 'border-red-500' : ''
                            }`}
                          />
                          {term.errors?.term && (
                            <p className="text-xs text-red-500 mt-1">
                              {term.errors.term}
                            </p>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Textarea
                            value={term.description}
                            onChange={(e) => updateTerm(originalIndex, 'description', e.target.value)}
                            placeholder="Description du terme..."
                            className={`text-sm resize-none h-20 ${
                              term.errors?.description ? 'border-red-500' : ''
                            }`}
                            rows={3}
                          />
                          {term.errors?.description && (
                            <p className="text-xs text-red-500 mt-1">
                              {term.errors.description}
                            </p>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Select
                            value={term.type}
                            onValueChange={(value) => updateTerm(originalIndex, 'type', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GLOSSARY_TERM_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full bg-${type.color}-500`} />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            value={term.category || ''}
                            onChange={(e) => updateTerm(originalIndex, 'category', e.target.value)}
                            placeholder="Catégorie..."
                            className={`text-sm ${
                              term.errors?.category ? 'border-red-500' : ''
                            }`}
                          />
                          {term.errors?.category && (
                            <p className="text-xs text-red-500 mt-1">
                              {term.errors.category}
                            </p>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Input
                            type="number"
                            value={term.order}
                            onChange={(e) => updateTerm(originalIndex, 'order', parseInt(e.target.value) || 0)}
                            className={`text-sm ${
                              term.errors?.order ? 'border-red-500' : ''
                            }`}
                            min="0"
                            max="999999"
                          />
                          {term.errors?.order && (
                            <p className="text-xs text-red-500 mt-1">
                              {term.errors.order}
                            </p>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Switch
                            checked={term.isActive}
                            onCheckedChange={(checked: boolean) => updateTerm(originalIndex, 'isActive', checked)}
                          />
                        </TableCell>
                        
                        {/* ✅ CORRECTION ICI - Boutons d'actions */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => moveRow(originalIndex, "up")}
                              disabled={originalIndex === 0}
                              title="Monter"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => moveRow(originalIndex, "down")}
                              disabled={originalIndex === terms.length - 1}
                              title="Descendre"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => duplicateRow(originalIndex)}
                              title="Dupliquer"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              onClick={() => removeRow(originalIndex)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredAndSortedTerms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">
                            {searchTerm || filterType !== "ALL" || showOnlyModified || showOnlyErrors
                              ? "Aucun terme trouvé avec ces filtres"
                              : "Aucun terme à afficher"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Informations de pagination */}
            {filteredAndSortedTerms.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Affichage de {filteredAndSortedTerms.length} terme(s) 
                {(searchTerm || filterType !== "ALL" || showOnlyModified || showOnlyErrors) && 
                  ` sur ${terms.length} total`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'import CSV */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importer des termes depuis un CSV
            </DialogTitle>
            <DialogDescription>
              Collez le contenu de votre fichier CSV ci-dessous. 
              Format attendu : Terme, Description, Type, Catégorie, Ordre, Actif
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvContent">Contenu CSV</Label>
              <Textarea
                id="csvContent"
                placeholder={`Terme,Description,Type,Catégorie,Ordre,Actif
API,Interface de programmation d'application,Acronyme,Technique,100,Oui
Scrum,Méthode agile de gestion de projet,Methodology,Agile,200,Oui`}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Format CSV attendu :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Terme</strong> : Nom du terme (obligatoire)</li>
                    <li><strong>Description</strong> : Description détaillée</li>
                    <li><strong>Type</strong> : Type parmi {GLOSSARY_TERM_TYPES.map(t => t.label).join(', ')}</li>
                    <li><strong>Catégorie</strong> : Catégorie libre</li>
                    <li><strong>Ordre</strong> : Nombre pour le tri</li>
                    <li><strong>Actif</strong> : "Oui"/"Non" ou "true"/"false"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleImportCSV} disabled={!csvContent.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlossaryTable;
