-- Let owners correct staff timesheets (missed clock-in/out, system errors)
-- while keeping staff from editing clock records directly. The original
-- staff_checkins_org_policy allowed any org member to update/delete any
-- row, since it only checked org_id — split it into per-command policies.

drop policy if exists "staff_checkins_org_policy" on staff_checkins;

create policy "staff_checkins_select" on staff_checkins for select
  using (org_id = auth_org_id());

create policy "staff_checkins_insert" on staff_checkins for insert
  with check (org_id = auth_org_id());

create policy "staff_checkins_owner_update" on staff_checkins for update
  using (
    org_id = auth_org_id()
    and exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  )
  with check (org_id = auth_org_id());

-- Audit trail for owner-edited/added entries. Set explicitly by the owner
-- timesheet UI (not inferred from column changes) so a normal checkout
-- via checkout_staff() — which also transitions checked_out_at from null
-- to a value — is never mistaken for a manual correction.
alter table staff_checkins
  add column edited_at timestamptz,
  add column edited_by uuid references profiles(id) on delete set null;

-- Keep duration_minutes correct no matter which path changed the times
-- (owner edit, manual entry, or the checkout_staff() RPC).
create or replace function staff_checkins_maintain()
returns trigger language plpgsql as $$
begin
  new.duration_minutes := case
    when new.checked_out_at is not null
      then greatest(0, extract(epoch from (new.checked_out_at - new.checked_in_at))::int / 60)
    else null
  end;
  return new;
end;
$$;

create trigger staff_checkins_before_write
  before insert or update on staff_checkins
  for each row execute function staff_checkins_maintain();
