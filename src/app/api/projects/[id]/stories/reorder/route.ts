import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, prisma } from "@/server/services/auth/db.server";
import { reorderStorySchema } from "@/lib/validations/story";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const validatedData = reorderStorySchema.parse(body);

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
      project.members.some((member) =>
        ["ADMIN", "OWNER"].includes(member.role)
      );

    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const storyIds = validatedData.items.map((item) => item.id);
    const existingStories = await prisma.story.findMany({
      where: {
        id: { in: storyIds },
        projectId,
      },
      select: {
        id: true,
        position: true,
        status: true,
        sprintId: true,
      },
    });

    if (existingStories.length !== storyIds.length) {
      return NextResponse.json(
        { success: false, error: "Story mismatch" },
        { status: 400 }
      );
    }

    const existingStoryMap = new Map(
      existingStories.map((story) => [story.id, story])
    );

    const updates = validatedData.items.flatMap((item) => {
      const existingStory = existingStoryMap.get(item.id);
      if (!existingStory) {
        return [];
      }

      return [
        prisma.story.update({
          where: { id: item.id },
          data: {
            status: item.status,
            position: item.position,
          },
        }),
      ];
    });

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: "Story order updated successfully",
    });
  } catch (error) {
    console.error("Error updating story order:", error);

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
      { success: false, error: "Failed to update story order" },
      { status: 500 }
    );
  }
}
