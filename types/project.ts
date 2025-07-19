// types/project.ts
export interface ProjectWithRelations {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  key: string;
  order: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  visibility: string;
  settings: any;
  metadata: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations selon votre schéma Prisma User complet
  user: Array<{
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean; // ✅ Champ requis selon le schéma
    image: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    timezone?: string | null;
    preferences?: any;
    isActive: boolean;
    lastLoginAt?: Date | null;
    twoFactorEnabled?: boolean;
  }>;

  members: Array<{
    id: string;
    role:
      | "ADMIN"
      | "PRODUCT_OWNER"
      | "SCRUM_MASTER"
      | "DEVELOPER"
      | "STAKEHOLDER"
      | "VIEWER";
    joinedAt: Date;
    isActive: boolean;
    user: {
      id: string;
      name: string | null;
      email: string;
      emailVerified: boolean; // ✅ Champ requis
      image: string | null;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      bio?: string | null;
      timezone?: string | null;
      preferences?: any;
      isActive: boolean;
    };
  }>;

  _count?: {
    user?: number;
    members?: number;
    initiatives?: number;
    features?: number;
    sprints?: number;
    files?: number;
    channels?: number;
    templates?: number;
  };
}
