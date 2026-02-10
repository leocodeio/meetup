/**
 * AI Models Configuration
 * Central configuration for all AI model integrations
 */

export interface AIMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface AIResponse {
    text: string;
    model: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    finishReason?: string;
}

export interface AIModelConfig {
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
}

export interface ChatCompletionOptions {
    messages: AIMessage[];
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
}

export type AIProvider = "gemini" | "mistral";

export const AI_MODELS = {
    GEMINI: {
        FLASH: "gemini-2.0-flash-exp",
        PRO: "gemini-1.5-pro-latest",
        FLASH_PREVIEW: "gemini-3-flash-preview",
    },
    MISTRAL: {
        SMALL: "mistral-small-latest",
        MEDIUM: "mistral-medium-latest",
        LARGE: "mistral-large-latest",
    },
} as const;

export const DEFAULT_CONFIG = {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.95,
} as const;

/**
 * Validates that required environment variables are set
 */
export function validateAIConfig(provider: AIProvider): void {
    const envVars: Record<AIProvider, string> = {
        gemini: "GEMINI_API_KEY",
        mistral: "MISTRAL_API_KEY",
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
export function getAPIKey(provider: AIProvider): string {
    const envVars: Record<AIProvider, string> = {
        gemini: process.env.GEMINI_API_KEY || "",
        mistral: process.env.MISTRAL_API_KEY || "",
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
 * Error class for AI-related errors
 */
export class AIError extends Error {
    constructor(
        message: string,
        public provider: AIProvider,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "AIError";
    }
}

/**
 * Gets the configured AI provider from environment
 */
export function getAIProvider(): AIProvider {
    const provider = process.env.AI_PROVIDER || "gemini";
    if (provider !== "gemini" && provider !== "mistral") {
        return "gemini";
    }
    return provider;
}

/**
 * Gets the configured AI model from environment
 */
export function getAIModel(provider: AIProvider): string {
    const envModel = process.env.AI_MODEL;
    if (envModel) return envModel;

    return provider === "gemini"
        ? AI_MODELS.GEMINI.FLASH
        : AI_MODELS.MISTRAL.MEDIUM;
}
