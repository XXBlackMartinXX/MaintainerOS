
-- documentation_drafts
DROP POLICY IF EXISTS "docs self insert" ON public.documentation_drafts;
DROP POLICY IF EXISTS "docs self update" ON public.documentation_drafts;
CREATE POLICY "docs self insert" ON public.documentation_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));
CREATE POLICY "docs self update" ON public.documentation_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));

-- github_publish_events
DROP POLICY IF EXISTS "publish events self insert" ON public.github_publish_events;
CREATE POLICY "publish events self insert" ON public.github_publish_events FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));

-- issue_triage_results
DROP POLICY IF EXISTS "triage self insert" ON public.issue_triage_results;
DROP POLICY IF EXISTS "triage self update" ON public.issue_triage_results;
CREATE POLICY "triage self insert" ON public.issue_triage_results FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));
CREATE POLICY "triage self update" ON public.issue_triage_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));

-- pull_request_ai_summaries
DROP POLICY IF EXISTS "pr_ai self insert" ON public.pull_request_ai_summaries;
DROP POLICY IF EXISTS "pr_ai self update" ON public.pull_request_ai_summaries;
CREATE POLICY "pr_ai self insert" ON public.pull_request_ai_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));
CREATE POLICY "pr_ai self update" ON public.pull_request_ai_summaries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));

-- release_drafts
DROP POLICY IF EXISTS "release_drafts self insert" ON public.release_drafts;
DROP POLICY IF EXISTS "release_drafts self update" ON public.release_drafts;
CREATE POLICY "release_drafts self insert" ON public.release_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));
CREATE POLICY "release_drafts self update" ON public.release_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.has_repo_access(auth.uid(), repository_id));
