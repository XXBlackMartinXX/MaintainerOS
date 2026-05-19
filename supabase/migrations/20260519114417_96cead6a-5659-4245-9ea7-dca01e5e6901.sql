
create table if not exists public.pull_request_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  pull_request_id uuid not null,
  repository_id uuid not null,
  user_id uuid not null,
  model text not null,
  input_title_snapshot text not null,
  input_body_snapshot text,
  input_metadata_snapshot jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  release_note_candidate text,
  approval_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists pr_ai_summaries_pr_user_uniq on public.pull_request_ai_summaries(pull_request_id, user_id);
create index if not exists pr_ai_summaries_repo_idx on public.pull_request_ai_summaries(repository_id);

alter table public.pull_request_ai_summaries enable row level security;

create policy "pr_ai self read" on public.pull_request_ai_summaries for select using (auth.uid() = user_id);
create policy "pr_ai self insert" on public.pull_request_ai_summaries for insert with check (auth.uid() = user_id);
create policy "pr_ai self update" on public.pull_request_ai_summaries for update using (auth.uid() = user_id);
create policy "pr_ai self delete" on public.pull_request_ai_summaries for delete using (auth.uid() = user_id);

create trigger pr_ai_summaries_touch before update on public.pull_request_ai_summaries
  for each row execute function public.touch_updated_at();

create table if not exists public.release_drafts (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null,
  user_id uuid not null,
  version text not null default '',
  title text not null default '',
  body_markdown text not null default '',
  result jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists release_drafts_repo_user_idx on public.release_drafts(repository_id, user_id);

alter table public.release_drafts enable row level security;

create policy "release_drafts self read" on public.release_drafts for select using (auth.uid() = user_id);
create policy "release_drafts self insert" on public.release_drafts for insert with check (auth.uid() = user_id);
create policy "release_drafts self update" on public.release_drafts for update using (auth.uid() = user_id);
create policy "release_drafts self delete" on public.release_drafts for delete using (auth.uid() = user_id);

create trigger release_drafts_touch before update on public.release_drafts
  for each row execute function public.touch_updated_at();
