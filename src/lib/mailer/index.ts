/**
 * Mailer Service
 * Main entry point for sending emails with support for multiple providers
 */

import {
    type EmailOptions,
    type EmailResponse,
    type EmailProvider,
    type MailerConfig,
    getEmailProvider,
    getAPIKey,
    getDefaultFromEmail,
    getDefaultFromName,
    validateMailerConfig,
    MailerError,
} from "./mailer.config";

import { PlunkClient } from "./providers/useplunk";

/**
 * Abstract mailer interface that all providers must implement
 */
interface MailerProvider {
    send(options: EmailOptions): Promise<EmailResponse>;
}

/**
 * Main Mailer class for sending emails
 */
export class Mailer {
    private provider: MailerProvider;
    private providerName: EmailProvider;

    constructor(provider?: EmailProvider, config?: MailerConfig) {
        this.providerName = provider || getEmailProvider();

        // Validate configuration
        if (!config?.apiKey) {
            validateMailerConfig(this.providerName);
        }

        // Initialize provider
        const providerConfig: MailerConfig = config || {
            apiKey: getAPIKey(this.providerName),
            from: this.getDefaultFrom(),
        };

        this.provider = this.initializeProvider(
            this.providerName,
            providerConfig
        );
    }

    /**
     * Initialize the appropriate email provider
     */
    private initializeProvider(
        provider: EmailProvider,
        config: MailerConfig
    ): MailerProvider {
        switch (provider) {
            case "useplunk":
                return new PlunkClient(config);
            case "sendgrid":
                throw new MailerError(
                    "SendGrid provider not implemented yet",
                    provider
                );
            case "resend":
                throw new MailerError(
                    "Resend provider not implemented yet",
                    provider
                );
            default:
                throw new MailerError(
                    `Unknown email provider: ${provider}`,
                    provider
                );
        }
    }

    /**
     * Get default from email address
     */
    private getDefaultFrom(): string | { email: string; name?: string } | undefined {
        const email = getDefaultFromEmail();
        const name = getDefaultFromName();

        if (!email) return undefined;

        if (name) {
            return { email, name };
        }

        return email;
    }

    /**
     * Send an email
     */
    async send(options: EmailOptions): Promise<EmailResponse> {
        try {
            return await this.provider.send(options);
        } catch (error) {
            if (error instanceof MailerError) {
                throw error;
            }

            throw new MailerError(
                `Failed to send email: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                this.providerName,
                error
            );
        }
    }

    /**
     * Get the current provider name
     */
    getProviderName(): EmailProvider {
        return this.providerName;
    }
}

/**
 * Create a singleton instance of the mailer
 */
let mailerInstance: Mailer | null = null;

/**
 * Get or create the mailer instance
 */
export function getMailer(
    provider?: EmailProvider,
    config?: MailerConfig
): Mailer {
    if (!mailerInstance || provider || config) {
        mailerInstance = new Mailer(provider, config);
    }
    return mailerInstance;
}

/**
 * Send an email using the default mailer instance
 */
export async function sendEmail(
    options: EmailOptions
): Promise<EmailResponse> {
    const mailer = getMailer();
    return mailer.send(options);
}

// Re-export types and utilities
export type {
    EmailOptions,
    EmailResponse,
    EmailProvider,
    EmailRecipient,
    EmailAttachment,
    MailerConfig,
} from "./mailer.config";

export {
    MailerError,
    getEmailProvider,
    validateMailerConfig,
} from "./mailer.config";

// Re-export templates
export {
    getTemplate,
    generateTemplate,
    templates,
    type TemplateName,
    type EmailTemplate,
    type TemplateVariables,
} from "./templates";
