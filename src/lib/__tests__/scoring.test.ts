import { describe, expect, it } from 'vitest';
import { RAGAMS } from '../../engine/engine';
import type { Note } from '../../engine/types';
import { alignSeqs, referenceToTokens, scorePractice, type ReferenceSvara } from '../scoring';

const mohanam = RAGAMS.find((r) => r.name === 'Mohanam')!;

function note(label: string, oct = 0): Note {
  return {
    start: 0, end: 0.4, dur: 0.4, label, pos: 0, oct, cents: 0,
    meanCents: 0, sd: 0, slide: 0, artic: 'plain', deviation: 0, conf: 1,
  };
}

// Sarali-varisai-style ascent: S R2 G3 P D2 S'
const reference: ReferenceSvara[] = [
  { s: 'S', o: 0 }, { s: 'R2', o: 0 }, { s: 'G3', o: 0 },
  { s: 'P', o: 0 }, { s: 'D2', o: 0 }, { s: 'S', o: 1 },
];

describe('alignSeqs', () => {
  it('aligns identical sequences with no gaps', () => {
    const pairs = alignSeqs(['a', 'b', 'c'], ['a', 'b', 'c']);
    expect(pairs).toEqual([[0, 0], [1, 1], [2, 2]]);
  });

  it('marks a deletion as [-1, j] and an insertion as [i, -1]', () => {
    const pairs = alignSeqs(['a', 'c'], ['a', 'b', 'c']);
    expect(pairs).toEqual([[0, 0], [-1, 1], [1, 2]]);
  });
});

describe('scorePractice', () => {
  it('scores a correct rendition highly (>=85)', () => {
    const sung = reference.map((r) => note(r.s, r.o));
    const result = scorePractice(sung, reference, mohanam);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.svaraAccuracy.every((e) => e.status === 'hit')).toBe(true);
  });

  it('flags deliberately wrong svaras and scores <=60', () => {
    // sing S R2 G3 P D2 S but replace G3 with M1 (out of Mohanam) and D2 with N3
    const sung: Note[] = [
      note('S'), note('R2'), note('M1'), note('P'), note('N3'), note('S', 1),
    ];
    const result = scorePractice(sung, reference, mohanam);
    expect(result.score).toBeLessThan(85);
    const subs = result.svaraAccuracy.filter((e) => e.status === 'substitution');
    expect(subs.map((e) => e.expected)).toEqual(expect.arrayContaining(['G3', 'D2']));
    expect(result.problemSvaras.length).toBeGreaterThan(0);
  });

  it('gives partial credit for an in-ragam substitution vs. none for out-of-ragam', () => {
    const inRagamSub: Note[] = [note('S'), note('R2'), note('D2'), note('P'), note('D2'), note('S', 1)]; // G3->D2 (in ragam)
    const outRagamSub: Note[] = [note('S'), note('R2'), note('M1'), note('P'), note('D2'), note('S', 1)]; // G3->M1 (not in Mohanam)
    const a = scorePractice(inRagamSub, reference, mohanam);
    const b = scorePractice(outRagamSub, reference, mohanam);
    expect(a.score).toBeGreaterThan(b.score);
  });

  it('referenceToTokens renders octave marks consistent with the flat-string DB convention', () => {
    expect(referenceToTokens([{ s: 'S', o: 0 }, { s: 'S', o: 1 }, { s: 'S', o: -1 }])).toEqual(["S", "S'", 'S.']);
  });
});
