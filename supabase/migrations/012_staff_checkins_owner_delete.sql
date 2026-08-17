-- 005 split the generic staff_checkins_org_policy into select/insert/
-- owner_update, but never added a delete policy — meaning no one, not even
-- an owner, could delete a staff_checkins row at all. Add owner-only delete,
-- matching the same "must be owner" check already used for owner_update.
create policy "staff_checkins_owner_delete" on staff_checkins for delete
  using (
    org_id = auth_org_id()
    and exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  );
