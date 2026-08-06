// Golden-file test: every synthesized fixture below is run through BOTH the
// frozen legacy engine (src/engine/legacy/engine.cjs, an untouched copy of
// sruthiscribe's engine.js) and the ported TS engine (src/engine/engine.ts),
// then asserted byte-identical on the outputs that matter to the product
// (svara labels, articulation, tonic-offset, ragam suggestions, quality).
//
// Hard rule (see docs/sruthiscribe-learn-build-plan.md §9, Phase 0):
// NEVER change pitch/Viterbi/alignment logic without this test passing.
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import * as engineTs from '../engine';
import type { AnalyzeConfig } from '../types';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const engineJs = require('../legacy/engine.cjs');

const SR = 16000;

interface SynthEvent {
  cents: number;
  dur: number;
  gamaka?: 'kampita' | 'slide';
  depth?: number;
  rate?: number;
  span?: number;
}

// --- synthesise a voice-like tone following a cents contour (ported 1:1 from
// sruthiscribe's test/test_engine.js so both engines see identical PCM) ---
function synth(events: SynthEvent[], tonic: number, opts: { noise?: number } = {}): Float32Array {
  const total = events.reduce((a, e) => a + e.dur, 0);
  const n = Math.round(total * SR);
  const x = new Float32Array(n);
  let phase = 0, idx = 0;
  const harm = [1, 0.55, 0.32, 0.18, 0.1, 0.06];
  for (const ev of events) {
    const len = Math.round(ev.dur * SR);
    for (let i = 0; i < len && idx < n; i++, idx++) {
      const t = i / SR;
      let cents = ev.cents;
      if (ev.gamaka === 'kampita') cents += ev.depth! * Math.sin(2 * Math.PI * ev.rate! * t);
      if (ev.gamaka === 'slide') cents += ev.span! * (t / ev.dur);
      const f = tonic * Math.pow(2, cents / 1200);
      phase += (2 * Math.PI * f) / SR;
      let s = 0;
      for (let h = 0; h < harm.length; h++) s += harm[h] * Math.sin(phase * (h + 1));
      const env = Math.min(1, i / (0.02 * SR)) * Math.min(1, (len - i) / (0.02 * SR));
      x[idx] = 0.25 * s * env + (opts.noise || 0) * (Math.random() - 0.5);
    }
  }
  return x;
}

function cfgFor(engine: typeof engineJs, ragamName: string, tonicHz: number, over?: Partial<AnalyzeConfig>): AnalyzeConfig {
  const ragam = engine.RAGAMS.find((r: { name: string }) => r.name === ragamName);
  return Object.assign(
    {
      tonicHz, ragam, temperament: 'et' as const,
      window: 800, hop: 256, fmin: 70, fmax: 900,
      minConf: 0.55, silenceRatio: 0.045,
      sigma: 55, switchPenalty: 5.0, silencePenalty: 6, minNoteDur: 0.06,
    },
    over || {},
  );
}

// deterministic fixtures only — no `noise` (Math.random) so both engines see
// byte-identical PCM and results are reproducible across runs.
const FIXTURES: Array<{ name: string; ragam: string; tonic: number; events: SynthEvent[] }> = [
  {
    name: 'plain Mohanam arohana/avarohana',
    ragam: 'Mohanam',
    tonic: 146.83,
    events: [0, 200, 400, 700, 900, 1200, 900, 700, 400, 200, 0].map((c) => ({ cents: c, dur: 0.45 })),
  },
  {
    name: 'kampita gamaka on R2 and P',
    ragam: 'Shankarabharanam',
    tonic: 196.0,
    events: [
      { cents: 0, dur: 0.5 },
      { cents: 200, dur: 0.7, gamaka: 'kampita', depth: 95, rate: 5.5 },
      { cents: 400, dur: 0.5 },
      { cents: 700, dur: 0.8, gamaka: 'kampita', depth: 70, rate: 6.0 },
      { cents: 0, dur: 0.5 },
    ],
  },
  {
    name: 'ascending jaaru (slide) S -> M1',
    ragam: 'Kharaharapriya',
    tonic: 220.0,
    events: [
      { cents: 0, dur: 0.4 },
      { cents: 0, dur: 0.45, gamaka: 'slide', span: 500 },
      { cents: 500, dur: 0.5 },
    ],
  },
];

describe('engine.ts port matches legacy engine.js (golden fixtures)', () => {
  for (const fx of FIXTURES) {
    it(fx.name, () => {
      const xJs = synth(fx.events, fx.tonic);
      const xTs = synth(fx.events, fx.tonic);

      const resJs = engineJs.finishAnalysis(engineJs.yinTrack(xJs, SR, {}), cfgFor(engineJs, fx.ragam, fx.tonic));
      const resTs = engineTs.finishAnalysis(engineTs.yinTrack(xTs, SR, {}), cfgFor(engineTs, fx.ragam, fx.tonic) as AnalyzeConfig);

      const labelsJs = resJs.notes.map((n: unknown) => engineJs.renderSvara(n, true)).join(' ');
      const labelsTs = resTs.notes.map((n) => engineTs.renderSvara(n, true)).join(' ');
      expect(labelsTs).toBe(labelsJs);

      expect(resTs.notes.map((n) => n.artic)).toEqual(resJs.notes.map((n: { artic: string }) => n.artic));
      expect(resTs.tonicOffset.shift).toBe(resJs.tonicOffset.shift);
      expect(resTs.ragamSuggestions.map((s) => s.name)).toEqual(
        resJs.ragamSuggestions.map((s: { name: string }) => s.name),
      );
      expect(resTs.quality).toEqual(resJs.quality);
    });
  }

  it('RAGAMS database is identical (114 ragams, same svara sets)', () => {
    expect(engineTs.RAGAMS).toEqual(engineJs.RAGAMS);
  });

  it('notationText output is identical for a representative note sequence', () => {
    const fx = FIXTURES[0];
    const x = synth(fx.events, fx.tonic);
    const resJs = engineJs.finishAnalysis(engineJs.yinTrack(x, SR, {}), cfgFor(engineJs, fx.ragam, fx.tonic));
    const resTs = engineTs.finishAnalysis(engineTs.yinTrack(x, SR, {}), cfgFor(engineTs, fx.ragam, fx.tonic) as AnalyzeConfig);
    expect(engineTs.notationText(resTs.notes, { marks: false, perLine: 8 })).toBe(
      engineJs.notationText(resJs.notes, { marks: false, perLine: 8 }),
    );
  });
});
