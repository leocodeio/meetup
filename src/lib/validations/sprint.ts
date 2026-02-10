import { z } from "zod";
import { SprintStatus } from "@prisma/client";

export const createSprintSchema = z.object({
  name: z
    .string()
    .min(1, "Sprint name is required")
    .min(3, "Sprint name must be at least 3 characters")
    .max(100, "Sprint name must be less than 100 characters"),
  goal: z
    .string()
    .max(500, "Sprint goal must be less than 500 characters")
    .optional(),
  startDate: z.coerce.date({
    message: "Start date is required",
  }),
  endDate: z.coerce.date({
    message: "End date is required",
  }),
  projectId: z.string().min(1, "Project ID is required"),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateSprintSchema = z.object({
  name: z
    .string()
    .min(3, "Sprint name must be at least 3 characters")
    .max(100, "Sprint name must be less than 100 characters")
    .optional(),
  goal: z
    .string()
    .max(500, "Sprint goal must be less than 500 characters")
    .nullable()
    .optional(),
  status: z.nativeEnum(SprintStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);
