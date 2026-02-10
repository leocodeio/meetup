import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { prisma, Prisma } from "@/server/services/auth/db.server";
import { updateSprintSchema } from "@/lib/validations/sprint";
import { ApiResponse, UpdateSprintInput } from "@/types/sprint";

/**
 * GET /api/projects/[id]/sprints/[sprintId]
 * Fetch a specific sprint by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const { id: projectId, sprintId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch sprint with project and organization details
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                ownerId: true,
              },
            },
            members: {
              where: { userId: session.user.id },
            },
          },
        },
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
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            points: true,
            position: true,
            attachments: true,
            labels: true,
            slug: true,
            archived: true,
            projectId: true,
            sprintId: true,
            dueDate: true,
            createdAt: true,
            updatedAt: true,
            assignees: {
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
        },
      },
    });

    if (!sprint) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sprint not found" },
        { status: 404 }
      );
    }

    if (sprint.projectId !== projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sprint does not belong to this project" },
        { status: 400 }
      );
    }

    // Check access
    const isOrgOwner = sprint.project.organization.ownerId === session.user.id;
    const isProjectMember = sprint.project.members.length > 0;

    if (!isOrgOwner && !isProjectMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Calculate stats
    const todoCount = sprint.stories.filter((s) => s.status === "TODO").length;
    const inProgressCount = sprint.stories.filter(
      (s) => s.status === "IN_PROGRESS"
    ).length;
    const doneCount = sprint.stories.filter((s) => s.status === "DONE").length;

    const sprintWithStats = {
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
      stories: sprint.stories,
      project: sprint.project,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { sprint: sprintWithStats },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sprint:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]/sprints/[sprintId]
 * Update a sprint
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const { id: projectId, sprintId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch sprint with project details
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
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
        },
      },
    });

    if (!sprint) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sprint not found" },
        { status: 404 }
      );
    }

    if (sprint.projectId !== projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sprint does not belong to this project" },
        { status: 400 }
      );
    }

    // Check permissions
    const isOrgOwner = sprint.project.organization.ownerId === session.user.id;
    const isProjectAdmin = sprint.project.members.some(
      (m) => m.role === "ADMIN" || m.role === "OWNER"
    );

    if (!isOrgOwner && !isProjectAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Only organization owners and project admins can update sprints",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateSprintSchema.safeParse(body);

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

    const data = validationResult.data as UpdateSprintInput;

    // Build update data
    const updateData: Prisma.SprintUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.goal !== undefined) updateData.goal = data.goal;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    // Update sprint
    const updatedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: updateData,
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: updatedSprint,
        message: "Sprint updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating sprint:", error);

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

/**
 * DELETE /api/projects/[id]/sprints/[sprintId]
 * Delete a sprint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const { id: projectId, sprintId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch sprint with project details
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
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
        },
      },
    });

    if (!sprint) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sprint not found" },
        { status: 404 }
      );
    }

    if (sprint.projectId !== projectId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sprint does not belong to this project" },
        { status: 400 }
      );
    }

    // Check permissions
    const isOrgOwner = sprint.project.organization.ownerId === session.user.id;
    const isProjectAdmin = sprint.project.members.some(
      (m) => m.role === "ADMIN" || m.role === "OWNER"
    );

    if (!isOrgOwner && !isProjectAdmin) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Only organization owners and project admins can delete sprints",
        },
        { status: 403 }
      );
    }

    // Delete sprint
    await prisma.sprint.delete({
      where: { id: sprintId },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Sprint deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sprint:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
