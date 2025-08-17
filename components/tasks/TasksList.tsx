// components/tasks/TasksList.tsx

import React from "react";
import { Task, TaskStatus, Priority } from "@/lib/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TasksListProps {
  tasks: Task[];
  displayMode: "list" | "table";
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder: (taskId: string, direction: 'up' | 'down') => void;
  projectId: string;
}

// Helper function for priority styling
const getPriorityBorderColor = (priority: Priority) => {
  switch (priority) {
    case "CRITICAL": return "border-l-4 border-red-500";
    case "HIGH": return "border-l-4 border-orange-500";
    case "MEDIUM": return "border-l-4 border-yellow-500";
    case "LOW": return "border-l-4 border-green-500";
    default: return "border-l-4 border-gray-300";
  }
};

// Helper function for status styling
const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "TODO": return "text-gray-500";
    case "IN_PROGRESS": return "text-blue-500";
    case "CODE_REVIEW": return "text-purple-500";
    case "TESTING": return "text-yellow-500";
    case "DONE": return "text-green-500";
    case "BLOCKED": return "text-red-500";
    case "CANCELLED": return "text-gray-300";
    default: return "";
  }
};

export default function TasksList({ 
  tasks, 
  displayMode, 
  onEdit, 
  onDelete,
  onReorder,
  projectId
}: TasksListProps) {
  
  const handleReorder = async (taskId: string, direction: 'up' | 'down') => {
    try {
      await onReorder(taskId, direction);
    } catch (error) {
      console.error('Failed to reorder task:', error);
    }
  };

  const canMoveUp = (index: number) => index > 0;
  const canMoveDown = (index: number) => index < tasks.length - 1;

  if (displayMode === "list") {
    return (
      <div className="space-y-4">
        {tasks.map((task, index) => (
          <div 
            key={task.id}
            className={`p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${getPriorityBorderColor(task.priority)}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{task.title}</h3>
                  <div className="flex space-x-2">
                    {/* Reorder buttons */}
                    <div className="flex flex-col space-y-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleReorder(task.id, 'up')}
                        disabled={!canMoveUp(index)}
                        className="h-6 w-6 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                        title="Move up"
                      >
                        <ChevronUpIcon className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleReorder(task.id, 'down')}
                        disabled={!canMoveDown(index)}
                        className="h-6 w-6 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                        title="Move down"
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Edit and Delete buttons */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(task)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(task.id)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {task.description && (
                  <p className="mt-2 text-gray-600">{task.description}</p>
                )}
                
                <div className="flex items-center mt-3 space-x-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} bg-gray-100`}>
                    {task.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority: <span className="font-medium">{task.priority}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table view
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Order</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task, index) => (
            <TableRow key={task.id} className="hover:bg-gray-50">
              <TableCell className="font-medium py-3">
                <div className="font-medium">{task.title}</div>
                {task.description && (
                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </div>
                )}
              </TableCell>
              <TableCell className="py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} bg-gray-100`}>
                  {task.status.replace("_", " ")}
                </span>
              </TableCell>
              <TableCell className="py-3">
                <span className="font-medium">{task.priority}</span>
              </TableCell>
              <TableCell className="py-3">
                <span className="text-sm text-gray-600">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell className="py-3 text-center">
                <div className="flex flex-col items-center space-y-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleReorder(task.id, 'up')}
                    disabled={!canMoveUp(index)}
                    className="h-6 w-6 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUpIcon className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleReorder(task.id, 'down')}
                    disabled={!canMoveDown(index)}
                    className="h-6 w-6 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDownIcon className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="py-3 text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(task)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(task.id)}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {tasks.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No tasks found. Create your first task to get started.
        </div>
      )}
    </div> 
  );
}
