import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import {
  getOrganizationMembers,
  inviteMemberToOrganization,
  isUserAdminOfOrg,
} from "@/server/services/organization-member.server";
import { inviteMemberSchema } from "@/lib/validations/organization";
import { ApiResponse } from "@/types/organization";
import { prisma } from "@/server/services/auth/db.server";
// TODO: Re-enable when mail service is configured
import { sendEmail, getTemplate, MailerError } from "@/lib/mailer";

/**
 * GET /api/organizations/[id]/members
 * Get all members of an organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isAdmin = await isUserAdminOfOrg(session.user.id, orgId);
    const isOwner = org.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get all members
    const members = await getOrganizationMembers(orgId);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: members,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/members
 * Invite a user to the organization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isAdmin = await isUserAdminOfOrg(session.user.id, orgId);
    const isOwner = org.ownerId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = inviteMemberSchema.safeParse(body);

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

    const { email, role } = validationResult.data;

    // Invite the member
    const member = await inviteMemberToOrganization(orgId, email, role);

    // TODO: Send invitation email when mail service is configured
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string}/en/dashboard/organizations/invites`;
      const template = getTemplate("organization-invite", {
        inviterName: session.user.name || "A team member",
        organizationName: org.name,
        inviteUrl,
        role: role.charAt(0) + role.slice(1).toLowerCase(),
      });
    
      await sendEmail({
        to: email,
        subject: template.subject,
        body: template.body,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: member,
        message: "Member invited successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inviting member:", error);

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
