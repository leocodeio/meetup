import { SprintStatus } from "@prisma/client";

export type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SprintWithStats = Sprint & {
  storyCount: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
};

export type SprintWithProject = Sprint & {
  project: {
    id: string;
    name: string;
    orgId: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
};

export type CreateSprintInput = {
  name: string;
  goal?: string;
  startDate: Date | string;
  endDate: Date | string;
  projectId: string;
};

export type UpdateSprintInput = {
  name?: string;
  goal?: string | null;
  status?: SprintStatus;
  startDate?: Date | string;
  endDate?: Date | string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
