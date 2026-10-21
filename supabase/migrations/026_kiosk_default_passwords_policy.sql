-- Supabase advisor: "RLS Enabled No Policy" on kiosk_default_passwords.
-- No policies was deliberate (024): only the service role may touch this
-- table, and anon/authenticated have no grants on it either. This makes
-- that intent explicit instead of implicit. No change in who can access it.

create policy "no client access" on kiosk_default_passwords
  for all to anon, authenticated
  using (false)
  with check (false);
