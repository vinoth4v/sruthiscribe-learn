import type { AnalyzeConfig, Ragam } from '../engine/types';

// Defaults mirror sruthiscribe's test/test_engine.js cfgFor() and the values
// used throughout index.html's live analysis path — the tuning that the
// golden tests (src/engine/__tests__/engine.golden.test.ts) were validated
// against.
export function defaultAnalyzeConfig(ragam: Ragam, tonicHz: number, overrides: Partial<AnalyzeConfig> = {}): AnalyzeConfig {
  return {
    tonicHz,
    ragam,
    temperament: 'et',
    window: 800,
    hop: 256,
    fmin: 70,
    fmax: 900,
    minConf: 0.55,
    silenceRatio: 0.045,
    sigma: 55,
    switchPenalty: 5.0,
    silencePenalty: 6,
    minNoteDur: 0.06,
    ...overrides,
  };
}
