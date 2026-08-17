-- Expose the primary parent/guardian contact (falling back to the
-- earliest-added contact if none is marked primary) on active_students,
-- so the Live Display can show it without a separate query.
create or replace view active_students as
select
  sc.id,
  sc.org_id,
  sc.student_id,
  s.first_name  as student_first_name,
  s.last_name   as student_last_name,
  sc.location_id,
  sc.checked_in_at,
  sc.subjects_snapshot,
  sc.time_limit_minutes,
  sc.checkin_method,
  sc.assigned_staff_id,
  case when sm.id is not null then sm.first_name || ' ' || sm.last_name end as assigned_staff_name,
  extract(epoch from (now() - sc.checked_in_at))::int / 60 as elapsed_minutes,
  case
    when extract(epoch from (now() - sc.checked_in_at))::int / 60 >= sc.time_limit_minutes then 'red'
    when sc.subjects_snapshot = 'both' and extract(epoch from (now() - sc.checked_in_at))::int / 60 >= 30 then 'yellow'
    when sc.subjects_snapshot != 'both' and extract(epoch from (now() - sc.checked_in_at))::int / 60 >= 15 then 'yellow'
    else 'green'
  end as timer_status,
  pc.full_name as primary_contact_name,
  pc.phone as primary_contact_phone,
  pc.relationship as primary_contact_relationship
from student_checkins sc
join students s on s.id = sc.student_id
left join staff_members sm on sm.id = sc.assigned_staff_id
left join lateral (
  select full_name, phone, relationship
  from parent_contacts
  where student_id = sc.student_id
  order by is_primary desc, created_at asc
  limit 1
) pc on true
where sc.checked_out_at is null;
