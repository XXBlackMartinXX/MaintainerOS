
CREATE TABLE public.issue_triage_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL,
  issue_id uuid NOT NULL,
  user_id uuid NOT NULL,
  model text NOT NULL,
  input_title text NOT NULL,
  input_body text,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggested_reply text,
  approval_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_triage_issue ON public.issue_triage_results(issue_id);
CREATE INDEX idx_triage_user ON public.issue_triage_results(user_id);
CREATE INDEX idx_triage_repo ON public.issue_triage_results(repository_id);

ALTER TABLE public.issue_triage_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "triage self read" ON public.issue_triage_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "triage self insert" ON public.issue_triage_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "triage self update" ON public.issue_triage_results
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "triage self delete" ON public.issue_triage_results
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_triage_updated
BEFORE UPDATE ON public.issue_triage_results
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "audit self insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
