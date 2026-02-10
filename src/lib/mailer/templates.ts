/**
 * Email Templates
 * Reusable email templates for the application
 */

export interface TemplateVariables {
    [key: string]: string | number | boolean | undefined;
}

export interface EmailTemplate {
    subject: string;
    body: string;
}

/**
 * Replace variables in a template string
 * Variables are in the format {{variableName}}
 */
function replaceVariables(
    template: string,
    variables: TemplateVariables
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = variables[key];
        return value !== undefined ? String(value) : match;
    });
}

/**
 * Generate an email template with variables replaced
 */
export function generateTemplate(
    template: EmailTemplate,
    variables: TemplateVariables
): EmailTemplate {
    return {
        subject: replaceVariables(template.subject, variables),
        body: replaceVariables(template.body, variables),
    };
}

// =============================================================================
// Base Styles
// =============================================================================

const baseStyles = `
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
  .content { padding: 30px 0; }
  .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; }
  .button:hover { background-color: #0060df; }
  h1 { color: #111; margin: 0 0 10px 0; }
  p { margin: 0 0 15px 0; }
  .highlight { background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; }
  .code { font-family: monospace; background-color: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
</style>
`;

const baseLayout = (content: string, appName: string = "Meetup") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${baseStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// =============================================================================
// Email Templates
// =============================================================================

/**
 * Welcome Email Template
 * Variables: userName, appName, loginUrl
 */
export const welcomeTemplate: EmailTemplate = {
    subject: "Welcome to {{appName}}!",
    body: baseLayout(`
        <h2>Welcome, {{userName}}!</h2>
        <p>We're excited to have you on board. Your account has been successfully created.</p>
        <p>Get started by exploring your dashboard and setting up your first project.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" class="button">Go to Dashboard</a>
        </p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Password Reset Template
 * Variables: userName, resetUrl, expiresIn, appName
 */
export const passwordResetTemplate: EmailTemplate = {
    subject: "Reset Your Password - {{appName}}",
    body: baseLayout(`
        <h2>Password Reset Request</h2>
        <p>Hi {{userName}},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" class="button">Reset Password</a>
        </p>
        <div class="highlight">
            <p><strong>This link will expire in {{expiresIn}}.</strong></p>
        </div>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Email Verification Template
 * Variables: userName, verifyUrl, appName
 */
export const emailVerificationTemplate: EmailTemplate = {
    subject: "Verify Your Email - {{appName}}",
    body: baseLayout(`
        <h2>Verify Your Email Address</h2>
        <p>Hi {{userName}},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{verifyUrl}}" class="button">Verify Email</a>
        </p>
        <p>If you didn't create an account with us, you can safely ignore this email.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Organization Invitation Template
 * Variables: inviterName, organizationName, inviteUrl, role, appName
 */
export const organizationInviteTemplate: EmailTemplate = {
    subject: "You've been invited to join {{organizationName}}",
    body: baseLayout(`
        <h2>You're Invited!</h2>
        <p>{{inviterName}} has invited you to join <strong>{{organizationName}}</strong> as a <strong>{{role}}</strong>.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{inviteUrl}}" class="button">Accept Invitation</a>
        </p>
        <p>This invitation will give you access to the organization's projects and resources.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Project Invitation Template
 * Variables: inviterName, projectName, organizationName, inviteUrl, role, appName
 */
export const projectInviteTemplate: EmailTemplate = {
    subject: "You've been invited to {{projectName}}",
    body: baseLayout(`
        <h2>Project Invitation</h2>
        <p>{{inviterName}} has invited you to join the project <strong>{{projectName}}</strong> in <strong>{{organizationName}}</strong> as a <strong>{{role}}</strong>.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{inviteUrl}}" class="button">Accept Invitation</a>
        </p>
        <p>You'll be able to collaborate on stories, sprints, and more.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Story Assignment Template
 * Variables: assignerName, storyTitle, storyUrl, projectName, appName
 */
export const storyAssignmentTemplate: EmailTemplate = {
    subject: "You've been assigned to: {{storyTitle}}",
    body: baseLayout(`
        <h2>New Story Assignment</h2>
        <p>{{assignerName}} has assigned you to a story in <strong>{{projectName}}</strong>:</p>
        <div class="highlight">
            <p><strong>{{storyTitle}}</strong></p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{storyUrl}}" class="button">View Story</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Story Comment Template
 * Variables: commenterName, storyTitle, storyUrl, commentPreview, projectName, appName
 */
export const storyCommentTemplate: EmailTemplate = {
    subject: "New comment on: {{storyTitle}}",
    body: baseLayout(`
        <h2>New Comment</h2>
        <p>{{commenterName}} commented on a story you're following in <strong>{{projectName}}</strong>:</p>
        <div class="highlight">
            <p><strong>{{storyTitle}}</strong></p>
            <p style="color: #666; font-style: italic;">"{{commentPreview}}"</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{storyUrl}}" class="button">View Comment</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Sprint Started Template
 * Variables: sprintName, projectName, startDate, endDate, sprintUrl, appName
 */
export const sprintStartedTemplate: EmailTemplate = {
    subject: "Sprint Started: {{sprintName}}",
    body: baseLayout(`
        <h2>Sprint Started</h2>
        <p>A new sprint has started in <strong>{{projectName}}</strong>:</p>
        <div class="highlight">
            <p><strong>{{sprintName}}</strong></p>
            <p>Duration: {{startDate}} - {{endDate}}</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{sprintUrl}}" class="button">View Sprint</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Sprint Completed Template
 * Variables: sprintName, projectName, completedStories, totalStories, sprintUrl, appName
 */
export const sprintCompletedTemplate: EmailTemplate = {
    subject: "Sprint Completed: {{sprintName}}",
    body: baseLayout(`
        <h2>Sprint Completed!</h2>
        <p>A sprint has been completed in <strong>{{projectName}}</strong>:</p>
        <div class="highlight">
            <p><strong>{{sprintName}}</strong></p>
            <p>Stories completed: {{completedStories}} / {{totalStories}}</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{sprintUrl}}" class="button">View Sprint Report</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

/**
 * Generic Notification Template
 * Variables: title, message, actionUrl, actionText, appName
 */
export const notificationTemplate: EmailTemplate = {
    subject: "{{title}}",
    body: baseLayout(`
        <h2>{{title}}</h2>
        <p>{{message}}</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{actionUrl}}" class="button">{{actionText}}</a>
        </p>
        <p>Best regards,<br>The {{appName}} Team</p>
    `),
};

// =============================================================================
// Template Registry
// =============================================================================

export type TemplateName =
    | "welcome"
    | "password-reset"
    | "email-verification"
    | "organization-invite"
    | "project-invite"
    | "story-assignment"
    | "story-comment"
    | "sprint-started"
    | "sprint-completed"
    | "notification";

export const templates: Record<TemplateName, EmailTemplate> = {
    "welcome": welcomeTemplate,
    "password-reset": passwordResetTemplate,
    "email-verification": emailVerificationTemplate,
    "organization-invite": organizationInviteTemplate,
    "project-invite": projectInviteTemplate,
    "story-assignment": storyAssignmentTemplate,
    "story-comment": storyCommentTemplate,
    "sprint-started": sprintStartedTemplate,
    "sprint-completed": sprintCompletedTemplate,
    "notification": notificationTemplate,
};

/**
 * Get a template by name and replace variables
 */
export function getTemplate(
    name: TemplateName,
    variables: TemplateVariables = {}
): EmailTemplate {
    const template = templates[name];
    if (!template) {
        throw new Error(`Template "${name}" not found`);
    }

    // Add default appName if not provided
    const varsWithDefaults: TemplateVariables = {
        appName: "Meetup",
        ...variables,
    };

    return generateTemplate(template, varsWithDefaults);
}
