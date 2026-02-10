/**
 * Plunk API Types
 * Based on https://next-wiki.useplunk.com/api-reference/public-api/sendEmail
 */

export interface PlunkRecipient {
    email: string;
    name?: string;
}

export interface PlunkAttachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
}

export interface PlunkSendRequest {
    to: string | PlunkRecipient | (string | PlunkRecipient)[];
    subject?: string;
    body?: string;
    template?: string;
    from?: string | PlunkRecipient;
    name?: string;
    subscribed?: boolean;
    data?: Record<string, unknown>;
    headers?: Record<string, string>;
    reply?: string;
    attachments?: PlunkAttachment[];
}

export interface PlunkContactInfo {
    id: string;
    email: string;
}

export interface PlunkEmailInfo {
    contact: PlunkContactInfo;
    email: string;
}

export interface PlunkSendResponse {
    success: boolean;
    data?: {
        emails: PlunkEmailInfo[];
        timestamp: string;
    };
    error?: {
        code: string;
        message: string;
        statusCode: number;
        requestId?: string;
        errors?: Array<{
            field: string;
            message: string;
            code: string;
        }>;
        suggestion?: string;
    };
    timestamp?: string;
}

export interface PlunkErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        statusCode: number;
        requestId?: string;
        errors?: Array<{
            field: string;
            message: string;
            code: string;
        }>;
        suggestion?: string;
    };
    timestamp: string;
}
