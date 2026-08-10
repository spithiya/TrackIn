-- staff_members.location_ids was referenced throughout the app (staff
-- dashboard/checkin location scoping, the owner's multi-location staff
-- edit UI) but the column was never actually created — every query
-- requesting it failed with "column does not exist", silently degrading
-- to an empty/unfiltered result since callers didn't check the error.
alter table staff_members
  add column location_ids uuid[];
