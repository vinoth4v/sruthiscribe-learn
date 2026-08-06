-- Phase 3/4: Student practice activity (attempts, lesson progress, streaks)
-- Owner insert/select only; admins select-all for analytics (Phase 6).

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  score numeric not null,
  svara_accuracy jsonb,
  gamaka_notes jsonb,
  detected_sruthi_hz numeric,
  duration_sec numeric,
  created_at timestamptz not null default now()
);

create table lesson_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  best_score numeric,
  attempt_count int not null default 0,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table practice_days (
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  seconds_practiced int not null default 0,
  primary key (user_id, day)
);

alter table attempts enable row level security;
alter table lesson_progress enable row level security;
alter table practice_days enable row level security;

create policy "attempts: owner select" on attempts
  for select using (auth.uid() = user_id);
create policy "attempts: admin select all" on attempts
  for select using (is_admin());
create policy "attempts: owner insert" on attempts
  for insert with check (auth.uid() = user_id);

create policy "lesson_progress: owner select" on lesson_progress
  for select using (auth.uid() = user_id);
create policy "lesson_progress: admin select all" on lesson_progress
  for select using (is_admin());
create policy "lesson_progress: owner upsert" on lesson_progress
  for insert with check (auth.uid() = user_id);
create policy "lesson_progress: owner update" on lesson_progress
  for update using (auth.uid() = user_id);

create policy "practice_days: owner select" on practice_days
  for select using (auth.uid() = user_id);
create policy "practice_days: admin select all" on practice_days
  for select using (is_admin());
create policy "practice_days: owner upsert" on practice_days
  for insert with check (auth.uid() = user_id);
create policy "practice_days: owner update" on practice_days
  for update using (auth.uid() = user_id);

create index attempts_user_id_idx on attempts(user_id);
create index attempts_lesson_id_idx on attempts(lesson_id);
