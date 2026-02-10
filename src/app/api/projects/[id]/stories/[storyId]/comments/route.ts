import { NextRequest, NextResponse } from "next/server";
import { getSession, prisma } from "@/server/services/auth/db.server";
import { createCommentSchema } from "@/lib/validations/comment";
import { ZodError } from "zod";

/**
 * GET /api/projects/[id]/stories/[storyId]/comments
 * Fetch story comments
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

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId,
      },
      select: { id: true },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { storyId },
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

    return NextResponse.json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/stories/[storyId]/comments
 * Create a story comment
 */
export async function POST(
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
    const validatedData = createCommentSchema.parse(body);

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

    const story = await prisma.story.findFirst({
      where: {
        id: storyId,
        projectId,
      },
      select: { id: true },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        attachments: validatedData.attachments,
        storyId,
        userId: session.user.id,
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

    return NextResponse.json(
      {
        success: true,
        data: { comment },
        message: "Comment created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);

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
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
