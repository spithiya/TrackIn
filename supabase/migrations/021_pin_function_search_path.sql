-- Pin search_path on functions that left it to the caller's session
-- (Supabase advisor: "Function Search Path Mutable"). A security definer
-- function resolving unqualified table names through a caller-controlled
-- search_path could be pointed at lookalike objects in another schema.
-- These all reference public tables only, matching 019's convention.

alter function auth_org_id()                    set search_path = public;
alter function checkout_student(uuid, text)     set search_path = public;
alter function checkout_staff(uuid, boolean)    set search_path = public;
alter function staff_checkins_maintain()        set search_path = public;
