-- New kiosk logins get a random password instead of the old shared
-- 12345678. The owner should still be able to see it (and keep it if they
-- like), so it's stored here until they set their own from Settings,
-- which deletes the row.
--
-- Not on profiles: every org member can read their org's profiles, and
-- staff shouldn't see the kiosk password. RLS with no policies plus no
-- grants means only the service role (the owner Settings page and the
-- signup route) can touch this table.

create table kiosk_default_passwords (
  profile_id uuid primary key references profiles(id) on delete cascade,
  password   text not null,
  created_at timestamptz not null default now()
);

alter table kiosk_default_passwords enable row level security;
revoke all on kiosk_default_passwords from anon, authenticated;
