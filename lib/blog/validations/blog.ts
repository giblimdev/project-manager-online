// lib/blog/validations/blog.ts
import { z } from "zod";

// ✅ Validation pour Category
export const createCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  slug: z.string().min(1, "Le slug est requis").max(100).optional(),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Format de couleur invalide")
    .optional(),
  parentId: z.string().uuid().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ✅ Validation pour BlogTag
export const createBlogTagSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Format de couleur invalide")
    .optional(),
  categoriesId: z.string().uuid().optional(),
});

export const updateBlogTagSchema = createBlogTagSchema.partial();

// ✅ Validation pour Post (articles de blog)
export const createPostSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
  title: z.string().min(1, "Le titre est requis").max(200),
  authorId: z.string().uuid("ID auteur invalide"),
  excerpt: z.string().max(300).optional(),
  slug: z.string().max(200).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  visibility: z.enum(["PRIVATE", "PUBLIC", "INTERNAL"]).default("PUBLIC"),
  blogImage: z.string().url().optional(),
  readingTime: z.number().positive().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  isResolved: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  mentions: z.array(z.string()).default([]),
  categoryIds: z.array(z.string().uuid()).default([]),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updatePostSchema = createPostSchema.partial();

// ✅ Validation pour Comment
export const createBlogCommentSchema = z.object({
  content: z.string().min(1, "Le contenu est requis"),
  authorId: z.string().uuid("ID auteur invalide"),
  title: z.string().max(200).optional(),
  excerpt: z.string().max(300).optional(),
  slug: z.string().max(200).optional(),
  status: z.string().default("DRAFT"),
  visibility: z.enum(["PRIVATE", "PUBLIC", "INTERNAL"]).default("PRIVATE"),
  blogImage: z.string().url().optional(),
  readingTime: z.number().positive().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  isResolved: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  mentions: z.array(z.string()).default([]),
  parentCommentId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  userStoryId: z.string().uuid().optional(),
  fileId: z.string().uuid().optional(),
  itemId: z.string().uuid().optional(),
  categoryIds: z.array(z.string().uuid()).default([]),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updateBlogCommentSchema = createBlogCommentSchema.partial();

// ✅ Interface pour les résultats de validation
export interface ValidationResult<T> {
  success: boolean;
  data: T | null;
  errors: z.ZodIssue[] | null;
  message?: string;
}

// ✅ Fonction de validation avec gestion correcte des erreurs Zod
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues,
        message: "Données de validation invalides",
      };
    }

    return {
      success: false,
      data: null,
      errors: null,
      message:
        error instanceof Error
          ? error.message
          : "Erreur de validation inconnue",
    };
  }
};

// ✅ Constante validate avec gestion correcte des erreurs
export const validate = {
  category: (
    data: unknown
  ): ValidationResult<z.infer<typeof createCategorySchema>> => {
    return validateData(createCategorySchema, data);
  },

  categoryUpdate: (
    data: unknown
  ): ValidationResult<z.infer<typeof updateCategorySchema>> => {
    return validateData(updateCategorySchema, data);
  },

  blogTag: (
    data: unknown
  ): ValidationResult<z.infer<typeof createBlogTagSchema>> => {
    return validateData(createBlogTagSchema, data);
  },

  blogTagUpdate: (
    data: unknown
  ): ValidationResult<z.infer<typeof updateBlogTagSchema>> => {
    return validateData(updateBlogTagSchema, data);
  },

  post: (data: unknown): ValidationResult<z.infer<typeof createPostSchema>> => {
    return validateData(createPostSchema, data);
  },

  postUpdate: (
    data: unknown
  ): ValidationResult<z.infer<typeof updatePostSchema>> => {
    return validateData(updatePostSchema, data);
  },

  blogComment: (
    data: unknown
  ): ValidationResult<z.infer<typeof createBlogCommentSchema>> => {
    return validateData(createBlogCommentSchema, data);
  },

  blogCommentUpdate: (
    data: unknown
  ): ValidationResult<z.infer<typeof updateBlogCommentSchema>> => {
    return validateData(updateBlogCommentSchema, data);
  },
} as const;

// ✅ Types exportés avec typage strict
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateBlogTagInput = z.infer<typeof createBlogTagSchema>;
export type UpdateBlogTagInput = z.infer<typeof updateBlogTagSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateBlogCommentInput = z.infer<typeof createBlogCommentSchema>;
export type UpdateBlogCommentInput = z.infer<typeof updateBlogCommentSchema>;

// ✅ Validation des UUID
export const validateUUID = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// ✅ Validation des slugs
export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

// ✅ Validation des couleurs
export const validateColor = (color: string): boolean => {
  const colorRegex = /^#[0-9A-F]{6}$/i;
  return colorRegex.test(color);
};

// ✅ Constantes de validation
export const VALIDATION_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CONTENT_LENGTH: 50000,
  MAX_EXCERPT_LENGTH: 300,
  MAX_TITLE_LENGTH: 200,
  MAX_SLUG_LENGTH: 200,
  MAX_METADATA_KEYS: 50,
  MAX_METADATA_VALUE_LENGTH: 1000,
  MAX_TAGS_PER_COMMENT: 20,
  MAX_CATEGORIES_PER_COMMENT: 10,
  MAX_MENTIONS_PER_COMMENT: 50,
  MIN_READING_TIME: 1,
  MAX_READING_TIME: 1000,
} as const;

// ✅ Messages d'erreur standardisés
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: "Ce champ est obligatoire",
  INVALID_UUID: "Format UUID invalide",
  INVALID_EMAIL: "Format d'email invalide",
  INVALID_URL: "Format d'URL invalide",
  INVALID_COLOR: "Format de couleur invalide (ex: #FF0000)",
  INVALID_SLUG:
    "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets",
  TOO_LONG: "La valeur est trop longue",
  TOO_SHORT: "La valeur est trop courte",
  INVALID_DATE: "Format de date invalide",
  INVALID_NUMBER: "Nombre invalide",
  INVALID_BOOLEAN: "Valeur booléenne invalide",
  ARRAY_TOO_LARGE: "Trop d'éléments dans le tableau",
  OBJECT_TOO_COMPLEX: "Objet trop complexe",
} as const;

// ❌ SUPPRIMÉ : Export par défaut qui causait l'erreur
// export default { ... }
