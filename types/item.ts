// types/item.ts
// Types TypeScript pour les items
export type ViewMode = "list" | "card" | "tree" | "kanban";

export interface Item {
  assignees: any;
  title: any;
  id: string;
  type: string;
  name: string;
  description?: string;
  objective?: string;
  slug: string;
  key?: string;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  acceptanceCriteria?: string;
  storyPoints?: number;
  businessValue?: number;
  technicalRisk?: number;
  effort?: number;
  progress?: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "ON_HOLD";
  visibility: "PRIVATE" | "PUBLIC" | "INTERNAL";
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  text?: Record<string, any>;
  backlogPosition?: number;
  DoD?: string;
  isActive: boolean;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  teamId: string;
  parentId?: string;
  children?: Item[];
  sprintId?: string;
}
