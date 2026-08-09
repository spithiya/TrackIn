-- Support yellow/red session alerts for assigned staff. `level` lets the
-- UI distinguish alert severity, and the unique constraint means the same
-- checkin can only ever produce one yellow and one red alert, even if
-- multiple staff tabs detect the threshold crossing at the same time.
alter table session_alerts
  add column level text not null default 'yellow' check (level in ('yellow', 'red'));

alter table session_alerts
  add constraint session_alerts_checkin_level_unique unique (checkin_id, level);
