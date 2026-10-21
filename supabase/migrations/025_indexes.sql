-- Every non-primary-key index in public, in one place. The non-unique
-- ones were suggested by Supabase's index advisor and created from the
-- dashboard on 2026-10-21; recorded here so a rebuild from migrations
-- matches production. Names match what the dashboard created, so this is
-- a no-op where they already exist.
--
-- Defined by earlier migrations (listed for reference, not recreated):
--   profiles_username_lower_idx          unique (lower(username))       003
--   profiles_kiosk_location_unique       unique (location_id) kiosks     015
--   session_alerts_checkin_level_unique  unique (checkin_id, level)      006 (constraint)

-- locations
create index if not exists locations_org_id_idx
  on locations using btree (org_id);

-- parent_contacts: Live display looks up each checked-in student's contact.
create index if not exists parent_contacts_student_id_idx
  on parent_contacts using btree (student_id);

-- staff_checkins
create index if not exists staff_checkins_org_id_idx
  on staff_checkins using btree (org_id);
create index if not exists staff_checkins_checked_in_at_idx
  on staff_checkins using btree (checked_in_at);
create index if not exists staff_checkins_checked_out_at_idx
  on staff_checkins using btree (checked_out_at);

-- The advisor suggestion was applied three times, leaving two identical
-- copies that only add write overhead.
drop index if exists staff_checkins_checked_out_at_idx1;
drop index if exists staff_checkins_checked_out_at_idx2;

-- staff_members
create index if not exists staff_members_first_name_idx
  on staff_members using btree (first_name);

-- student_checkins: "who's checked in right now" (checked_out_at is null)
-- backs the dashboard, live display, check-in page and auto-checkout cron.
create index if not exists student_checkins_org_id_idx
  on student_checkins using btree (org_id);
create index if not exists student_checkins_checked_out_at_idx
  on student_checkins using btree (checked_out_at);
create index if not exists student_checkins_assigned_staff_id_idx
  on student_checkins using btree (assigned_staff_id);

-- Foreign keys the performance advisor flagged as unindexed. org_id is
-- filtered on by every RLS policy, so these keep one org's queries from
-- scanning every org's rows. The location_id foreign keys are left out on
-- purpose (one location per org, so they're no narrower than org_id), as
-- are audit columns like edited_by that only matter on rare deletes.
create index if not exists students_org_id_idx
  on students using btree (org_id);
create index if not exists staff_members_org_id_idx
  on staff_members using btree (org_id);
create index if not exists profiles_org_id_idx
  on profiles using btree (org_id);
create index if not exists parent_contacts_org_id_idx
  on parent_contacts using btree (org_id);
create index if not exists session_alerts_org_id_idx
  on session_alerts using btree (org_id);
create index if not exists staff_notifications_org_id_idx
  on staff_notifications using btree (org_id);
create index if not exists sms_log_org_id_idx
  on sms_log using btree (org_id);

-- A student's visit history; a staff member's timesheet; and which staff
-- member a login belongs to (every staff page, staff clock-out).
create index if not exists student_checkins_student_id_idx
  on student_checkins using btree (student_id);
create index if not exists staff_checkins_staff_id_idx
  on staff_checkins using btree (staff_id);
create index if not exists staff_members_profile_id_idx
  on staff_members using btree (profile_id);

-- students
create index if not exists students_is_active_idx
  on students using btree (is_active);
create index if not exists students_first_name_idx
  on students using btree (first_name);
create index if not exists students_last_name_idx
  on students using btree (last_name);
