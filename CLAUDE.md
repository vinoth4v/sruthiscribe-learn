# SruthiScribe Learn

Carnatic music learning app. Vite + React + TS SPA, Supabase (auth/DB/storage),
static deploy to Vercel + GitHub Pages. Build plan: docs/sruthiscribe-learn-build-plan.md.

## Hard rules
- NEVER modify pitch/Viterbi/alignment logic in src/engine/engine.ts without
  running golden tests: `npm run test:engine` (compares against the frozen
  reference in src/engine/legacy/engine.cjs).
- Every schema change = new file in supabase/migrations/, never edit old ones.
- Community versioning (kritis/versions, in the shared Supabase project) is
  append-only. Never write UPDATE/DELETE on those tables from this app.
- All curriculum reads/writes go through RLS; never use the service key in
  frontend code — only the anon/publishable key belongs in VITE_* env vars.
- Saraga-sourced content must render its stored attribution wherever shown.
- No CDN <script> tags; all deps via npm. App must build to fully static dist/.
- Media paths go through mediaUrl() (src/lib/mediaUrl.ts) for the future S3 swap.

## Commands
- dev: `npm run dev` | build: `npm run build` | tests: `npm test`
- engine golden tests only: `npm run test:engine`
- db: apply supabase/migrations/*.sql in order (via `supabase db push` once
  the CLI is linked to the project, or paste into the Supabase SQL editor)

## Current phase
Phases 0-6 all have a working first pass (see
docs/sruthiscribe-learn-build-plan.md §9 for the phase definitions). Notable
gaps to know about before extending further:
- Google OAuth is configured but not yet verified end-to-end (no
  `google`-provider row confirmed in `auth.identities` as of last check).
- Kriti lessons: many `kritis.ragam` values in the shared DB don't match any
  of the ~90 engine-supported `RAGAMS` names (e.g. "Todi" vs "Hanumatodi",
  diacritic variants). The admin picker warns and lets you override; that
  data isn't going to get cleaner on its own.
- i18n (English/Tamil) covers nav/dashboard/sign-in/practice loop, not the
  admin console.
- No component-level UI tests (no @testing-library/react) — coverage is
  unit tests on pure logic (engine, scoring, gating, streak/date math, PDF
  writer, offline queue). Manually exercise the record→score→persist flow
  in a real browser before trusting it blindly.
- The GitHub Actions `push` trigger has not fired on any of several pushes
  to `main` (workflow_dispatch always works) — cause unconfirmed, may need
  Settings → Actions → General in the GitHub web UI to diagnose.
