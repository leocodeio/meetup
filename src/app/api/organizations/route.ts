import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { prisma, Prisma } from "@/server/services/auth/db.server";
import {
  createOrganizationSchema,
  searchOrganizationsSchema,
} from "@/lib/validations/organization";
import { ApiResponse, CreateOrganizationInput } from "@/types/organization";

/**
 * GET /api/organizations
 * Fetch all organizations for the authenticated user (owned + joined)
 * Query params:
 *   - query: Search by organization name (optional)
 *   - limit: Number of results (optional, default 10, max 100)
 *   - offset: Pagination offset (optional, default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate search parameters
    const validationResult = searchOrganizationsSchema.safeParse({
      query,
      limit,
      offset,
    });

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid query parameters",
        },
        { status: 400 }
      );
    }

    // Build where clause to include owned and joined organizations
    const whereClause: Prisma.OrganizationWhereInput = {
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
              status: "ACCEPTED",
            },
          },
        },
      ],
    };

    if (query) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
          ],
        },
      ];
    }

    // Fetch organizations with member count using Prisma's _count aggregation
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.organization.count({
        where: whereClause,
      }),
    ]);

    // Format response - memberCount includes all OrganizationMember records
    const formattedOrganizations = await Promise.all(
      organizations.map(async (org) => {
        let role = "MEMBER";
        if (org.ownerId === session.user.id) {
          role = "OWNER";
        } else {
          const member = await prisma.organizationMember.findUnique({
            where: {
              orgId_userId: {
                orgId: org.id,
                userId: session.user.id,
              },
            },
            select: { role: true },
          });
          if (member) role = member.role;
        }

        return {
          ...org,
          memberCount: org._count.members,
          userRole: role,
          _count: undefined,
        };
      })
    );

    return NextResponse.json<
      ApiResponse<{
        organizations: typeof formattedOrganizations;
        total: number;
        limit: number;
        offset: number;
      }>
    >(
      {
        success: true,
        data: {
          organizations: formattedOrganizations,
          total,
          limit,
          offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = createOrganizationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Validation failed",
          message: validationResult.error.issues[0]?.message,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data as CreateOrganizationInput;

    // Check if slug already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existingOrg) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Slug already exists" },
        { status: 409 }
      );
    }

    // Create organization and automatically add owner as an ADMIN member
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          image: data.image || null,
          ownerId: session.user.id,
        },
      });

      // Automatically add the owner as an OWNER member with ACCEPTED status
      await tx.organizationMember.create({
        data: {
          orgId: org.id,
          userId: session.user.id,
          role: "OWNER",
          status: "ACCEPTED",
          active: true,
        },
      });

      return org;
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { ...organization, memberCount: 1 }, // Owner is now a member
        message: "Organization created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating organization:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
