/**
 * AI Models - Main Export
 * Unified interface for all AI model integrations
 */

export * from "./config";
export * from "./gemini";
export * from "./mistral";
export * from "./systemprompts";

import { GeminiAI, gemini } from "./gemini";
import { MistralAI, mistral } from "./mistral";
import { AIProvider, AI_MODELS } from "./config";

/**
 * Factory function to get AI client by provider
 */
export function getAIClient(provider: AIProvider, model?: string) {
    switch (provider) {
        case "gemini":
            return model ? new GeminiAI(model) : gemini;
        case "mistral":
            return model ? new MistralAI(model) : mistral;
        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

/**
 * Default exports for convenience
 */
export const ai = {
    gemini,
    mistral,
    models: AI_MODELS,
    getClient: getAIClient,
};

export default ai;
