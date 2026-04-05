import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit("clone");
    if (limited) return limited;

    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Voice cloning is not configured." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided." },
        { status: 400 }
      );
    }

    // Build form data for ElevenLabs API
    const elFormData = new FormData();
    elFormData.append("name", `storyteller-${Date.now()}`);
    elFormData.append("files", audioFile, "recording.webm");
    elFormData.append(
      "description",
      "Voice cloned for reading children's stories aloud"
    );

    const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: elFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("ElevenLabs clone error:", errorData);
      const message =
        errorData?.detail?.message || "Failed to clone voice. Try again.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ voiceId: data.voice_id });
  } catch (error) {
    console.error("Voice clone error:", error);
    return NextResponse.json(
      { error: "Failed to process voice recording." },
      { status: 500 }
    );
  }
}
