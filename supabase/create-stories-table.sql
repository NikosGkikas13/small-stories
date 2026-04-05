-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Stories table
create table public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  cover_image_url text,
  child_name text not null,
  age smallint not null,
  theme text not null,
  character text,
  setting text,
  length text not null check (length in ('short', 'medium')),
  format text not null check (format in ('story', 'poem')),
  language text not null default 'en',
  gender text not null check (gender in ('boy', 'girl')),
  created_at timestamptz default now() not null
);

-- Index for fast user lookups (most recent first)
create index stories_user_id_created_at_idx
  on public.stories (user_id, created_at desc);

-- RLS policies: users can only access their own stories
alter table public.stories enable row level security;

create policy "Users can view their own stories"
  on public.stories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own stories"
  on public.stories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own stories"
  on public.stories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own stories"
  on public.stories for delete
  using (auth.uid() = user_id);
