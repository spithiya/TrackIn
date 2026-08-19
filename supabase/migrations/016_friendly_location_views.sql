-- Read-only views for browsing data in Supabase Studio. Every operational
-- table is scoped by org_id (and most by location_id), but those are bare
-- UUIDs — there's no way to eyeball which business or location a row
-- belongs to without looking it up. These views add org_name/location_name
-- columns so that's visible directly in the Table Editor.
--
-- These are for manual browsing only — the app itself keeps querying the
-- real tables directly, so this is purely additive and carries no risk to
-- existing functionality.

create or replace view v_profiles as
select
  p.*,
  o.name as org_name
from profiles p
left join organizations o on o.id = p.org_id;

create or replace view v_staff_members as
select
  sm.*,
  o.name  as org_name,
  loc.name as location_name
from staff_members sm
left join organizations o on o.id = sm.org_id
left join locations loc on loc.id = sm.location_id;

create or replace view v_students as
select
  s.*,
  o.name  as org_name,
  loc.name as location_name
from students s
left join organizations o on o.id = s.org_id
left join locations loc on loc.id = s.location_id;

create or replace view v_parent_contacts as
select
  pc.*,
  o.name   as org_name,
  loc.name as location_name,
  s.first_name || ' ' || s.last_name as student_name
from parent_contacts pc
left join organizations o on o.id = pc.org_id
left join students s on s.id = pc.student_id
left join locations loc on loc.id = s.location_id;

create or replace view v_student_checkins as
select
  sc.*,
  o.name   as org_name,
  loc.name as location_name,
  s.first_name || ' ' || s.last_name as student_name
from student_checkins sc
left join organizations o on o.id = sc.org_id
left join locations loc on loc.id = sc.location_id
left join students s on s.id = sc.student_id;

create or replace view v_staff_checkins as
select
  sfc.*,
  o.name   as org_name,
  loc.name as location_name,
  sm.first_name || ' ' || sm.last_name as staff_name
from staff_checkins sfc
left join organizations o on o.id = sfc.org_id
left join locations loc on loc.id = sfc.location_id
left join staff_members sm on sm.id = sfc.staff_id;

create or replace view v_session_alerts as
select
  sa.*,
  o.name   as org_name,
  loc.name as location_name,
  s.first_name || ' ' || s.last_name as student_name
from session_alerts sa
left join organizations o on o.id = sa.org_id
left join student_checkins sc on sc.id = sa.checkin_id
left join locations loc on loc.id = sc.location_id
left join students s on s.id = sa.student_id;

create or replace view v_staff_notifications as
select
  sn.*,
  o.name   as org_name,
  loc.name as location_name,
  sm.first_name || ' ' || sm.last_name as staff_name
from staff_notifications sn
left join organizations o on o.id = sn.org_id
left join locations loc on loc.id = sn.location_id
left join staff_members sm on sm.id = sn.staff_id;

create or replace view v_sms_log as
select
  log.*,
  o.name   as org_name,
  loc.name as location_name
from sms_log log
left join organizations o on o.id = log.org_id
left join student_checkins sc on sc.id = log.checkin_id
left join locations loc on loc.id = sc.location_id;
