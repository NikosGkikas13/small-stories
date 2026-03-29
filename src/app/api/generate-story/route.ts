import { NextRequest, NextResponse } from "next/server";
import { storyFormSchema } from "@/lib/validators";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompts";
import { streamStory } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Story generation is not configured. Please set up an API key." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const result = storyFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const systemPrompt = buildSystemPrompt(data.age, data.length);
    const userMessage = buildUserMessage(data);
    const maxTokens = data.length === "short" ? 1024 : 2048;

    const stream = await streamStory(systemPrompt, userMessage, maxTokens);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Story generation error:", error);

    // Extract useful error message from Anthropic SDK errors
    let message = "Failed to generate story. Please try again.";
    let status = 500;

    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("authentication")) {
        message = "API key is invalid. Please check your configuration.";
        status = 401;
      } else if (error.message.includes("403") || error.message.includes("billing")) {
        message = "API billing is not set up. Please add a payment method at console.anthropic.com.";
        status = 403;
      } else if (error.message.includes("429")) {
        message = "Too many requests. Please wait a moment and try again.";
        status = 429;
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
