import { NextRequest, NextResponse } from "next/server";
import { getSession, prisma } from "@/server/services/auth/db.server";
import { createStorySchema } from "@/lib/validations/story";
import { ZodError } from "zod";
import { Priority, StoryStatus } from "@prisma/client";
import { formatStorySlug } from "@/lib/utils/slug";

/**
 * GET /api/projects/[id]/stories
 * Fetch all stories for a project with optional filters
 */
export async function GET(
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
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const sprintId = searchParams.get("sprintId");
    const assigneeId = searchParams.get("assigneeId");
    const search = searchParams.get("search");
    const archived = searchParams.get("archived");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    // Build filter object
    const where: {
      projectId: string;
      status?: StoryStatus;
      priority?: Priority;
      sprintId?: string | null;
      archived?: boolean;
      assignees?: { some: { userId: string } };
      OR?: Array<{ title: { contains: string; mode: "insensitive" } } | { description: { contains: string; mode: "insensitive" } }>;
    } = {
      projectId,
    };

    if (status) where.status = status as StoryStatus;
    if (priority) where.priority = priority as Priority;
    if (sprintId === "null") {
      where.sprintId = null;
    } else if (sprintId) {
      where.sprintId = sprintId;
    }
    if (archived === "true") {
      where.archived = true;
    } else {
      // By default, exclude archived stories
      where.archived = false;
    }
    if (assigneeId) {
      where.assignees = { some: { userId: assigneeId } };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch stories with assignees
    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
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
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      prisma.story.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stories,
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/stories
 * Create a new story in a project
 */
export async function POST(
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

    // Validate input
    const validatedData = createStorySchema.parse({
      ...body,
      projectId,
    });

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

    // If sprint is specified, verify it belongs to this project
    if (validatedData.sprintId) {
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

    // Get the next position number
    const lastStory = await prisma.story.findFirst({
      where: { projectId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = (lastStory?.position ?? -1) + 1;

    // Create story with assignees and auto-generated slug
    const { assigneeIds, ...storyData } = validatedData;

    // Use transaction to atomically increment counter and create story
    const story = await prisma.$transaction(async (tx) => {
      // Increment project's story counter
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { storyCounter: { increment: 1 } },
        select: { storyCounter: true },
      });

      // Generate slug from counter
      const slug = formatStorySlug(updatedProject.storyCounter);

      // Create story with generated slug
      return await tx.story.create({
        data: {
          ...storyData,
          slug,
          attachments: validatedData.attachments || [],
          position,
          assignees: assigneeIds
            ? {
              create: assigneeIds.map((userId) => ({
                userId,
              })),
            }
            : undefined,
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
    });

    return NextResponse.json(
      {
        success: true,
        data: { story },
        message: "Story created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating story:", error);

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
      { success: false, error: "Failed to create story" },
      { status: 500 }
    );
  }
}
