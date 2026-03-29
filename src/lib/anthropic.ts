import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

/**
 * Calls the Anthropic API with streaming enabled.
 * The `await` on `create()` validates the connection (auth, model, billing)
 * and throws on errors before we return the stream.
 */
export async function streamStory(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  // This await validates the API connection — it throws on auth/model/billing errors
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    stream: true,
  });

  // If we reach here, the API accepted the request — wrap the event stream
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        console.error("Stream error:", error);
        controller.close();
      }
    },
  });
}
