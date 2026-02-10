import { z } from "zod";

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

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment is required")
    .max(10000, "Comment must be less than 10000 characters")
    .transform((val) => val.trim()),
  attachments: z.array(attachmentSchema).optional().default([]),
});

export type CommentAttachmentInput = z.infer<typeof attachmentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
