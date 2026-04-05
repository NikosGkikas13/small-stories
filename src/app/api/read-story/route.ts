import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit("tts");
    if (limited) return limited;

    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Voice reading is not configured." },
        { status: 500 }
      );
    }

    const { text, voiceId } = await request.json();

    if (!text || !voiceId) {
      return NextResponse.json(
        { error: "Missing text or voiceId." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("ElevenLabs TTS error:", errorData);
      const message =
        errorData?.detail?.message || "Failed to generate speech.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    // Stream the audio back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Read story error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech." },
      { status: 500 }
    );
  }
}
