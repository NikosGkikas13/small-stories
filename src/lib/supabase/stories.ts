import { createClient } from "./server";

export interface Story {
  id: string;
  user_id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  child_name: string;
  age: number;
  theme: string;
  character: string | null;
  setting: string | null;
  length: "short" | "medium";
  format: "story" | "poem";
  language: string;
  gender: "boy" | "girl";
  created_at: string;
}

export interface SaveStoryInput {
  title: string;
  content: string;
  cover_image_url?: string | null;
  child_name: string;
  age: number;
  theme: string;
  character?: string | null;
  setting?: string | null;
  length: "short" | "medium";
  format: "story" | "poem";
  language: string;
  gender: "boy" | "girl";
}

/** Save a new story for the authenticated user. */
export async function saveStory(input: SaveStoryInput): Promise<Story> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("stories")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Story;
}

/** Fetch all stories for the authenticated user, most recent first. */
export async function getUserStories(): Promise<Story[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Story[];
}

/** Fetch a single story by ID (only if owned by the user). */
export async function getStoryById(id: string): Promise<Story | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Story;
}

/** Update the cover image URL of an existing story. */
export async function updateStoryCoverImage(
  id: string,
  cover_image_url: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("stories")
    .update({ cover_image_url })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/** Delete a story by ID. */
export async function deleteStory(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("stories").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
