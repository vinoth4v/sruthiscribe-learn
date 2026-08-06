-- Phase 4: one round-trip for "% complete" per course on the course grid,
-- instead of N+1 queries. Runs as invoker (not security definer) -- RLS on
-- lesson_progress already scopes to auth.uid(), and the explicit filter
-- below matches that, so no elevated privileges are needed.
create or replace function my_course_progress()
returns table(course_id uuid, total_lessons bigint, completed_lessons bigint)
language sql
stable
set search_path = public
as $$
  select m.course_id, count(l.id), count(*) filter (where lp.status = 'completed')
  from lessons l
  join modules m on m.id = l.module_id
  join courses c on c.id = m.course_id
  left join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = auth.uid()
  where l.is_published and c.is_published
  group by m.course_id;
$$;
