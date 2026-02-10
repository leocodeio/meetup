import { z } from "zod";

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  orgId: z
    .string()
    .min(1, "Organization ID is required")
});

/**
 * Schema for updating a project
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
});

/**
 * Schema for searching projects
 */
export const searchProjectsSchema = z.object({
  orgId: z
    .string()
    .min(1, "Organization ID is required"),
  query: z
    .string()
    .max(100, "Search query must be less than 100 characters")
    .optional(),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(10),
  offset: z
    .number()
    .min(0)
    .optional()
    .default(0),
});

/**
 * Type inference from Zod schemas
 */
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SearchProjectsInput = z.infer<typeof searchProjectsSchema>;
