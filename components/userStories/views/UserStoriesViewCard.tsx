// @/components/userStories/views/UserStoriesViewCard.tsx

/*
 * Template de vue carte pour User Stories (MISE À JOUR)
 * Rôle : Composant de présentation pure pour affichage en cartes.
 * Responsabilités :
 * - Définit l'apparence d'une carte.
 * - Utilise les types partagés depuis @/types/userStories.ts.
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  TrendingUp,
  AlertTriangle,
  Calendar,
  Copy,
} from "lucide-react";

// ✅ Import des types et configurations partagés
import {
  UserStoryData,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from "@/types/userStories";
import { UserStoriesViewProps } from "./UserStoriesViewList"; // Réutilise la même interface de props

const UserStoriesViewCard: React.FC<UserStoriesViewProps> = ({
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
  const priorityConfig = PRIORITY_CONFIG[userStory.priority];
  const statusConfig = STATUS_CONFIG[userStory.status];

  return (
    <TooltipProvider>
      <Card
        className={`h-full flex flex-col transition-all duration-200 hover:shadow-md ${priorityConfig.borderColor} border-l-4`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 pr-2">
              {userStory.title}
            </h3>
            <div className="flex items-center gap-1">
              {canDuplicate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDuplicate}
                      disabled={isLoading}
                      className="h-6 w-6"
                    >
                      <Copy className="h-3.5 w-3.5" />
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
                      size="icon"
                      onClick={onEdit}
                      disabled={isLoading}
                      className="h-6 w-6"
                    >
                      <Edit className="h-3.5 w-3.5" />
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
                      size="icon"
                      onClick={onDelete}
                      disabled={isLoading}
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supprimer</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={statusConfig.variant} className="text-xs">
              {statusConfig.label}
            </Badge>
            <Badge variant={priorityConfig.variant} className="text-xs">
              {priorityConfig.label}
            </Badge>
          </div>
          <Progress value={statusConfig.progress} className="h-1" />
        </CardHeader>

        <CardContent className="flex-1 pt-0 text-sm">
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-1">Feature</div>
            <div className="font-medium text-gray-700">
              {userStory.feature.name}
            </div>
          </div>
          {userStory.description && (
            <p className="text-gray-600 line-clamp-3 mb-3">
              {userStory.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            {userStory.storyPoints != null && (
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-medium">{userStory.storyPoints}</span>
                <span className="text-gray-500">pts</span>
              </div>
            )}
            {userStory.estimatedHours != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-green-500" />
                <span className="font-medium">{userStory.estimatedHours}</span>
                <span className="text-gray-500">h</span>
              </div>
            )}
            {userStory.businessValue != null && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                <span className="font-medium">{userStory.businessValue}</span>
                <span className="text-gray-500">val.</span>
              </div>
            )}
            {userStory.technicalRisk != null && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-medium">{userStory.technicalRisk}</span>
                <span className="text-gray-500">risk</span>
              </div>
            )}
          </div>
          {(userStory.labels.length > 0 || userStory.tags.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-3">
              {userStory.labels.slice(0, 3).map((label) => (
                <Badge key={label} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
              {userStory.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 flex justify-between items-center">
          {userStory.UserStoryAssignees.length > 0 ? (
            <div className="flex -space-x-2">
              {userStory.UserStoryAssignees.slice(0, 4).map((assignee) => (
                <Tooltip key={assignee.users.id}>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6 border-2 border-white">
                      <AvatarImage src={assignee.users.image || undefined} />
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
              {userStory.UserStoryAssignees.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                  +{userStory.UserStoryAssignees.length - 4}
                </div>
              )}
            </div>
          ) : (
            <div></div>
          )}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(userStory.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
};

export default UserStoriesViewCard;
