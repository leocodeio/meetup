import { z } from "zod";

// Organization slug validation - must be URL-friendly
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Schema for creating a new organization
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(slugRegex, "Slug must be URL-friendly (lowercase letters, numbers, hyphens only)"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  image: z
    .union([
      z.string().url("Image must be a valid URL"),
      z.string().length(0),
      z.null()
    ])
    .optional(),
});

/**
 * Schema for updating an organization
 */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be less than 50 characters")
    .regex(slugRegex, "Slug must be URL-friendly (lowercase letters, numbers, hyphens only)")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  image: z
    .union([
      z.string().url("Image must be a valid URL"),
      z.string().length(0),
      z.null()
    ])
    .optional()
    .nullable(),
});

/**
 * Schema for searching organizations
 */
export const searchOrganizationsSchema = z.object({
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
 * Schema for inviting a member to an organization
 */
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .email("Must be a valid email address")
    .min(1, "Email is required"),
  role: z
    .enum(["ADMIN", "MEMBER"])
    .optional()
    .default("MEMBER"),
});

/**
 * Schema for updating a member's role or status
 */
export const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
});

/**
 * Schema for responding to an invitation
 */
export const respondToInvitationSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

/**
 * Type inference from Zod schemas
 */
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type SearchOrganizationsInput = z.infer<typeof searchOrganizationsSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type RespondToInvitationInput = z.infer<typeof respondToInvitationSchema>;
