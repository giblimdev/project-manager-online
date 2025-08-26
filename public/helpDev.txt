//@/app/helpDev/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit, Save, X, Plus, Trash2, FileText, Database, 
  PlusCircle, Eye, EyeOff, Code, Palette, Settings2,
  Navigation, Folder, Layers, ChevronDown, ChevronRight,
  GripVertical, ArrowUp, ArrowDown, Copy, Indent
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface SubElement {
  id?: string;
  label?: string;
  name?: string;
  path?: string;
  description?: string;
  role?: string;
  category?: string;
  usage?: string;
  order?: number;
  [key: string]: any;
}

interface SectionElement {
  id?: string;
  label?: string;
  name?: string;
  path?: string;
  description?: string;
  role?: string;
  category?: string;
  usage?: string;
  order?: number;
  subElements?: SubElement[];
  [key: string]: any;
}

interface Section {
  id: string;
  type: string;
  title: string;
  order: number;
  data: SectionElement[];
}

interface HelpDev {
  id: string;
  titre: string;
  presentationProjet: string | null;
  section: Section[];
  createdAt: Date;
  updatedAt: Date;
}

export default function HelpDevPage() {
  const [helpDevItems, setHelpDevItems] = useState<HelpDev[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<HelpDev | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());
  const [jsonEditMode, setJsonEditMode] = useState<Set<string>>(new Set());
  const [jsonErrors, setJsonErrors] = useState<Map<string, string>>(new Map());
  const [editingElements, setEditingElements] = useState<Set<string>>(new Set());
  const [editingSubElements, setEditingSubElements] = useState<Set<string>>(new Set());

  // États pour créer de nouvelles sections
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionType, setNewSectionType] = useState('custom');

  // États pour l'éditeur JSON global
  const [globalJsonText, setGlobalJsonText] = useState('');
  const [isGlobalJsonEdit, setIsGlobalJsonEdit] = useState(false);
  const [globalJsonError, setGlobalJsonError] = useState('');

  // Refs pour les éditeurs
  const jsonEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchHelpDevData();
  }, []);

  const fetchHelpDevData = async () => {
    try {
      const response = await fetch('/api/helpdev');
      if (response.ok) {
        const data = await response.json();
        setHelpDevItems(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const createDefault = async () => {
    const defaultData = {
      titre: "Guide de Développement",
      presentationProjet: "Cette application Next.js utilise TypeScript et Prisma pour créer une plateforme moderne et performante.",
      section: [
        {
          id: crypto.randomUUID(),
          type: "navigation-public",
          title: "Navigation Publique",
          order: 0,
          data: [
            { 
              id: crypto.randomUUID(),
              label: "Accueil", 
              path: "/", 
              description: "Page d'accueil principale",
              order: 0,
              subElements: []
            },
            { 
              id: crypto.randomUUID(),
              label: "À propos", 
              path: "/about", 
              description: "Informations sur l'entreprise",
              order: 1,
              subElements: []
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch('/api/helpdev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultData),
      });

      if (response.ok) {
        const newItem = await response.json();
        setHelpDevItems([...helpDevItems, newItem]);
        toast.success('Documentation créée');
      }
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setEditingId(null);
      setEditingData(null);
      setJsonEditMode(new Set());
      setJsonErrors(new Map());
      setEditingElements(new Set());
      setEditingSubElements(new Set());
      setIsGlobalJsonEdit(false);
    }
  };

  const startEditing = (item: HelpDev) => {
    setEditingId(item.id);
    setEditingData({ ...item });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
    setNewSectionTitle('');
    setJsonEditMode(new Set());
    setJsonErrors(new Map());
    setEditingElements(new Set());
    setEditingSubElements(new Set());
    setIsGlobalJsonEdit(false);
  };

  const saveChanges = async () => {
    if (!editingData) return;

    try {
      const response = await fetch(`/api/helpdev/${editingData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setHelpDevItems(items => 
          items.map(item => 
            item.id === editingData.id ? updatedItem : item
          )
        );
        toast.success('Modifications sauvegardées');
        cancelEditing();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // === GESTION JSON GLOBAL ===
  const onGlobalJsonClick = () => {
    if (editingData) {
      setGlobalJsonText(JSON.stringify(editingData, null, 2));
      setIsGlobalJsonEdit(true);
      setGlobalJsonError('');
    }
  };

  const onGlobalJsonChange = (val: string) => {
    setGlobalJsonText(val);
    try {
      JSON.parse(val);
      setGlobalJsonError('');
    } catch {
      setGlobalJsonError('JSON invalide');
    }
  };

  const onGlobalJsonSave = async () => {
    if (!editingId) return;
    try {
      const parsed = JSON.parse(globalJsonText);
      const response = await fetch(`/api/helpdev/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (response.ok) {
        const updatedItem = await response.json();
        setHelpDevItems(items => items.map(item => item.id === editingId ? updatedItem : item));
        setEditingData(updatedItem);
        setIsGlobalJsonEdit(false);
        toast.success('JSON sauvegardé');
      } else {
        toast.error('Erreur lors de la sauvegarde JSON');
      }
    } catch (e) {
      setGlobalJsonError('JSON invalide');
      toast.error('JSON invalide');
    }
  };

  // === GESTION DES ÉLÉMENTS INDIVIDUELS ===
  const toggleElementEdit = (elementId: string) => {
    const newEditingElements = new Set(editingElements);
    if (newEditingElements.has(elementId)) {
      newEditingElements.delete(elementId);
    } else {
      newEditingElements.add(elementId);
    }
    setEditingElements(newEditingElements);
  };

  // === GESTION DES SOUS-ÉLÉMENTS ===
  const toggleSubElementEdit = (subElementId: string) => {
    const newEditingSubElements = new Set(editingSubElements);
    if (newEditingSubElements.has(subElementId)) {
      newEditingSubElements.delete(subElementId);
    } else {
      newEditingSubElements.add(subElementId);
    }
    setEditingSubElements(newEditingSubElements);
  };

  const toggleElementExpansion = (elementId: string) => {
    const newExpanded = new Set(expandedElements);
    if (newExpanded.has(elementId)) {
      newExpanded.delete(elementId);
    } else {
      newExpanded.add(elementId);
    }
    setExpandedElements(newExpanded);
  };

  const addNewSubElement = (sectionIndex: number, elementIndex: number) => {
    if (!editingData) return;

    const newSubElement: SubElement = {
      id: crypto.randomUUID(),
      label: "Nouveau sous-élément",
      description: "",
      order: editingData.section[sectionIndex].data[elementIndex].subElements?.length || 0
    };

    const newSections = [...editingData.section];
    const element = newSections[sectionIndex].data[elementIndex];
    
    if (!element.subElements) {
      element.subElements = [];
    }
    
    element.subElements = [...element.subElements, newSubElement];

    setEditingData({
      ...editingData,
      section: newSections
    });

    toast.success('Sous-élément ajouté');
  };

  const updateSubElement = (sectionIndex: number, elementIndex: number, subElementIndex: number, updates: Partial<SubElement>) => {
    if (!editingData) return;

    const newSections = [...editingData.section];
    const element = newSections[sectionIndex].data[elementIndex];
    
    if (element.subElements) {
      element.subElements[subElementIndex] = { ...element.subElements[subElementIndex], ...updates };
    }

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  const removeSubElement = (sectionIndex: number, elementIndex: number, subElementIndex: number) => {
    if (!editingData) return;

    const newSections = [...editingData.section];
    const element = newSections[sectionIndex].data[elementIndex];
    
    if (element.subElements) {
      element.subElements = element.subElements.filter((_, idx) => idx !== subElementIndex);
      // Réorganiser les ordres
      element.subElements.forEach((subItem, index) => {
        subItem.order = index;
      });
    }

    setEditingData({
      ...editingData,
      section: newSections
    });

    toast.success('Sous-élément supprimé');
  };

  const moveSubElementUp = (sectionIndex: number, elementIndex: number, subElementIndex: number) => {
    if (!editingData || subElementIndex === 0) return;

    const newSections = [...editingData.section];
    const element = newSections[sectionIndex].data[elementIndex];
    
    if (element.subElements) {
      const subElements = [...element.subElements];
      [subElements[subElementIndex - 1], subElements[subElementIndex]] = 
      [subElements[subElementIndex], subElements[subElementIndex - 1]];
      
      // Mettre à jour les ordres
      subElements.forEach((subItem, index) => {
        subItem.order = index;
      });

      element.subElements = subElements;
    }

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  const moveSubElementDown = (sectionIndex: number, elementIndex: number, subElementIndex: number) => {
    if (!editingData) return;

    const element = editingData.section[sectionIndex].data[elementIndex];
    if (!element.subElements || subElementIndex === element.subElements.length - 1) return;

    const newSections = [...editingData.section];
    const targetElement = newSections[sectionIndex].data[elementIndex];
    
    if (targetElement.subElements) {
      const subElements = [...targetElement.subElements];
      [subElements[subElementIndex], subElements[subElementIndex + 1]] = 
      [subElements[subElementIndex + 1], subElements[subElementIndex]];
      
      // Mettre à jour les ordres
      subElements.forEach((subItem, index) => {
        subItem.order = index;
      });

      targetElement.subElements = subElements;
    }

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  // === GESTION DES SECTIONS ===
  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const addNewSection = () => {
    if (!editingData || !newSectionTitle.trim()) return;

    const newSection: Section = {
      id: crypto.randomUUID(),
      type: newSectionType,
      title: newSectionTitle.trim(),
      order: editingData.section.length,
      data: []
    };

    setEditingData({
      ...editingData,
      section: [...editingData.section, newSection]
    });

    setNewSectionTitle('');
    toast.success('Section créée');
  };

  const updateSection = (sectionIndex: number, updates: Partial<Section>) => {
    if (!editingData) return;
    
    const newSections = [...editingData.section];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
    
    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  const duplicateSection = (sectionIndex: number) => {
    if (!editingData) return;

    const sectionToDuplicate = editingData.section[sectionIndex];
    const duplicatedSection: Section = {
      ...sectionToDuplicate,
      id: crypto.randomUUID(),
      title: `${sectionToDuplicate.title} (Copie)`,
      order: editingData.section.length,
      data: sectionToDuplicate.data.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        subElements: item.subElements?.map(subItem => ({
          ...subItem,
          id: crypto.randomUUID()
        }))
      }))
    };

    setEditingData({
      ...editingData,
      section: [...editingData.section, duplicatedSection]
    });

    toast.success('Section dupliquée');
  };

  const removeSection = (sectionIndex: number) => {
    if (!editingData) return;
    
    const newSections = editingData.section.filter((_: Section, index: number) => index !== sectionIndex);
    // Réorganiser les ordres
    newSections.forEach((section, index) => {
      section.order = index;
    });

    setEditingData({
      ...editingData,
      section: newSections
    });
    toast.success('Section supprimée');
  };

  const moveSectionUp = (sectionIndex: number) => {
    if (!editingData || sectionIndex === 0) return;

    const newSections = [...editingData.section];
    [newSections[sectionIndex - 1], newSections[sectionIndex]] = 
    [newSections[sectionIndex], newSections[sectionIndex - 1]];
    
    // Mettre à jour les ordres
    newSections.forEach((section, index) => {
      section.order = index;
    });

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  const moveSectionDown = (sectionIndex: number) => {
    if (!editingData || sectionIndex === editingData.section.length - 1) return;

    const newSections = [...editingData.section];
    [newSections[sectionIndex], newSections[sectionIndex + 1]] = 
    [newSections[sectionIndex + 1], newSections[sectionIndex]];
    
    // Mettre à jour les ordres
    newSections.forEach((section, index) => {
      section.order = index;
    });

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  // === GESTION DES ÉLÉMENTS ===
  const addNewElement = (sectionIndex: number) => {
    if (!editingData) return;

    const section = editingData.section[sectionIndex];
    const newElement: SectionElement = {
      id: crypto.randomUUID(),
      label: "Nouvel élément",
      description: "",
      order: section.data.length,
      subElements: []
    };

    const newSections = [...editingData.section];
    newSections[sectionIndex] = {
      ...section,
      data: [...section.data, newElement]
    };

    setEditingData({
      ...editingData,
      section: newSections
    });

    toast.success('Élément ajouté');
  };

  const updateElement = (sectionIndex: number, elementIndex: number, updates: Partial<SectionElement>) => {
    if (!editingData) return;

    const newSections = [...editingData.section];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      data: newSections[sectionIndex].data.map((item, idx) => 
        idx === elementIndex ? { ...item, ...updates } : item
      )
    };

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  const removeElement = (sectionIndex: number, elementIndex: number) => {
    if (!editingData) return;

    const newSections = [...editingData.section];
    const newData = newSections[sectionIndex].data.filter((_, idx) => idx !== elementIndex);
    
    // Réorganiser les ordres
    newData.forEach((item, index) => {
      item.order = index;
    });

    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      data: newData
    };

    setEditingData({
      ...editingData,
      section: newSections
    });

    toast.success('Élément supprimé');
  };

  const moveElementUp = (sectionIndex: number, elementIndex: number) => {
    if (!editingData || elementIndex === 0) return;

    const newSections = [...editingData.section];
    const data = [...newSections[sectionIndex].data];
    [data[elementIndex - 1], data[elementIndex]] = [data[elementIndex], data[elementIndex - 1]];
    
    // Mettre à jour les ordres
    data.forEach((item, index) => {
      item.order = index;
    });

    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      data
    };

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  const moveElementDown = (sectionIndex: number, elementIndex: number) => {
    if (!editingData) return;

    const section = editingData.section[sectionIndex];
    if (elementIndex === section.data.length - 1) return;

    const newSections = [...editingData.section];
    const data = [...section.data];
    [data[elementIndex], data[elementIndex + 1]] = [data[elementIndex + 1], data[elementIndex]];
    
    // Mettre à jour les ordres
    data.forEach((item, index) => {
      item.order = index;
    });

    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      data
    };

    setEditingData({
      ...editingData,
      section: newSections
    });
  };

  // === GESTION JSON ===
  const toggleJsonEdit = (sectionId: string) => {
    const newJsonEdit = new Set(jsonEditMode);
    if (newJsonEdit.has(sectionId)) {
      newJsonEdit.delete(sectionId);
    } else {
      newJsonEdit.add(sectionId);
    }
    setJsonEditMode(newJsonEdit);
    
    const newErrors = new Map(jsonErrors);
    newErrors.delete(sectionId);
    setJsonErrors(newErrors);
  };

  const updateSectionFromJson = (sectionIndex: number, jsonString: string) => {
    if (!editingData) return;

    try {
      const parsedData = JSON.parse(jsonString);
      const newSections = [...editingData.section];
      newSections[sectionIndex] = { 
        ...newSections[sectionIndex], 
        data: parsedData 
      };
      
      setEditingData({
        ...editingData,
        section: newSections
      });

      const newErrors = new Map(jsonErrors);
      newErrors.delete(newSections[sectionIndex].id);
      setJsonErrors(newErrors);

      toast.success('Section mise à jour depuis JSON');
    } catch (error) {
      const newErrors = new Map(jsonErrors);
      newErrors.set(editingData.section[sectionIndex].id, 'JSON invalide');
      setJsonErrors(newErrors);
      toast.error('JSON invalide');
    }
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'navigation-public':
      case 'navigation-metier':
        return <Navigation className="h-4 w-4" />;
      case 'files':
        return <Folder className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'navigation-public':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'navigation-metier':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
      case 'files':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (helpDevItems.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Database className="h-20 w-20 mx-auto text-muted-foreground" />
            <h1 className="text-4xl font-bold">Aide Développeur</h1>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">
              Aucune documentation n'est encore configurée. Créez votre première documentation pour commencer.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button onClick={createDefault} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Créer une documentation exemple
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="text-center flex-1">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Aide Développeur
          </h1>
          <p className="text-xl text-muted-foreground">
            Documentation et guides de développement
          </p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            onClick={toggleEditMode} 
            variant={isEditMode ? "default" : "outline"}
            size="lg"
            className="gap-2 shadow-lg"
          >
            {isEditMode ? (
              <>
                <Eye className="h-5 w-5" />
                Mode Lecture
              </>
            ) : (
              <>
                <Edit className="h-5 w-5" />
                Mode Édition
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      <div className="grid gap-8">
        {helpDevItems.map((item, itemIndex) => {
          const isEditing = editingId === item.id && isEditMode;
          const displayData = isEditing && editingData ? editingData : item;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: itemIndex * 0.1 }}
            >
              <Card className="w-full shadow-xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={editingData?.titre || ''}
                          onChange={(e) => setEditingData(prev => 
                            prev ? { ...prev, titre: e.target.value } : null
                          )}
                          className="text-3xl font-bold mb-2 border-none bg-transparent p-0"
                          placeholder="Titre du guide"
                        />
                      ) : (
                        <CardTitle className="text-3xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                          {displayData.titre}
                        </CardTitle>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="px-3 py-1">
                        {displayData.section.length} section{displayData.section.length > 1 ? 's' : ''}
                      </Badge>
                      
                      {isEditMode && (
                        <AnimatePresence mode="wait">
                          {isEditing ? (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex gap-2"
                            >
                              <Button onClick={saveChanges} size="sm" className="gap-2">
                                <Save className="h-4 w-4" />
                                Sauvegarder
                              </Button>
                              <Button onClick={cancelEditing} size="sm" variant="outline" className="gap-2">
                                <X className="h-4 w-4" />
                                Annuler
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Button onClick={() => startEditing(item)} size="sm" variant="outline" className="gap-2">
                                <Edit className="h-4 w-4" />
                                Éditer
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    Guide de développement • Dernière mise à jour: {new Date(item.updatedAt).toLocaleDateString('fr-FR')}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">

                  {/* Sections */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Settings2 className="h-5 w-5 text-blue-600" />
                      </div>
                      Sections de Documentation
                    </h3>

                    {displayData.section.map((section: Section, sectionIndex: number) => {
                      const sectionId = section.id;
                      const isExpanded = expandedSections.has(sectionId);
                      const isJsonEdit = jsonEditMode.has(sectionId);
                      const hasJsonError = jsonErrors.has(sectionId);

                      return (
                        <motion.div
                          key={sectionId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: sectionIndex * 0.1 }}
                          className={`border-2 rounded-xl p-6 ${getSectionColor(section.type)} transition-all duration-300 hover:shadow-lg`}
                        >
                          {/* Header de section */}
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => toggleSectionExpansion(sectionId)}
                              className="flex items-center gap-3 text-left flex-1 hover:opacity-80 transition-opacity"
                            >
                              {isExpanded ? 
                                <ChevronDown className="h-5 w-5" /> : 
                                <ChevronRight className="h-5 w-5" />
                              }
                              <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
                                {getSectionIcon(section.type)}
                              </div>
                              <div className="flex-1">
                                {isEditing ? (
                                  <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                                    className="text-lg font-semibold bg-transparent border-none p-0"
                                  />
                                ) : (
                                  <>
                                    <h4 className="text-lg font-semibold">{section.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {section.data?.length || 0} élément{(section.data?.length || 0) > 1 ? 's' : ''}
                                    </p>
                                  </>
                                )}
                              </div>
                            </button>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="px-3 py-1">
                                {section.type}
                              </Badge>
                              
                              {isEditing && (
                                <>
                                  {/* Réorganiser sections */}
                                  <Button
                                    onClick={() => moveSectionUp(sectionIndex)}
                                    size="sm"
                                    variant="ghost"
                                    disabled={sectionIndex === 0}
                                    title="Monter"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => moveSectionDown(sectionIndex)}
                                    size="sm"
                                    variant="ghost"
                                    disabled={sectionIndex === displayData.section.length - 1}
                                    title="Descendre"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                  
                                  <Button
                                    onClick={() => duplicateSection(sectionIndex)}
                                    size="sm"
                                    variant="ghost"
                                    title="Dupliquer"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => toggleJsonEdit(sectionId)}
                                    size="sm"
                                    variant={isJsonEdit ? "default" : "ghost"}
                                    title="Éditer JSON"
                                  >
                                    <Code className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => removeSection(sectionIndex)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Contenu de section */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                              >
                                {/* Éditeur JSON */}
                                {isEditing && isJsonEdit && (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Code className="h-4 w-4" />
                                      <span className="font-medium">Éditeur JSON</span>
                                      {hasJsonError && (
                                        <Badge variant="destructive" className="text-xs">
                                          {jsonErrors.get(sectionId)}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="relative">
                                      <Textarea
                                        ref={jsonEditorRef}
                                        defaultValue={JSON.stringify(section.data, null, 2)}
                                        onChange={(e) => {
                                          try {
                                            JSON.parse(e.target.value);
                                            const newErrors = new Map(jsonErrors);
                                            newErrors.delete(sectionId);
                                            setJsonErrors(newErrors);
                                          } catch {
                                            const newErrors = new Map(jsonErrors);
                                            newErrors.set(sectionId, 'JSON invalide');
                                            setJsonErrors(newErrors);
                                          }
                                        }}
                                        className={`min-h-[200px] font-mono text-sm ${hasJsonError ? 'border-destructive' : ''}`}
                                        placeholder="Entrez le JSON pour cette section..."
                                      />
                                      <Button
                                        onClick={() => {
                                          const value = jsonEditorRef.current?.value;
                                          if (value) {
                                            updateSectionFromJson(sectionIndex, value);
                                          }
                                        }}
                                        size="sm"
                                        className="absolute bottom-2 right-2"
                                        disabled={hasJsonError}
                                      >
                                        <Save className="h-3 w-3 mr-1" />
                                        Appliquer
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Affichage/Édition des éléments */}
                                {!isJsonEdit && (
                                  <div className="space-y-3">
                                    {section.data && section.data.length > 0 ? (
                                      section.data.map((item: SectionElement, itemIndex: number) => {
                                        const elementId = item.id || `${sectionId}-${itemIndex}`;
                                        const isElementEditing = editingElements.has(elementId);
                                        const isElementExpanded = expandedElements.has(elementId);

                                        return (
                                          <motion.div
                                            key={elementId}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: itemIndex * 0.05 }}
                                            className="bg-white/70 dark:bg-black/20 p-4 rounded-lg border border-white/50 dark:border-gray-700/50"
                                          >
                                            {(isEditing && isElementEditing) ? (
                                              // Mode édition élément individuel
                                              <div className="space-y-3">
                                                {/* Contrôles d'ordre et suppression */}
                                                <div className="flex justify-between items-start">
                                                  <div className="flex items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                                    <span className="text-xs text-muted-foreground">#{itemIndex + 1}</span>
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button
                                                      onClick={() => moveElementUp(sectionIndex, itemIndex)}
                                                      size="sm"
                                                      variant="ghost"
                                                      disabled={itemIndex === 0}
                                                      className="h-6 w-6 p-0"
                                                    >
                                                      <ArrowUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      onClick={() => moveElementDown(sectionIndex, itemIndex)}
                                                      size="sm"
                                                      variant="ghost"
                                                      disabled={itemIndex === section.data.length - 1}
                                                      className="h-6 w-6 p-0"
                                                    >
                                                      <ArrowDown className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      onClick={() => removeElement(sectionIndex, itemIndex)}
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>

                                                {/* Champs d'édition */}
                                                <div className="grid grid-cols-2 gap-3">
                                                  <div>
                                                    <label className="text-xs font-medium text-muted-foreground">Label/Nom</label>
                                                    <Input
                                                      value={item.label || item.name || ''}
                                                      onChange={(e) => updateElement(sectionIndex, itemIndex, { 
                                                        label: e.target.value,
                                                        name: e.target.value 
                                                      })}
                                                      className="mt-1"
                                                      placeholder="Nom de l'élément"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="text-xs font-medium text-muted-foreground">Chemin/URL</label>
                                                    <Input
                                                      value={item.path || ''}
                                                      onChange={(e) => updateElement(sectionIndex, itemIndex, { path: e.target.value })}
                                                      className="mt-1"
                                                      placeholder="/chemin"
                                                    />
                                                  </div>
                                                </div>

                                                <div>
                                                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                                                  <Input
                                                    value={item.description || ''}
                                                    onChange={(e) => updateElement(sectionIndex, itemIndex, { description: e.target.value })}
                                                    className="mt-1"
                                                    placeholder="Description de l'élément"
                                                  />
                                                </div>

                                                {item.role !== undefined && (
                                                  <div>
                                                    <label className="text-xs font-medium text-muted-foreground">Rôle</label>
                                                    <Input
                                                      value={item.role || ''}
                                                      onChange={(e) => updateElement(sectionIndex, itemIndex, { role: e.target.value })}
                                                      className="mt-1"
                                                      placeholder="Rôle du composant"
                                                    />
                                                  </div>
                                                )}

                                                {item.usage !== undefined && (
                                                  <div>
                                                    <label className="text-xs font-medium text-muted-foreground">Usage</label>
                                                    <Textarea
                                                      value={item.usage || ''}
                                                      onChange={(e) => updateElement(sectionIndex, itemIndex, { usage: e.target.value })}
                                                      className="mt-1 font-mono text-xs"
                                                      placeholder="Code d'exemple"
                                                    />
                                                  </div>
                                                )}

                                                {item.category !== undefined && (
                                                  <div>
                                                    <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                                                    <Input
                                                      value={item.category || ''}
                                                      onChange={(e) => updateElement(sectionIndex, itemIndex, { category: e.target.value })}
                                                      className="mt-1"
                                                      placeholder="component, utils, etc."
                                                    />
                                                  </div>
                                                )}

                                                {/* Boutons de contrôle */}
                                                <div className="flex gap-2 pt-2 border-t">
                                                  <Button
                                                    onClick={() => toggleElementEdit(elementId)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1"
                                                  >
                                                    <Save className="h-3 w-3" />
                                                    Terminer
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              // Mode lecture avec bouton éditer et sous-éléments
                                              <div className="space-y-2">
                                                <div className="flex justify-between items-start">
                                                  <div className="flex items-center gap-2">
                                                    {item.subElements && item.subElements.length > 0 && (
                                                      <button
                                                        onClick={() => toggleElementExpansion(elementId)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                                      >
                                                        {isElementExpanded ? 
                                                          <ChevronDown className="h-3 w-3" /> : 
                                                          <ChevronRight className="h-3 w-3" />
                                                        }
                                                      </button>
                                                    )}
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                      {item.label || item.name || 'Element'}
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-1">
                                                    {isEditing && (
                                                      <>
                                                        <Button
                                                          onClick={() => addNewSubElement(sectionIndex, itemIndex)}
                                                          size="sm"
                                                          variant="ghost"
                                                          className="gap-1 h-6 px-2"
                                                          title="Ajouter sous-élément"
                                                        >
                                                          <Indent className="h-3 w-3" />
                                                          <Plus className="h-2 w-2" />
                                                        </Button>
                                                        <Button
                                                          onClick={() => toggleElementEdit(elementId)}
                                                          size="sm"
                                                          variant="ghost"
                                                          className="gap-1 h-6 px-2"
                                                        >
                                                          <Edit className="h-3 w-3" />
                                                          Éditer
                                                        </Button>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                  {item.path && (
                                                    <code className="bg-muted px-2 py-1 rounded text-xs">
                                                      {item.path}
                                                    </code>
                                                  )}
                                                </div>
                                                {item.description && (
                                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {item.description}
                                                  </p>
                                                )}
                                                {item.role && (
                                                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                    {item.role}
                                                  </p>
                                                )}
                                                {item.category && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {item.category}
                                                  </Badge>
                                                )}
                                                {item.usage && (
                                                  <div className="mt-3">
                                                    <p className="text-xs font-medium text-muted-foreground mb-1">Usage:</p>
                                                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded border overflow-x-auto">
                                                      {item.usage}
                                                    </pre>
                                                  </div>
                                                )}

                                                {/* Sous-éléments */}
                                                <AnimatePresence>
                                                  {isElementExpanded && item.subElements && item.subElements.length > 0 && (
                                                    <motion.div
                                                      initial={{ opacity: 0, height: 0 }}
                                                      animate={{ opacity: 1, height: "auto" }}
                                                      exit={{ opacity: 0, height: 0 }}
                                                      transition={{ duration: 0.2 }}
                                                      className="ml-6 mt-3 space-y-2 border-l-2 border-dashed border-gray-300 pl-4"
                                                    >
                                                      {item.subElements.map((subItem: SubElement, subItemIndex: number) => {
                                                        const subElementId = subItem.id || `${elementId}-sub-${subItemIndex}`;
                                                        const isSubElementEditing = editingSubElements.has(subElementId);

                                                        return (
                                                          <motion.div
                                                            key={subElementId}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: subItemIndex * 0.05 }}
                                                            className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded border"
                                                          >
                                                            {(isEditing && isSubElementEditing) ? (
                                                              // Mode édition sous-élément
                                                              <div className="space-y-2">
                                                                <div className="flex justify-between items-start">
                                                                  <div className="flex items-center gap-2">
                                                                    <Indent className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-xs text-muted-foreground">#{subItemIndex + 1}</span>
                                                                  </div>
                                                                  <div className="flex gap-1">
                                                                    <Button
                                                                      onClick={() => moveSubElementUp(sectionIndex, itemIndex, subItemIndex)}
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      disabled={subItemIndex === 0}
                                                                      className="h-5 w-5 p-0"
                                                                    >
                                                                      <ArrowUp className="h-2 w-2" />
                                                                    </Button>
                                                                    <Button
                                                                      onClick={() => moveSubElementDown(sectionIndex, itemIndex, subItemIndex)}
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      disabled={subItemIndex === item.subElements!.length - 1}
                                                                      className="h-5 w-5 p-0"
                                                                    >
                                                                      <ArrowDown className="h-2 w-2" />
                                                                    </Button>
                                                                    <Button
                                                                      onClick={() => removeSubElement(sectionIndex, itemIndex, subItemIndex)}
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                                                                    >
                                                                      <Trash2 className="h-2 w-2" />
                                                                    </Button>
                                                                  </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2">
                                                                  <div>
                                                                    <label className="text-xs font-medium text-muted-foreground">Nom</label>
                                                                    <Input
                                                                      value={subItem.label || subItem.name || ''}
                                                                      onChange={(e) => updateSubElement(sectionIndex, itemIndex, subItemIndex, { 
                                                                        label: e.target.value,
                                                                        name: e.target.value 
                                                                      })}
                                                                      className="mt-1 text-xs"
                                                                      placeholder="Nom du sous-élément"
                                                                    />
                                                                  </div>
                                                                  <div>
                                                                    <label className="text-xs font-medium text-muted-foreground">Chemin</label>
                                                                    <Input
                                                                      value={subItem.path || ''}
                                                                      onChange={(e) => updateSubElement(sectionIndex, itemIndex, subItemIndex, { path: e.target.value })}
                                                                      className="mt-1 text-xs"
                                                                      placeholder="/chemin"
                                                                    />
                                                                  </div>
                                                                </div>

                                                                <div>
                                                                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                                                                  <Input
                                                                    value={subItem.description || ''}
                                                                    onChange={(e) => updateSubElement(sectionIndex, itemIndex, subItemIndex, { description: e.target.value })}
                                                                    className="mt-1 text-xs"
                                                                    placeholder="Description du sous-élément"
                                                                  />
                                                                </div>

                                                                <div className="flex gap-2 pt-1">
                                                                  <Button
                                                                    onClick={() => toggleSubElementEdit(subElementId)}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-1 h-6 text-xs"
                                                                  >
                                                                    <Save className="h-2 w-2" />
                                                                    OK
                                                                  </Button>
                                                                </div>
                                                              </div>
                                                            ) : (
                                                              // Mode lecture sous-élément
                                                              <div className="space-y-1">
                                                                <div className="flex justify-between items-start">
                                                                  <div className="flex items-center gap-2">
                                                                    <Indent className="h-3 w-3 text-muted-foreground" />
                                                                    <div className="text-sm font-medium">
                                                                      {subItem.label || subItem.name || 'Sous-élément'}
                                                                    </div>
                                                                  </div>
                                                                  {isEditing && (
                                                                    <Button
                                                                      onClick={() => toggleSubElementEdit(subElementId)}
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="gap-1 h-5 px-1"
                                                                    >
                                                                      <Edit className="h-2 w-2" />
                                                                    </Button>
                                                                  )}
                                                                </div>
                                                                {subItem.path && (
                                                                  <div className="text-xs text-muted-foreground">
                                                                    <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                                                      {subItem.path}
                                                                    </code>
                                                                  </div>
                                                                )}
                                                                {subItem.description && (
                                                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                    {subItem.description}
                                                                  </p>
                                                                )}
                                                              </div>
                                                            )}
                                                          </motion.div>
                                                        );
                                                      })}
                                                      
                                                      {/* Bouton ajouter sous-élément */}
                                                      {isEditing && (
                                                        <Button
                                                          onClick={() => addNewSubElement(sectionIndex, itemIndex)}
                                                          size="sm"
                                                          variant="outline"
                                                          className="w-full gap-1 h-6 text-xs"
                                                        >
                                                          <Plus className="h-3 w-3" />
                                                          Ajouter un sous-élément
                                                        </Button>
                                                      )}
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                            )}
                                          </motion.div>
                                        );
                                      })
                                    ) : (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Section vide</p>
                                        {isEditing && (
                                          <Button
                                            onClick={() => addNewElement(sectionIndex)}
                                            size="sm"
                                            variant="ghost"
                                            className="mt-2 gap-1"
                                          >
                                            <Plus className="h-3 w-3" />
                                            Ajouter un élément
                                          </Button>
                                        )}
                                      </div>
                                    )}

                                    {/* Bouton ajouter élément */}
                                    {isEditing && section.data.length > 0 && (
                                      <div className="pt-4 border-t border-dashed">
                                        <Button
                                          onClick={() => addNewElement(sectionIndex)}
                                          size="sm"
                                          variant="outline"
                                          className="w-full gap-2"
                                        >
                                          <Plus className="h-4 w-4" />
                                          Ajouter un élément
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}

                    {/* Ajouter une nouvelle section */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/20">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <PlusCircle className="h-5 w-5" />
                              Ajouter une nouvelle section
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">Type de section</label>
                                <Select value={newSectionType} onValueChange={setNewSectionType}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="navigation-public">
                                      <div className="flex items-center gap-2">
                                        <Navigation className="h-4 w-4" />
                                        Navigation Public
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="navigation-metier">
                                      <div className="flex items-center gap-2">
                                        <Settings2 className="h-4 w-4" />
                                        Navigation Métier
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="files">
                                      <div className="flex items-center gap-2">
                                        <Folder className="h-4 w-4" />
                                        Fichiers
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="custom">
                                      <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4" />
                                        Personnalisée
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Titre de la section</label>
                                <Input
                                  value={newSectionTitle}
                                  onChange={(e) => setNewSectionTitle(e.target.value)}
                                  placeholder="Titre de la section..."
                                />
                              </div>
                            </div>
                            
                            <Button
                              onClick={addNewSection}
                              disabled={!newSectionTitle.trim()}
                              className="w-full gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Créer la section
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Section JSON Global */}
      {isEditMode && editingData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <Card className="border-2 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                  <Code className="h-5 w-5 text-orange-600" />
                </div>
                JSON de la page complète
              </CardTitle>
              <CardDescription>
                Éditez directement la structure JSON complète de la page pour des modifications avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isGlobalJsonEdit ? (
                <div className="space-y-4">
                  <Button 
                    onClick={onGlobalJsonClick} 
                    variant="secondary" 
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Éditer le JSON complet
                  </Button>
                  <div className="bg-muted border rounded-lg p-4 whitespace-pre-wrap font-mono text-xs select-text overflow-auto max-h-[400px]">
                    {JSON.stringify(editingData, null, 2)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    value={globalJsonText}
                    onChange={(e) => onGlobalJsonChange(e.target.value)}
                    rows={20}
                    className={`font-mono text-xs resize-none ${globalJsonError ? 'border-destructive' : ''}`}
                    spellCheck={false}
                    autoFocus
                  />
                  {globalJsonError && (
                    <div className="text-destructive text-sm flex items-center gap-2">
                      <X className="h-4 w-4" />
                      {globalJsonError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={onGlobalJsonSave}
                      disabled={!!globalJsonError}
                      variant="default"
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Sauvegarder JSON
                    </Button>
                    <Button
                      onClick={() => setIsGlobalJsonEdit(false)}
                      variant="outline"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
