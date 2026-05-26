// Upload helper for plot images.
// Uploads a local URI (from react-native-image-picker) to Supabase Storage
// and returns the public URL.

import { supabase } from '@/lib/supabase';

const BUCKET = 'plot-images';

/**
 * Upload one image from a local URI (file://...) to Supabase Storage.
 * Returns the public URL on success, or null on failure.
 */
export async function uploadPlotImage(
  uri: string,
  ownerId: string,
): Promise<string | null> {
  try {
    // Get the file as a Blob via fetch (works for file:// URIs in RN)
    const response = await fetch(uri);
    const blob = await response.blob();

    // Derive a reasonable extension from the URI
    const extMatch = uri.match(/\.(jpg|jpeg|png|webp|heic)$/i);
    const ext = (extMatch?.[1] ?? 'jpg').toLowerCase();
    const filename = `${ownerId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, blob, {
        contentType: blob.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('uploadPlotImage upload:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl ?? null;
  } catch (e: any) {
    console.warn('uploadPlotImage exception:', e?.message ?? e);
    return null;
  }
}

/**
 * Upload many images in parallel and return only the URLs that succeeded.
 * Order of returned URLs is NOT guaranteed to match input order.
 */
export async function uploadPlotImages(
  uris: string[],
  ownerId: string,
): Promise<string[]> {
  if (!uris.length) return [];
  const results = await Promise.all(uris.map(u => uploadPlotImage(u, ownerId)));
  return results.filter((u): u is string => !!u);
}
