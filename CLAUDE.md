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
Phase 3 (Practice Loop MVP) complete at MVP scope. See
docs/sruthiscribe-learn-build-plan.md §9 for phase definitions and
verification steps. Phase 4 (dashboard) has a minimal version; Phases 5-6 are
not started — see the handoff notes at the bottom of this session's summary
for what's left.
