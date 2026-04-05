import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Tier definitions: requests per window
const limiters = redis
  ? {
      // Story generation (Claude API) — most expensive
      generate: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1h"),
        prefix: "rl:generate",
      }),
      // Image generation (DALL-E) — expensive
      image: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1h"),
        prefix: "rl:image",
      }),
      // TTS (ElevenLabs) — moderate cost
      tts: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1h"),
        prefix: "rl:tts",
      }),
      // Voice cloning (ElevenLabs) — expensive, rare operation
      clone: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "24h"),
        prefix: "rl:clone",
      }),
      // DB operations — cheap, generous limit
      db: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, "1h"),
        prefix: "rl:db",
      }),
    }
  : null;

export type RateLimitTier = keyof NonNullable<typeof limiters>;

/**
 * Check rate limit for the authenticated user.
 * Returns null if allowed, or a NextResponse 429 if rate limited.
 * If Upstash is not configured, all requests are allowed (dev mode).
 */
export async function checkRateLimit(
  tier: RateLimitTier
): Promise<NextResponse | null> {
  if (!limiters) return null; // No Upstash configured — skip in dev

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { success, reset } = await limiters[tier].limit(user.id);

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  return null;
}
