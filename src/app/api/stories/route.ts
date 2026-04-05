import { NextRequest, NextResponse } from "next/server";
import { saveStory, getUserStories } from "@/lib/supabase/stories";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit("db");
    if (limited) return limited;

    const body = await request.json();
    const story = await saveStory(body);
    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save story";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  try {
    const stories = await getUserStories();
    return NextResponse.json(stories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stories";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
