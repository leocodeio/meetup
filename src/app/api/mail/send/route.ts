import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { sendEmail, MailerError } from "@/lib/mailer";
import { getTemplate, type TemplateName } from "@/lib/mailer/templates";
import { mailRateLimiter } from "@/lib/rate-limiter";
import { createRateLimitResponse } from "@/lib/rate-limiter/middleware";

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface SendEmailBody {
    // Direct email (either use this or template)
    to: string | string[];
    subject?: string;
    body?: string;

    // Template-based email
    template?: TemplateName;
    variables?: Record<string, string | number | boolean>;

    // Optional fields
    from?: string | { email: string; name?: string };
    replyTo?: string;
}

/**
 * POST /api/mail/send
 * Send an email using the mailer service
 * Rate limited: 10 requests per hour per user
 * 
 * Body:
 *   - to: string | string[] (required) - Recipient email(s)
 *   - subject: string (required if no template) - Email subject
 *   - body: string (required if no template) - Email HTML body
 *   - template: string (optional) - Template name to use
 *   - variables: object (optional) - Variables for template
 *   - from: string | object (optional) - Sender email
 *   - replyTo: string (optional) - Reply-to email
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getSession(request);

        if (!session?.user?.id) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check rate limit using user ID
        const rateLimitResult = await mailRateLimiter.check(session.user.id);
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        const body: SendEmailBody = await request.json();

        // Validate required fields
        if (!body.to) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Recipient (to) is required" },
                { status: 400 }
            );
        }

        // Determine subject and body
        let subject: string;
        let emailBody: string;

        if (body.template) {
            // Use template
            try {
                const template = getTemplate(body.template, body.variables || {});
                subject = template.subject;
                emailBody = template.body;
            } catch (_error) {
                return NextResponse.json<ApiResponse>(
                    {
                        success: false,
                        error: `Invalid template: ${body.template}`
                    },
                    { status: 400 }
                );
            }
        } else {
            // Use direct subject and body
            if (!body.subject || !body.body) {
                return NextResponse.json<ApiResponse>(
                    {
                        success: false,
                        error: "Subject and body are required when not using a template"
                    },
                    { status: 400 }
                );
            }
            subject = body.subject;
            emailBody = body.body;
        }

        // Send email
        const result = await sendEmail({
            to: body.to,
            subject,
            body: emailBody,
            from: body.from,
            replyTo: body.replyTo,
        });

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                data: {
                    messageId: result.messageId,
                    timestamp: result.timestamp,
                    provider: result.provider,
                },
                message: "Email sent successfully",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error sending email:", error);

        if (error instanceof MailerError) {
            return NextResponse.json<ApiResponse>(
                {
                    success: false,
                    error: `Mailer error (${error.provider}): ${error.message}`
                },
                { status: 500 }
            );
        }

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
