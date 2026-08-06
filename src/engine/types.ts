// Type definitions for the SruthiScribe engine port.
// Mirrors the plain-object shapes produced by the original engine.js —
// see src/engine/legacy/engine.cjs for the untyped reference implementation.

export type Temperament = 'et' | 'ji';

export interface Ragam {
  name: string;
  mela: number | null;
  aroh: string;
  avaroh: string;
  svaras: Array<[number, string]>;
}

export interface DirSets {
  up: Record<string, boolean>;
  down: Record<string, boolean>;
}

export interface YinTrack {
  f0: Float32Array;
  conf: Float32Array;
  rms: Float32Array;
  hop: number;
  sr: number;
  nFrames: number;
  totalFrames: number;
  frameStart: number;
}

export interface YinOpts {
  window?: number;
  hop?: number;
  fmin?: number;
  fmax?: number;
  sr?: number;
  threshold?: number;
  frameStart?: number;
  frameEnd?: number;
}

export interface VoicingOpts {
  minConf: number;
  silenceRatio?: number;
}

export interface PitchHistogram {
  bins: Float64Array;
  binCents: number;
}

export interface TonicOffset {
  shift: number;
  score: number;
}

export interface RagamMatch {
  name: string;
  score: number;
}

export interface SvaraState {
  cents: number;
  pos: number;
  label: string;
  oct: number;
}

export interface ViterbiOpts {
  sigma?: number;
  switchPenalty: number;
  silencePenalty?: number;
  dirSets?: DirSets | null;
  dirPenalty?: number;
  occupancyPenalty?: number;
}

export type Articulation = 'plain' | 'light' | 'kampita' | 'slide-up' | 'slide-down';

export interface Note {
  start: number;
  end: number;
  dur: number;
  label: string;
  pos: number;
  oct: number;
  cents: number;
  meanCents: number;
  sd: number;
  slide: number;
  artic: Articulation;
  deviation: number;
  conf: number;
  transit?: boolean;
}

export interface PathToNotesOpts {
  minNoteDur: number;
  transientMax?: number;
}

export interface Tala {
  name: string;
  angas: string[];
}

export interface Jathi {
  name: string;
  beats: number;
}

export interface TalaInfo {
  tala: string;
  jathi: string;
  angas: string[];
  beats: number;
  label: string;
}

export interface NotationTextOpts {
  unit?: number;
  perLine?: number;
  marks?: boolean;
  hideTransit?: boolean;
}

export interface AnalyzeConfig {
  window?: number;
  hop?: number;
  fmin?: number;
  fmax?: number;
  tonicHz: number;
  minConf: number;
  silenceRatio?: number;
  ragam: Ragam;
  temperament: Temperament;
  sigma?: number;
  switchPenalty: number;
  silencePenalty?: number;
  dirPenalty?: number;
  grammar?: boolean;
  autoTonic?: boolean;
  minNoteDur: number;
  transientMax?: number;
}

export interface AnalysisQuality {
  meanAbsDeviation: number;
  meanNoteConfidence: number;
  voicedRatio: number;
  noteCount: number;
}

export interface AnalysisResult {
  track: YinTrack;
  cents: Float32Array;
  voiced: Uint8Array;
  notes: Note[];
  states: SvaraState[];
  hist: PitchHistogram;
  tonicOffset: TonicOffset;
  ragamSuggestions: RagamMatch[];
  appliedShift: number;
  range: { lo: number; hi: number };
  quality: AnalysisQuality;
}

export interface EngineDefaults {
  sr: number;
  window: number;
  hop: number;
  fmin: number;
  fmax: number;
}
