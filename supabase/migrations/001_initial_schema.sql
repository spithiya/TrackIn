-- TrackIn Tutoring CRM — Initial Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ORGANIZATIONS ───────────────────────────────────────────────────────────
create table organizations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ─── LOCATIONS ───────────────────────────────────────────────────────────────
create table locations (
  id             uuid primary key default uuid_generate_v4(),
  org_id         uuid not null references organizations(id) on delete cascade,
  name           text not null,
  address_street text not null,
  address_city   text not null,
  address_state  text not null,
  address_zip    text not null,
  phone          text,
  notes          text,
  opens_at       time not null default '08:00',
  closes_at      time not null default '18:00',
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  role       text not null check (role in ('owner', 'staff')),
  full_name  text not null,
  email      text not null,
  created_at timestamptz not null default now()
);

-- ─── STAFF MEMBERS ───────────────────────────────────────────────────────────
create table staff_members (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  first_name  text not null,
  last_name   text not null,
  dob         date,
  phone       text,
  email       text,
  role_title  text,
  location_id uuid not null references locations(id),
  subjects    text not null check (subjects in ('math', 'reading', 'both')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── STUDENTS ────────────────────────────────────────────────────────────────
create table students (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  dob         date,
  subjects    text not null check (subjects in ('math', 'reading', 'both')),
  location_id uuid not null references locations(id),
  notes       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── PARENT CONTACTS ─────────────────────────────────────────────────────────
create table parent_contacts (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references students(id) on delete cascade,
  org_id       uuid not null references organizations(id) on delete cascade,
  full_name    text not null,
  relationship text not null check (relationship in ('Mother', 'Father', 'Guardian', 'Other')),
  phone        text,
  email        text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── STUDENT CHECK-INS ───────────────────────────────────────────────────────
create table student_checkins (
  id                      uuid primary key default uuid_generate_v4(),
  org_id                  uuid not null references organizations(id) on delete cascade,
  student_id              uuid not null references students(id),
  location_id             uuid not null references locations(id),
  checked_in_at           timestamptz not null default now(),
  checked_out_at          timestamptz,
  subjects_snapshot       text not null check (subjects_snapshot in ('math', 'reading', 'both')),
  time_limit_minutes      int not null,
  checkin_method          text not null check (checkin_method in ('kiosk', 'staff')),
  assigned_staff_id       uuid references staff_members(id) on delete set null,
  checked_in_by_staff_id  uuid references staff_members(id) on delete set null,
  checked_out_by_staff_id uuid references staff_members(id) on delete set null,
  sms_sent                boolean not null default false,
  session_note            text,
  duration_minutes        int,
  created_at              timestamptz not null default now()
);

-- ─── STAFF CHECK-INS (TIMESHEET) ─────────────────────────────────────────────
create table staff_checkins (
  id                   uuid primary key default uuid_generate_v4(),
  org_id               uuid not null references organizations(id) on delete cascade,
  staff_id             uuid not null references staff_members(id),
  location_id          uuid not null references locations(id),
  checked_in_at        timestamptz not null default now(),
  checked_out_at       timestamptz,
  duration_minutes     int,
  checked_out_by_owner boolean not null default false,
  created_at           timestamptz not null default now()
);

-- ─── SESSION ALERTS ──────────────────────────────────────────────────────────
create table session_alerts (
  id               uuid primary key default uuid_generate_v4(),
  org_id           uuid not null references organizations(id) on delete cascade,
  checkin_id       uuid not null references student_checkins(id) on delete cascade,
  student_id       uuid not null references students(id),
  assigned_staff_id uuid references staff_members(id) on delete set null,
  message          text not null,
  acknowledged_by  uuid references staff_members(id) on delete set null,
  acknowledged_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- ─── STAFF NOTIFICATIONS ─────────────────────────────────────────────────────
create table staff_notifications (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  staff_id    uuid not null references staff_members(id),
  location_id uuid not null references locations(id),
  type        text not null check (type in ('clock_in', 'clock_out')),
  timestamp   timestamptz not null default now(),
  dismissed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─── SMS LOG ─────────────────────────────────────────────────────────────────
create table sms_log (
  id          uuid primary key default uuid_generate_v4(),
  org_id      uuid not null references organizations(id) on delete cascade,
  checkin_id  uuid not null references student_checkins(id) on delete cascade,
  to_phone    text not null,
  message     text not null,
  twilio_sid  text,
  status      text not null default 'sent',
  created_at  timestamptz not null default now()
);

-- ─── VIEWS ───────────────────────────────────────────────────────────────────
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
  end as timer_status
from student_checkins sc
join students s on s.id = sc.student_id
left join staff_members sm on sm.id = sc.assigned_staff_id
where sc.checked_out_at is null;

create or replace view active_staff as
select
  sc.id,
  sc.org_id,
  sc.staff_id,
  sm.first_name as staff_first_name,
  sm.last_name  as staff_last_name,
  sc.location_id,
  sc.checked_in_at,
  extract(epoch from (now() - sc.checked_in_at))::int / 60 as elapsed_minutes
from staff_checkins sc
join staff_members sm on sm.id = sc.staff_id
where sc.checked_out_at is null;

create or replace view visit_history as
select
  sc.id,
  sc.org_id,
  sc.student_id,
  s.first_name  as student_first_name,
  s.last_name   as student_last_name,
  sc.location_id,
  sc.checked_in_at,
  sc.checked_out_at,
  sc.duration_minutes,
  sc.subjects_snapshot,
  sc.checkin_method,
  case when sm.id is not null then sm.first_name || ' ' || sm.last_name end as checked_in_by_name,
  sc.session_note,
  sc.sms_sent
from student_checkins sc
join students s on s.id = sc.student_id
left join staff_members sm on sm.id = sc.checked_in_by_staff_id
where sc.checked_out_at is not null;

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────
create function checkout_student(
  checkin_id   uuid,
  session_note text default null
)
returns json language plpgsql security definer as $$
declare
  v_checkin_id   uuid := checkin_id;
  v_session_note text := session_note;
  v_checkin      student_checkins;
  v_duration     int;
  v_over_limit   boolean;
  v_phone        text := null;
begin
  select * into v_checkin
  from student_checkins
  where id = v_checkin_id and checked_out_at is null;
  if not found then raise exception 'Checkin not found or already checked out'; end if;

  v_duration   := extract(epoch from (now() - v_checkin.checked_in_at))::int / 60;
  v_over_limit := v_duration >= v_checkin.time_limit_minutes;

  update student_checkins set
    checked_out_at   = now(),
    duration_minutes = v_duration,
    session_note     = coalesce(v_session_note, student_checkins.session_note),
    sms_sent         = v_over_limit
  where id = v_checkin_id;

  update session_alerts set acknowledged_at = now()
  where session_alerts.checkin_id = v_checkin_id and acknowledged_at is null;

  if v_over_limit then
    select phone into v_phone
    from parent_contacts
    where student_id = v_checkin.student_id and is_primary = true
    limit 1;
  end if;

  return json_build_object(
    'send_sms',           v_over_limit and v_phone is not null,
    'parent_phone',       v_phone,
    'student_first_name', (select first_name from students where id = v_checkin.student_id)
  );
end;
$$;

create or replace function checkout_staff(
  p_checkin_id uuid,
  p_by_owner   boolean default false
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
  from staff_checkins where id = p_checkin_id and checked_out_at is null;

  if not found then raise exception 'Staff checkin not found or already checked out'; end if;

  update staff_checkins set
    checked_out_at       = now(),
    duration_minutes     = v_duration,
    checked_out_by_owner = p_by_owner
  where id = p_checkin_id;

  insert into staff_notifications(org_id, staff_id, location_id, type)
  values (v_org_id, v_staff_id, v_loc_id, 'clock_out');

  return json_build_object('duration_minutes', v_duration);
end;
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table organizations     enable row level security;
alter table locations         enable row level security;
alter table profiles          enable row level security;
alter table staff_members     enable row level security;
alter table students          enable row level security;
alter table parent_contacts   enable row level security;
alter table student_checkins  enable row level security;
alter table staff_checkins    enable row level security;
alter table session_alerts    enable row level security;
alter table staff_notifications enable row level security;
alter table sms_log           enable row level security;

-- Helper: get org_id for authenticated user
create or replace function auth_org_id() returns uuid language sql stable security definer as $$
  select org_id from profiles where id = auth.uid()
$$;

-- Policy for organizations (no org_id column — use id directly)
create policy "organizations_org_policy" on organizations
  using (id = auth_org_id())
  with check (id = auth_org_id());

-- Policies for all other tables that have org_id
do $$ declare t text; begin
  foreach t in array array[
    'locations','profiles','staff_members','students',
    'parent_contacts','student_checkins','staff_checkins',
    'session_alerts','staff_notifications','sms_log'
  ] loop
    execute format('
      create policy "%s_org_policy" on %I
      using (org_id = auth_org_id())
      with check (org_id = auth_org_id());
    ', t, t);
  end loop;
end $$;

-- Kiosk: anon can search students and insert/update checkins
create policy "kiosk_students_read" on students for select to anon using (true);
create policy "kiosk_checkins_insert" on student_checkins for insert to anon with check (true);
create policy "kiosk_checkins_update" on student_checkins for update to anon using (checked_out_at is null);

-- ─── REALTIME ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table student_checkins;
alter publication supabase_realtime add table staff_checkins;
alter publication supabase_realtime add table session_alerts;
alter publication supabase_realtime add table staff_notifications;
