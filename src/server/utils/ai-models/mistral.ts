/**
 * Mistral AI Integration
 * Provides chat completion functionality using Mistral's models
 */

import { Mistral } from "@mistralai/mistralai";
import {
    AIResponse,
    ChatCompletionOptions,
    DEFAULT_CONFIG,
    AI_MODELS,
    getAPIKey,
    validateAIConfig,
    AIError,
} from "./config";

/**
 * Helper to extract text from Mistral's content format (string | ContentChunk[])
 */
function extractText(content: unknown): string {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((chunk) => {
                if (typeof chunk === "string") return chunk;
                if (typeof chunk === "object" && chunk !== null && "text" in chunk) {
                    return chunk.text;
                }
                return "";
            })
            .join("");
    }
    return "";
}

export class MistralAI {
    private client: Mistral;
    private model: string;

    constructor(model: string = AI_MODELS.MISTRAL.MEDIUM) {
        validateAIConfig("mistral");
        const apiKey = getAPIKey("mistral");

        this.client = new Mistral({ apiKey });
        this.model = model;
    }

    /**
     * Generate chat completion using Mistral
     */
    async chat(options: ChatCompletionOptions): Promise<AIResponse> {
        try {
            const {
                messages,
                temperature = DEFAULT_CONFIG.temperature,
                maxTokens = DEFAULT_CONFIG.maxTokens,
            } = options;

            const response = await this.client.chat.complete({
                model: this.model,
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
                temperature,
                maxTokens,
                topP: options.topP || DEFAULT_CONFIG.topP,
            });

            const choice = response.choices?.[0];

            return {
                text: extractText(choice?.message?.content),
                model: response.model || this.model,
                usage: {
                    promptTokens: response.usage?.promptTokens,
                    completionTokens: response.usage?.completionTokens,
                    totalTokens: response.usage?.totalTokens,
                },
                finishReason: choice?.finishReason,
            };
        } catch (error) {
            throw new AIError(
                `Mistral API error: ${error instanceof Error ? error.message : "Unknown error"}`,
                "mistral",
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

            const stream = await this.client.chat.stream({
                model: this.model,
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
                temperature,
                maxTokens,
                topP: options.topP || DEFAULT_CONFIG.topP,
            });

            for await (const chunk of stream) {
                const chunkData = chunk as { data?: { choices?: Array<{ delta?: { content?: unknown } }> }; choices?: Array<{ delta?: { content?: unknown } }> };
                const delta = extractText(chunkData.data?.choices?.[0]?.delta?.content || chunkData.choices?.[0]?.delta?.content);
                if (delta) {
                    yield delta;
                }
            }
        } catch (error) {
            throw new AIError(
                `Mistral streaming error: ${error instanceof Error ? error.message : "Unknown error"}`,
                "mistral",
                error
            );
        }
    }

    /**
     * Generate embeddings for text (useful for semantic search)
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.client.embeddings.create({
                model: "mistral-embed",
                inputs: texts,
            });

            return response.data.map((item) => item.embedding as number[]);
        } catch (error) {
            throw new AIError(
                `Mistral embeddings error: ${error instanceof Error ? error.message : "Unknown error"}`,
                "mistral",
                error
            );
        }
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
export const mistral = new MistralAI();

// Export model constants for convenience
export { AI_MODELS };
