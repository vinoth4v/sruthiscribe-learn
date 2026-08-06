import { supabase } from './supabase';
import type { Kriti, Version } from './db-types';

export async function searchKritisByTitle(query: string, limit = 15): Promise<Kriti[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('kritis')
    .select('*')
    .or(`title.ilike.%${q}%,alt_title.ilike.%${q}%,composer.ilike.%${q}%`)
    .order('notation_rank', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data as Kriti[];
}

export async function getKriti(id: string): Promise<Kriti> {
  const { data, error } = await supabase.from('kritis').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Kriti;
}

export async function listVersionsForKriti(kritiId: string): Promise<Version[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('kriti_id', kritiId)
    .order('status', { ascending: true }) // 'community' < 'seed' alphabetically -- reorder below
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data as Version[];
  // seed (curated) versions first, then community, each newest-first
  return rows.sort((a, b) => (a.status === b.status ? 0 : a.status === 'seed' ? -1 : 1));
}

export async function getVersion(id: string): Promise<Version> {
  const { data, error } = await supabase.from('versions').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Version;
}

// Best default version for a kriti when a lesson doesn't pin one explicitly:
// prefer a curated 'seed' version, else the most recently contributed
// community version.
export async function getBestVersion(kritiId: string): Promise<Version | null> {
  const versions = await listVersionsForKriti(kritiId);
  return versions[0] ?? null;
}

export interface CommunityVersionRow extends Version {
  kriti_title: string;
  kriti_ragam: string;
}

// Admin review queue: recent community-contributed versions across every
// kriti. Never mutates versions (append-only per CLAUDE.md) -- "approving"
// one happens by an admin linking it to a lesson (kritiApi/lessons.version_id),
// not by flipping a status flag here.
export async function listCommunityVersions(limit = 30): Promise<CommunityVersionRow[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*, kritis(title, ragam)')
    .eq('status', 'community')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as Array<Version & { kritis: { title: string; ragam: string } | null }>).map((row) => ({
    ...row,
    kriti_title: row.kritis?.title ?? 'Unknown',
    kriti_ragam: row.kritis?.ragam ?? '',
  }));
}
