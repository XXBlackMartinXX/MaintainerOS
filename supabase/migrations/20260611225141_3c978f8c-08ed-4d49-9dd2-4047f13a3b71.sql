-- Remove user-writable policies on tables that must be server-mediated.
-- Per project security model, GitHub publish events are inserted only by
-- server-side handlers using the service-role client after explicit approval,
-- and AI draft approval transitions must go through server functions.
DROP POLICY IF EXISTS "publish events self insert" ON public.github_publish_events;
DROP POLICY IF EXISTS "docs self update" ON public.documentation_drafts;
DROP POLICY IF EXISTS "triage self update" ON public.issue_triage_results;
DROP POLICY IF EXISTS "pr_ai self update" ON public.pull_request_ai_summaries;
DROP POLICY IF EXISTS "release_drafts self update" ON public.release_drafts;