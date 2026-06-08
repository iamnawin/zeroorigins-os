-- Migration 004: Allow profile self-healing without the service-role key.
--
-- Why: on login, ensureProfile() self-heals a missing profiles row. Previously it
-- required SUPABASE_SERVICE_ROLE_KEY to bypass RLS; when that key was absent the
-- client creation threw and login failed with "An unexpected error occurred."
--
-- This policy lets an authenticated user insert ONLY their own profile row, and
-- only with role = 'CUSTOMER'. Role escalation is impossible via this policy;
-- promotion to internal roles stays a separate, controlled flow.

drop policy if exists "Users can insert own profile" on profiles;

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid() and role = 'CUSTOMER');
