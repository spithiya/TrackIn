-- Owners don't have a staff_members row (that table is staff-only), so
-- there's nowhere to store an owner's own contact phone number. Staff
-- already have staff_members.phone for this purpose.
alter table profiles
  add column phone text;
