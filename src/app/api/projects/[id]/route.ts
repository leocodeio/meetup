import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { prisma, Prisma } from "@/server/services/auth/db.server";
import { updateProjectSchema } from "@/lib/validations/project";
import { ApiResponse, UpdateProjectInput } from "@/types/project";

/**
 * GET /api/projects/[id]
 * Fetch a specific project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const memberCount = await prisma.projectMember.count({
      where: { projectId: id },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { ...project, memberCount, sprintCount: 0, storyCount: 0 },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const validationResult = updateProjectSchema.safeParse(body);

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

    const data = validationResult.data as UpdateProjectInput;

    const updateData: Prisma.ProjectUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
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

    const memberCount = await prisma.projectMember.count({
      where: { projectId: id },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { ...updatedProject, memberCount, sprintCount: 0, storyCount: 0 },
        message: "Project updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating project:", error);

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
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Project deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
