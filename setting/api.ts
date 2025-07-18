//@/setting/api.ts
export const API_ROUTES = {
  // Authentification
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    PROFILE: "/auth/profile",
  },

  // Équipes
  TEAMS: {
    LIST: "/teams",
    CREATE: "/teams",
    DETAIL: (id: string) => `/teams/${id}`,
    UPDATE: (id: string) => `/teams/${id}`,
    DELETE: (id: string) => `/teams/${id}`,
    MEMBERS: (id: string) => `/teams/${id}/members`,
  },

  // Projets
  PROJECTS: {
    LIST: "/projects",
    CREATE: "/projects",
    DETAIL: (id: string) => `/projects/${id}`,
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    MEMBERS: (id: string) => `/projects/${id}/members`,
    SETTINGS: (id: string) => `/projects/${id}/settings`,
  },

  // Items (Initiatives, Épics, Features, User Stories, Tasks)
  ITEMS: {
    LIST: "/items",
    CREATE: "/items",
    DETAIL: (id: string) => `/items/${id}`,
    UPDATE: (id: string) => `/items/${id}`,
    DELETE: (id: string) => `/items/${id}`,
    REORDER: (id: string) => `/items/${id}/reorder`,
    ASSIGNEES: (id: string) => `/items/${id}/assignees`,
  },

  // Sprints
  SPRINTS: {
    LIST: "/sprints",
    CREATE: "/sprints",
    DETAIL: (id: string) => `/sprints/${id}`,
    UPDATE: (id: string) => `/sprints/${id}`,
    DELETE: (id: string) => `/sprints/${id}`,
    START: (id: string) => `/sprints/${id}/start`,
    COMPLETE: (id: string) => `/sprints/${id}/complete`,
  },

  // Fichiers
  FILES: {
    LIST: "/files",
    UPLOAD: "/files/upload",
    DETAIL: (id: string) => `/files/${id}`,
    DELETE: (id: string) => `/files/${id}`,
    DOWNLOAD: (id: string) => `/files/${id}/download`,
  },

  // Commentaires
  COMMENTS: {
    LIST: "/comments",
    CREATE: "/comments",
    UPDATE: (id: string) => `/comments/${id}`,
    DELETE: (id: string) => `/comments/${id}`,
  },

  // Analytics
  ANALYTICS: {
    DASHBOARD: "/analytics/dashboard",
    VELOCITY: "/analytics/velocity",
    BURNDOWN: "/analytics/burndown",
    REPORTS: "/analytics/reports",
  },
} as const;

// Types pour la sécurité TypeScript
export type ApiRoute = typeof API_ROUTES;
export type RouteKey = keyof ApiRoute;
