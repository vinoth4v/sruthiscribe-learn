# SruthiScribe Learn

A Carnatic music learning app: pick a lesson, hear/see the reference, record
yourself, get per-svara accuracy feedback. Built on top of
[sruthiscribe](https://github.com/vinoth4v/sruthiscribe)'s pitch-tracking
engine and community kriti database. Full build plan in
[`docs/sruthiscribe-learn-build-plan.md`](docs/sruthiscribe-learn-build-plan.md).

## Setup

```bash
npm install
cp .env.example .env.local   # already points at the shared sruthiscribe Supabase project
npm run dev
```

## Database

Migrations live in `supabase/migrations/`, applied in numeric order. Apply
them via the Supabase SQL editor, or with the CLI once linked:

```bash
supabase link --project-ref yrgsdvgsnoxmfhtyngqc
supabase db push
```

After your first signup, promote yourself to admin from the SQL editor:

```sql
update profiles set role = 'admin' where id = '<your-auth-uid>';
```

## Testing

```bash
npm test          # full suite
npm run test:engine   # golden-file check: ported engine.ts vs legacy engine.cjs
npm run lint
npm run build
```

## Deployment

- **Vercel**: connect the repo, framework preset "Vite", set
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars.
- **GitHub Pages**: `.github/workflows/deploy.yml` builds and deploys on push
  to `main` (set the same two secrets in repo settings).
