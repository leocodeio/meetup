import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import {
  getMemberById,
  updateMemberRole,
  updateMemberStatus,
  removeMemberFromOrganization,
  isUserAdminOfOrg,
} from "@/server/services/organization-member.server";
import { updateMemberSchema, respondToInvitationSchema } from "@/lib/validations/organization";
import { ApiResponse } from "@/types/organization";
import { prisma } from "@/server/services/auth/db.server";

/**
 * PATCH /api/organizations/[id]/members/[memberId]
 * Update a member's role or respond to an invitation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: orgId, memberId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the member
    const member = await getMemberById(memberId);

    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Verify the member belongs to the organization
    if (member.orgId !== orgId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Member not found in this organization" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check if this is a status update (user responding to invitation)
    if (body.status && !body.role) {
      // User can only update their own invitation status
      if (member.userId !== session.user.id) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Forbidden - Can only respond to your own invitations" },
          { status: 403 }
        );
      }

      // Validate status update
      const validationResult = respondToInvitationSchema.safeParse(body);

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

      // Update status
      const updatedMember = await updateMemberStatus(memberId, validationResult.data.status);

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          data: updatedMember,
          message: `Invitation ${validationResult.data.status.toLowerCase()}`,
        },
        { status: 200 }
      );
    }

    // Check if user is owner or admin for role updates
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const isAdmin = await isUserAdminOfOrg(session.user.id, orgId);
    const isOwner = org.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Validate role update
    const validationResult = updateMemberSchema.safeParse(body);

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

    const { role } = validationResult.data;

    if (!role) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Role is required" },
        { status: 400 }
      );
    }

    // Update role
    const updatedMember = await updateMemberRole(memberId, role);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: updatedMember,
        message: "Member role updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating member:", error);

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
 * DELETE /api/organizations/[id]/members/[memberId]
 * Remove a member from the organization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: orgId, memberId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the member
    const member = await getMemberById(memberId);

    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Verify the member belongs to the organization
    if (member.orgId !== orgId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Member not found in this organization" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const isAdmin = await isUserAdminOfOrg(session.user.id, orgId);
    const isOwner = org.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Remove the member
    await removeMemberFromOrganization(memberId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Member removed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing member:", error);

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
