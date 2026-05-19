create table public.documentation_drafts (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null,
  user_id uuid not null,
  doc_type text not null,
  title text not null default '',
  body_markdown text not null default '',
  structured_result jsonb not null default '{}'::jsonb,
  model text,
  approval_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documentation_drafts_repo_idx on public.documentation_drafts(repository_id);
create index documentation_drafts_user_idx on public.documentation_drafts(user_id);

alter table public.documentation_drafts enable row level security;

create policy "docs self read" on public.documentation_drafts for select using (auth.uid() = user_id);
create policy "docs self insert" on public.documentation_drafts for insert with check (auth.uid() = user_id);
create policy "docs self update" on public.documentation_drafts for update using (auth.uid() = user_id);
create policy "docs self delete" on public.documentation_drafts for delete using (auth.uid() = user_id);

create trigger documentation_drafts_touch
  before update on public.documentation_drafts
  for each row execute function public.touch_updated_at();