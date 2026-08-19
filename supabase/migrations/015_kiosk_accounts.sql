-- Third account class: kiosk. Each kiosk login is scoped to exactly one
-- location and can only check students in/out there. This replaces the
-- old fully-public /kiosk flow, which required no login at all and let
-- anyone browse and use every organization's kiosk.

-- Allow 'kiosk' as a profiles.role value. profiles.role was declared as an
-- inline column check in 001_initial_schema.sql, so Postgres auto-named
-- the constraint profiles_role_check.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('owner', 'staff', 'kiosk'));

-- Which location a kiosk profile is allowed to operate at. Null until a
-- location is created for that org, at which point it's bound
-- automatically. Unused for owner/staff rows.
alter table profiles add column if not exists location_id uuid references locations(id) on delete set null;

-- At most one kiosk account per location.
create unique index if not exists profiles_kiosk_location_unique
  on profiles(location_id) where role = 'kiosk';
