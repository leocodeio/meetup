export type Project = {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectWithStats = Project & {
  memberCount: number;
  sprintCount: number;
  storyCount: number;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  orgId: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
