import { prisma } from "@/server/services/auth/db.server";
import { ProjectMemberRole } from "@prisma/client";

/**
 * Get all members of a project with user details
 */
export async function getProjectMembers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
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
 * Get organization members who are not in the project
 */
export async function getAvailableOrgMembersForProject(
  projectId: string,
  orgId: string
) {
  // Get all organization members
  const orgMembers = await prisma.organizationMember.findMany({
    where: {
      orgId,
      active: true,
      status: "ACCEPTED",
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

  // Get current project members
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });

  const projectMemberIds = new Set(projectMembers.map((m) => m.userId));

  // Filter out members already in the project
  return orgMembers
    .filter((orgMember) => !projectMemberIds.has(orgMember.userId))
    .map((orgMember) => orgMember.user);
}

/**
 * Check if a user is a member of a project
 */
export async function isUserMemberOfProject(userId: string, projectId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return member !== null;
}

/**
 * Check if a user is an admin or owner of a project
 */
export async function isUserAdminOfProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      organization: {
        select: { ownerId: true },
      },
    },
  });

  // Organization owner is always an admin
  if (project?.organization.ownerId === userId) {
    return true;
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return (
    member?.role === ProjectMemberRole.ADMIN ||
    member?.role === ProjectMemberRole.OWNER
  );
}

/**
 * Add a user to a project
 */
export async function addMemberToProject(
  projectId: string,
  userId: string,
  role: ProjectMemberRole = ProjectMemberRole.MEMBER
) {
  // Check if user is already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this project");
  }

  // Verify user is a member of the organization
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { orgId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const orgMember = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId: project.orgId,
        userId,
      },
    },
  });

  if (!orgMember || orgMember.status !== "ACCEPTED") {
    throw new Error("User must be an active member of the organization first");
  }

  // Add the member
  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role,
      active: true,
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
export async function updateProjectMemberRole(
  memberId: string,
  role: ProjectMemberRole
) {
  const member = await prisma.projectMember.update({
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
 * Remove a member from a project
 */
export async function removeMemberFromProject(memberId: string) {
  await prisma.projectMember.delete({
    where: { id: memberId },
  });
}

/**
 * Get project member count
 */
export async function getProjectMemberCount(projectId: string) {
  return await prisma.projectMember.count({
    where: { projectId },
  });
}
