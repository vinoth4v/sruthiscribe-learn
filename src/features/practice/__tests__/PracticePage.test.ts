import { describe, expect, it } from 'vitest';
import { sahityaLine, toReferenceSvaras } from '../PracticePage';

describe('sahityaLine', () => {
  it('returns null when the section has no sahitya', () => {
    expect(sahityaLine({ sahitya: false, svaras: [{ syl: 'Sa' }] })).toBeNull();
    expect(sahityaLine({ svaras: [{ syl: 'Sa' }] })).toBeNull();
  });

  it('joins syllables from svaras[].syl, skipping svaras with none, when sahitya is true', () => {
    // real shape from versions.notation: sahitya is a boolean flag, the
    // syllables live per-svara -- a section-level string would be a bug.
    const section = {
      sahitya: true,
      svaras: [{ s: 'D2', o: 0, syl: 'In' }, { s: 'P', o: 0 }, { s: 'M1', o: 0, syl: 'tha' }],
    };
    expect(sahityaLine(section)).toBe('In tha');
  });

  it('returns null if sahitya is true but no syllables are present', () => {
    expect(sahityaLine({ sahitya: true, svaras: [{}] })).toBeNull();
  });
});

describe('toReferenceSvaras', () => {
  it('maps version svaras to {s,o} reference svaras, dropping duration/syllable', () => {
    const svaras = [{ s: 'S', o: 0, d: 1, syl: 'Sa' }, { s: 'R2', o: 1, d: 2 }];
    expect(toReferenceSvaras(svaras)).toEqual([{ s: 'S', o: 0 }, { s: 'R2', o: 1 }]);
  });
});
