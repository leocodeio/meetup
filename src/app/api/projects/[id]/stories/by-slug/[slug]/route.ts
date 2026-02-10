import { NextRequest, NextResponse } from "next/server";
import { getSession, prisma } from "@/server/services/auth/db.server";

/**
 * GET /api/projects/[id]/stories/by-slug/[slug]
 * Fetch a story by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slug: string }> }
) {
  console.log("[by-slug API] ========== NEW REQUEST ==========");

  try {
    console.log("[by-slug API] Step 1: Getting session...");
    const session = await getSession(request);
    console.log("[by-slug API] Step 2: Session result:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
    });

    if (!session?.user?.id) {
      console.log("[by-slug API] ERROR: Unauthorized - no session");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[by-slug API] Step 3: Awaiting params...");
    const resolvedParams = await params;
    const { id: projectId, slug } = resolvedParams;
    console.log("[by-slug API] Step 4: Parameters resolved:", { projectId, slug });

    // First, fetch story by slug (using compound unique key)
    console.log("[by-slug API] Step 5: Fetching story by slug from database...");
    console.log("[by-slug API] Query: prisma.story.findUnique({ where: { projectId_slug: { projectId: '" + projectId + "', slug: '" + slug + "' } } })");

    const story = await prisma.story.findUnique({
      where: {
        projectId_slug: {
          projectId,
          slug
        }
      },
      include: {
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        sprint: {
          select: { id: true, name: true, status: true }
        },
      },
    });

    console.log("[by-slug API] Step 6: Story query result:", {
      found: !!story,
      storyId: story?.id,
      storyProjectId: story?.projectId,
      storyTitle: story?.title,
    });

    if (!story) {
      console.log("[by-slug API] ERROR: Story not found in database");
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    // Fetch project separately with organization and members
    console.log("[by-slug API] Step 7: Fetching project data...");
    const project = await prisma.project.findUnique({
      where: { id: story.projectId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, ownerId: true }
        },
        members: {
          where: { userId: session.user.id }
        },
      },
    });

    console.log("[by-slug API] Step 8: Project query result:", {
      found: !!project,
      projectId: project?.id,
      orgId: project?.organization?.id,
      memberCount: project?.members?.length,
    });

    if (!project) {
      console.log("[by-slug API] ERROR: Project not found");
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Permission check
    const isOrgOwner = project.organization.ownerId === session.user.id;
    const isProjectMember = project.members.length > 0;
    console.log("[by-slug API] Step 9: Permission check:", {
      isOrgOwner,
      isProjectMember,
      orgOwnerId: project.organization.ownerId,
      currentUserId: session.user.id,
    });

    if (!isOrgOwner && !isProjectMember) {
      console.log("[by-slug API] ERROR: Access denied");
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Return story with project info attached
    const storyWithProject = {
      ...story,
      project,
    };

    console.log("[by-slug API] Step 10: SUCCESS - Returning story data");
    console.log("[by-slug API] ========== REQUEST COMPLETE ==========");

    return NextResponse.json({
      success: true,
      data: { story: storyWithProject },
    });
  } catch (error) {
    console.error("[by-slug API] ========== FATAL ERROR ==========");
    console.error("[by-slug API] Error caught:", error);

    // Log the full error for debugging
    if (error instanceof Error) {
      console.error("[by-slug API] Error name:", error.name);
      console.error("[by-slug API] Error message:", error.message);
      console.error("[by-slug API] Error stack:", error.stack);
    } else {
      console.error("[by-slug API] Non-Error object:", JSON.stringify(error, null, 2));
    }

    console.error("[by-slug API] ========== ERROR END ==========");

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch story",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
