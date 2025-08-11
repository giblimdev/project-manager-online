// @/components/userStories/views/UserStoriesViewList.tsx

/*
 * Template de vue liste pour User Stories (MISE À JOUR)
 * Rôle : Composant de présentation pure pour affichage en liste.
 * Responsabilités :
 * - Définit l'apparence d'un item dans une liste.
 * - Utilise les types partagés depuis @/types/userStories.ts.
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Users,
  Clock,
  Target,
  MessageSquare,
  Paperclip,
  Copy,
} from "lucide-react";

// ✅ Import des types et configurations partagés
import {
  UserStoryData,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "@/types/userStories";

// ✅ Props interface pour la vue (partageable entre list et card)
export interface UserStoriesViewProps {
  userStory: UserStoryData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canReorder?: boolean;
  canDuplicate?: boolean;
  isLoading?: boolean;
}

const UserStoriesViewList: React.FC<UserStoriesViewProps> = ({
  userStory,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canEdit = false,
  canDelete = false,
  canReorder = false,
  canDuplicate = false,
  isLoading = false,
}) => {
  const statusConfig = STATUS_CONFIG[userStory.status];
  const priorityConfig = PRIORITY_CONFIG[userStory.priority];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900 truncate">
              {userStory.title}
            </h3>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <Badge variant={priorityConfig.variant}>
              {priorityConfig.label}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Feature:</span>{" "}
            {userStory.feature.name}
            {userStory.description && (
              <span className="ml-2 text-gray-500">
                — {userStory.description.substring(0, 100)}
                {userStory.description.length > 100 ? "..." : ""}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-4 text-xs text-gray-500">
            {userStory.storyPoints != null && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{userStory.storyPoints} pts</span>
              </div>
            )}
            {userStory.estimatedHours != null && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{userStory.estimatedHours}h</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              {userStory._count.tasks > 0 && (
                <span>{userStory._count.tasks} tâche(s)</span>
              )}
              {userStory._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{userStory._count.comments}</span>
                </div>
              )}
              {userStory._count.files > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  <span>{userStory._count.files}</span>
                </div>
              )}
            </div>
            {userStory.UserStoryAssignees.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <div className="flex -space-x-1">
                  {userStory.UserStoryAssignees.slice(0, 3).map((assignee) => (
                    <Tooltip key={assignee.users.id}>
                      <TooltipTrigger>
                        <Avatar className="h-5 w-5 border border-white">
                          <AvatarImage
                            src={assignee.users.image || undefined}
                          />
                          <AvatarFallback className="text-xs">
                            {assignee.users.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{assignee.users.name || assignee.users.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {userStory.UserStoryAssignees.length > 3 && (
                    <div className="h-5 w-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-xs">
                      +{userStory.UserStoryAssignees.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-4">
          {canReorder && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMoveUp}
                    disabled={!onMoveUp || isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Monter</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMoveDown}
                    disabled={!onMoveDown || isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descendre</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          {canDuplicate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDuplicate}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dupliquer</p>
              </TooltipContent>
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Modifier</p>
              </TooltipContent>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  disabled={isLoading}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Supprimer</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default UserStoriesViewList;
