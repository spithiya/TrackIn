-- Supabase advisor: "Auth RLS Initialization Plan". The owner-only update
-- and delete policies on staff_checkins called auth.uid() and
-- auth_org_id() once per row; wrapping them in (select ...) lets Postgres
-- evaluate each once per query instead. Same rules, just cheaper.
-- (auth_org_id moved to the private schema in 022.)

drop policy if exists "staff_checkins_owner_update" on staff_checkins;
create policy "staff_checkins_owner_update" on staff_checkins for update
  using (
    org_id = (select private.auth_org_id())
    and exists (select 1 from profiles where id = (select auth.uid()) and role = 'owner')
  )
  with check (org_id = (select private.auth_org_id()));

drop policy if exists "staff_checkins_owner_delete" on staff_checkins;
create policy "staff_checkins_owner_delete" on staff_checkins for delete
  using (
    org_id = (select private.auth_org_id())
    and exists (select 1 from profiles where id = (select auth.uid()) and role = 'owner')
  );
