import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { getUserPendingInvitations } from "@/server/services/organization-member.server";
import { ApiResponse } from "@/types/organization";

/**
 * GET /api/user/invitations
 * Get all pending organization invitations for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const invitations = await getUserPendingInvitations(session.user.id);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: invitations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
