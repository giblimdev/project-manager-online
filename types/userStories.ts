// @/types/userStories.ts

/*
 * Types partagés pour les User Stories
 * Rôle : Définition centralisée des interfaces basées sur le schéma Prisma
 * Responsabilités :
 * - Types strictement conformes au schéma Prisma UserStory
 * - Interfaces partagées entre UserStoriesList et UserStoriesForm
 * - Cohérence des types dans toute l'application
 * - Support TypeScript strict mode Next.js 15
 * - Harmonisation complète des types entre tous les composants
 * - Utilitaires de création et validation des données
 *
 * Composants utilisés :
 * - Prisma : Schéma de base de données avec types générés
 * - TypeScript : Mode strict avec types stricts
 * - Next.js 15 : Compatibilité App Router
 * - shadcn/ui : Types pour les composants Badge, Button, etc.
 */

"use client";

// ✅ Types de base strictement basés sur le schéma Prisma fourni
export interface UserStoryCreator {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface UserStoryAssignee {
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
}

export interface UserStoryFeature {
  id: string;
  name: string;
  order: number;
  description?: string | null;
  acceptanceCriteria?: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  storyPoints?: number | null;
  businessValue?: number | null;
  technicalRisk?: number | null;
  effort?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  progress: number;
  position: number;
  projectId?: string | null;
  epic?: {
    id: string;
    name: string;
    order: number;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    status: string;
    initiative?: {
      id: string;
      name: string;
      order: number;
      description?: string | null;
      objective?: string | null;
      priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      status: string;
    } | null;
  } | null;
}

export interface UserStorySprint {
  id: string;
  name: string;
  order: number;
  goal?: string | null;
  description?: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  capacity?: number | null;
  velocity?: number | null;
}

export interface UserStoryTask {
  id: string;
  title: string;
  order: number;
  description?: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "CODE_REVIEW"
    | "TESTING"
    | "DONE"
    | "BLOCKED"
    | "CANCELLED";
  type: string;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: Date | null;
  startDate?: Date | null;
  completedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
  userStoryId: string;
  creatorId: string;
}

export interface UserStoryComment {
  id: string;
  title: string;
  order: number;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
  userStoryId?: string | null;
  parentCommentId?: string | null;
  blogImage?: string | null;
  excerpt?: string | null;
  isActive: boolean;
  isPinned: boolean;
  isResolved: boolean;
  metadata?: Record<string, any> | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  slug?: string | null;
  status: string;
  visibility: "PRIVATE" | "PUBLIC" | "INTERNAL";
}

export interface UserStoryFile {
  id: string;
  name: string;
  order: number;
  type:
    | "DOSSIER"
    | "PAGE"
    | "COMPONENT"
    | "UTILS"
    | "LIB"
    | "STORE"
    | "HOOK"
    | "ENV"
    | "SYSTEM"
    | "TEST"
    | "OTHER";
  mimeType?: string | null;
  path?: string | null;
  description?: string | null;
  version: number;
  isFolder: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserStoryTimeEntry {
  id: string;
  description?: string | null;
  hours: number;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  isManual: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// ✅ Interface principale UserStoryData (COMPLÈTEMENT harmonisée)
export interface UserStoryData {
  id: string;
  title: string;
  order: number;
  description: string | null;
  acceptanceCriteria: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "CODE_REVIEW"
    | "TESTING"
    | "DONE"
    | "BLOCKED"
    | "CANCELLED";
  storyPoints: number | null;
  businessValue: number | null;
  technicalRisk: number | null;
  effort: number | null;
  position: number;
  labels: string[];
  tags: string[];
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: string;
  updatedAt: string;
  featureId: string;
  creatorId: string;
  creator: UserStoryCreator;
  UserStoryAssignees: UserStoryAssignee[];
  feature: UserStoryFeature;
  tasks: UserStoryTask[];
  comments: UserStoryComment[];
  files: UserStoryFile[];
  timeEntries: UserStoryTimeEntry[];
  sprints: UserStorySprint[];
  _count: {
    tasks: number;
    comments: number;
    files: number;
    timeEntries: number;
  };
}

// ✅ Types pour les données de support (corrigés selon le schéma Prisma)
export interface FeatureData {
  id: string;
  name: string;
  order: number;
  description?: string | null;
  acceptanceCriteria?: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  storyPoints?: number | null;
  businessValue?: number | null;
  technicalRisk?: number | null;
  effort?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  progress: number;
  position: number;
  createdAt: string;
  updatedAt: string;
  epicId: string;
  parentId?: string | null;
  projectId?: string | null;
  userId?: string | null;
  epic: {
    id: string;
    name: string;
    order: number;
    description?: string | null;
    priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    status: string;
    startDate?: string | null;
    endDate?: string | null;
    progress: number;
    createdAt: string;
    updatedAt: string;
    initiativeId: string;
    initiative: {
      id: string;
      name: string;
      order: number;
      description?: string | null;
      objective?: string | null;
      priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      status: string;
      startDate?: string | null;
      endDate?: string | null;
      progress: number;
      budget?: number | null;
      roi?: number | null;
      createdAt: string;
      updatedAt: string;
      projectId: string;
      userId?: string | null;
    };
  };
}

export interface ProjectMemberData {
  id: string;
  role:
    | "ADMIN"
    | "PRODUCT_OWNER"
    | "SCRUM_MASTER"
    | "DEVELOPER"
    | "STAKEHOLDER"
    | "VIEWER";
  order: number;
  joinedAt: string;
  isActive: boolean;
  projectId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    timezone?: string | null;
    isActive: boolean;
  };
}

export interface SprintData {
  id: string;
  name: string;
  order: number;
  goal?: string | null;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  capacity?: number | null;
  velocity?: number | null;
  burndownData?: Record<string, any> | null;
  retrospective?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  key: string;
  order: number;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  visibility: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ✅ Interface pour les données de la page (cohérente avec l'API)
export interface UserStoriesPageData {
  project: ProjectData;
  userStories: UserStoryData[];
  features: FeatureData[];
  projectMembers: ProjectMemberData[];
  sprints: SprintData[];
  userRole:
    | "ADMIN"
    | "PRODUCT_OWNER"
    | "SCRUM_MASTER"
    | "DEVELOPER"
    | "STAKEHOLDER"
    | "VIEWER";
}

// ✅ Props pour UserStoriesList (harmonisées)
export interface UserStoriesListProps {
  userStories: UserStoryData[];
  displayMode: "list" | "card";
  features: FeatureData[];
  projectMembers: ProjectMemberData[];
  sprints: SprintData[];
  userRole:
    | "ADMIN"
    | "PRODUCT_OWNER"
    | "SCRUM_MASTER"
    | "DEVELOPER"
    | "STAKEHOLDER"
    | "VIEWER";
  projectId: string;
  onUpdate: () => void;
  className?: string;
  isLoading?: boolean;
}

// ✅ Props pour UserStoriesForm (harmonisées)
export interface UserStoriesFormProps {
  userStory?: UserStoryData | null;
  projectId: string;
  features?: FeatureData[];
  projectMembers?: ProjectMemberData[];
  sprints?: SprintData[];
  onSave: (userStory: UserStoryData) => void;
  onCancel: () => void;
  isOpen: boolean;
}

// ✅ Configuration des statuts et priorités
export const PRIORITY_CONFIG = {
  CRITICAL: {
    label: "Critique",
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  HIGH: {
    label: "Haute",
    variant: "destructive" as const,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  MEDIUM: {
    label: "Moyenne",
    variant: "secondary" as const,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  LOW: {
    label: "Basse",
    variant: "outline" as const,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
} as const;

export const STATUS_CONFIG = {
  TODO: {
    label: "À faire",
    variant: "outline" as const,
    progress: 0,
    color: "text-gray-600",
  },
  IN_PROGRESS: {
    label: "En cours",
    variant: "default" as const,
    progress: 30,
    color: "text-blue-600",
  },
  CODE_REVIEW: {
    label: "Revue de code",
    variant: "secondary" as const,
    progress: 60,
    color: "text-purple-600",
  },
  TESTING: {
    label: "Test",
    variant: "secondary" as const,
    progress: 80,
    color: "text-indigo-600",
  },
  DONE: {
    label: "Terminé",
    variant: "default" as const,
    progress: 100,
    color: "text-green-600",
  },
  BLOCKED: {
    label: "Bloqué",
    variant: "destructive" as const,
    progress: 0,
    color: "text-red-600",
  },
  CANCELLED: {
    label: "Annulé",
    variant: "outline" as const,
    progress: 0,
    color: "text-gray-400",
  },
} as const;

// ✅ Types additionnels
export type DisplayMode = "list" | "card";
export type UserRole =
  | "ADMIN"
  | "PRODUCT_OWNER"
  | "SCRUM_MASTER"
  | "DEVELOPER"
  | "STAKEHOLDER"
  | "VIEWER";
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "CODE_REVIEW"
  | "TESTING"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type FileType =
  | "DOSSIER"
  | "PAGE"
  | "COMPONENT"
  | "UTILS"
  | "LIB"
  | "STORE"
  | "HOOK"
  | "ENV"
  | "SYSTEM"
  | "TEST"
  | "OTHER";
export type Visibility = "PRIVATE" | "PUBLIC" | "INTERNAL";

// ✅ Utilitaires de transformation de données (AJOUTÉS ET EXPORTÉS)
export const createEmptyUserStory = (
  featureId: string,
  creatorId: string
): Partial<UserStoryData> => ({
  title: "",
  order: 1000,
  description: null,
  acceptanceCriteria: null,
  priority: "MEDIUM",
  status: "TODO",
  storyPoints: null,
  businessValue: null,
  technicalRisk: null,
  effort: null,
  position: 0,
  labels: [],
  tags: [],
  estimatedHours: null,
  actualHours: null,
  featureId,
  creatorId,
  tasks: [],
  comments: [],
  files: [],
  timeEntries: [],
  sprints: [],
  UserStoryAssignees: [],
  _count: {
    tasks: 0,
    comments: 0,
    files: 0,
    timeEntries: 0,
  },
});

export const validateUserStoryData = (
  data: Partial<UserStoryData>
): string[] => {
  const errors: string[] = [];

  if (!data.title?.trim()) {
    errors.push("Le titre est requis");
  }

  if (data.title && data.title.length > 255) {
    errors.push("Le titre ne peut pas dépasser 255 caractères");
  }

  if (!data.featureId) {
    errors.push("Une feature doit être sélectionnée");
  }

  if (!data.creatorId) {
    errors.push("Un créateur doit être défini");
  }

  if (data.storyPoints && (data.storyPoints < 0 || data.storyPoints > 100)) {
    errors.push("Les story points doivent être entre 0 et 100");
  }

  if (
    data.businessValue &&
    (data.businessValue < 0 || data.businessValue > 100)
  ) {
    errors.push("La valeur business doit être entre 0 et 100");
  }

  if (
    data.technicalRisk &&
    (data.technicalRisk < 0 || data.technicalRisk > 100)
  ) {
    errors.push("Le risque technique doit être entre 0 et 100");
  }

  if (data.effort && (data.effort < 0 || data.effort > 100)) {
    errors.push("L'effort doit être entre 0 et 100");
  }

  if (data.estimatedHours && data.estimatedHours < 0) {
    errors.push("Les heures estimées ne peuvent pas être négatives");
  }

  return errors;
};

// ✅ Utilitaires de formatage des dates
export const formatDate = (date: Date | string): string => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("fr-FR");
  }
  return date.toLocaleDateString("fr-FR");
};

export const formatDateTime = (date: Date | string): string => {
  if (typeof date === "string") {
    return new Date(date).toLocaleString("fr-FR");
  }
  return date.toLocaleString("fr-FR");
};

// ✅ Utilitaires de conversion
export const stringToDate = (dateString: string): Date => {
  return new Date(dateString);
};

export const dateToString = (date: Date): string => {
  return date.toISOString();
};

// ✅ Utilitaire de calcul du score de priorité
export const calculatePriorityScore = (userStory: UserStoryData): number => {
  const priorityWeight = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const businessValue = userStory.businessValue || 0;
  const technicalRisk = 100 - (userStory.technicalRisk || 0); // Inverser le risque
  const priorityMultiplier = priorityWeight[userStory.priority];

  return (businessValue + technicalRisk) * priorityMultiplier;
};

// ✅ Utilitaire de tri des user stories par priorité
export const sortUserStoriesByPriority = (
  userStories: UserStoryData[]
): UserStoryData[] => {
  return [...userStories].sort(
    (a, b) => calculatePriorityScore(b) - calculatePriorityScore(a)
  );
};

// ✅ Utilitaire de regroupement par statut
export const groupUserStoriesByStatus = (
  userStories: UserStoryData[]
): Record<string, UserStoryData[]> => {
  return userStories.reduce((groups, userStory) => {
    const status = userStory.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(userStory);
    return groups;
  }, {} as Record<string, UserStoryData[]>);
};
