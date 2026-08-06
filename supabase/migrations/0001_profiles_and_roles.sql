-- Phase 1: Auth & Roles
-- Adds a role-bearing profile row per auth.users, created automatically on
-- signup. Role changes are only possible via the security-definer function
-- below (never a direct client UPDATE), so RLS can safely trust profiles.role.

create type user_role as enum ('student', 'admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role user_role not null default 'student',
  sruthi_hz numeric,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- A user reads/updates their own row, but the policy below excludes `role`
-- from what they can change (enforced by the trigger, since RLS alone can't
-- do column-level write restriction on UPDATE).
create policy "profiles: self select" on profiles
  for select using (auth.uid() = id);

create policy "profiles: admin select all" on profiles
  for select using (is_admin());

create policy "profiles: self update" on profiles
  for update using (auth.uid() = id);

create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'Only an admin can change role';
  end if;
  return new;
end;
$$;

create trigger profiles_no_self_role_change
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- Callable only by admins (checked inside the function body) to promote/demote.
create or replace function set_user_role(target_user uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can change role';
  end if;
  update profiles set role = new_role where id = target_user;
end;
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- One-time bootstrap: after your first signup, promote yourself via the
-- Supabase SQL editor (service role bypasses RLS there):
--   update profiles set role = 'admin' where id = '<your-auth-uid>';
