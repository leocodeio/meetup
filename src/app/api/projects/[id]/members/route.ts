import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import {
  getProjectMembers,
  addMemberToProject,
  removeMemberFromProject,
  isUserAdminOfProject,
  getAvailableOrgMembersForProject,
} from "@/server/services/project-member.server";
import { prisma } from "@/server/services/auth/db.server";
import { ProjectMemberRole } from "@prisma/client";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).optional().default("MEMBER"),
});

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * GET /api/projects/[id]/members
 * Get all members of a project or available org members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(request);
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode"); // 'available' or undefined

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or owner
    const isAdmin = await isUserAdminOfProject(session.user.id, projectId);
    const isOwner = project.organization.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get available org members if mode is 'available'
    if (mode === "available") {
      const availableMembers = await getAvailableOrgMembersForProject(
        projectId,
        project.organization.id
      );
      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: availableMembers,
        },
        { status: 200 }
      );
    }

    // Get all project members
    const members = await getProjectMembers(projectId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: members,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/members
 * Add a user to the project
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

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or owner
    const isAdmin = await isUserAdminOfProject(session.user.id, projectId);
    const isOwner = project.organization.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addMemberSchema.safeParse(body);

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

    const { userId, role } = validationResult.data;

    // Add the member with proper type casting
    const member = await addMemberToProject(projectId, userId, role as ProjectMemberRole);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: member,
        message: "Member added to project successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding member to project:", error);

    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
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
 * DELETE /api/projects/[id]/members/[memberId]
 * Remove a member from the project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getSession(request);
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!memberId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or owner
    const isAdmin = await isUserAdminOfProject(session.user.id, projectId);
    const isOwner = project.organization.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Remove the member
    await removeMemberFromProject(memberId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Member removed from project successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing member from project:", error);

    if (error instanceof Error) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
