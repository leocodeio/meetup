import { NextRequest, NextResponse } from "next/server";
import { getAIClient, getAIProvider, getAIModel, GET_DESCRIPTION_BY_TITLE } from "@/server/utils/ai-models";
import { aiRateLimiter } from "@/lib/rate-limiter";
import { getClientIdentifier, createRateLimitResponse, applyRateLimitHeaders } from "@/lib/rate-limiter/middleware";

export async function POST(req: NextRequest) {
    try {
        // Apply rate limiting
        const identifier = getClientIdentifier(req);
        const rateLimitResult = await aiRateLimiter.check(identifier);
        
        if (!rateLimitResult.success) {
            return createRateLimitResponse(rateLimitResult);
        }

        const { title } = await req.json();

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const provider = getAIProvider();
        const model = getAIModel(provider);
        const client = getAIClient(provider, model);

        const response = await client.chat({
            messages: [
                { role: "system", content: GET_DESCRIPTION_BY_TITLE },
                { role: "user", content: `Title: ${title}\n\nTask: Generate a detailed description based on this title.` }
            ]
        });

        let description = response.text;

        // Clean up AI response if it's wrapped in markdown code blocks
        if (description.includes("```html")) {
            description = description.split("```html")[1].split("```")[0].trim();
        } else if (description.includes("```")) {
            description = description.split("```")[1].split("```")[0].trim();
        }


        return applyRateLimitHeaders(
            NextResponse.json({ description }),
            rateLimitResult
        );
    } catch (error: unknown) {
        console.error("AI Generation failed:", error);
        const message = error instanceof Error ? error.message : "Failed to generate description";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
