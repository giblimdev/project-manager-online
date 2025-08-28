// components/tasks/TaskForm.tsx

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Task, TaskStatus, Priority } from "@/lib/generated/prisma/client";
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Code, 
  Bug, 
  XCircle,
  Flame, 
  ArrowUp, 
  Minus, 
  ArrowDown 
} from "lucide-react";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  userId?: string;
  onCreate: (taskData: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: Priority;
  }) => void;
  onUpdate: (id: string, updateData: Partial<Task>) => void;
}

const statusOptions: { value: TaskStatus; label: string; icon: any; color: string }[] = [
  { value: "TODO", label: "To Do", icon: Clock, color: "bg-gray-200 text-gray-700" },
  { value: "IN_PROGRESS", label: "In Progress", icon: Code, color: "bg-blue-200 text-blue-700" },
  { value: "CODE_REVIEW", label: "Code Review", icon: AlertCircle, color: "bg-purple-200 text-purple-700" },
  { value: "TESTING", label: "Testing", icon: Bug, color: "bg-yellow-200 text-yellow-700" },
  { value: "DONE", label: "Done", icon: CheckCircle, color: "bg-green-200 text-green-700" },
  { value: "BLOCKED", label: "Blocked", icon: XCircle, color: "bg-red-200 text-red-700" },
  { value: "CANCELLED", label: "Cancelled", icon: XCircle, color: "bg-gray-300 text-gray-700" }
];

const priorityOptions: { value: Priority; label: string; icon: any; color: string }[] = [
  { value: "CRITICAL", label: "Critical", icon: Flame, color: "bg-red-200 text-red-700" },
  { value: "HIGH", label: "High", icon: ArrowUp, color: "bg-orange-200 text-orange-700" },
  { value: "MEDIUM", label: "Medium", icon: Minus, color: "bg-yellow-200 text-yellow-700" },
  { value: "LOW", label: "Low", icon: ArrowDown, color: "bg-green-200 text-green-700" }
];

export default function TaskForm({
  open,
  onClose,
  task,
  userId,
  onCreate,
  onUpdate
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "TODO");
  const [priority, setPriority] = useState<Priority>(task?.priority || "MEDIUM");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
    } else {
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
    }
  }, [task]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority
    };
    if (task) {
      onUpdate(task.id, taskData);
    } else {
      onCreate(taskData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] h-[90vh] flex flex-col p-0 rounded-2xl shadow-xl">
        
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gray-50 rounded-t-2xl">
          <DialogTitle className="text-lg font-semibold">
            {task ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Title */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="min-h-[100px] resize-y"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as TaskStatus)}
            >
              <SelectTrigger>
                <SelectValue>
                  {statusOptions.find((s) => s.value === status) && (
                    <div className="flex items-center gap-2">
                      {React.createElement(statusOptions.find((s) => s.value === status)!.icon, { className: "w-4 h-4" })}
                      <span>{statusOptions.find((s) => s.value === status)!.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(({ value, label, icon: Icon, color }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <Badge className={`${color} font-medium px-2 py-0.5 rounded-md`}>
                        {label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as Priority)}
            >
              <SelectTrigger>
                <SelectValue>
                  {priorityOptions.find((p) => p.value === priority) && (
                    <div className="flex items-center gap-2">
                      {React.createElement(priorityOptions.find((p) => p.value === priority)!.icon, { className: "w-4 h-4" })}
                      <span>{priorityOptions.find((p) => p.value === priority)!.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(({ value, label, icon: Icon, color }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <Badge className={`${color} font-medium px-2 py-0.5 rounded-md`}>
                        {label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer fixé en bas */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl shrink-0 flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full sm:w-auto"
          >
            {task ? "Update Task" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
