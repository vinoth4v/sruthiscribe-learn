import type { ReferenceSvara } from './scoring';

// Parses the same flat-token notation used throughout sruthiscribe (e.g. the
// versions.flat / community-DB "S R2 G3 P D2 S'" convention): a label
// followed by `'` per octave up or `.` per octave down.
export function parseFlatSvaras(text: string): ReferenceSvara[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const ups = (tok.match(/'/g) || []).length;
      const downs = (tok.match(/\./g) || []).length;
      const s = tok.replace(/['.]/g, '');
      return { s, o: ups - downs };
    });
}

export function formatFlatSvaras(svaras: ReferenceSvara[]): string {
  return svaras.map((s) => s.s + (s.o > 0 ? "'".repeat(s.o) : s.o < 0 ? '.'.repeat(-s.o) : '')).join(' ');
}
