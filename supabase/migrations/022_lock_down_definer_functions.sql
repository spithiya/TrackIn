-- Supabase advisor: "Public / Signed-In Users Can Execute SECURITY DEFINER
-- Function". Anything security definer in public is callable through
-- /rest/v1/rpc and bypasses RLS, so:
--
-- * checkout_staff was callable by anon (Supabase's default privileges
--   grant EXECUTE on new public functions to anon), never checked the
--   caller's org, and let staff clock out coworkers or pass by_owner=true.
-- * checkout_student never checked the caller's org either, so any
--   signed-in user could check out another organization's students.
--
-- Definer code that still needs to bypass RLS moves to a `private` schema,
-- which PostgREST doesn't expose; app roles can run it, but only through
-- policies or the public wrappers below.
--
-- NOTE: auth_org_id() now lives at private.auth_org_id(). Existing
-- policies reference it by OID and keep working; new migrations must
-- write private.auth_org_id().

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- RLS policies call this as the querying role (anon included, where it
-- just returns null), so those roles keep EXECUTE — it's only the REST
-- exposure that goes away.
alter function public.auth_org_id() set schema private;
revoke all on function private.auth_org_id() from public;
grant execute on function private.auth_org_id() to anon, authenticated, service_role;

-- checkout_student only touches tables the caller can already update
-- under RLS (student_checkins, session_alerts) or read (parent_contacts,
-- students), so it can simply run as the caller: another org's check-in
-- is then invisible to it. The kiosk route calls it with the service
-- role, which bypasses RLS as before.
alter function checkout_student(uuid, text) security invoker;
revoke all on function checkout_student(uuid, text) from public, anon;
grant execute on function checkout_student(uuid, text) to authenticated, service_role;

-- checkout_staff must stay definer: staff_checkins updates are owner-only
-- under RLS (005), yet staff need to clock themselves out. The definer
-- part now enforces who may do what itself.
drop function if exists public.checkout_staff(uuid, boolean);

create function private.checkout_staff(p_checkin_id uuid, p_by_owner boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_role     text;
  v_org_id   uuid;
  v_checkin  staff_checkins;
  v_by_owner boolean;
  v_duration int;
begin
  select role, org_id into v_role, v_org_id from profiles where id = auth.uid();

  select * into v_checkin
  from staff_checkins
  where id = p_checkin_id and checked_out_at is null;

  if not found or v_checkin.org_id is distinct from v_org_id then
    raise exception 'Staff checkin not found or already checked out';
  end if;

  -- Owners can clock out anyone in their org; staff only themselves.
  if v_role = 'owner' then
    v_by_owner := p_by_owner;
  elsif exists (
    select 1 from staff_members
    where id = v_checkin.staff_id and profile_id = auth.uid()
  ) then
    v_by_owner := false;
  else
    raise exception 'Not allowed to clock out this staff member';
  end if;

  v_duration := extract(epoch from (now() - v_checkin.checked_in_at))::int / 60;

  update staff_checkins set
    checked_out_at       = now(),
    duration_minutes     = v_duration,
    checked_out_by_owner = v_by_owner
  where id = p_checkin_id;

  insert into staff_notifications(org_id, staff_id, location_id, type)
  values (v_checkin.org_id, v_checkin.staff_id, v_checkin.location_id, 'clock_out');

  return json_build_object('duration_minutes', v_duration);
end;
$$;

revoke all on function private.checkout_staff(uuid, boolean) from public;
grant execute on function private.checkout_staff(uuid, boolean) to authenticated;

-- Same name and parameters the app already calls via supabase.rpc().
create function public.checkout_staff(checkin_id uuid, by_owner boolean default false)
returns json language sql security invoker set search_path = public as $$
  select private.checkout_staff(checkin_id, by_owner);
$$;

revoke all on function public.checkout_staff(uuid, boolean) from public, anon;
grant execute on function public.checkout_staff(uuid, boolean) to authenticated;
