//@/app/projects/tasks/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useProjectStore } from "@/stores/useSelectedProjectStore";
import TasksDisplay from "@/components/tasks/TasksDisplay";
import TasksFilter from "@/components/tasks/TasksFilter";
import TasksList from "@/components/tasks/TasksList";
import TaskForm from "@/components/tasks/TasksForm";
import { Task, TaskStatus, Priority } from "@/lib/generated/prisma/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";

interface TaskFilter {
  search: string;
  status: TaskStatus | "ALL";
  priority: Priority | "ALL";
}

export default function ProjectTasksPage() {
  const { projectData, selectedProjectId } = useProjectStore();
  const { data: session, isPending, error: sessionError } = useSession();

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

  // Check if user is authenticated
  const isAuthenticated = !isPending && !!session?.user;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  // Handle task creation
  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
  }) => {
    if (!selectedProjectId) return;

    // Check if user is authenticated and session data is available
    if (!isAuthenticated || !session?.user?.id) {
      toast.error("Vous devez être connecté pour créer une tâche.");
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskData,
          projectId: selectedProjectId,
          creatorId: session.user.id,
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
          prev.map(task => (task.id === id ? { ...task, ...updateData } : task))
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

  // FILTRAGE
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(filter.search.toLowerCase()));
    const matchesStatus =
      filter.status === "ALL" || task.status === filter.status;
    const matchesPriority =
      filter.priority === "ALL" || task.priority === filter.priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Open form only if user is authenticated
  const handleOpenForm = () => {
    if (!isAuthenticated || !session?.user?.id) {
      toast.error("Vous devez être connecté pour créer une tâche.");
      return;
    }
    setIsFormOpen(true);
  };

  // Show loading state while session is loading
  if (isPending) {
    return <div className="container mx-auto p-6">Loading session...</div>;
  }

  // Show session error if any
  if (sessionError) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-500">Session error: {sessionError.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Tasks for Project: {projectData?.name}
        </h1>
        <Button 
          onClick={handleOpenForm} 
          disabled={!isAuthenticated || !session?.user?.id}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <TasksFilter
        filter={filter}
        onFilterChange={setFilter}
      />

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>
          <div>Error loading tasks</div>
          <div>{error}</div>
        </div>
      ) : (
        <TasksList
          tasks={filteredTasks}
          displayMode={displayMode}
          onEdit={task => {
            setIsFormOpen(true);
            setEditingTask(task);
          }}
          onDelete={handleDeleteTask}
        />
      )}

      <TaskForm
        open={isFormOpen}
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
