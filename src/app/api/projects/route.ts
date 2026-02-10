import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { prisma, Prisma } from "@/server/services/auth/db.server";
import {
  createProjectSchema,
  searchProjectsSchema,
} from "@/lib/validations/project";
import { ApiResponse, CreateProjectInput } from "@/types/project";

/**
 * GET /api/projects
 * Fetch all projects for an organization
 * Query params:
 *   - orgId: Organization ID (required)
 *   - query: Search by project name (optional)
 *   - limit: Number of results (optional, default 10, max 100)
 *   - offset: Pagination offset (optional, default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get("orgId");
    const query = searchParams.get("query") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!orgId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const validationResult = searchProjectsSchema.safeParse({
      orgId,
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

    const whereClause: Prisma.ProjectWhereInput = {
      orgId,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" as const } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.project.count({
        where: whereClause,
      }),
    ]);

    const formattedProjects = await Promise.all(
      projects.map(async (project) => {
        let role = "MEMBER";
        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: session.user.id,
            },
          },
          select: { role: true },
        });
        if (member) role = member.role;

        return {
          ...project,
          memberCount: project._count.members,
          userRole: role,
          sprintCount: 0,
          storyCount: 0,
          _count: undefined,
        };
      })
    );

    return NextResponse.json<
      ApiResponse<{
        projects: typeof formattedProjects;
        total: number;
        limit: number;
        offset: number;
      }>
    >(
      {
        success: true,
        data: {
          projects: formattedProjects,
          total,
          limit,
          offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validationResult = createProjectSchema.safeParse(body);

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

    const data = validationResult.data as CreateProjectInput;

    const organization = await prisma.organization.findUnique({
      where: { id: data.orgId },
    });

    if (!organization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    if (organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Create project and automatically add creator as OWNER member
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name: data.name,
          description: data.description || null,
          orgId: data.orgId,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Automatically add the creator as an OWNER member
      await tx.projectMember.create({
        data: {
          projectId: proj.id,
          userId: session.user.id,
          role: "OWNER",
          active: true,
        },
      });

      return proj;
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { ...project, memberCount: 1, sprintCount: 0, storyCount: 0 }, // Creator is now a member
        message: "Project created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);

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
