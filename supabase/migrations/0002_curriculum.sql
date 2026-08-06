-- Phase 2: Curriculum schema (courses -> modules -> lessons)
-- Lessons reference kritis.id (existing table from sruthiscribe) rather than
-- copying notation, per build plan §4. Admin full CRUD; everyone reads only
-- published rows.

create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level int not null default 1,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  sort_order int not null default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  lesson_type text not null check (lesson_type in ('exercise', 'geetham', 'varnam', 'kriti', 'theory')),
  ragam text not null,
  talam text,
  kriti_id uuid references kritis(id),
  reference_svaras jsonb,
  sahitya jsonb,
  reference_audio_path text,
  pass_score int not null default 70,
  sort_order int not null default 0,
  is_published boolean not null default false
);

alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;

create policy "courses: published readable by authenticated" on courses
  for select using (is_published or is_admin());
create policy "courses: admin write" on courses
  for insert with check (is_admin());
create policy "courses: admin update" on courses
  for update using (is_admin());
create policy "courses: admin delete" on courses
  for delete using (is_admin());

create policy "modules: readable via course" on modules
  for select using (
    exists (select 1 from courses c where c.id = course_id and (c.is_published or is_admin()))
  );
create policy "modules: admin write" on modules
  for insert with check (is_admin());
create policy "modules: admin update" on modules
  for update using (is_admin());
create policy "modules: admin delete" on modules
  for delete using (is_admin());

create policy "lessons: published readable by authenticated" on lessons
  for select using (is_published or is_admin());
create policy "lessons: admin write" on lessons
  for insert with check (is_admin());
create policy "lessons: admin update" on lessons
  for update using (is_admin());
create policy "lessons: admin delete" on lessons
  for delete using (is_admin());

create index lessons_module_id_idx on lessons(module_id);
create index modules_course_id_idx on modules(course_id);
