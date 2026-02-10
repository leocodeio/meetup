import { NextRequest, NextResponse } from "next/server";
import { getSession, prisma } from "@/server/services/auth/db.server";
import { updateStorySchema } from "@/lib/validations/story";
import { ZodError } from "zod";

/**
 * GET /api/projects/[id]/stories/[storyId]
 * Fetch a single story by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId, storyId } = await params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { ownerId: true },
        },
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const isOrgOwner = project.organization.ownerId === session.user.id;
    const isProjectMember = project.members.length > 0;

    if (!isOrgOwner && !isProjectMember) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch story with all details
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId,
      },
      include: {
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
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
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
        },
      },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { story },
    });
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/stories/[storyId]
 * Update a story
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId, storyId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateStorySchema.parse(body);

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { ownerId: true },
        },
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const isOrgOwner = project.organization.ownerId === session.user.id;
    const canManage =
      isOrgOwner ||
      project.members.some((m) => m.role === "ADMIN" || m.role === "OWNER");

    if (!canManage && project.members.length === 0) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify story exists and belongs to this project
    const existingStory = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId,
      },
    });

    if (!existingStory) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    // If sprint is being changed, verify it belongs to this project
    if (validatedData.sprintId !== undefined && validatedData.sprintId !== null) {
      const sprint = await prisma.sprint.findFirst({
        where: {
          id: validatedData.sprintId,
          projectId,
        },
      });

      if (!sprint) {
        return NextResponse.json(
          { success: false, error: "Sprint not found in this project" },
          { status: 404 }
        );
      }
    }

    // Update story with assignees if provided
    const { assigneeIds, ...updateData } = validatedData;
    
    const story = await prisma.story.update({
      where: { id: storyId },
      data: {
        ...updateData,
        ...(assigneeIds !== undefined && {
          assignees: {
            deleteMany: {},
            create: assigneeIds.map((userId) => ({
              userId,
            })),
          },
        }),
      },
      include: {
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
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create history entry (serialize objects to JSON)
    await prisma.storyHistory.create({
      data: {
        storyId,
        field: "updated",
        oldValue: JSON.parse(JSON.stringify(existingStory)),
        newValue: JSON.parse(JSON.stringify(story)),
        changedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { story },
      message: "Story updated successfully",
    });
  } catch (error) {
    console.error("Error updating story:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update story" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/stories/[storyId]
 * Delete a story
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId, storyId } = await params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { ownerId: true },
        },
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const isOrgOwner = project.organization.ownerId === session.user.id;
    const canManage =
      isOrgOwner ||
      project.members.some((m) => m.role === "ADMIN" || m.role === "OWNER");

    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify story exists and belongs to this project
    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId,
      },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    // Delete story (this will cascade to assignees, comments, and history)
    await prisma.story.delete({
      where: { id: storyId },
    });

    return NextResponse.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
