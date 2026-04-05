# Small Stories

A children's story generator web app. Parents input their child's name, age, theme, and preferences — the app generates a personalized bedtime story using AI, complete with a cover illustration and read-aloud narration.

## Features

- **Story generation** — Streams personalized stories via Claude (Anthropic)
- **Cover art** — Generates watercolor-style illustrations via DALL-E 3
- **Read aloud** — Text-to-speech narration via ElevenLabs, with voice cloning support
- **Auth** — Email/password login and signup via Supabase
- **Story library** — Save, browse, re-read, and delete past stories
- **Multi-language** — English and Greek UI, stories generated in either language
- **Dark mode** — Light/dark theme toggle
- **Rate limiting** — Per-user API limits via Upstash Redis

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth & DB**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Anthropic Claude Haiku (stories), OpenAI DALL-E 3 (images)
- **Voice**: ElevenLabs (TTS + voice cloning)
- **Rate Limiting**: Upstash Redis

## Getting Started

### Prerequisites

- Node.js >= 20
- A Supabase project
- API keys for Anthropic, OpenAI, and ElevenLabs

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd small-stories
npm install
```

2. Create a `.env.local` file with your keys:

```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ELEVEN_LABS_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

3. Run the database migration in your Supabase SQL editor:

```bash
# Copy and run the contents of:
supabase/create-stories-table.sql
```

4. Create a `story-covers` storage bucket in Supabase (set to public).

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
  app/
    api/            # API routes (generate-story, generate-image, read-story, clone-voice, stories)
    auth/           # Supabase auth callback
    create/         # Story creation form
    history/        # Story list view
    login/          # Login page
    my-stories/     # Bookshelf view
    signup/         # Signup page
    story/          # Story reader with pagination
  components/       # Reusable UI components
  contexts/         # React contexts (locale)
  lib/              # Utilities (Anthropic, i18n, prompts, rate-limit, Supabase, validators)
  proxy.ts          # Auth middleware (redirects unauthenticated users)
supabase/           # Database migrations
```
