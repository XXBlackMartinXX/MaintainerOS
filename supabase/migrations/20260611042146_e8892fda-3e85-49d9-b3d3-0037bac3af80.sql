-- Remove client-side write policies. All writes happen via service role in server functions.
DROP POLICY IF EXISTS "audit self insert" ON public.audit_logs;
DROP POLICY IF EXISTS "memberships self write" ON public.repository_memberships;