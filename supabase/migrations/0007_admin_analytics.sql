-- Phase 6: admin analytics RPCs. Each is admin-gated inside the function
-- body (same pattern as set_user_role) rather than relying on RLS alone,
-- since these aggregate across all users' attempts/practice_days.

create or replace function admin_dau(days_back int default 14)
returns table(day date, active_users bigint)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can view analytics';
  end if;
  return query
    select pd.day, count(distinct pd.user_id)
    from practice_days pd
    where pd.day >= current_date - days_back
    group by pd.day
    order by pd.day;
end;
$$;

create or replace function admin_attempts_per_day(days_back int default 14)
returns table(day date, attempts bigint)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can view analytics';
  end if;
  return query
    select a.created_at::date as day, count(*)
    from attempts a
    where a.created_at::date >= current_date - days_back
    group by a.created_at::date
    order by day;
end;
$$;

create or replace function admin_hardest_lessons(limit_n int default 10)
returns table(lesson_id uuid, title text, avg_score numeric, attempt_count bigint)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can view analytics';
  end if;
  return query
    select l.id, l.title, round(avg(a.score), 1), count(*)
    from attempts a
    join lessons l on l.id = a.lesson_id
    group by l.id, l.title
    having count(*) >= 3
    order by avg(a.score) asc
    limit limit_n;
end;
$$;

create or replace function admin_course_funnel(course_id_arg uuid)
returns table(lesson_id uuid, title text, sort_order int, attempted bigint, completed bigint)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only an admin can view analytics';
  end if;
  return query
    select l.id, l.title, l.sort_order,
      count(distinct lp.user_id) filter (where lp.user_id is not null),
      count(distinct lp.user_id) filter (where lp.status = 'completed')
    from lessons l
    join modules m on m.id = l.module_id
    left join lesson_progress lp on lp.lesson_id = l.id
    where m.course_id = course_id_arg
    group by l.id, l.title, l.sort_order
    order by l.sort_order;
end;
$$;
