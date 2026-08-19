-- Lets an owner reuse the same real email across multiple location-accounts
-- (one owner account per location, per the new model) without needing a
-- distinct work email for each one. Supabase Auth still requires a unique
-- email per account, so when a signup or email change collides with an
-- email already in use, the app derives a plus-tagged variant
-- (name+username@domain) to satisfy that uniqueness requirement — using
-- the account's own username as the tag guarantees it's unique, since
-- usernames already are.
--
-- auth_email holds that tagged variant when one was needed; it's null for
-- the common case where the real email is unique and used as-is. profiles.
-- email always holds the real, human-facing address — the only thing ever
-- shown in the UI. Login/password-reset resolve username -> auth_email
-- (falling back to email) so they target the real Supabase Auth account.
alter table profiles add column if not exists auth_email text;

-- v_profiles (016_friendly_location_views.sql) expands profiles.* at
-- creation time, so it won't pick up auth_email on its own — refresh it.
-- CREATE OR REPLACE VIEW requires existing columns to stay in the same
-- position, so this lists them explicitly (matching the view's current
-- live order) instead of using p.*, with auth_email appended at the end.
create or replace view v_profiles as
select
  p.id,
  p.org_id,
  p.role,
  p.full_name,
  p.email,
  p.created_at,
  p.username,
  p.phone,
  p.location_id,
  o.name as org_name,
  p.auth_email
from profiles p
left join organizations o on o.id = p.org_id;
