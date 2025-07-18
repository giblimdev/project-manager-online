// app/schema-documentation/page.tsx
"use client";
import React, { use, useState } from "react";
import {
  Database,
  Users,
  Building2,
  FolderOpen,
  GitBranch,
  MessageSquare,
  FileText,
  Clock,
  Shield,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Link,
  Hash,
  Key,
  ExternalLink,
} from "lucide-react";

// Types pour les exemples de données
interface TableExample {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  fields: Field[];
  relations: Relation[];
  examples: Record<string, any>[];
  color: string;
}

interface Field {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  description: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  relatedTable?: string;
}

interface Relation {
  type: "one-to-many" | "many-to-one" | "many-to-many";
  targetTable: string;
  description: string;
  field: string;
}

export default function SchemaDocumentationPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [showRelations, setShowRelations] = useState<boolean>(true);

  // Données complètes du schéma avec exemples
  const tables: TableExample[] = [
    // =====================================
    // AUTHENTIFICATION
    // =====================================
    {
      id: "user",
      name: "User",
      description:
        "Utilisateurs de la plateforme avec authentification Better Auth",
      icon: <Users className="w-5 h-5" />,
      category: "Authentication",
      color: "blue",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String?",
          nullable: true,
          description: "Nom complet de l'utilisateur",
        },
        {
          name: "email",
          type: "String",
          nullable: false,
          description: "Email unique",
        },
        {
          name: "emailVerified",
          type: "Boolean",
          nullable: false,
          defaultValue: "false",
          description: "Email vérifié",
        },
        {
          name: "image",
          type: "String?",
          nullable: true,
          description: "URL de l'avatar",
        },
        {
          name: "username",
          type: "String?",
          nullable: true,
          description: "Nom d'utilisateur unique",
        },
        {
          name: "firstName",
          type: "String?",
          nullable: true,
          description: "Prénom",
        },
        {
          name: "lastName",
          type: "String?",
          nullable: true,
          description: "Nom de famille",
        },
        {
          name: "bio",
          type: "String?",
          nullable: true,
          description: "Biographie",
        },
        {
          name: "timezone",
          type: "String?",
          nullable: true,
          defaultValue: "UTC",
          description: "Fuseau horaire",
        },
        {
          name: "preferences",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Préférences utilisateur",
        },
        {
          name: "isActive",
          type: "Boolean",
          nullable: false,
          defaultValue: "true",
          description: "Compte actif",
        },
        {
          name: "lastLoginAt",
          type: "DateTime?",
          nullable: true,
          description: "Dernière connexion",
        },
        {
          name: "twoFactorEnabled",
          type: "Boolean",
          nullable: false,
          defaultValue: "false",
          description: "2FA activé",
        },
        {
          name: "createdAt",
          type: "DateTime",
          nullable: false,
          defaultValue: "now()",
          description: "Date de création",
        },
        {
          name: "updatedAt",
          type: "DateTime",
          nullable: false,
          description: "Date de mise à jour",
        },
      ],
      relations: [
        {
          type: "one-to-many",
          targetTable: "Account",
          field: "accounts",
          description: "Comptes d'authentification",
        },
        {
          type: "one-to-many",
          targetTable: "Session",
          field: "sessions",
          description: "Sessions actives",
        },
        {
          type: "one-to-many",
          targetTable: "OrganizationMember",
          field: "organizationMemberships",
          description: "Appartenances aux organisations",
        },
        {
          type: "one-to-many",
          targetTable: "ProjectMember",
          field: "projectMemberships",
          description: "Appartenances aux projets",
        },
        {
          type: "many-to-many",
          targetTable: "Task",
          field: "assignedTasks",
          description: "Tâches assignées",
        },
        {
          type: "one-to-many",
          targetTable: "Task",
          field: "createdTasks",
          description: "Tâches créées",
        },
        {
          type: "one-to-many",
          targetTable: "Comment",
          field: "comments",
          description: "Commentaires",
        },
        {
          type: "one-to-many",
          targetTable: "File",
          field: "fileUploads",
          description: "Fichiers uploadés",
        },
      ],
      examples: [
        {
          id: "usr_2yBq7K8mN3pR5xZ",
          name: "Jean-Philippe Dubois",
          email: "jean-philippe@projectmanager.com",
          emailVerified: true,
          image: "https://avatars.githubusercontent.com/u/12345",
          username: "jpdubo",
          firstName: "Jean-Philippe",
          lastName: "Dubois",
          bio: "Product Owner passionné par l'agilité",
          timezone: "Europe/Paris",
          preferences: { theme: "dark", language: "fr", notifications: true },
          isActive: true,
          lastLoginAt: "2024-01-15T09:30:00Z",
          twoFactorEnabled: true,
          createdAt: "2024-01-01T10:00:00Z",
          updatedAt: "2024-01-15T09:30:00Z",
        },
        {
          id: "usr_8wXm2L6vP9qS4nB",
          name: "Sarah Martin",
          email: "sarah.martin@techcorp.com",
          emailVerified: true,
          image: null,
          username: "smartin",
          firstName: "Sarah",
          lastName: "Martin",
          bio: "Scrum Master experte en transformation agile",
          timezone: "Europe/Paris",
          preferences: { theme: "light", language: "fr", notifications: false },
          isActive: true,
          lastLoginAt: "2024-01-14T16:45:00Z",
          twoFactorEnabled: false,
          createdAt: "2024-01-02T14:20:00Z",
          updatedAt: "2024-01-14T16:45:00Z",
        },
      ],
    },

    {
      id: "account",
      name: "Account",
      description:
        "Comptes d'authentification liés aux utilisateurs (Better Auth)",
      icon: <Key className="w-5 h-5" />,
      category: "Authentication",
      color: "blue",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "accountId",
          type: "String",
          nullable: false,
          description: "ID du compte provider",
        },
        {
          name: "providerId",
          type: "String",
          nullable: false,
          description: "ID du provider (google, github, etc.)",
        },
        {
          name: "userId",
          type: "String",
          nullable: false,
          description: "Référence utilisateur",
          isForeignKey: true,
          relatedTable: "User",
        },
        {
          name: "accessToken",
          type: "String?",
          nullable: true,
          description: "Token d'accès OAuth",
        },
        {
          name: "refreshToken",
          type: "String?",
          nullable: true,
          description: "Token de rafraîchissement",
        },
        {
          name: "idToken",
          type: "String?",
          nullable: true,
          description: "Token ID OIDC",
        },
        {
          name: "accessTokenExpiresAt",
          type: "DateTime?",
          nullable: true,
          description: "Expiration access token",
        },
        {
          name: "refreshTokenExpiresAt",
          type: "DateTime?",
          nullable: true,
          description: "Expiration refresh token",
        },
        {
          name: "scope",
          type: "String?",
          nullable: true,
          description: "Portée OAuth",
        },
        {
          name: "password",
          type: "String?",
          nullable: true,
          description: "Mot de passe haché (provider credential)",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "User",
          field: "user",
          description: "Utilisateur propriétaire",
        },
      ],
      examples: [
        {
          id: "acc_5rT8nK3mP7qX2vB",
          accountId: "jean-philippe@projectmanager.com",
          providerId: "credential",
          userId: "usr_2yBq7K8mN3pR5xZ",
          accessToken: null,
          refreshToken: null,
          idToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          scope: null,
          password:
            "$2b$12$LQv3c1yqBwbHfh5i7tbm8uvwq.c6Nz/Q8Br7gN.n5a1Bdc8ZCn2Ky",
        },
        {
          id: "acc_9wL4pS6vT2xN8mR",
          accountId: "12345678901234567890",
          providerId: "google",
          userId: "usr_8wXm2L6vP9qS4nB",
          accessToken: "ya29.a0Ae4lvC2Rbf...",
          refreshToken: "1//0GWthfF7qN2y5CR...",
          idToken: "eyJhbGciOiJSUzI1NiIs...",
          accessTokenExpiresAt: "2024-01-15T10:30:00Z",
          refreshTokenExpiresAt: "2024-07-15T09:30:00Z",
          scope: "openid email profile",
          password: null,
        },
      ],
    },

    // =====================================
    // ORGANISATIONS
    // =====================================
    {
      id: "organization",
      name: "Organization",
      description: "Organisations multi-tenant avec gestion centralisée",
      icon: <Building2 className="w-5 h-5" />,
      category: "Organizations",
      color: "purple",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom de l'organisation",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description",
        },
        {
          name: "slug",
          type: "String",
          nullable: false,
          description: "Slug unique pour URL",
        },
        {
          name: "logoUrl",
          type: "String?",
          nullable: true,
          description: "URL du logo",
        },
        {
          name: "domain",
          type: "String?",
          nullable: true,
          description: "Domaine email unique",
        },
        {
          name: "settings",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Paramètres organisation",
        },
        {
          name: "isActive",
          type: "Boolean",
          nullable: false,
          defaultValue: "true",
          description: "Organisation active",
        },
      ],
      relations: [
        {
          type: "one-to-many",
          targetTable: "OrganizationMember",
          field: "members",
          description: "Membres de l'organisation",
        },
        {
          type: "one-to-many",
          targetTable: "Project",
          field: "projects",
          description: "Projets de l'organisation",
        },
        {
          type: "one-to-many",
          targetTable: "Template",
          field: "templates",
          description: "Templates personnalisés",
        },
      ],
      examples: [
        {
          id: "org_3kN7mR9sT5xW2qP",
          name: "TechInnovate Solutions",
          description:
            "Entreprise de développement logiciel spécialisée en solutions agiles",
          slug: "techinnovate",
          logoUrl: "https://cdn.techinnovate.com/logo.png",
          domain: "techinnovate.com",
          settings: {
            defaultTimezone: "Europe/Paris",
            workingHours: { start: "09:00", end: "18:00" },
            sprintDuration: 14,
            allowPublicProjects: false,
          },
          isActive: true,
          createdAt: "2023-12-01T10:00:00Z",
          updatedAt: "2024-01-10T14:30:00Z",
        },
      ],
    },

    {
      id: "organizationMember",
      name: "OrganizationMember",
      description: "Membres d'organisation avec rôles et permissions",
      icon: <Users className="w-5 h-5" />,
      category: "Organizations",
      color: "purple",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "role",
          type: "UserRole",
          nullable: false,
          defaultValue: "DEVELOPER",
          description: "Rôle dans l'organisation",
        },
        {
          name: "joinedAt",
          type: "DateTime",
          nullable: false,
          defaultValue: "now()",
          description: "Date d'ajout",
        },
        {
          name: "isActive",
          type: "Boolean",
          nullable: false,
          defaultValue: "true",
          description: "Membre actif",
        },
        {
          name: "organizationId",
          type: "String",
          nullable: false,
          description: "Référence organisation",
          isForeignKey: true,
          relatedTable: "Organization",
        },
        {
          name: "userId",
          type: "String",
          nullable: false,
          description: "Référence utilisateur",
          isForeignKey: true,
          relatedTable: "User",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Organization",
          field: "organization",
          description: "Organisation",
        },
        {
          type: "many-to-one",
          targetTable: "User",
          field: "user",
          description: "Utilisateur",
        },
      ],
      examples: [
        {
          id: "om_7vX2nL9pS6qR4mT",
          role: "ADMIN",
          joinedAt: "2023-12-01T10:00:00Z",
          isActive: true,
          organizationId: "org_3kN7mR9sT5xW2qP",
          userId: "usr_2yBq7K8mN3pR5xZ",
        },
        {
          id: "om_4sB8nK2pL9xT6vR",
          role: "SCRUM_MASTER",
          joinedAt: "2024-01-02T14:20:00Z",
          isActive: true,
          organizationId: "org_3kN7mR9sT5xW2qP",
          userId: "usr_8wXm2L6vP9qS4nB",
        },
      ],
    },

    // =====================================
    // PROJETS
    // =====================================
    {
      id: "project",
      name: "Project",
      description: "Projets agiles avec métadonnées et configuration",
      icon: <FolderOpen className="w-5 h-5" />,
      category: "Projects",
      color: "green",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom du projet",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description du projet",
        },
        {
          name: "slug",
          type: "String",
          nullable: false,
          description: "Slug unique dans l'organisation",
        },
        {
          name: "key",
          type: "String",
          nullable: false,
          description: "Clé courte (ex: SHOP, ECOM)",
        },
        {
          name: "startDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de début",
        },
        {
          name: "endDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de fin prévue",
        },
        {
          name: "status",
          type: "String",
          nullable: false,
          defaultValue: "ACTIVE",
          description: "Statut du projet",
        },
        {
          name: "visibility",
          type: "String",
          nullable: false,
          defaultValue: "PRIVATE",
          description: "Visibilité du projet",
        },
        {
          name: "settings",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Paramètres projet",
        },
        {
          name: "metadata",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Métadonnées personnalisées",
        },
        {
          name: "organizationId",
          type: "String",
          nullable: false,
          description: "Référence organisation",
          isForeignKey: true,
          relatedTable: "Organization",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Organization",
          field: "organization",
          description: "Organisation propriétaire",
        },
        {
          type: "one-to-many",
          targetTable: "ProjectMember",
          field: "members",
          description: "Membres du projet",
        },
        {
          type: "one-to-many",
          targetTable: "Initiative",
          field: "initiatives",
          description: "Initiatives du projet",
        },
        {
          type: "one-to-many",
          targetTable: "Sprint",
          field: "sprints",
          description: "Sprints du projet",
        },
        {
          type: "one-to-many",
          targetTable: "File",
          field: "files",
          description: "Fichiers du projet",
        },
        {
          type: "one-to-many",
          targetTable: "Channel",
          field: "channels",
          description: "Channels de communication",
        },
      ],
      examples: [
        {
          id: "prj_9mK4pS7vX2nL6qR",
          name: "E-commerce Platform",
          description: "Plateforme e-commerce moderne avec IA intégrée",
          slug: "ecommerce-platform",
          key: "ECOM",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-06-30T00:00:00Z",
          status: "ACTIVE",
          visibility: "PRIVATE",
          settings: {
            sprintDuration: 14,
            storyPointsScale: "fibonacci",
            definitionOfDone: [
              "Code reviewed",
              "Tests passed",
              "Documentation updated",
            ],
            workflowStates: [
              "TODO",
              "IN_PROGRESS",
              "CODE_REVIEW",
              "TESTING",
              "DONE",
            ],
          },
          metadata: {
            budget: 250000,
            client: "RetailCorp",
            technology: ["React", "Node.js", "PostgreSQL"],
            category: "Web Application",
          },
          organizationId: "org_3kN7mR9sT5xW2qP",
          createdAt: "2024-01-10T09:00:00Z",
          updatedAt: "2024-01-15T16:30:00Z",
        },
      ],
    },

    // =====================================
    // HIÉRARCHIE DU TRAVAIL
    // =====================================
    {
      id: "initiative",
      name: "Initiative",
      description: "Objectifs business stratégiques avec ROI et budget",
      icon: <Hash className="w-5 h-5" />,
      category: "Work Hierarchy",
      color: "indigo",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom de l'initiative",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description détaillée",
        },
        {
          name: "objective",
          type: "String?",
          nullable: true,
          description: "Objectif business",
        },
        {
          name: "priority",
          type: "Priority",
          nullable: false,
          defaultValue: "MEDIUM",
          description: "Priorité business",
        },
        {
          name: "status",
          type: "String",
          nullable: false,
          defaultValue: "ACTIVE",
          description: "Statut de l'initiative",
        },
        {
          name: "startDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de début",
        },
        {
          name: "endDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de fin prévue",
        },
        {
          name: "progress",
          type: "Float",
          nullable: false,
          defaultValue: "0",
          description: "Pourcentage de completion",
        },
        {
          name: "budget",
          type: "Float?",
          nullable: true,
          description: "Budget alloué",
        },
        {
          name: "roi",
          type: "Float?",
          nullable: true,
          description: "Return on Investment estimé",
        },
        {
          name: "projectId",
          type: "String",
          nullable: false,
          description: "Référence projet",
          isForeignKey: true,
          relatedTable: "Project",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Project",
          field: "project",
          description: "Projet parent",
        },
        {
          type: "one-to-many",
          targetTable: "Epic",
          field: "epics",
          description: "Epics de l'initiative",
        },
      ],
      examples: [
        {
          id: "ini_8vB3nR6pK9sL2xT",
          name: "MVP E-commerce Platform",
          description:
            "Lancement de la première version de la plateforme e-commerce avec fonctionnalités essentielles",
          objective: "Capturer 15% du marché e-commerce B2B en 6 mois",
          priority: "HIGH",
          status: "ACTIVE",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-04-15T00:00:00Z",
          progress: 35.5,
          budget: 150000,
          roi: 3.2,
          projectId: "prj_9mK4pS7vX2nL6qR",
          createdAt: "2024-01-10T10:00:00Z",
          updatedAt: "2024-01-15T14:20:00Z",
        },
      ],
    },

    {
      id: "epic",
      name: "Epic",
      description: "Ensemble de fonctionnalités liées à un domaine métier",
      icon: <GitBranch className="w-5 h-5" />,
      category: "Work Hierarchy",
      color: "indigo",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom de l'epic",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description de l'epic",
        },
        {
          name: "priority",
          type: "Priority",
          nullable: false,
          defaultValue: "MEDIUM",
          description: "Priorité",
        },
        {
          name: "status",
          type: "String",
          nullable: false,
          defaultValue: "ACTIVE",
          description: "Statut",
        },
        {
          name: "startDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de début",
        },
        {
          name: "endDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de fin prévue",
        },
        {
          name: "progress",
          type: "Float",
          nullable: false,
          defaultValue: "0",
          description: "Pourcentage de completion",
        },
        {
          name: "initiativeId",
          type: "String",
          nullable: false,
          description: "Référence initiative",
          isForeignKey: true,
          relatedTable: "Initiative",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Initiative",
          field: "initiative",
          description: "Initiative parent",
        },
        {
          type: "one-to-many",
          targetTable: "Feature",
          field: "features",
          description: "Features de l'epic",
        },
      ],
      examples: [
        {
          id: "epc_5rT8nK3mP7qX2vB",
          name: "Gestion des utilisateurs",
          description:
            "Système complet d'authentification et de gestion des profils utilisateurs",
          priority: "HIGH",
          status: "ACTIVE",
          startDate: "2024-01-15T00:00:00Z",
          endDate: "2024-02-28T00:00:00Z",
          progress: 65.0,
          initiativeId: "ini_8vB3nR6pK9sL2xT",
          createdAt: "2024-01-10T11:00:00Z",
          updatedAt: "2024-01-15T16:45:00Z",
        },
        {
          id: "epc_2wL9pS6vT8xN4mR",
          name: "Catalogue produits",
          description:
            "Interface de navigation et recherche dans le catalogue produits",
          priority: "HIGH",
          status: "PLANNED",
          startDate: "2024-02-01T00:00:00Z",
          endDate: "2024-03-15T00:00:00Z",
          progress: 0.0,
          initiativeId: "ini_8vB3nR6pK9sL2xT",
          createdAt: "2024-01-10T11:00:00Z",
          updatedAt: "2024-01-12T09:30:00Z",
        },
      ],
    },

    {
      id: "feature",
      name: "Feature",
      description:
        "Fonctionnalité avec critères d'acceptation et valeur business",
      icon: <FileText className="w-5 h-5" />,
      category: "Work Hierarchy",
      color: "indigo",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom de la feature",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description détaillée",
        },
        {
          name: "acceptanceCriteria",
          type: "String?",
          nullable: true,
          description: "Critères d'acceptation",
        },
        {
          name: "priority",
          type: "Priority",
          nullable: false,
          defaultValue: "MEDIUM",
          description: "Priorité",
        },
        {
          name: "status",
          type: "String",
          nullable: false,
          defaultValue: "ACTIVE",
          description: "Statut",
        },
        {
          name: "storyPoints",
          type: "Int?",
          nullable: true,
          description: "Story points estimés",
        },
        {
          name: "businessValue",
          type: "Int?",
          nullable: true,
          description: "Valeur métier (1-10)",
        },
        {
          name: "technicalRisk",
          type: "Int?",
          nullable: true,
          description: "Risque technique (1-10)",
        },
        {
          name: "effort",
          type: "Int?",
          nullable: true,
          description: "Effort estimé (1-10)",
        },
        {
          name: "position",
          type: "Int",
          nullable: false,
          defaultValue: "0",
          description: "Position dans le backlog",
        },
        {
          name: "parentId",
          type: "String?",
          nullable: true,
          description: "Feature parent",
          isForeignKey: true,
          relatedTable: "Feature",
        },
        {
          name: "epicId",
          type: "String",
          nullable: false,
          description: "Référence epic",
          isForeignKey: true,
          relatedTable: "Epic",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Epic",
          field: "epic",
          description: "Epic parent",
        },
        {
          type: "many-to-one",
          targetTable: "Feature",
          field: "parent",
          description: "Feature parent (hiérarchie)",
        },
        {
          type: "one-to-many",
          targetTable: "Feature",
          field: "children",
          description: "Sous-features",
        },
        {
          type: "one-to-many",
          targetTable: "UserStory",
          field: "userStories",
          description: "User stories",
        },
        {
          type: "one-to-many",
          targetTable: "FeatureDependency",
          field: "dependencies",
          description: "Dépendances",
        },
        {
          type: "one-to-many",
          targetTable: "File",
          field: "files",
          description: "Fichiers attachés",
        },
      ],
      examples: [
        {
          id: "fea_7nK4pS9vX6qL2rT",
          name: "Authentification OAuth",
          description:
            "Système d'authentification avec providers externes (Google, GitHub, LinkedIn)",
          acceptanceCriteria: `
            - L'utilisateur peut se connecter avec Google
            - L'utilisateur peut se connecter avec GitHub
            - L'utilisateur peut se connecter avec LinkedIn
            - Les données de profil sont synchronisées automatiquement
            - La déconnexion fonctionne correctement
          `,
          priority: "HIGH",
          status: "IN_PROGRESS",
          storyPoints: 13,
          businessValue: 9,
          technicalRisk: 6,
          effort: 7,
          position: 1,
          parentId: null,
          epicId: "epc_5rT8nK3mP7qX2vB",
          createdAt: "2024-01-12T09:00:00Z",
          updatedAt: "2024-01-15T14:30:00Z",
        },
        {
          id: "fea_3wB8nL2pK9xT6vR",
          name: "Gestion des profils",
          description:
            "Interface de gestion et modification des profils utilisateurs",
          acceptanceCriteria: `
            - L'utilisateur peut modifier ses informations personnelles
            - L'utilisateur peut changer son avatar
            - L'utilisateur peut modifier ses préférences
            - Les modifications sont sauvegardées en temps réel
          `,
          priority: "MEDIUM",
          status: "TODO",
          storyPoints: 8,
          businessValue: 7,
          technicalRisk: 3,
          effort: 5,
          position: 2,
          parentId: null,
          epicId: "epc_5rT8nK3mP7qX2vB",
          createdAt: "2024-01-12T09:15:00Z",
          updatedAt: "2024-01-12T09:15:00Z",
        },
      ],
    },

    {
      id: "userStory",
      name: "UserStory",
      description: "Besoin utilisateur avec estimation en story points",
      icon: <FileText className="w-5 h-5" />,
      category: "Work Hierarchy",
      color: "indigo",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "title",
          type: "String",
          nullable: false,
          description: "Titre de la user story",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description As a... I want... So that...",
        },
        {
          name: "acceptanceCriteria",
          type: "String?",
          nullable: true,
          description: "Critères d'acceptation",
        },
        {
          name: "priority",
          type: "Priority",
          nullable: false,
          defaultValue: "MEDIUM",
          description: "Priorité",
        },
        {
          name: "status",
          type: "TaskStatus",
          nullable: false,
          defaultValue: "TODO",
          description: "Statut",
        },
        {
          name: "storyPoints",
          type: "Int?",
          nullable: true,
          description: "Story points",
        },
        {
          name: "businessValue",
          type: "Int?",
          nullable: true,
          description: "Valeur métier (1-10)",
        },
        {
          name: "technicalRisk",
          type: "Int?",
          nullable: true,
          description: "Risque technique (1-10)",
        },
        {
          name: "effort",
          type: "Int?",
          nullable: true,
          description: "Effort estimé (1-10)",
        },
        {
          name: "position",
          type: "Int",
          nullable: false,
          defaultValue: "0",
          description: "Position dans le backlog",
        },
        {
          name: "labels",
          type: "String[]",
          nullable: false,
          defaultValue: "[]",
          description: "Labels/tags",
        },
        {
          name: "estimatedHours",
          type: "Float?",
          nullable: true,
          description: "Estimation en heures",
        },
        {
          name: "actualHours",
          type: "Float?",
          nullable: true,
          description: "Heures réelles",
        },
        {
          name: "featureId",
          type: "String",
          nullable: false,
          description: "Référence feature",
          isForeignKey: true,
          relatedTable: "Feature",
        },
        {
          name: "creatorId",
          type: "String",
          nullable: false,
          description: "Créateur",
          isForeignKey: true,
          relatedTable: "User",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Feature",
          field: "feature",
          description: "Feature parent",
        },
        {
          type: "many-to-one",
          targetTable: "User",
          field: "creator",
          description: "Créateur",
        },
        {
          type: "many-to-many",
          targetTable: "User",
          field: "assignees",
          description: "Assignés",
        },
        {
          type: "one-to-many",
          targetTable: "Task",
          field: "tasks",
          description: "Tâches techniques",
        },
        {
          type: "many-to-many",
          targetTable: "Sprint",
          field: "sprints",
          description: "Sprints",
        },
        {
          type: "one-to-many",
          targetTable: "Comment",
          field: "comments",
          description: "Commentaires",
        },
        {
          type: "one-to-many",
          targetTable: "TimeEntry",
          field: "timeEntries",
          description: "Temps passé",
        },
      ],
      examples: [
        {
          id: "us_6rT5nK8mP3qX9vB",
          title: "Connexion avec Google OAuth",
          description:
            "En tant qu'utilisateur, je veux pouvoir me connecter avec mon compte Google pour accéder rapidement à la plateforme sans créer un nouveau compte.",
          acceptanceCriteria: `
            - Le bouton "Se connecter avec Google" est visible sur la page de connexion
            - Le clic redirige vers la page d\'autorisation Google
            - Après autorisation, l\'utilisateur est connecté automatiquement
            - Si c\'est la première connexion, un compte est créé automatiquement
            - Les informations de profil sont récupérées (nom, email, avatar)
          `,
          priority: "HIGH",
          status: "IN_PROGRESS",
          storyPoints: 5,
          businessValue: 9,
          technicalRisk: 4,
          effort: 5,
          position: 1,
          labels: ["oauth", "authentication", "google"],
          estimatedHours: 12.0,
          actualHours: 8.5,
          featureId: "fea_7nK4pS9vX6qL2rT",
          creatorId: "usr_2yBq7K8mN3pR5xZ",
          createdAt: "2024-01-12T10:00:00Z",
          updatedAt: "2024-01-15T16:00:00Z",
        },
      ],
    },

    {
      id: "task",
      name: "Task",
      description: "Tâche technique avec estimation en heures",
      icon: <FileText className="w-5 h-5" />,
      category: "Work Hierarchy",
      color: "indigo",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "title",
          type: "String",
          nullable: false,
          description: "Titre de la tâche",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description technique",
        },
        {
          name: "priority",
          type: "Priority",
          nullable: false,
          defaultValue: "MEDIUM",
          description: "Priorité",
        },
        {
          name: "status",
          type: "TaskStatus",
          nullable: false,
          defaultValue: "TODO",
          description: "Statut",
        },
        {
          name: "type",
          type: "String",
          nullable: false,
          defaultValue: "TASK",
          description: "Type (TASK, BUG, IMPROVEMENT)",
        },
        {
          name: "position",
          type: "Int",
          nullable: false,
          defaultValue: "0",
          description: "Position",
        },
        {
          name: "labels",
          type: "String[]",
          nullable: false,
          defaultValue: "[]",
          description: "Labels/tags",
        },
        {
          name: "estimatedHours",
          type: "Float?",
          nullable: true,
          description: "Estimation en heures",
        },
        {
          name: "actualHours",
          type: "Float?",
          nullable: true,
          description: "Heures réelles",
        },
        {
          name: "dueDate",
          type: "DateTime?",
          nullable: true,
          description: "Date d'échéance",
        },
        {
          name: "startDate",
          type: "DateTime?",
          nullable: true,
          description: "Date de début",
        },
        {
          name: "completedAt",
          type: "DateTime?",
          nullable: true,
          description: "Date de completion",
        },
        {
          name: "userStoryId",
          type: "String",
          nullable: false,
          description: "Référence user story",
          isForeignKey: true,
          relatedTable: "UserStory",
        },
        {
          name: "creatorId",
          type: "String",
          nullable: false,
          description: "Créateur",
          isForeignKey: true,
          relatedTable: "User",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "UserStory",
          field: "userStory",
          description: "User story parent",
        },
        {
          type: "many-to-one",
          targetTable: "User",
          field: "creator",
          description: "Créateur",
        },
        {
          type: "many-to-many",
          targetTable: "User",
          field: "assignees",
          description: "Assignés",
        },
        {
          type: "one-to-many",
          targetTable: "TaskDependency",
          field: "dependencies",
          description: "Dépendances",
        },
        {
          type: "one-to-many",
          targetTable: "Comment",
          field: "comments",
          description: "Commentaires",
        },
        {
          type: "one-to-many",
          targetTable: "TimeEntry",
          field: "timeEntries",
          description: "Temps passé",
        },
      ],
      examples: [
        {
          id: "tsk_4wL9pS2vT8xN6mR",
          title: "Configurer Google OAuth dans Next.js",
          description:
            "Installer et configurer NextAuth.js avec le provider Google OAuth pour l'authentification",
          priority: "HIGH",
          status: "IN_PROGRESS",
          type: "TASK",
          position: 1,
          labels: ["frontend", "oauth", "nextjs"],
          estimatedHours: 4.0,
          actualHours: 3.5,
          dueDate: "2024-01-16T17:00:00Z",
          startDate: "2024-01-15T09:00:00Z",
          completedAt: null,
          userStoryId: "us_6rT5nK8mP3qX9vB",
          creatorId: "usr_8wXm2L6vP9qS4nB",
          createdAt: "2024-01-12T14:00:00Z",
          updatedAt: "2024-01-15T16:30:00Z",
        },
        {
          id: "tsk_7nK3pS6vX9qL5rT",
          title: "Créer API endpoint /auth/google",
          description:
            "Développer l'endpoint backend pour gérer le callback OAuth Google",
          priority: "HIGH",
          status: "TODO",
          type: "TASK",
          position: 2,
          labels: ["backend", "api", "oauth"],
          estimatedHours: 3.0,
          actualHours: 0.0,
          dueDate: "2024-01-17T17:00:00Z",
          startDate: null,
          completedAt: null,
          userStoryId: "us_6rT5nK8mP3qX9vB",
          creatorId: "usr_8wXm2L6vP9qS4nB",
          createdAt: "2024-01-12T14:15:00Z",
          updatedAt: "2024-01-12T14:15:00Z",
        },
      ],
    },

    // =====================================
    // SPRINTS
    // =====================================
    {
      id: "sprint",
      name: "Sprint",
      description: "Sprints Scrum avec capacity planning et métriques",
      icon: <Clock className="w-5 h-5" />,
      category: "Sprints",
      color: "orange",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom du sprint",
        },
        {
          name: "goal",
          type: "String?",
          nullable: true,
          description: "Objectif du sprint",
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description",
        },
        {
          name: "startDate",
          type: "DateTime",
          nullable: false,
          description: "Date de début",
        },
        {
          name: "endDate",
          type: "DateTime",
          nullable: false,
          description: "Date de fin",
        },
        {
          name: "status",
          type: "SprintStatus",
          nullable: false,
          defaultValue: "PLANNED",
          description: "Statut du sprint",
        },
        {
          name: "capacity",
          type: "Int?",
          nullable: true,
          description: "Capacité en story points",
        },
        {
          name: "velocity",
          type: "Float?",
          nullable: true,
          description: "Vélocité réelle",
        },
        {
          name: "burndownData",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Données burndown chart",
        },
        {
          name: "retrospective",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Données rétrospective",
        },
        {
          name: "projectId",
          type: "String",
          nullable: false,
          description: "Référence projet",
          isForeignKey: true,
          relatedTable: "Project",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "Project",
          field: "project",
          description: "Projet parent",
        },
        {
          type: "many-to-many",
          targetTable: "UserStory",
          field: "userStories",
          description: "User stories du sprint",
        },
        {
          type: "one-to-many",
          targetTable: "TimeEntry",
          field: "timeEntries",
          description: "Temps passé",
        },
        {
          type: "one-to-many",
          targetTable: "File",
          field: "files",
          description: "Fichiers du sprint",
        },
      ],
      examples: [
        {
          id: "spr_8vB5nR2pK6sL9xT",
          name: "Sprint 1 - Authentication Foundation",
          goal: "Implémenter les bases de l'authentification utilisateur avec OAuth",
          description:
            "Premier sprint focalisé sur la mise en place de l'infrastructure d'authentification",
          startDate: "2024-01-15T09:00:00Z",
          endDate: "2024-01-28T18:00:00Z",
          status: "ACTIVE",
          capacity: 40,
          velocity: null,
          burndownData: {
            planned: [40, 35, 30, 25, 20, 15, 10, 5, 0],
            actual: [40, 38, 33, 28, 25, 18],
            dates: [
              "2024-01-15",
              "2024-01-16",
              "2024-01-17",
              "2024-01-18",
              "2024-01-19",
              "2024-01-22",
            ],
          },
          retrospective: null,
          projectId: "prj_9mK4pS7vX2nL6qR",
          createdAt: "2024-01-10T15:00:00Z",
          updatedAt: "2024-01-15T17:00:00Z",
        },
      ],
    },

    // =====================================
    // COLLABORATION
    // =====================================
    {
      id: "comment",
      name: "Comment",
      description: "Commentaires temps réel avec mentions et threads",
      icon: <MessageSquare className="w-5 h-5" />,
      category: "Collaboration",
      color: "blue",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "content",
          type: "String",
          nullable: false,
          description: "Contenu du commentaire",
        },
        {
          name: "mentions",
          type: "String[]",
          nullable: false,
          defaultValue: "[]",
          description: "IDs utilisateurs mentionnés",
        },
        {
          name: "authorId",
          type: "String",
          nullable: false,
          description: "Auteur",
          isForeignKey: true,
          relatedTable: "User",
        },
        {
          name: "taskId",
          type: "String?",
          nullable: true,
          description: "Tâche commentée",
          isForeignKey: true,
          relatedTable: "Task",
        },
        {
          name: "userStoryId",
          type: "String?",
          nullable: true,
          description: "User story commentée",
          isForeignKey: true,
          relatedTable: "UserStory",
        },
        {
          name: "fileId",
          type: "String?",
          nullable: true,
          description: "Fichier commenté",
          isForeignKey: true,
          relatedTable: "File",
        },
        {
          name: "parentCommentId",
          type: "String?",
          nullable: true,
          description: "Commentaire parent",
          isForeignKey: true,
          relatedTable: "Comment",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "User",
          field: "author",
          description: "Auteur du commentaire",
        },
        {
          type: "many-to-one",
          targetTable: "Task",
          field: "task",
          description: "Tâche (optionnel)",
        },
        {
          type: "many-to-one",
          targetTable: "UserStory",
          field: "userStory",
          description: "User story (optionnel)",
        },
        {
          type: "many-to-one",
          targetTable: "File",
          field: "file",
          description: "Fichier (optionnel)",
        },
        {
          type: "many-to-one",
          targetTable: "Comment",
          field: "parentComment",
          description: "Commentaire parent (thread)",
        },
        {
          type: "one-to-many",
          targetTable: "Comment",
          field: "replies",
          description: "Réponses",
        },
      ],
      examples: [
        {
          id: "cmt_3wB8nL5pK2xT9vR",
          content:
            "@sarah.martin Peux-tu valider la configuration OAuth avant que je passe aux tests ? Les scopes semblent corrects mais je veux être sûr.",
          mentions: ["usr_8wXm2L6vP9qS4nB"],
          authorId: "usr_2yBq7K8mN3pR5xZ",
          taskId: "tsk_4wL9pS2vT8xN6mR",
          userStoryId: null,
          fileId: null,
          parentCommentId: null,
          createdAt: "2024-01-15T14:30:00Z",
          updatedAt: "2024-01-15T14:30:00Z",
        },
        {
          id: "cmt_7nK4pS9vX6qL2rT",
          content:
            "Parfait ! La configuration semble bonne. Tu peux procéder aux tests. N'oublie pas de tester la déconnexion aussi.",
          mentions: [],
          authorId: "usr_8wXm2L6vP9qS4nB",
          taskId: "tsk_4wL9pS2vT8xN6mR",
          userStoryId: null,
          fileId: null,
          parentCommentId: "cmt_3wB8nL5pK2xT9vR",
          createdAt: "2024-01-15T14:45:00Z",
          updatedAt: "2024-01-15T14:45:00Z",
        },
      ],
    },

    // =====================================
    // FILES
    // =====================================
    {
      id: "file",
      name: "File",
      description: "Gestion de fichiers avec versioning et hiérarchie",
      icon: <FileText className="w-5 h-5" />,
      category: "Files",
      color: "gray",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "name",
          type: "String",
          nullable: false,
          description: "Nom du fichier/dossier",
        },
        {
          name: "originalName",
          type: "String",
          nullable: false,
          description: "Nom original",
        },
        {
          name: "type",
          type: "FileType",
          nullable: false,
          description: "Type de fichier",
        },
        {
          name: "mimeType",
          type: "String",
          nullable: false,
          description: "Type MIME",
        },
        {
          name: "size",
          type: "Int",
          nullable: false,
          description: "Taille en bytes",
        },
        {
          name: "url",
          type: "String",
          nullable: false,
          description: "URL de stockage",
        },
        {
          name: "path",
          type: "String?",
          nullable: true,
          description: "Chemin système",
        },
        {
          name: "version",
          type: "Int",
          nullable: false,
          defaultValue: "1",
          description: "Version du fichier",
        },
        {
          name: "isPublic",
          type: "Boolean",
          nullable: false,
          defaultValue: "false",
          description: "Fichier public",
        },
        {
          name: "isFolder",
          type: "Boolean",
          nullable: false,
          defaultValue: "false",
          description: "Est un dossier",
        },
        {
          name: "metadata",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Métadonnées",
        },
        {
          name: "tags",
          type: "String[]",
          nullable: false,
          defaultValue: "[]",
          description: "Tags",
        },
        {
          name: "uploaderId",
          type: "String",
          nullable: false,
          description: "Uploader",
          isForeignKey: true,
          relatedTable: "User",
        },
        {
          name: "parentId",
          type: "String?",
          nullable: true,
          description: "Dossier parent",
          isForeignKey: true,
          relatedTable: "File",
        },
        {
          name: "projectId",
          type: "String?",
          nullable: true,
          description: "Projet (optionnel)",
          isForeignKey: true,
          relatedTable: "Project",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "User",
          field: "uploader",
          description: "Utilisateur qui a uploadé",
        },
        {
          type: "many-to-one",
          targetTable: "File",
          field: "parent",
          description: "Dossier parent",
        },
        {
          type: "one-to-many",
          targetTable: "File",
          field: "children",
          description: "Fichiers enfants",
        },
        {
          type: "many-to-one",
          targetTable: "Project",
          field: "project",
          description: "Projet (optionnel)",
        },
        {
          type: "one-to-many",
          targetTable: "FileVersion",
          field: "versions",
          description: "Versions du fichier",
        },
        {
          type: "one-to-many",
          targetTable: "Comment",
          field: "comments",
          description: "Commentaires",
        },
      ],
      examples: [
        {
          id: "fil_6rT5nK8mP3qX9vB",
          name: "Documentation",
          originalName: "Documentation",
          type: "FOLDER",
          mimeType: "folder",
          size: 0,
          url: "",
          path: "/projects/ecom/docs",
          version: 1,
          isPublic: false,
          isFolder: true,
          metadata: { description: "Documentation du projet e-commerce" },
          tags: ["documentation", "projet"],
          uploaderId: "usr_2yBq7K8mN3pR5xZ",
          parentId: null,
          projectId: "prj_9mK4pS7vX2nL6qR",
          createdAt: "2024-01-10T12:00:00Z",
          updatedAt: "2024-01-10T12:00:00Z",
        },
        {
          id: "fil_4wL9pS2vT8xN6mR",
          name: "api-specifications.pdf",
          originalName: "API Specifications v1.2.pdf",
          type: "DOCUMENT",
          mimeType: "application/pdf",
          size: 2048576,
          url: "https://storage.projectmanager.com/files/api-spec-v12.pdf",
          path: "/projects/ecom/docs/api-spec-v12.pdf",
          version: 2,
          isPublic: false,
          isFolder: false,
          metadata: {
            author: "Jean-Philippe Dubois",
            createdWith: "OpenAPI Generator",
            lastModified: "2024-01-15T10:30:00Z",
          },
          tags: ["api", "documentation", "specifications"],
          uploaderId: "usr_2yBq7K8mN3pR5xZ",
          parentId: "fil_6rT5nK8mP3qX9vB",
          projectId: "prj_9mK4pS7vX2nL6qR",
          createdAt: "2024-01-12T16:00:00Z",
          updatedAt: "2024-01-15T10:30:00Z",
        },
      ],
    },

    // =====================================
    // ANALYTICS
    // =====================================
    {
      id: "timeEntry",
      name: "TimeEntry",
      description: "Suivi du temps passé sur les tâches et user stories",
      icon: <Clock className="w-5 h-5" />,
      category: "Analytics",
      color: "pink",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "description",
          type: "String?",
          nullable: true,
          description: "Description du travail effectué",
        },
        {
          name: "hours",
          type: "Float",
          nullable: false,
          description: "Nombre d'heures",
        },
        {
          name: "date",
          type: "DateTime",
          nullable: false,
          description: "Date du travail",
        },
        {
          name: "startTime",
          type: "DateTime?",
          nullable: true,
          description: "Heure de début",
        },
        {
          name: "endTime",
          type: "DateTime?",
          nullable: true,
          description: "Heure de fin",
        },
        {
          name: "isManual",
          type: "Boolean",
          nullable: false,
          defaultValue: "true",
          description: "Saisie manuelle",
        },
        {
          name: "userId",
          type: "String",
          nullable: false,
          description: "Utilisateur",
          isForeignKey: true,
          relatedTable: "User",
        },
        {
          name: "taskId",
          type: "String?",
          nullable: true,
          description: "Tâche (optionnel)",
          isForeignKey: true,
          relatedTable: "Task",
        },
        {
          name: "userStoryId",
          type: "String?",
          nullable: true,
          description: "User story (optionnel)",
          isForeignKey: true,
          relatedTable: "UserStory",
        },
        {
          name: "sprintId",
          type: "String?",
          nullable: true,
          description: "Sprint (optionnel)",
          isForeignKey: true,
          relatedTable: "Sprint",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "User",
          field: "user",
          description: "Utilisateur",
        },
        {
          type: "many-to-one",
          targetTable: "Task",
          field: "task",
          description: "Tâche (optionnel)",
        },
        {
          type: "many-to-one",
          targetTable: "UserStory",
          field: "userStory",
          description: "User story (optionnel)",
        },
        {
          type: "many-to-one",
          targetTable: "Sprint",
          field: "sprint",
          description: "Sprint (optionnel)",
        },
      ],
      examples: [
        {
          id: "te_8vB5nR2pK6sL9xT",
          description: "Configuration OAuth Google et tests unitaires",
          hours: 3.5,
          date: "2024-01-15T00:00:00Z",
          startTime: "2024-01-15T09:00:00Z",
          endTime: "2024-01-15T12:30:00Z",
          isManual: false,
          userId: "usr_2yBq7K8mN3pR5xZ",
          taskId: "tsk_4wL9pS2vT8xN6mR",
          userStoryId: "us_6rT5nK8mP3qX9vB",
          sprintId: "spr_8vB5nR2pK6sL9xT",
          createdAt: "2024-01-15T12:30:00Z",
          updatedAt: "2024-01-15T12:30:00Z",
        },
      ],
    },

    {
      id: "notification",
      name: "Notification",
      description: "Notifications intelligentes multi-canaux",
      icon: <Shield className="w-5 h-5" />,
      category: "Analytics",
      color: "pink",
      fields: [
        {
          name: "id",
          type: "String",
          nullable: false,
          description: "Identifiant unique",
          isPrimaryKey: true,
        },
        {
          name: "type",
          type: "NotificationType",
          nullable: false,
          description: "Type de notification",
        },
        {
          name: "title",
          type: "String",
          nullable: false,
          description: "Titre",
        },
        {
          name: "message",
          type: "String",
          nullable: false,
          description: "Message",
        },
        {
          name: "data",
          type: "Json?",
          nullable: true,
          defaultValue: "{}",
          description: "Données contextuelles",
        },
        {
          name: "read",
          type: "Boolean",
          nullable: false,
          defaultValue: "false",
          description: "Lu",
        },
        {
          name: "readAt",
          type: "DateTime?",
          nullable: true,
          description: "Date de lecture",
        },
        {
          name: "userId",
          type: "String",
          nullable: false,
          description: "Destinataire",
          isForeignKey: true,
          relatedTable: "User",
        },
      ],
      relations: [
        {
          type: "many-to-one",
          targetTable: "User",
          field: "user",
          description: "Utilisateur destinataire",
        },
      ],
      examples: [
        {
          id: "not_5rT8nK3mP7qX2vB",
          type: "MENTION",
          title: "Mention dans un commentaire",
          message:
            'Jean-Philippe vous a mentionné dans un commentaire sur la tâche "Configurer Google OAuth"',
          data: {
            commentId: "cmt_3wB8nL5pK2xT9vR",
            taskId: "tsk_4wL9pS2vT8xN6mR",
            mentionedBy: "usr_2yBq7K8mN3pR5xZ",
            url: "/projects/ecom/tasks/tsk_4wL9pS2vT8xN6mR#comment-cmt_3wB8nL5pK2xT9vR",
          },
          read: false,
          readAt: null,
          userId: "usr_8wXm2L6vP9qS4nB",
          createdAt: "2024-01-15T14:30:00Z",
        },
      ],
    },
  ];

  // Filtrage des tables
  const filteredTables = tables.filter((table) => {
    const matchesCategory =
      selectedCategory === "all" || table.category === selectedCategory;
    const matchesSearch =
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Catégories uniques
  const categories = [
    "all",
    ...Array.from(new Set(tables.map((table) => table.category))),
  ];

  // Toggle expand table
  const toggleExpanded = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  // Couleurs par catégorie
  const getCategoryColor = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      purple: "from-purple-500 to-purple-600",
      green: "from-green-500 to-green-600",
      indigo: "from-indigo-500 to-indigo-600",
      orange: "from-orange-500 to-orange-600",
      pink: "from-pink-500 to-pink-600",
      gray: "from-gray-500 to-gray-600",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getFieldTypeColor = (type: string) => {
    if (type.includes("String")) return "text-blue-600 bg-blue-50";
    if (type.includes("Int") || type.includes("Float"))
      return "text-green-600 bg-green-50";
    if (type.includes("Boolean")) return "text-purple-600 bg-purple-50";
    if (type.includes("DateTime")) return "text-orange-600 bg-orange-50";
    if (type.includes("Json")) return "text-indigo-600 bg-indigo-50";
    return "text-gray-600 bg-gray-50";
  };

  const getRelationTypeColor = (type: string) => {
    const colors = {
      "one-to-many": "text-blue-600 bg-blue-50",
      "many-to-one": "text-green-600 bg-green-50",
      "many-to-many": "text-purple-600 bg-purple-50",
    };
    return colors[type as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Schema Documentation
                </h1>
                <p className="text-gray-600">
                  Documentation interactive du schéma de base de données
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-700">
                  {filteredTables.length} tables
                </span>
              </div>
              <button
                onClick={() => setShowRelations(!showRelations)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showRelations
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {showRelations ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Relations</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Toutes les catégories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="space-y-6">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Table Header */}
              <div
                className={`p-6 bg-gradient-to-r ${getCategoryColor(
                  table.color
                )} text-white cursor-pointer`}
                onClick={() => toggleExpanded(table.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      {table.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{table.name}</h3>
                      <p className="text-white/90 text-sm">
                        {table.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-white/80">Catégorie</div>
                      <div className="font-semibold">{table.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/80">Champs</div>
                      <div className="font-semibold">{table.fields.length}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/80">Relations</div>
                      <div className="font-semibold">
                        {table.relations.length}
                      </div>
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center">
                      {expandedTables.has(table.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Content */}
              {expandedTables.has(table.id) && (
                <div className="p-6 space-y-6">
                  {/* Fields */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Hash className="w-5 h-5 mr-2 text-gray-500" />
                      Champs ({table.fields.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                              Nom
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                              Type
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                              Nullable
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                              Défaut
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                              Description
                            </th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">
                              Clés
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {table.fields.map((field) => (
                            <tr key={field.name} className="hover:bg-gray-50">
                              <td className="py-2 px-3">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {field.name}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getFieldTypeColor(
                                    field.type
                                  )}`}
                                >
                                  {field.type}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${
                                    field.nullable
                                      ? "text-orange-600 bg-orange-50"
                                      : "text-green-600 bg-green-50"
                                  }`}
                                >
                                  {field.nullable ? "Nullable" : "Required"}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                {field.defaultValue ? (
                                  <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {field.defaultValue}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-sm text-gray-600">
                                {field.description}
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex space-x-1">
                                  {field.isPrimaryKey && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md text-blue-600 bg-blue-50">
                                      PK
                                    </span>
                                  )}
                                  {field.isForeignKey && (
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md text-purple-600 bg-purple-50">
                                      FK
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Relations */}
                  {showRelations && table.relations.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Link className="w-5 h-5 mr-2 text-gray-500" />
                        Relations ({table.relations.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {table.relations.map((relation, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getRelationTypeColor(
                                  relation.type
                                )}`}
                              >
                                {relation.type}
                              </span>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="font-medium text-gray-900 mb-1">
                              {relation.field} → {relation.targetTable}
                            </div>
                            <div className="text-sm text-gray-600">
                              {relation.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Database className="w-5 h-5 mr-2 text-gray-500" />
                      Exemples de données ({table.examples.length})
                    </h4>
                    <div className="space-y-4">
                      {table.examples.map((example, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Exemple {index + 1}
                            </span>
                          </div>
                          <pre className="text-xs text-gray-800 overflow-x-auto">
                            {JSON.stringify(example, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune table trouvée
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Documentation générée automatiquement à partir du schéma Prisma
            </div>
            <div>
              {tables.length} tables •{" "}
              {tables.reduce((acc, table) => acc + table.fields.length, 0)}{" "}
              champs total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
