import { OrganizationMemberRole, OrganizationMemberStatus } from "@prisma/client";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationWithMemberCount = Organization & {
  memberCount: number;
  userRole?: OrganizationMemberRole | "OWNER";
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  description?: string;
  image?: string | null;
};

export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
};

export type OrganizationMember = {
  id: string;
  role: OrganizationMemberRole;
  status: OrganizationMemberStatus;
  active: boolean;
  orgId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationMemberWithUser = OrganizationMember & {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export type InviteMemberInput = {
  email: string;
  role?: OrganizationMemberRole;
};

export type UpdateMemberInput = {
  role?: OrganizationMemberRole;
  status?: OrganizationMemberStatus;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
