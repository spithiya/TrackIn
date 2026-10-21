-- Indexes suggested by Supabase's index advisor and created from the
-- dashboard on 2026-10-21. Recorded here so a rebuild from migrations
-- matches production. Names are Postgres's defaults for an unnamed
-- CREATE INDEX, so this is a no-op where they already exist.

-- Live display looks up each checked-in student's primary contact.
create index if not exists parent_contacts_student_id_idx
  on parent_contacts using btree (student_id);

-- "Who's checked in right now" (checked_out_at is null): dashboard, live
-- display, check-in page and the auto-checkout cron job.
create index if not exists student_checkins_checked_out_at_idx
  on student_checkins using btree (checked_out_at);

-- Foreign key lookups when a staff member is deleted or filtered on.
create index if not exists student_checkins_assigned_staff_id_idx
  on student_checkins using btree (assigned_staff_id);
