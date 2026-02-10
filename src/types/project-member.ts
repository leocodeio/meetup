import { ProjectMemberRole } from "@prisma/client";

export type ProjectMember = {
  id: string;
  role: ProjectMemberRole;
  active: boolean;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AddProjectMemberInput = {
  projectId: string;
  userId: string;
  role?: ProjectMemberRole;
  active?: boolean;
};

export type UpdateProjectMemberInput = {
  role?: ProjectMemberRole;
  active?: boolean;
};
