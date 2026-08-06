# SruthiScribe Learn — Build Plan for Claude Code

A phased plan to evolve SruthiScribe (svara transcription engine + community kriti DB) into a full-fledged Carnatic music learning app with **Student** and **Admin** experiences, modeled on Riyaz's practice-feedback loop.

---

## 1. Vision & Problem Statement

Carnatic students practicing alone get no feedback on svara accuracy, sruthi alignment, or gamaka execution until their next class. Riyaz solved this for Hindustani/film music with real-time pitch feedback; nothing comparable exists with **ragam-aware, gamaka-aware** feedback for Carnatic music.

SruthiScribe already has the hardest pieces built:
- Client-side YIN pitch tracking + ragam-constrained Viterbi decoder (63 ragams)
- Gamaka classification, two-pass auto sruthi correction, directional aroha/avaroha grammar
- Needleman-Wunsch alignment (currently used for community DB matching) → reusable as the **practice scoring engine**
- ~140 compositions across 56 ragams in Supabase with append-only community versioning

**The product**: students pick a lesson (sarali varisai → alankaras → geethams → kritis), hear/see the reference, record themselves, and get per-svara accuracy feedback, scores, streaks, and progress tracking. Admins author curriculum, manage users, and review community contributions.

## 2. Goals

1. Student can complete a full practice loop (listen → record → per-svara feedback → score saved) entirely client-side, on free-tier infrastructure.
2. Admin can author a course → module → lesson hierarchy without touching SQL.
3. Existing kriti DB and community versioning are reused as lesson source material, not duplicated.
4. Practice history, streaks, and progress persist per user.
5. App remains deployable as a static SPA (Vercel primary, GitHub Pages fallback) — no server rendering required.

## 3. Non-Goals (v1)

- **Native mobile apps** — responsive PWA only; native is a v2+ decision.
- **Live teacher–student sessions / video** — out of scope; async practice only.
- **Payments/subscriptions** — everything free in v1; design roles so a `premium` tier can be added later.
- **Server-side audio processing** — the engine is client-side by design; Lambda enters only if/when batch pre-analysis of reference tracks is needed (see §8).
- **Social features** (leaderboards, sharing) — P2; schema should not preclude them.

## 4. Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend | **Vite + React SPA** (TypeScript) | Static output deploys identically to Vercel *and* GitHub Pages — avoids the Vercel SSR/branch-config failures from the zip-deploy era. No server needed since Supabase handles auth/data. |
| Engine | Keep `engine.js` as a standalone ES module, imported by the SPA | Preserves the single-source-of-truth constraint; retire the Python re-embed script. |
| Auth | **Supabase Auth** (email + Google OAuth) | Same project, free tier, integrates with RLS. |
| Roles | `profiles.role` enum: `student` / `admin` (+ future `teacher`, `premium`) | Enforced via RLS + a `is_admin()` SQL helper; never trust client-side role checks. |
| DB | Same Supabase project; new tables alongside `kritis`/`versions` | Lessons reference `kritis.id` rather than copying notation. |
| Media storage | **Supabase Storage first** (reference audio, ~1 GB free) → **S3 + CloudFront** when exceeded | Don't add AWS complexity until the free tier is actually exhausted. |
| AWS Lambda | Deferred; only for batch reference-track pre-analysis (§8) | Engine runs in-browser; no server compute needed for the core loop. |
| Student recordings | **Not uploaded by default** — analyzed in-browser, only scores stored | Privacy + storage cost. Optional "save my take" upload is P1. |
| Deployment | Vercel (framework preset: Vite, output `dist/`), GitHub Pages fallback via Actions | Two known-good static targets. |

## 5. Data Model (new tables)

All tables get RLS. Admin-write/all-read for curriculum tables; owner-only for student data.

```sql
-- roles
create type user_role as enum ('student','admin');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role user_role not null default 'student',
  sruthi_hz numeric,            -- student's preferred sruthi
  created_at timestamptz default now()
);

-- curriculum hierarchy
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level int not null default 1,          -- 1=beginner ... ordering
  is_published boolean default false,
  sort_order int default 0,
  created_by uuid references profiles(id)
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  sort_order int default 0
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  lesson_type text not null check (lesson_type in
    ('exercise','geetham','varnam','kriti','theory')),
  ragam text not null,
  talam text,
  kriti_id uuid references kritis(id),   -- reuse existing DB when applicable
  reference_svaras jsonb,                -- inline notation for exercises (varisai etc.)
  sahitya jsonb,
  reference_audio_path text,             -- Supabase Storage path
  pass_score int default 70,             -- % needed to mark complete
  sort_order int default 0,
  is_published boolean default false
);

-- student activity
create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  score numeric not null,                -- 0–100 alignment score
  svara_accuracy jsonb,                  -- per-svara hit/miss/substitution detail
  gamaka_notes jsonb,
  detected_sruthi_hz numeric,
  duration_sec numeric,
  created_at timestamptz default now()
);

create table lesson_progress (
  user_id uuid references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress','completed')),
  best_score numeric,
  attempt_count int default 0,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

create table practice_days (                 -- streak source of truth
  user_id uuid references profiles(id) on delete cascade,
  day date not null,
  seconds_practiced int default 0,
  primary key (user_id, day)
);
```

RLS sketch:
- `profiles`: user reads/updates own row (but **not** `role`); admins read all. Role changes only via a `security definer` function callable by admins.
- `courses/modules/lessons`: `is_published = true` readable by all authenticated; full CRUD for admins.
- `attempts`, `lesson_progress`, `practice_days`: owner insert/select only; admins select-all for analytics.
- Existing `kritis`/`versions` policies unchanged.

## 6. Repo Restructure

```
sruthiscribe/
├── src/
│   ├── engine/           # engine.js → engine.ts (mechanical port, no logic changes)
│   ├── lib/              # supabase client, auth helpers, scoring.ts
│   ├── features/
│   │   ├── practice/     # recorder, live feedback canvas, results
│   │   ├── curriculum/   # course/module/lesson browsing
│   │   ├── transcribe/   # existing free-transcription tool, kept as a feature
│   │   ├── browse/       # existing community DB browser
│   │   └── admin/        # admin console
│   ├── routes/           # react-router: /, /learn, /practice/:lessonId,
│   │                     #   /transcribe, /browse, /profile, /admin/*
│   └── main.tsx
├── supabase/migrations/  # every schema change as a numbered .sql file
├── public/
└── legacy/work.html      # frozen snapshot of current app until parity confirmed
```

## 7. The Practice Loop (core feature)

1. **Lesson screen**: notation rendered (reuse existing renderer), reference audio playback, sruthi drone at the student's `sruthi_hz` (Web Audio oscillator — no audio files needed).
2. **Record**: mic capture → engine runs YIN + Viterbi constrained to the lesson's ragam → live svara trail drawn against the reference (Riyaz-style scrolling pitch lane).
3. **Score**: Needleman-Wunsch alignment of detected svara sequence vs. `reference_svaras` (or the linked kriti's notation). Score = weighted alignment identity; substitutions checked against in-ragam substitution table (already built) for partial credit; sruthi drift reported separately.
4. **Persist**: insert `attempts` row; upsert `lesson_progress` (best score, completion at `pass_score`); upsert `practice_days` for streaks.
5. **Feedback UI**: per-svara green/amber/red strip, top-3 problem svaras, gamaka observations, "retry" and "next lesson" CTAs.

Key reuse note for Claude Code: **do not rewrite alignment or the decoder** — extract them from `engine.js` into importable functions and add a thin `scorePractice(detected, reference, ragam)` wrapper.

## 8. AWS (only where needed)

- **S3 + CloudFront**: migrate `reference_audio` here when Supabase Storage free tier is exhausted. Keep paths abstract behind a `mediaUrl(path)` helper from day one so the swap is one function.
- **Lambda** (P2): batch pre-analysis of admin-uploaded reference tracks (pre-compute pitch contour JSON so student devices don't analyze reference audio). Trigger: S3 upload event → Lambda runs the engine under Node → writes contour JSON next to the audio. Not needed for v1 (admins can run pre-analysis in-browser at upload time instead — build it that way first).

## 9. Phased Build Plan (Claude Code sessions)

Each phase is sized for 1–3 Claude Code sessions. Every phase ends with verification steps; do not start the next phase until they pass.

### Phase 0 — Scaffold & Engine Port
- Vite + React + TS scaffold; ESLint/Prettier; react-router.
- Port `engine.js` into `src/engine/` as typed modules **without changing logic**; keep a golden-file test: run 3 known recordings' pitch arrays through old and new engine, assert identical svara output.
- CI: GitHub Action builds `dist/` and deploys to GitHub Pages; Vercel connected to repo with Vite preset.
- ✅ Verify: `npm run build` clean; golden tests pass; both deploy URLs serve the shell.

### Phase 1 — Auth & Roles
- Supabase Auth (email + Google). `profiles` table + trigger creating a profile row on signup. Migration files committed.
- Route guards: `/admin/*` requires `role='admin'` (checked server-side via RLS on every query, UI guard is cosmetic).
- Promote your own account to admin via SQL once.
- ✅ Verify: student account cannot select unpublished lessons or other users' attempts (test with two accounts via SQL editor + app).

### Phase 2 — Curriculum Schema & Admin Console
- Migrations for `courses/modules/lessons` + RLS.
- Admin console: CRUD for the hierarchy (drag-to-reorder via `sort_order`), lesson editor with: notation input (reuse manual-entry component + count validation from current app), ragam picker (63 engine ragams), link-to-kriti picker (search via existing `match_kritis` RPC), reference audio upload to Supabase Storage, publish toggle.
- Seed content: Sarali varisai (14), Janta varisai, Melsthayi, Alankaras (7 talams) as `reference_svaras` JSON — generate these programmatically in Mayamalavagowla; admin can clone per ragam.
- ✅ Verify: admin builds "Beginner Level 1" course end-to-end in the UI; student account sees only published lessons.

### Phase 3 — Practice Loop MVP
- Lesson player: notation + drone + reference audio.
- Recorder + live pitch lane (canvas; target 60fps on mid-range Android — throttle Viterbi to chunked decoding as the current app already does).
- `scorePractice()` wrapper over N-W alignment; results screen with per-svara feedback.
- Persist attempts/progress/practice_days.
- ✅ Verify: sing sarali varisai correctly → score >85 and lesson completes; sing wrong svaras deliberately → those svaras flagged red; refresh → progress persisted.

### Phase 4 — Student Dashboard & Gamification
- Home: course grid with progress rings, "continue where you left off".
- Streak calendar (from `practice_days`), total practice minutes, per-ragam accuracy trend chart.
- Lesson gating: next lesson unlocks at `pass_score` (admin-configurable; add an admin "unlock all" override).
- ✅ Verify: streak increments once per day regardless of attempt count; gating unlocks correctly.

### Phase 5 — Kriti Lessons & Community Bridge
- Lesson type `kriti` pulls notation + sahitya from existing `kritis`/`versions` (respecting version selection); Saraga attribution rendered on the lesson page (license compliance — CC BY-NC-SA attribution is non-negotiable).
- Section-wise practice: pallavi/anupallavi/charanam segments practiced independently, scored per segment.
- Admin review queue for community versions (approve → available as lesson source).
- ✅ Verify: a Saraga-sourced kriti lesson shows full attribution; segment scores roll up to lesson score.

### Phase 6 — Polish, PWA, Analytics
- PWA manifest + service worker (offline lesson playback for cached lessons; practice works offline, attempts sync on reconnect via queued inserts).
- Admin analytics: DAU, attempts/day, hardest lessons (lowest avg score), per-course completion funnel — plain Supabase queries, no external analytics.
- PDF export of a student's progress report (reuse the self-contained PDF-1.4 writer).
- Accessibility + Tamil/English UI toggle.
- ✅ Verify: Lighthouse PWA pass; offline practice → reconnect → attempt appears in DB.

### P2 parking lot
Teacher role with assigned students; recording uploads + teacher comments; Lambda reference pre-analysis; leaderboards; Sanidha dataset import (pending Georgia Tech access); native wrappers (Capacitor).

## 10. CLAUDE.md (drop into repo root)

```markdown
# SruthiScribe Learn

Carnatic music learning app. Vite + React + TS SPA, Supabase (auth/DB/storage),
static deploy to Vercel + GitHub Pages.

## Hard rules
- NEVER modify pitch/Viterbi/alignment logic in src/engine/ without running
  golden tests: `npm run test:engine`
- Every schema change = new file in supabase/migrations/, never edit old ones.
- Community versioning is append-only. Never write UPDATE/DELETE on kritis
  or versions rows.
- All curriculum reads/writes go through RLS; never use the service key
  in frontend code.
- Saraga-sourced content must render its stored attribution wherever shown.
- No CDN <script> tags; all deps via npm. App must build to fully static dist/.
- Media paths go through mediaUrl() helper (future S3 swap).

## Commands
- dev: npm run dev | build: npm run build | tests: npm test
- db: supabase db push (linked project)

## Current phase
Phase [N] — see BUILD_PLAN.md §9. Complete verification steps before
advancing phases.
```

## 11. Success Metrics

- **Leading**: ≥60% of new signups complete one full practice loop in first session; median practice session ≥8 min; scoring feels fair (spot-check: correct renditions score ≥85, wrong-svara renditions score ≤60).
- **Lagging**: 4-week retention ≥25%; ≥5 community-contributed lessons/versions per month; zero license-attribution gaps in audits.

## 12. Open Questions

1. **Reference audio sourcing** for exercises: record your own varisai audio vs. synthesize from notation via Web Audio (synth is faster to ship, sounds robotic) — *product call, decide before Phase 2 seeding*.
2. **Scoring weights**: how much should timing/talam alignment count vs. pure svara identity in v1? (Suggest: svara-only in v1, talam-aware in v2.) — *pedagogy call*.
3. **Should completed kriti attempts feed back into the community DB** as anonymous accuracy stats per composition? — *privacy + product call, non-blocking*.
4. **Google OAuth vs. email-only** at launch (OAuth needs a Google Cloud consent screen) — *decide in Phase 1*.
