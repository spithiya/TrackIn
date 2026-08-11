-- 009's `revoke ... from anon` didn't actually remove anon's ability to
-- call checkout_student: Postgres grants EXECUTE to PUBLIC by default at
-- function creation time, and anon inherits through that PUBLIC grant, not
-- a direct one. Revoking from anon specifically is a no-op while the
-- PUBLIC grant still stands. Revoke from PUBLIC instead, and explicitly
-- re-grant to authenticated so logged-in owner/staff checkout still works.
revoke execute on function checkout_student(uuid, text) from public;
grant execute on function checkout_student(uuid, text) to authenticated;
