-- The original kiosk RLS policies granted the anon role unscoped access:
-- "using (true)" on students, and no org/location check on student_checkins
-- insert/update/select. That was only safe by accident, relying on the
-- kiosk app code to always filter by location_id — anyone calling the
-- Supabase REST API directly with the public anon key could read or write
-- every organization's students and check-ins, not just their own.
--
-- Kiosk reads/writes now go through server routes (app/api/kiosk/**) that
-- use the service role and explicitly verify the student/checkin belongs
-- to the requested location before doing anything. Direct anon table
-- access is no longer needed, so remove it.
drop policy if exists "kiosk_students_read" on students;
drop policy if exists "kiosk_checkins_insert" on student_checkins;
drop policy if exists "kiosk_checkins_update" on student_checkins;
drop policy if exists "kiosk_checkins_read" on student_checkins;

-- checkout_student() doesn't check location/org internally (it trusts
-- whatever checkin_id it's given), so it shouldn't be callable directly
-- by anon either now that the kiosk calls it via the service role from
-- a route that's already verified the checkin belongs to that location.
revoke execute on function checkout_student(uuid, text) from anon;
