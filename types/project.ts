// types/project.ts
import type {
  Project,
  ProjectMember,
  User,
  Initiative,
  Epic,
  Feature,
  UserStory,
  Task,
  Sprint,
  File,
  Channel,
  Template,
} from "@/lib/generated/prisma/client";

export interface ProjectWithRelations extends Project {
  user: User[];
  members: (ProjectMember & {
    user: User;
  })[];
  initiatives?: Initiative[];
  epics?: Epic[];
  features?: Feature[];
  userStories?: UserStory[];
  tasks?: Task[];
  sprints?: Sprint[];
  files?: File[];
  channels?: Channel[];
  templates?: Template[];
  _count: {
    user: number;
    members: number;
    initiatives: number;
    epics: number;
    features: number;
    userStories: number;
    tasks: number;
    sprints: number;
    files: number;
    channels: number;
    templates: number;
  };
}

export interface WorkItemStats {
  initiatives: number;
  epics: number;
  features: number;
  userStories: number;
  tasks: number;
  sprints: number;
  files: number;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  cancelled: number;
}
