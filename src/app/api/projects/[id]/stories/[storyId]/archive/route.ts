import { NextRequest, NextResponse } from "next/server";
import { getSession, prisma } from "@/server/services/auth/db.server";

/**
 * PATCH /api/projects/[id]/stories/[storyId]/archive
 * Archive or unarchive a story
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
    const { archived } = body;

    if (typeof archived !== 'boolean') {
      return NextResponse.json(
        { success: false, error: "Invalid archived value" },
        { status: 400 }
      );
    }

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
      project.members.some((m) => m.role === "ADMIN" || m.role === "OWNER" || m.role === "MEMBER");

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

    // Update story archived status
    const story = await prisma.story.update({
      where: { id: storyId },
      data: { archived },
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

    // Create history entry
    await prisma.storyHistory.create({
      data: {
        storyId,
        field: "archived",
        oldValue: existingStory.archived,
        newValue: archived,
        changedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { story },
      message: archived ? "Story archived successfully" : "Story unarchived successfully",
    });
  } catch (error) {
    console.error("Error archiving/unarchiving story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to archive/unarchive story" },
      { status: 500 }
    );
  }
}
