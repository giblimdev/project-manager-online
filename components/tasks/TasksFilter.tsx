// components/tasks/TasksFilter.tsx

import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatus, Priority } from "@/lib/generated/prisma/client";

interface TasksFilterProps {
  filter: {
    search: string;
    status: TaskStatus | "ALL";
    priority: Priority | "ALL";
  };
  onFilterChange: (filter: {
    search: string;
    status: TaskStatus | "ALL";
    priority: Priority | "ALL";
  }) => void; 
}

const statusOptions: { value: TaskStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CODE_REVIEW", label: "Code Review" },
  { value: "TESTING", label: "Testing" },
  { value: "DONE", label: "Done" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "CANCELLED", label: "Cancelled" },
];

const priorityOptions: { value: Priority | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Priorities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export default function TasksFilter({ 
  filter, 
  onFilterChange 
}: TasksFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Input
        placeholder="Search by title or description..."
        value={filter.search}
        onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
      />
      
      <Select
        value={filter.status}
        onValueChange={(value) => 
          onFilterChange({ ...filter, status: value as TaskStatus | "ALL" })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={filter.priority}
        onValueChange={(value) => 
          onFilterChange({ ...filter, priority: value as Priority | "ALL" })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}