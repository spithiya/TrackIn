-- Automatically check out any student still checked in once their
-- location's closing time passes.
--
-- closes_at is a wall-clock time, so each location needs a time zone to know
-- when "6:00 PM" actually is. Existing locations are all on Eastern time;
-- new ones get the creating owner's browser time zone (see addLocation()).
alter table locations add column if not exists timezone text not null default 'America/New_York';

create or replace function auto_checkout_at_close()
returns int language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[];
begin
  -- A check-in closes at its location's closing time on the (local) day it
  -- started. Someone checked in after that day's closing time (staying late)
  -- closes at midnight that night instead, rather than being checked out
  -- instantly.
  -- The checkout is stamped with the closing time itself, not when this job
  -- happens to run, so durations and history stay accurate.
  with open_checkins as (
    select
      sc.id,
      sc.checked_in_at,
      ((sc.checked_in_at at time zone l.timezone)::date + l.closes_at) at time zone l.timezone as same_day_close,
      ((sc.checked_in_at at time zone l.timezone)::date + 1)::timestamp at time zone l.timezone as midnight
    from student_checkins sc
    join locations l on l.id = sc.location_id
    where sc.checked_out_at is null
  ), due as (
    select
      id,
      case when checked_in_at < same_day_close then same_day_close else midnight end as close_at
    from open_checkins
  ), closed as (
    update student_checkins sc set
      checked_out_at   = due.close_at,
      duration_minutes = extract(epoch from (due.close_at - sc.checked_in_at))::int / 60,
      session_note     = coalesce(sc.session_note, 'Automatically checked out at closing time.')
    from due
    where sc.id = due.id and due.close_at <= now()
    returning sc.id
  )
  select array_agg(id) into v_ids from closed;

  update session_alerts set acknowledged_at = now()
  where checkin_id = any(v_ids) and acknowledged_at is null;

  return coalesce(array_length(v_ids, 1), 0);
end;
$$;

-- Only the scheduler should run this — not app users.
revoke execute on function auto_checkout_at_close() from public, anon, authenticated;

-- Run every 5 minutes via pg_cron.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;

select cron.schedule(
  'auto-checkout-at-close',
  '*/5 * * * *',
  $$select public.auto_checkout_at_close()$$
);

-- pg_cron logs every run; keep a week of it so the log doesn't eat into
-- database storage.
select cron.schedule(
  'purge-cron-run-history',
  '30 4 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$
);
