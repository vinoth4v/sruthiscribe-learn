import { supabase } from './supabase';

// Every reference-audio/image path in the DB is stored relative to a storage
// bucket, never as an absolute URL. Swapping Supabase Storage for S3+CloudFront
// later (build plan §8) is then a one-function change, not a data migration.
const BUCKET = 'lesson-media';

export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path; // already absolute (e.g. Saraga audio_url)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
