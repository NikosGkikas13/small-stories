import { NextResponse } from "next/server";
import { deleteStory, getStoryById, updateStoryCoverImage } from "@/lib/supabase/stories";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const story = await getStoryById(id);
    if (!story || story.user_id !== userId) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const { cover_image_url } = await request.json();
    await updateStoryCoverImage(id, cover_image_url);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update story";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const story = await getStoryById(id);
    if (!story || story.user_id !== userId) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    await deleteStory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete story";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
