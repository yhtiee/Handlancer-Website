import { extensionForMime, readFileBytes } from '@/lib/app/domain/file-bytes';
import { supabase } from '@/lib/app/services/supabase';

/**
 * Artisan application uploads. Past-work photos live in the existing public
 * `job-media` bucket under applications/<user id>/, whose insert policy already
 * allows any signed-in user and whose delete policy limits removal to the
 * uploader. The URLs are kept on profiles.work_photos.
 */
const BUCKET = 'job-media';

export async function uploadWorkPhoto(userId: string, file: File): Promise<string> {
  const uri = URL.createObjectURL(file);
  try {
    const bytes = await readFileBytes(uri);
    const path = `applications/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionForMime(file.type)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: file.type || 'image/jpeg', upsert: false });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } finally {
    URL.revokeObjectURL(uri);
  }
}

/** Best effort: a stray file must not block removing it from the application. */
export async function deleteWorkPhoto(url: string): Promise<void> {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return;
  await supabase.storage.from(BUCKET).remove([url.slice(i + marker.length)]).then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Turn a guard-trigger refusal (supabase/artisan_review.sql) into words: the
 * actionable part is in the Postgres hint.
 */
export function applicationError(e: unknown, fallback: string): string {
  const err = e as { message?: string; hint?: string };
  if (err?.hint) return err.hint;
  if (err?.message && !/^[A-Z_]+$/.test(err.message)) return err.message;
  return fallback;
}
