// @/components/features/FeatureDetail.tsx
// Rôle : Affichage détaillé d'une feature avec toutes ses relations
// Responsabilités : Vue complète, navigation, édition inline, gestion des relations

"use client";

import React, { useState, useEffect } from "react";
import { FeatureWithRelations } from "@/types/feature";
import FeatureForm from "./FeatureForm";

interface FeatureDetailProps {
  featureId: string;
  onBack?: () => void;
  onEdit?: (feature: FeatureWithRelations) => void;
}

export default function FeatureDetail({
  featureId,
  onBack,
  onEdit,
}: FeatureDetailProps) {
  const [feature, setFeature] = useState<FeatureWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchFeature();
  }, [featureId]);

  const fetchFeature = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/features/${featureId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch feature");
      }

      const data = await response.json();
      setFeature(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      CRITICAL: "text-red-600 bg-red-100 border-red-200",
      HIGH: "text-orange-600 bg-orange-100 border-orange-200",
      MEDIUM: "text-yellow-600 bg-yellow-100 border-yellow-200",
      LOW: "text-green-600 bg-green-100 border-green-200",
    };
    return (
      colors[priority as keyof typeof colors] ||
      "text-gray-600 bg-gray-100 border-gray-200"
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: "text-blue-600 bg-blue-100 border-blue-200",
      IN_PROGRESS: "text-purple-600 bg-purple-100 border-purple-200",
      COMPLETED: "text-green-600 bg-green-100 border-green-200",
      ON_HOLD: "text-yellow-600 bg-yellow-100 border-yellow-200",
      CANCELLED: "text-red-600 bg-red-100 border-red-200",
    };
    return (
      colors[status as keyof typeof colors] ||
      "text-gray-600 bg-gray-100 border-gray-200"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.616 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Feature
        </h3>
        <p className="text-gray-500 mb-4">{error || "Feature not found"}</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{feature.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                  feature.priority
                )}`}
              >
                {feature.priority}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  feature.status
                )}`}
              >
                {feature.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span>Edit</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {feature.description && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {feature.description}
              </p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {feature.acceptanceCriteria && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Acceptance Criteria
              </h2>
              <div className="text-gray-700 whitespace-pre-wrap">
                {feature.acceptanceCriteria}
              </div>
            </div>
          )}

          {/* User Stories */}
          {feature.userStories.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                User Stories ({feature.userStories.length})
              </h2>
              <div className="space-y-3">
                {feature.userStories.map((story) => (
                  <div
                    key={story.id}
                    className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {story.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>Status: {story.status}</span>
                        {story.storyPoints && (
                          <span>Points: {story.storyPoints}</span>
                        )}
                        <span>Priority: {story.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Child Features */}
          {feature.children.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sub-features ({feature.children.length})
              </h2>
              <div className="space-y-3">
                {feature.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {child.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>Status: {child.status}</span>
                        <span>Priority: {child.priority}</span>
                        {child.storyPoints && (
                          <span>Points: {child.storyPoints}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {child.progress}% complete
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Metrics
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium">{feature.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${feature.progress}%` }}
                  ></div>
                </div>
              </div>

              {feature.storyPoints && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Story Points</span>
                  <span className="font-medium">{feature.storyPoints}</span>
                </div>
              )}

              {feature.businessValue && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Value</span>
                  <span className="font-medium">{feature.businessValue}%</span>
                </div>
              )}

              {feature.technicalRisk && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Technical Risk</span>
                  <span className="font-medium">{feature.technicalRisk}%</span>
                </div>
              )}

              {feature.effort && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Effort</span>
                  <span className="font-medium">{feature.effort}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Relations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Relations
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Epic</span>
                <span className="font-medium">
                  {feature.epic?.name || "None"}
                </span>
              </div>

              {feature.parent && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Parent</span>
                  <span className="font-medium">{feature.parent.name}</span>
                </div>
              )}

              {feature.Project && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Project</span>
                  <span className="font-medium">{feature.Project.name}</span>
                </div>
              )}

              {feature.users && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Owner</span>
                  <span className="font-medium">{feature.users.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline
            </h2>
            <div className="space-y-3">
              {feature.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium">
                    {new Date(feature.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {feature.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium">
                    {new Date(feature.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="font-medium">
                  {new Date(feature.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="font-medium">
                  {new Date(feature.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <FeatureForm
          feature={feature}
          projectId={feature.projectId || ""}
          epicId={feature.epicId}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            fetchFeature();
          }}
        />
      )}
    </div>
  );
}
