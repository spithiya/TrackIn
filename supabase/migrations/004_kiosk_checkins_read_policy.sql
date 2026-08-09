-- The kiosk runs as the anon role and needs to check whether a student is
-- currently checked in, but the generic student_checkins_org_policy requires
-- auth_org_id() (null for anon), silently blocking all kiosk reads.
create policy "kiosk_checkins_read" on student_checkins for select to anon using (checked_out_at is null);
