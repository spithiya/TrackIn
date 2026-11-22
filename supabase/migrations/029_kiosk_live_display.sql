-- Settings → Kiosk: let the kiosk login open the Live Display too, via a
-- button in the kiosk header. Off by default.

alter table organizations
  add column if not exists kiosk_live_display_enabled boolean not null default false;
