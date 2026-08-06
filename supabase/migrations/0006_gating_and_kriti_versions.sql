-- Phase 4: lesson gating override (admin can unlock a whole course regardless
-- of pass_score progression, per build plan §9 Phase 4).
alter table courses add column unlock_all boolean not null default false;

-- Phase 5: a kriti lesson can pin a specific community/seed version rather
-- than always following kritis' "best" notation_rank. NULL means "pick the
-- best available version for this kriti at read time" (client-side fallback).
-- Never UPDATE/DELETE versions rows themselves (CLAUDE.md hard rule,
-- append-only) -- "approving" a community version for teaching happens by an
-- admin linking it here, not by mutating the versions table.
alter table lessons add column version_id uuid references versions(id);
