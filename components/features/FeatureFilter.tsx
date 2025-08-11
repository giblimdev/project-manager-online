//@/components/features/FeatureFilter
"use client";
import { useState, useEffect } from "react";
import { FeatureWithRelations } from "@/types/feature";

export default function FeatureFilter({
  features,
  onFilter,
}: {
  features: FeatureWithRelations[];
  onFilter: (filtered: FeatureWithRelations[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    const filtered = features.filter((feature) => {
      const matchesSearch =
        feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        priorityFilter === "all" || feature.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
    onFilter(filtered);
  }, [searchTerm, priorityFilter, features, onFilter]);

  return (
    <div className="flex space-x-4">
      <input
        type="text"
        placeholder="Search features..."
        className="px-4 py-2 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select
        className="px-4 py-2 border rounded"
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
      >
        <option value="all">All Priorities</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>
  );
}
