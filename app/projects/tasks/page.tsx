// app/projects/tasks/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/stores/useSelectedProjectStore";
import TasksDisplay from "@/components/tasks/TasksDisplay";
import TasksFilter from "@/components/tasks/TasksFilter";
import TasksList from "@/components/tasks/TasksList";
import TaskForm from "@/components/tasks/TasksForm"
import { Task, TaskStatus, Priority } from "@/lib/generated/prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface TaskFilter {
  search: string;
  status: TaskStatus | "ALL";
  priority: Priority | "ALL";
}

export default function ProjectTasksPage() {
  const { projectData, selectedProjectId } = useProjectStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>({
    search: "",
    status: "ALL",
    priority: "ALL",
  });
  const [displayMode, setDisplayMode] = useState<"list" | "table">("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch tasks for current project
  const fetchTasks = async () => {
    if (!selectedProjectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks?projectId=${selectedProjectId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      
      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
      } else {
        throw new Error(result.error || "Error loading tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) fetchTasks();
  }, [selectedProjectId]);

  // Handle task creation
  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
  }) => {
    if (!selectedProjectId) return;
    
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          projectId: selectedProjectId,
          creatorId: "currentUserId", // Replace with actual user ID
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        setTasks(prev => [...prev, result.data]);
        toast.success("Task created successfully");
        setIsFormOpen(false);
      } else {
        throw new Error(result.error || "Error creating task");
      }
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Handle task update
  const handleUpdateTask = async (id: string, updateData: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      
      const result = await response.json();
      if (result.success) {
        setTasks(prev => 
          prev.map(task => task.id === id ? { ...task, ...updateData } : task)
        );
        toast.success("Task updated successfully");
        setEditingTask(null);
      } else {
        throw new Error(result.error || "Error updating task");
      }
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const result = await response.json();
      
      if (result.success) {
        setTasks(prev => prev.filter(task => task.id !== id));
        toast.success("Task deleted successfully");
      } else {
        throw new Error(result.error || "Error deleting task");
      }
    } catch (err) {
      toast.error("Error", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Filter tasks based on filter criteria
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(filter.search.toLowerCase()) || 
                          (task.description && task.description.toLowerCase().includes(filter.search.toLowerCase()));
    const matchesStatus = filter.status === "ALL" || task.status === filter.status;
    const matchesPriority = filter.priority === "ALL" || task.priority === filter.priority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Tasks for Project: {projectData?.name}
        </h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <TasksFilter 
        filter={filter} 
        onFilterChange={setFilter} 
      />
      
      <TasksDisplay 
        displayMode={displayMode} 
        onDisplayModeChange={setDisplayMode} 
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p className="font-bold">Error loading tasks</p>
          <p>{error}</p>
        </div>
      ) : (
        <TasksList 
          tasks={filteredTasks} 
          displayMode={displayMode}
          onEdit={setEditingTask}
          onDelete={handleDeleteTask}
        />
      )}

      <TaskForm
        open={isFormOpen || !!editingTask}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onCreate={handleCreateTask}
        onUpdate={handleUpdateTask}
      />
    </div>
  );
}