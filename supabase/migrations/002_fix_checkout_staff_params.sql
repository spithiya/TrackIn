-- Fix checkout_staff parameter names to match the RPC call arguments.
-- The original function used p_checkin_id / p_by_owner but the client sends
-- checkin_id / by_owner (matching checkout_student convention). PostgREST
-- uses strict named-parameter matching, so the mismatch caused the RPC to fail.

-- PostgreSQL does not allow renaming parameters via CREATE OR REPLACE;
-- the old signature must be dropped first.
drop function if exists checkout_staff(uuid, boolean);

create function checkout_staff(
  checkin_id uuid,
  by_owner   boolean default false
)
returns json language plpgsql security definer as $$
declare
  v_duration int;
  v_staff_id uuid;
  v_loc_id   uuid;
  v_org_id   uuid;
begin
  select staff_id, location_id, org_id,
         extract(epoch from (now() - checked_in_at))::int / 60
  into v_staff_id, v_loc_id, v_org_id, v_duration
  from staff_checkins
  where id = checkin_id and checked_out_at is null;

  if not found then
    raise exception 'Staff checkin not found or already checked out';
  end if;

  update staff_checkins set
    checked_out_at       = now(),
    duration_minutes     = v_duration,
    checked_out_by_owner = by_owner
  where id = checkin_id;

  insert into staff_notifications(org_id, staff_id, location_id, type)
  values (v_org_id, v_staff_id, v_loc_id, 'clock_out');

  return json_build_object('duration_minutes', v_duration);
end;
$$;
