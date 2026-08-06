-- 0001's prevent_role_self_escalation() blocked role changes whenever
-- is_admin() was false -- but is_admin() itself depends on auth.uid(),
-- which is NULL outside a PostgREST request (service-role access, the SQL
-- editor, or this migration tooling). That made the documented bootstrap
-- path ("promote yourself via the SQL editor") impossible: the very first
-- admin promotion had no admin yet to authorize it.
--
-- Fix: allow the role change through when auth.uid() is NULL (no end-user
-- JWT in play, i.e. service-role/direct-SQL context) in addition to the
-- existing is_admin() check. Client-driven requests through PostgREST
-- always carry a JWT, so end users still can't self-promote.
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    raise exception 'Only an admin can change role';
  end if;
  return new;
end;
$$;
