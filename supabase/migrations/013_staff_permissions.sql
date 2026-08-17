-- Per-staff-member permission grants, set by the owner on the staff
-- detail page. Timesheet editing is intentionally never included here —
-- it stays owner-only regardless of these flags.
alter table staff_members
  add column can_manage_students boolean not null default false,
  add column can_view_history boolean not null default false,
  add column can_view_analytics boolean not null default false,
  add column can_control_checkin boolean not null default false;
