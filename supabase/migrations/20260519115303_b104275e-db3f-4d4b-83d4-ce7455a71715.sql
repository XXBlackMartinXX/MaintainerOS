
create table public.github_publish_events (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null,
  user_id uuid not null,
  target_type text not null check (target_type in ('issue','pull_request','release','issue_labels')),
  target_id text,
  source_type text not null check (source_type in ('issue_triage','pr_summary','release_draft')),
  source_id uuid,
  github_url text,
  github_response_metadata jsonb not null default '{}'::jsonb,
  status text not null check (status in ('attempted','success','failed')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.github_publish_events enable row level security;

create policy "publish events self read" on public.github_publish_events
  for select using (auth.uid() = user_id);

create policy "publish events self insert" on public.github_publish_events
  for insert with check (auth.uid() = user_id);

create index idx_gpe_repo on public.github_publish_events(repository_id, created_at desc);
create index idx_gpe_source on public.github_publish_events(source_type, source_id);
