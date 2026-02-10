import { prisma } from "@/server/services/auth/db.server";
import { OrganizationMemberRole } from "@prisma/client";
import { Permission, hasPermission as checkPermission } from "@/lib/permissions";

/**
 * Get a user's role in an organization
 * Returns OWNER if the user is the owner of the organization record
 */
export async function getUserOrgRole(
    userId: string,
    orgId: string
): Promise<OrganizationMemberRole | null> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { ownerId: true },
    });

    if (!org) return null;

    if (org.ownerId === userId) {
        return "OWNER" as OrganizationMemberRole;
    }

    const member = await prisma.organizationMember.findUnique({
        where: {
            orgId_userId: {
                orgId,
                userId,
            },
        },
        select: { role: true, status: true },
    });

    if (!member || member.status !== "ACCEPTED") {
        return null;
    }

    return member.role as OrganizationMemberRole;
}

/**
 * Check if a user has a specific permission in an organization
 */
export async function hasOrgPermission(
    userId: string,
    orgId: string,
    permission: Permission
): Promise<boolean> {
    const role = await getUserOrgRole(userId, orgId);
    if (!role) return false;

    return checkPermission(role, permission);
}
