import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

function getOpenAIClient() {
  return new OpenAI();
}

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function uploadToStorage(imageBuffer: ArrayBuffer): Promise<string | null> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not set — skipping storage upload");
      return null;
    }

    const supabase = createServiceClient();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("story-covers")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload failed:", uploadError.message);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("story-covers").getPublicUrl(fileName);

    console.log("Image uploaded to Supabase Storage:", publicUrl);
    return publicUrl;
  } catch (err) {
    console.error("Storage upload error:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit("image");
    if (limited) return limited;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Image generation is not configured." },
        { status: 500 }
      );
    }

    const { title, childName, theme, setting, character } = await request.json();

    // Build a safe, child-friendly illustration prompt
    const characterDetail = character ? `featuring ${character}` : "";
    const settingDetail = setting ? `set in ${setting}` : "in a magical landscape";
    const prompt = [
      `Children's book illustration for a story called "${title}"`,
      `${characterDetail}`,
      `${settingDetail},`,
      `theme: ${theme}.`,
      "Soft watercolor style, warm pastel colours, whimsical and cozy,",
      "no text, no letters, no words in the image.",
    ]
      .filter(Boolean)
      .join(" ");

    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) throw new Error("No image URL returned from DALL-E");

    // Download the image from DALL-E (URL is temporary, expires in ~1 hour)
    const imageResponse = await fetch(tempUrl);
    if (!imageResponse.ok) {
      console.error("Failed to download DALL-E image, using temp URL");
      return NextResponse.json({ url: tempUrl });
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Try to upload to Supabase Storage for a permanent URL
    const permanentUrl = await uploadToStorage(imageBuffer);

    // Return permanent URL if upload worked, otherwise fall back to temp DALL-E URL
    const url = permanentUrl || tempUrl;
    console.log("Returning image URL:", url.substring(0, 80) + "...");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image generation error:", error);
    let message = "Failed to generate image.";
    if (error instanceof Error) {
      if (error.message.includes("billing") || error.message.includes("quota")) {
        message = "OpenAI billing not set up. Add credits at platform.openai.com.";
      } else if (error.message.includes("content_policy")) {
        message = "Image prompt was flagged. Skipping cover image.";
      }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
