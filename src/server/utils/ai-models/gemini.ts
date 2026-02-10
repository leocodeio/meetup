/**
 * Google Gemini AI Integration
 * Provides chat completion functionality using Google's Gemini models
 */

import { GoogleGenAI } from "@google/genai";
import {
    AIResponse,
    AIMessage,
    ChatCompletionOptions,
    DEFAULT_CONFIG,
    AI_MODELS,
    getAPIKey,
    validateAIConfig,
    AIError,
} from "./config";

export class GeminiAI {
    private client: GoogleGenAI;
    private model: string;

    constructor(model: string = AI_MODELS.GEMINI.FLASH) {
        validateAIConfig("gemini");
        const apiKey = getAPIKey("gemini");

        this.client = new GoogleGenAI({ apiKey });
        this.model = model;
    }

    /**
     * Generate chat completion using Gemini
     */
    async chat(options: ChatCompletionOptions): Promise<AIResponse> {
        try {
            const {
                messages,
                temperature = DEFAULT_CONFIG.temperature,
                maxTokens = DEFAULT_CONFIG.maxTokens,
            } = options;

            // Convert messages to Gemini format
            const contents = this.formatMessages(messages);

            const response = await this.client.models.generateContent({
                model: this.model,
                contents,
                config: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    topP: options.topP || DEFAULT_CONFIG.topP,
                },
            });

            return {
                text: response.text || "",
                model: this.model,
                usage: {
                    promptTokens: response.usageMetadata?.promptTokenCount,
                    completionTokens: response.usageMetadata?.candidatesTokenCount,
                    totalTokens: response.usageMetadata?.totalTokenCount,
                },
                finishReason: response.candidates?.[0]?.finishReason,
            };
        } catch (error) {
            throw new AIError(
                `Gemini API error: ${error instanceof Error ? error.message : "Unknown error"}`,
                "gemini",
                error
            );
        }
    }

    /**
     * Generate simple text completion
     */
    async generateText(prompt: string, options?: Partial<ChatCompletionOptions>): Promise<string> {
        const response = await this.chat({
            messages: [{ role: "user", content: prompt }],
            ...options,
        });
        return response.text;
    }

    /**
     * Stream chat completion (for real-time responses)
     */
    async *streamChat(options: ChatCompletionOptions): AsyncGenerator<string> {
        try {
            const {
                messages,
                temperature = DEFAULT_CONFIG.temperature,
                maxTokens = DEFAULT_CONFIG.maxTokens,
            } = options;

            const contents = this.formatMessages(messages);

            const stream = await this.client.models.generateContentStream({
                model: this.model,
                contents,
                config: {
                    temperature,
                    maxOutputTokens: maxTokens,
                    topP: options.topP || DEFAULT_CONFIG.topP,
                },
            });

            for await (const chunk of stream) {
                if (chunk.text) {
                    yield chunk.text;
                }
            }
        } catch (error) {
            throw new AIError(
                `Gemini streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
                "gemini",
                error
            );
        }
    }

    /**
     * Format messages for Gemini API
     */
    private formatMessages(messages: AIMessage[]): string {
        // Gemini expects a single string or structured content
        // For simple chat, we'll concatenate messages with role prefixes
        return messages
            .map((msg) => {
                const rolePrefix = msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : "System";
                return `${rolePrefix}: ${msg.content}`;
            })
            .join("\n\n");
    }

    /**
     * Change the model being used
     */
    setModel(model: string): void {
        this.model = model;
    }

    /**
     * Get current model
     */
    getModel(): string {
        return this.model;
    }
}

// Export a default instance
export const gemini = new GeminiAI();

// Export model constants for convenience
export { AI_MODELS };
