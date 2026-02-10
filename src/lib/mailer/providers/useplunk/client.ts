/**
 * Plunk Email Provider Client
 * Implementation for sending emails via Plunk API
 */

import {
    EmailOptions,
    EmailResponse,
    MailerConfig,
    MailerError,
} from "../../mailer.config";
import type {
    PlunkSendRequest,
    PlunkSendResponse,
} from "./types";

const PLUNK_API_BASE_URL = "https://next-api.useplunk.com";

export class PlunkClient {
    private apiKey: string;
    private baseUrl: string;
    private defaultFrom?: string | { email: string; name?: string };

    constructor(config: MailerConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || PLUNK_API_BASE_URL;
        this.defaultFrom = config.from;
    }

    /**
     * Send an email using Plunk API
     */
    async send(options: EmailOptions): Promise<EmailResponse> {
        try {
            const request = this.buildRequest(options);
            const response = await this.makeRequest(request);

            if (!response.success) {
                throw new MailerError(
                    response.error?.message || "Failed to send email",
                    "useplunk",
                    response.error
                );
            }

            return {
                success: true,
                messageId: response.data?.emails[0]?.contact.id,
                timestamp: response.data?.timestamp,
                provider: "useplunk",
                data: response.data,
            };
        } catch (error) {
            if (error instanceof MailerError) {
                throw error;
            }

            throw new MailerError(
                `Failed to send email via Plunk: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                "useplunk",
                error
            );
        }
    }

    /**
     * Build Plunk API request from EmailOptions
     */
    private buildRequest(options: EmailOptions): PlunkSendRequest {
        const request: PlunkSendRequest = {
            to: options.to,
        };

        // Handle template or inline content
        if (options.template) {
            request.template = options.template;
            if (options.variables) {
                request.data = options.variables;
            }
        } else {
            request.subject = options.subject;
            request.body = options.body;
        }

        // Handle from address
        if (options.from) {
            request.from = options.from;
        } else if (this.defaultFrom) {
            request.from = this.defaultFrom;
        }

        // Optional fields
        if (options.replyTo) {
            request.reply = options.replyTo;
        }

        if (options.headers) {
            request.headers = options.headers;
        }

        if (options.attachments) {
            request.attachments = options.attachments;
        }

        if (options.subscribed !== undefined) {
            request.subscribed = options.subscribed;
        }

        return request;
    }

    /**
     * Make HTTP request to Plunk API
     */
    private async makeRequest(
        request: PlunkSendRequest
    ): Promise<PlunkSendResponse> {
        const response = await fetch(`${this.baseUrl}/v1/send`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
        });

        const data = (await response.json()) as PlunkSendResponse;

        if (!response.ok) {
            return {
                success: false,
                error: data.error || {
                    code: "UNKNOWN_ERROR",
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    statusCode: response.status,
                },
                timestamp: new Date().toISOString(),
            };
        }

        return data;
    }

    /**
     * Track an event for a contact
     * Uses Plunk's event tracking endpoint
     */
    async trackEvent(email: string, event: string, data?: Record<string, unknown>): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/track`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    event,
                    data,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new MailerError(
                    `Failed to track event: ${error.message || response.statusText}`,
                    "useplunk",
                    error
                );
            }
        } catch (error) {
            if (error instanceof MailerError) {
                throw error;
            }

            throw new MailerError(
                `Failed to track event via Plunk: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                "useplunk",
                error
            );
        }
    }
}
