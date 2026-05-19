
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_login text,
  github_id text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

-- Token storage (server-only)
create table public.user_github_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  scopes text,
  updated_at timestamptz not null default now()
);
alter table public.user_github_tokens enable row level security;
-- intentionally no policies; service role only

-- Repositories
create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  github_id bigint unique not null,
  owner text not null,
  name text not null,
  full_name text not null,
  description text,
  stars int not null default 0,
  forks int not null default 0,
  primary_language text,
  visibility text,
  open_issues int not null default 0,
  pushed_at timestamptz,
  default_branch text,
  html_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.repositories enable row level security;

create table public.repository_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  repository_id uuid not null references public.repositories(id) on delete cascade,
  role text not null default 'maintainer',
  connected_at timestamptz not null default now(),
  primary key (user_id, repository_id)
);
alter table public.repository_memberships enable row level security;
create policy "memberships self read" on public.repository_memberships for select using (auth.uid() = user_id);
create policy "memberships self write" on public.repository_memberships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Helper function for repo access (security definer to avoid recursion)
create or replace function public.has_repo_access(_user_id uuid, _repo_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.repository_memberships where user_id = _user_id and repository_id = _repo_id)
$$;

create policy "repos read if member" on public.repositories for select
  using (public.has_repo_access(auth.uid(), id));

-- Issues
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  github_id bigint not null,
  number int not null,
  title text not null,
  state text not null,
  author_login text,
  author_avatar text,
  labels jsonb not null default '[]'::jsonb,
  comments int not null default 0,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz,
  unique (repository_id, github_id)
);
alter table public.issues enable row level security;
create policy "issues read if member" on public.issues for select using (public.has_repo_access(auth.uid(), repository_id));
create index on public.issues (repository_id, state);

-- Pull requests
create table public.pull_requests (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  github_id bigint not null,
  number int not null,
  title text not null,
  state text not null,
  author_login text,
  author_avatar text,
  additions int default 0,
  deletions int default 0,
  changed_files int default 0,
  draft boolean default false,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  merged_at timestamptz,
  closed_at timestamptz,
  unique (repository_id, github_id)
);
alter table public.pull_requests enable row level security;
create policy "prs read if member" on public.pull_requests for select using (public.has_repo_access(auth.uid(), repository_id));
create index on public.pull_requests (repository_id, state);

-- Contributors
create table public.contributors (
  repository_id uuid not null references public.repositories(id) on delete cascade,
  login text not null,
  avatar_url text,
  contributions int not null default 0,
  primary key (repository_id, login)
);
alter table public.contributors enable row level security;
create policy "contributors read if member" on public.contributors for select using (public.has_repo_access(auth.uid(), repository_id));

-- Labels
create table public.labels (
  repository_id uuid not null references public.repositories(id) on delete cascade,
  name text not null,
  color text,
  description text,
  primary key (repository_id, name)
);
alter table public.labels enable row level security;
create policy "labels read if member" on public.labels for select using (public.has_repo_access(auth.uid(), repository_id));

-- Commits
create table public.commits (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  sha text not null,
  author_login text,
  author_avatar text,
  message text,
  committed_at timestamptz,
  unique (repository_id, sha)
);
alter table public.commits enable row level security;
create policy "commits read if member" on public.commits for select using (public.has_repo_access(auth.uid(), repository_id));
create index on public.commits (repository_id, committed_at desc);

-- Sync jobs
create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  issues_synced int default 0,
  prs_synced int default 0,
  contributors_synced int default 0,
  commits_synced int default 0,
  labels_synced int default 0,
  error text
);
alter table public.sync_jobs enable row level security;
create policy "sync_jobs self read" on public.sync_jobs for select using (auth.uid() = user_id);
create index on public.sync_jobs (repository_id, started_at desc);

-- Audit logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create policy "audit self read" on public.audit_logs for select using (auth.uid() = user_id);

-- Settings
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_tone text not null default 'friendly',
  security_sensitivity text not null default 'balanced',
  auto_changelog boolean not null default true,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "settings self read" on public.settings for select using (auth.uid() = user_id);
create policy "settings self write" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile + settings on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, github_login, github_id, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'provider_id',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;
  insert into public.settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
