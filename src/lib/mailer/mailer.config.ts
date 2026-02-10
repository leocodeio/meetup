/**
 * Mailer Configuration
 * Central configuration for all email provider integrations
 */

export interface EmailRecipient {
    email: string;
    name?: string;
}

export interface EmailAttachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
}

export interface EmailOptions {
    to: string | EmailRecipient | (string | EmailRecipient)[];
    subject: string;
    body: string;
    from?: string | EmailRecipient;
    replyTo?: string;
    template?: string;
    variables?: Record<string, unknown>;
    headers?: Record<string, string>;
    attachments?: EmailAttachment[];
    subscribed?: boolean;
}

export interface EmailResponse {
    success: boolean;
    messageId?: string;
    timestamp?: string;
    provider: EmailProvider;
    data?: unknown;
}

export interface MailerConfig {
    apiKey: string;
    from?: string | EmailRecipient;
    baseUrl?: string;
}

export type EmailProvider = "useplunk" | "sendgrid" | "resend";

/**
 * Email provider URLs
 */
export const EMAIL_PROVIDER_URLS = {
    useplunk: "https://next-api.useplunk.com",
    sendgrid: "https://api.sendgrid.com/v3",
    resend: "https://api.resend.com",
} as const;

/**
 * Default mailer configuration
 */
export const DEFAULT_MAILER_CONFIG = {
    provider: "useplunk" as EmailProvider,
} as const;

/**
 * Validates that required environment variables are set
 */
export function validateMailerConfig(provider: EmailProvider): void {
    const envVars: Record<EmailProvider, string> = {
        useplunk: "MAIL_PLUNK_API_KEY",
        sendgrid: "MAIL_SENDGRID_API_KEY",
        resend: "MAIL_RESEND_API_KEY",
    };

    const requiredVar = envVars[provider];
    if (!process.env[requiredVar]) {
        throw new Error(
            `Missing ${requiredVar} environment variable. Please add it to your .env file.`
        );
    }
}

/**
 * Gets API key for a specific provider
 */
export function getAPIKey(provider: EmailProvider): string {
    const envVars: Record<EmailProvider, string> = {
        useplunk: process.env.MAIL_PLUNK_API_KEY || "",
        sendgrid: process.env.MAIL_SENDGRID_API_KEY || "",
        resend: process.env.MAIL_RESEND_API_KEY || "",
    };

    const apiKey = envVars[provider];
    if (!apiKey) {
        throw new Error(
            `API key not found for ${provider}. Please check your environment variables.`
        );
    }

    return apiKey;
}

/**
 * Gets the configured email provider from environment
 */
export function getEmailProvider(): EmailProvider {
    const provider = process.env.MAIL_PROVIDER || "useplunk";
    if (
        provider !== "useplunk" &&
        provider !== "sendgrid" &&
        provider !== "resend"
    ) {
        return "useplunk";
    }
    return provider;
}

/**
 * Gets the default from email address from environment
 */
export function getDefaultFromEmail(): string | undefined {
    return process.env.MAIL_FROM_EMAIL;
}

/**
 * Gets the default from name from environment
 */
export function getDefaultFromName(): string | undefined {
    return process.env.MAIL_FROM_NAME;
}

/**
 * Error class for mailer-related errors
 */
export class MailerError extends Error {
    constructor(
        message: string,
        public provider: EmailProvider,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "MailerError";
    }
}
