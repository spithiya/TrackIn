-- Owner-controlled display preferences (Settings → Kiosk / Live Display).
--
-- kiosk_hide_checked_in: the kiosk's default student list leaves out
--   students who are already checked in, so nobody taps someone else's
--   name and checks them out by mistake. Searching still finds them.
-- kiosk_show_student_count: whether the kiosk shows the student count
--   ("All students · 42") above its list.
-- live_show_contact_phone: whether the Live Display shows each student's
--   parent/guardian phone number. Some jurisdictions (e.g. Canadian
--   privacy law) don't allow phone numbers on a publicly visible screen.

alter table organizations
  add column if not exists kiosk_hide_checked_in boolean not null default false,
  add column if not exists live_show_contact_phone boolean not null default true,
  add column if not exists kiosk_show_student_count boolean not null default true;

