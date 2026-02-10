import { z } from "zod";
import { Priority, StoryStatus } from "@prisma/client";

const attachmentSchema = z.object({
  url: z
    .string()
    .refine((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, "Attachment URL must be valid"),
  name: z.string().min(1, "Attachment name is required"),
  key: z.string().nullable().optional(),
  size: z.number().int().nonnegative().optional(),
  type: z.enum(["image", "file"]).optional(),
});

export const createStorySchema = z.object({
  title: z
    .string()
    .min(1, "Story title is required")
    .min(3, "Story title must be at least 3 characters")
    .max(200, "Story title must be less than 200 characters"),
  description: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : val),
    z
      .string()
      .max(5000, "Story description must be less than 5000 characters")
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : null))
  ),
  attachments: z.array(attachmentSchema).optional().default([]),
  points: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().int().min(0).max(100).nullable().optional()
  ),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(StoryStatus).default(StoryStatus.TODO),
  labels: z.array(z.string()).default([]),
  projectId: z.string().min(1, "Project ID is required"),
  sprintId: z.preprocess(
    (val) => (val === "" || val === "null" || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
  dueDate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : val),
    z.coerce.date().nullable().optional()
  ),
  assigneeIds: z
    .array(z.string())
    .max(10, "Maximum 10 assignees allowed")
    .optional()
    .default([]),
});

export const updateStorySchema = z.object({
  title: z
    .string()
    .min(3, "Story title must be at least 3 characters")
    .max(200, "Story title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .max(5000, "Story description must be less than 5000 characters")
    .nullable()
    .optional()
    .transform((val) => (val === undefined ? undefined : val && val.trim() ? val.trim() : null)),
  attachments: z.array(attachmentSchema).optional(),
  points: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || (typeof val === "number" && isNaN(val)) ? null : val),
    z.number().int().min(0).max(100).nullable().optional()
  ),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(StoryStatus).optional(),
  labels: z.array(z.string()).optional(),
  sprintId: z.preprocess(
    (val) => (val === "" || val === "null" || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
  dueDate: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : val),
    z.coerce.date().nullable().optional()
  ),
  position: z.number().int().min(0).optional(),
  assigneeIds: z
    .array(z.string())
    .max(10, "Maximum 10 assignees allowed")
    .optional(),
});

export const bulkUpdateStorySchema = z.object({
  storyIds: z.array(z.string()).min(1, "At least one story is required"),
  updates: z.object({
    status: z.nativeEnum(StoryStatus).optional(),
    sprintId: z.string().nullable().optional(),
    priority: z.nativeEnum(Priority).optional(),
  }),
});

export const reorderStorySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Story ID is required"),
        status: z.nativeEnum(StoryStatus),
        position: z.number().int().min(0),
      })
    )
    .min(1, "At least one story is required"),
});
