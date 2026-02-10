import { prisma } from "@/server/services/auth/db.server";
import { Organization } from "@/types/organization";

/**
 * Get all organizations for a user with member counts
 */
export async function getUserOrganizations(userId: string): Promise<
  (Organization & { memberCount: number })[]
> {
  const organizations = await prisma.organization.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              status: "ACCEPTED",
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const orgsWithCounts = await Promise.all(
    organizations.map(async (org) => {
      const memberCount = await prisma.organizationMember.count({
        where: { orgId: org.id },
      });
      return { ...org, memberCount };
    })
  );

  return orgsWithCounts;
}

/**
 * Get a single organization with member count
 */
export async function getOrganizationById(id: string): Promise<
  (Organization & { memberCount: number }) | null
> {
  const org = await prisma.organization.findUnique({
    where: { id },
  });

  if (!org) return null;

  const memberCount = await prisma.organizationMember.count({
    where: { orgId: id },
  });

  return { ...org, memberCount };
}

/**
 * Get organization with full member details
 */
export async function getOrganizationWithMembers(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
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
      },
    },
  });

  return org;
}

/**
 * Search organizations by name or slug
 */
export async function searchOrganizations(
  userId: string,
  query: string,
  limit: number = 10,
  offset: number = 0
) {
  const whereClause = {
    OR: [
      { ownerId: userId },
      {
        members: {
          some: {
            userId,
            status: "ACCEPTED" as const,
          },
        },
      },
    ],
    ...(query && {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ],
    }),
  };

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.organization.count({
      where: whereClause,
    }),
  ]);

  const orgsWithCounts = await Promise.all(
    organizations.map(async (org) => {
      const memberCount = await prisma.organizationMember.count({
        where: { orgId: org.id },
      });
      return { ...org, memberCount };
    })
  );

  return { organizations: orgsWithCounts, total };
}
