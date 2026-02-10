import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
// TODO: Re-enable when mail service is configured
// import { prisma } from "@/server/services/auth/db.server";
// import { getProjectMembers } from "@/server/services/project-member.server";
// import { sendEmail, getTemplate, MailerError } from "@/lib/mailer";
// import { mailRateLimiter } from "@/lib/rate-limiter";
// import { createRateLimitResponse } from "@/lib/rate-limiter/middleware";

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * POST /api/projects/[id]/stories/[storyId]/notify
 * Send email notification about a story to all project members
 * Rate limited: 10 requests per hour per user
 * 
 * TODO: Currently disabled - returns "coming soon" message
 */
export async function POST(
    request: NextRequest,
    _context: { params: Promise<{ id: string; storyId: string }> }
) {
    try {
        const session = await getSession(request);

        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // TODO: Mail service not yet configured - return coming soon
        return NextResponse.json<ApiResponse>(
            {
                success: false,
                error: "Coming soon",
                message: "Email notifications will be available soon!",
            },
            { status: 503 }
        );

        // TODO: Re-enable when mail service is configured
        /*
        const { id: projectId, storyId } = await params;

        // Check rate limit using user ID
        const rateLimitResult = await mailRateLimiter.check(session.user.id);
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        // Get the story with project info
        const story = await prisma.story.findUnique({
            where: { id: storyId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        orgId: true,
                    },
                },
            },
        });

        if (!story) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Story not found" },
                { status: 404 }
            );
        }

        if (story.projectId !== projectId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Story does not belong to this project" },
                { status: 400 }
            );
        }

        // Get all project members
        const members = await getProjectMembers(projectId);

        if (members.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "No members to notify" },
                { status: 400 }
            );
        }

        // Build story URL - use locale from request or default to 'en'
        const locale = request.headers.get("x-locale") || "en";
        const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
        const storyUrl = story.slug 
            ? `${baseUrl}/${locale}/projects/${projectId}/stories/${story.slug}`
            : `${baseUrl}/${locale}/projects/${projectId}`;

        // Get member emails (exclude the sender)
        const memberEmails = members
            .filter((member) => member.userId !== session.user.id && member.user.email)
            .map((member) => member.user.email);

        if (memberEmails.length === 0) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "No other members to notify" },
                { status: 400 }
            );
        }

        // Send notification email
        const template = getTemplate("notification", {
            title: `Update on: ${story.title}`,
            message: `${session.user.name || "A team member"} wants to bring your attention to a story in ${story.project.name}. Click below to view the details.`,
            actionUrl: storyUrl,
            actionText: "View Story",
        });

        // Send to all members
        const results = await Promise.allSettled(
            memberEmails.map((email) =>
                sendEmail({
                    to: email,
                    subject: template.subject,
                    body: template.body,
                })
            )
        );

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                data: {
                    notified: successful,
                    failed,
                    total: memberEmails.length,
                },
                message: `Notified ${successful} member${successful !== 1 ? "s" : ""}`,
            },
            { status: 200 }
        );
        */
    } catch (error) {
        console.error("Error sending notifications:", error);

        return NextResponse.json<ApiResponse>(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
