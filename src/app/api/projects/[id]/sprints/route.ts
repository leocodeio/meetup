import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { prisma, Prisma } from "@/server/services/auth/db.server";
import { createSprintSchema } from "@/lib/validations/sprint";
import { ApiResponse, CreateSprintInput } from "@/types/sprint";

/**
 * GET /api/projects/[id]/sprints
 * Fetch all sprints for a specific project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            ownerId: true,
          },
        },
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is org owner or project member
    const isOrgOwner = project.organization.ownerId === session.user.id;
    const isProjectMember = project.members.length > 0;

    if (!isOrgOwner && !isProjectMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build where clause
    const where: Prisma.SprintWhereInput = { projectId };
    if (status) {
      where.status = status as "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    }

    // Fetch sprints with stats
    const [sprints, total] = await Promise.all([
      prisma.sprint.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: {
              stories: {
                where: {
                  archived: false,
                },
              },
            },
          },
          stories: {
            where: {
              archived: false,
            },
            select: {
              status: true,
            },
          },
        },
      }),
      prisma.sprint.count({ where }),
    ]);

    // Calculate stats for each sprint
    const sprintsWithStats = sprints.map((sprint) => {
      const todoCount = sprint.stories.filter((s) => s.status === "TODO").length;
      const inProgressCount = sprint.stories.filter(
        (s) => s.status === "IN_PROGRESS"
      ).length;
      const doneCount = sprint.stories.filter((s) => s.status === "DONE").length;

      return {
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        projectId: sprint.projectId,
        createdAt: sprint.createdAt,
        updatedAt: sprint.updatedAt,
        storyCount: sprint._count.stories,
        todoCount,
        inProgressCount,
        doneCount,
      };
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          sprints: sprintsWithStats,
          total,
          limit,
          offset,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sprints:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/sprints
 * Create a new sprint for a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: {
            ownerId: true,
          },
        },
        members: {
          where: { userId: session.user.id, active: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is org owner or active project member with ADMIN/OWNER role
    const isOrgOwner = project.organization.ownerId === session.user.id;
    const isProjectAdmin = project.members.some(
      (m) => m.role === "ADMIN" || m.role === "OWNER"
    );

    if (!isOrgOwner && !isProjectAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Only organization owners and project admins can create sprints",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createSprintSchema.safeParse({
      ...body,
      projectId,
    });

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

    const data = validationResult.data as CreateSprintInput;

    // Create sprint
    const sprint = await prisma.sprint.create({
      data: {
        name: data.name,
        goal: data.goal,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        projectId: data.projectId,
        status: "PLANNING",
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: sprint,
        message: "Sprint created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sprint:", error);

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
