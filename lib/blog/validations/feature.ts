// @/lib/validations/feature.ts
// Rôle : Validation des données des features
// Responsabilités : Schémas de validation, règles métier, sanitization

import { z } from "zod";
import { Priority } from "@/lib/generated/prisma/client";

export const createFeatureSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(255, "Name must be less than 255 characters")
      .trim(),

    description: z
      .string()
      .max(2000, "Description must be less than 2000 characters")
      .optional()
      .nullable(),

    acceptanceCriteria: z
      .string()
      .max(5000, "Acceptance criteria must be less than 5000 characters")
      .optional()
      .nullable(),

    priority: z.nativeEnum(Priority).default(Priority.MEDIUM),

    status: z.string().min(1, "Status is required").default("ACTIVE"),

    storyPoints: z
      .number()
      .int("Story points must be an integer")
      .min(0, "Story points cannot be negative")
      .max(100, "Story points cannot exceed 100")
      .optional()
      .nullable(),

    businessValue: z
      .number()
      .int("Business value must be an integer")
      .min(0, "Business value cannot be negative")
      .max(100, "Business value cannot exceed 100")
      .optional()
      .nullable(),

    technicalRisk: z
      .number()
      .int("Technical risk must be an integer")
      .min(0, "Technical risk cannot be negative")
      .max(100, "Technical risk cannot exceed 100")
      .optional()
      .nullable(),

    effort: z
      .number()
      .int("Effort must be an integer")
      .min(0, "Effort cannot be negative")
      .max(100, "Effort cannot exceed 100")
      .optional()
      .nullable(),

    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),

    parentId: z.string().optional().nullable(),
    epicId: z.string().min(1, "Epic ID is required"),
    projectId: z.string().optional().nullable(),
    userId: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export const updateFeatureSchema = z
  .object({
    id: z.string().min(1, "ID is required"),
  })
  .merge(createFeatureSchema.partial().omit({ epicId: true }));

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;

// Validation helper functions
export function validateCreateFeature(data: unknown): CreateFeatureInput {
  return createFeatureSchema.parse(data);
}

export function validateUpdateFeature(data: unknown): UpdateFeatureInput {
  return updateFeatureSchema.parse(data);
}

// Feature business rules
export class FeatureValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "FeatureValidationError";
  }
}

export function validateFeatureBusinessRules(
  data: CreateFeatureInput | UpdateFeatureInput
) {
  const errors: string[] = [];

  // Check if feature can have the given parent
  if ("parentId" in data && data.parentId) {
    // This would need to be validated against the database
    // to ensure no circular dependencies
  }

  // Check story points vs children
  if (data.storyPoints && data.storyPoints > 0) {
    // Features with children typically shouldn't have story points
    // This is a business rule that can be configurable
  }

  // Business value validation
  if (data.businessValue && data.technicalRisk) {
    if (data.businessValue < 30 && data.technicalRisk > 70) {
      errors.push("High risk, low value features should be reconsidered");
    }
  }

  if (errors.length > 0) {
    throw new FeatureValidationError(errors.join(", "));
  }
}
