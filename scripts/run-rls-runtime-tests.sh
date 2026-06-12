#!/usr/bin/env bash
# Owner-run runtime RLS harness.
#
# Requires a LOCAL Postgres database. Never point this at production.
# Recommended: start a throwaway container, e.g.
#   docker run --rm -d --name rls-pg -e POSTGRES_PASSWORD=postgres \
#     -p 54329:5432 postgres:15
#   export DATABASE_URL=postgres://postgres:postgres@localhost:54329/postgres
#
# Then:
#   bun run test:rls:runtime
#
# What it does:
#   1. Creates roles `anon` and `authenticated` if missing (mirrors Supabase).
#   2. Applies every file in supabase/migrations/ in lexicographic order.
#   3. Runs scripts/rls-runtime-tests.sql which seeds fixtures and asserts
#      allow/deny for the documented invariants.
#
# It does NOT simulate GoTrue, auth.users rows, or service-role behavior.
# Service-role bypass is exercised by server-function unit tests, not here.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Point it at a LOCAL Postgres test database." >&2
  echo "Example: postgres://postgres:postgres@localhost:54329/postgres" >&2
  exit 2
fi

case "$DATABASE_URL" in
  *supabase.co*|*supabase.com*|*amazonaws.com*)
    echo "Refusing to run: DATABASE_URL appears to point at a managed/production DB." >&2
    exit 2
    ;;
esac

PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -X -q)

echo "==> Ensuring anon / authenticated roles exist"
"${PSQL[@]}" <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;
-- Minimal stub of auth.uid() so policies work without GoTrue.
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS
  $f$ SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $f$;
SQL

echo "==> Applying migrations"
for f in supabase/migrations/*.sql; do
  echo "  - $(basename "$f")"
  "${PSQL[@]}" -f "$f" >/dev/null
done

echo "==> Running RLS runtime assertions"
"${PSQL[@]}" -f scripts/rls-runtime-tests.sql

echo "==> OK"
