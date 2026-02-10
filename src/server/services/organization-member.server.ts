import { prisma } from "@/server/services/auth/db.server";
import { OrganizationMemberRole, OrganizationMemberStatus } from "@prisma/client";

/**
 * Get all members of an organization with user details
 */
export async function getOrganizationMembers(orgId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { orgId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return members;
}

/**
 * Get a specific member by ID
 */
export async function getMemberById(memberId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
        },
      },
    },
  });

  return member;
}

/**
 * Check if a user is a member of an organization
 */
export async function isUserMemberOfOrg(userId: string, orgId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  return member !== null;
}

/**
 * Check if a user is an admin or owner of an organization
 */
export async function isUserAdminOfOrg(userId: string, orgId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerId: true },
  });

  // Owner is always an admin
  if (org?.ownerId === userId) {
    return true;
  }

  const member = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  return member?.role === OrganizationMemberRole.ADMIN;
}

/**
 * Invite a user to an organization by email
 * If user doesn't exist, we still create the invitation (they'll need to sign up first)
 */
export async function inviteMemberToOrganization(
  orgId: string,
  email: string,
  role: OrganizationMemberRole = OrganizationMemberRole.MEMBER
) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User with this email does not exist");
  }

  // Check if user is already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId: user.id,
      },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this organization");
  }

  // Create the invitation
  const member = await prisma.organizationMember.create({
    data: {
      orgId,
      userId: user.id,
      role,
      status: OrganizationMemberStatus.PENDING,
      active: false,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return member;
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  memberId: string,
  role: OrganizationMemberRole
) {
  const member = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return member;
}

/**
 * Update a member's status (accept/reject invitation)
 */
export async function updateMemberStatus(
  memberId: string,
  status: OrganizationMemberStatus
) {
  const updateData: { status: OrganizationMemberStatus; active?: boolean } = { status };

  // If accepting, set active to true
  if (status === OrganizationMemberStatus.ACCEPTED) {
    updateData.active = true;
  }

  const member = await prisma.organizationMember.update({
    where: { id: memberId },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return member;
}

/**
 * Remove a member from an organization
 */
export async function removeMemberFromOrganization(memberId: string) {
  await prisma.organizationMember.delete({
    where: { id: memberId },
  });
}

/**
 * Get all pending invitations for a user
 */
export async function getUserPendingInvitations(userId: string) {
  const invitations = await prisma.organizationMember.findMany({
    where: {
      userId,
      status: OrganizationMemberStatus.PENDING,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations;
}

/**
 * Get member count for an organization by status
 */
export async function getOrganizationMemberStats(orgId: string) {
  const [total, pending, accepted, rejected] = await Promise.all([
    prisma.organizationMember.count({ where: { orgId } }),
    prisma.organizationMember.count({
      where: { orgId, status: OrganizationMemberStatus.PENDING },
    }),
    prisma.organizationMember.count({
      where: { orgId, status: OrganizationMemberStatus.ACCEPTED },
    }),
    prisma.organizationMember.count({
      where: { orgId, status: OrganizationMemberStatus.REJECTED },
    }),
  ]);

  return { total, pending, accepted, rejected };
}
