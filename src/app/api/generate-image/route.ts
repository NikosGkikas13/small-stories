import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
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

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("No image URL returned");

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
