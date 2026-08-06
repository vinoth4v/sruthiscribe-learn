import type { Kriti } from './db-types';

// Mirrors sruthiscribe's sourceLabel() mapping (index.html ~5753). Saraga
// attribution is a license requirement (CLAUDE.md: "Saraga-sourced content
// must render its stored attribution wherever shown"), non-negotiable.
export function sourceLabel(source: string | null | undefined): string {
  if (!source) return '';
  if (/^saraga:/.test(source)) return 'Saraga · CC BY-NC-SA';
  if (/^wikipedia/.test(source)) return 'Wikipedia';
  if (source === 'seed') return 'SruthiScribe';
  return source;
}

export function kritiAttribution(k: Pick<Kriti, 'source' | 'license' | 'audio_credit' | 'audio_license'>): string {
  const parts = [sourceLabel(k.source)];
  if (k.license && !parts[0].includes(k.license)) parts.push(k.license);
  if (k.audio_credit) parts.push(`audio: ${k.audio_credit}`);
  if (k.audio_license) parts.push(k.audio_license);
  return parts.filter(Boolean).join(' · ');
}
