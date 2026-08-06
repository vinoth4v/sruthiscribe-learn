import type { Note, Ragam } from '../engine/types';

// Needleman-Wunsch global alignment — ported 1:1 from sruthiscribe's
// index.html `alignSeqs()` (there: aligning a decoded take against the best
// community-DB match, to suggest corrections). Build plan §7 repurposes this
// exact function as the practice-scoring engine: do not rewrite it.
export function alignSeqs<T>(a: T[], b: T[]): Array<[number, number]> {
  const n = a.length, m = b.length, GAP = 1, SUB = 1;
  const D: Float64Array[] = [];
  const B: Int8Array[] = [];
  for (let i = 0; i <= n; i++) {
    D.push(new Float64Array(m + 1));
    B.push(new Int8Array(m + 1));
  }
  for (let i = 1; i <= n; i++) { D[i][0] = i * GAP; B[i][0] = 1; }
  for (let j = 1; j <= m; j++) { D[0][j] = j * GAP; B[0][j] = 2; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : SUB);
      const up = D[i - 1][j] + GAP, left = D[i][j - 1] + GAP;
      if (diag <= up && diag <= left) { D[i][j] = diag; B[i][j] = 0; }
      else if (up <= left) { D[i][j] = up; B[i][j] = 1; }
      else { D[i][j] = left; B[i][j] = 2; }
    }
  }
  const pairs: Array<[number, number]> = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const mv = i > 0 && j > 0 ? B[i][j] : i > 0 ? 1 : 2;
    if (mv === 0) { pairs.push([i - 1, j - 1]); i--; j--; }
    else if (mv === 1) { pairs.push([i - 1, -1]); i--; }
    else { pairs.push([-1, j - 1]); j--; }
  }
  return pairs.reverse();
}

// A reference svara as stored in lessons.reference_svaras (exercises) or
// derived from a kritis/versions notation section (kriti lessons).
export interface ReferenceSvara {
  s: string; // label, e.g. 'S', 'R2', 'G3'
  o: number; // octave offset relative to the middle octave
}

export type SvaraStatus = 'hit' | 'substitution' | 'miss';

export interface SvaraAccuracyEntry {
  index: number;
  expected: string;
  detected: string | null;
  status: SvaraStatus;
}

export interface PracticeScore {
  score: number; // 0-100
  svaraAccuracy: SvaraAccuracyEntry[];
  problemSvaras: string[]; // most-missed svara tokens, worst first
}

function tokenOf(label: string, oct: number): string {
  return label + (oct > 0 ? "'".repeat(oct) : oct < 0 ? '.'.repeat(-oct) : '');
}

export function notesToTokens(notes: Note[]): string[] {
  return notes.filter((n) => !n.transit).map((n) => tokenOf(n.label, n.oct));
}

export function referenceToTokens(reference: ReferenceSvara[]): string[] {
  return reference.map((r) => tokenOf(r.s, r.o));
}

// Score = weighted alignment identity against the reference svara sequence.
// Substitutions that are still legal notes of the lesson's ragam earn partial
// credit (build plan §7); insertions (extra sung notes) don't penalize
// reference coverage; deletions (missed reference notes) count as misses.
export function scorePractice(detected: Note[], reference: ReferenceSvara[], ragam: Ragam): PracticeScore {
  const detTokens = notesToTokens(detected);
  const refTokens = referenceToTokens(reference);
  const pairs = alignSeqs(detTokens, refTokens);

  const inRagam = new Set(ragam.svaras.map((sv) => sv[1]));
  const svaraAccuracy: SvaraAccuracyEntry[] = [];
  const missCounts = new Map<string, number>();
  let weighted = 0;

  pairs.forEach(([di, ri]) => {
    if (ri < 0) return; // extra sung note with no reference counterpart
    const expected = refTokens[ri];
    if (di < 0) {
      svaraAccuracy.push({ index: ri, expected, detected: null, status: 'miss' });
      missCounts.set(expected, (missCounts.get(expected) || 0) + 1);
      return;
    }
    const got = detTokens[di];
    if (got === expected) {
      svaraAccuracy.push({ index: ri, expected, detected: got, status: 'hit' });
      weighted += 1;
    } else {
      const gotLabel = got.replace(/['.]/g, '');
      svaraAccuracy.push({ index: ri, expected, detected: got, status: 'substitution' });
      if (inRagam.has(gotLabel)) weighted += 0.5;
      missCounts.set(expected, (missCounts.get(expected) || 0) + 1);
    }
  });

  const score = refTokens.length ? Math.round((weighted / refTokens.length) * 100) : 0;
  const problemSvaras = [...missCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tok]) => tok);

  return { score: Math.max(0, Math.min(100, score)), svaraAccuracy, problemSvaras };
}
