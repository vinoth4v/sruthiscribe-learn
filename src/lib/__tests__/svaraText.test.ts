import { describe, expect, it } from 'vitest';
import { formatFlatSvaras, parseFlatSvaras } from '../svaraText';

describe('parseFlatSvaras / formatFlatSvaras', () => {
  it('round-trips a mixed-octave sequence', () => {
    const text = "S R2 G3 P D2 S' S.";
    const parsed = parseFlatSvaras(text);
    expect(parsed).toEqual([
      { s: 'S', o: 0 }, { s: 'R2', o: 0 }, { s: 'G3', o: 0 },
      { s: 'P', o: 0 }, { s: 'D2', o: 0 }, { s: 'S', o: 1 }, { s: 'S', o: -1 },
    ]);
    expect(formatFlatSvaras(parsed)).toBe(text);
  });

  it('ignores extra whitespace', () => {
    expect(parseFlatSvaras('  S   R2  ')).toEqual([{ s: 'S', o: 0 }, { s: 'R2', o: 0 }]);
  });
});
