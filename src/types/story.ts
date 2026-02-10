import { Priority, StoryStatus } from "@prisma/client";

export type Story = {
  id: string;
  title: string;
  description: string | null;
  attachments: unknown;
  points: number | null;
  priority: Priority;
  status: StoryStatus;
  labels: string[];
  slug: string | null;
  archived: boolean;
  projectId: string;
  sprintId: string | null;
  dueDate: Date | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StoryWithAssignees = Story & {
  assignees: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }>;
};

export type StoryWithDetails = StoryWithAssignees & {
  project: {
    id: string;
    name: string;
  };
  sprint: {
    id: string;
    name: string;
  } | null;
};

export type CreateStoryInput = {
  title: string;
  description?: string;
  points?: number;
  priority?: Priority;
  status?: StoryStatus;
  labels?: string[];
  projectId: string;
  sprintId?: string | null;
  dueDate?: Date | string | null;
  assigneeIds?: string[];
  attachments?: Array<{ url: string; name: string; key?: string; size?: number; type?: string }>;
};

export type UpdateStoryInput = {
  title?: string;
  description?: string | null;
  points?: number | null;
  priority?: Priority;
  status?: StoryStatus;
  labels?: string[];
  sprintId?: string | null;
  dueDate?: Date | string | null;
  position?: number;
  assigneeIds?: string[];
  attachments?: Array<{ url: string; name: string; key?: string; size?: number; type?: string }>;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type StoryFilters = {
  status?: StoryStatus;
  priority?: Priority;
  sprintId?: string | null;
  assigneeId?: string;
  search?: string;
};
