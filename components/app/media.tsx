'use client';

/**
 * Before/after photos and videos. Ported from mobile components/media/
 * (media-gallery.tsx, media-viewer.tsx, proof-uploader.tsx). The image picker
 * and camera become one <input type="file">: on a phone it offers library and
 * camera itself, so the mobile long-press-for-camera trick is not needed.
 */
import { useRef, useState } from 'react';

import { Dialog } from '@/components/app/controls';
import { Icon } from '@/components/app/icon';
import { useUploadMedia } from '@/lib/app/queries/use-media';
import type { JobMedia, MediaPhase } from '@/lib/app/services/database.types';

/** Big enough for a 60s phone video, small enough not to stall on mobile data. */
const MAX_BYTES = 50 * 1024 * 1024;

function ordered(media: JobMedia[]) {
  return [...media.filter((m) => m.phase === 'before'), ...media.filter((m) => m.phase === 'after')];
}

export function MediaThumb({ item, size = 96, onOpen }: { item: JobMedia; size?: number; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${item.phase} ${item.kind}`}
      className="relative shrink-0 overflow-hidden rounded-md bg-[var(--band-deep)]"
      style={{ width: size, height: size }}
    >
      {item.kind === 'video' ? (
        <>
          <video src={`${item.url}#t=0.1`} preload="metadata" muted playsInline className="size-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
            <Icon name="videocam" size={20} />
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs.
        <img src={item.url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      )}
    </button>
  );
}

/** Full-size viewer with previous/next, keyboard arrows included. */
export function MediaViewer({
  media,
  index,
  onIndex,
  onClose,
  title,
}: {
  media: JobMedia[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  /** Replaces the Before/After prefix, for photos that aren't from a job. */
  title?: string;
}) {
  const item = index != null ? media[index] : null;
  const go = (d: number) => index != null && onIndex((index + d + media.length) % media.length);
  return (
    <Dialog open={item != null} onClose={onClose} title={item ? `${title ?? (item.phase === 'before' ? 'Before' : 'After')} · ${(index ?? 0) + 1} of ${media.length}` : ''}>
      {item && (
        <div
          className="space-y-3"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
        >
          <div className="grid place-items-center rounded-md bg-[var(--ink)]">
            {item.kind === 'video' ? (
              <video src={item.url} controls playsInline className="max-h-[62dvh] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URLs.
              <img src={item.url} alt="" className="max-h-[62dvh] w-auto object-contain" />
            )}
          </div>
          {media.length > 1 && (
            <div className="flex justify-between">
              <button type="button" className="btn btn-ghost !h-10" onClick={() => go(-1)}>
                <Icon name="chevron-back" size={18} /> Previous
              </button>
              <button type="button" className="btn btn-ghost !h-10" onClick={() => go(1)}>
                Next <Icon name="chevron-forward" size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

/** Read-only before/after gallery for one job. */
export function MediaGallery({ media }: { media: JobMedia[] }) {
  const [index, setIndex] = useState<number | null>(null);
  if (!media.length) return null;
  const list = ordered(media);
  return (
    <div className="space-y-3">
      {(['before', 'after'] as MediaPhase[]).map((phase) => {
        const items = list.filter((m) => m.phase === phase);
        if (!items.length) return null;
        return (
          <div key={phase}>
            <p className="label mb-2">{phase === 'before' ? 'Before' : 'After'}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((m) => (
                <MediaThumb key={m.id} item={m} size={88} onOpen={() => setIndex(list.findIndex((x) => x.id === m.id))} />
              ))}
            </div>
          </div>
        );
      })}
      <MediaViewer media={list} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
    </div>
  );
}

/** The provider's proof of work: add before/after photos or videos. */
export function ProofUploader({ jobId, media }: { jobId: string; media: JobMedia[] }) {
  const upload = useUploadMedia(jobId);
  const [busyPhase, setBusyPhase] = useState<MediaPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const inputs = useRef<Record<MediaPhase, HTMLInputElement | null>>({ before: null, after: null });
  const list = ordered(media);

  async function add(phase: MediaPhase, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError('That file is over 50 MB. Trim the video or pick a photo.');
      return;
    }
    const kind = file.type.startsWith('video/') ? 'video' : 'photo';
    const uri = URL.createObjectURL(file);
    setBusyPhase(phase);
    try {
      await upload.mutateAsync({ phase, asset: { uri, kind, mimeType: file.type } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      URL.revokeObjectURL(uri);
      setBusyPhase(null);
      const input = inputs.current[phase];
      if (input) input.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[14px] text-[var(--muted)]">
        Before and after photos or videos. The client checks them before paying, and they show on your profile as your work.
      </p>
      {(['before', 'after'] as MediaPhase[]).map((phase) => {
        const items = list.filter((m) => m.phase === phase);
        const busy = busyPhase === phase;
        return (
          <div key={phase}>
            <p className="label mb-2">{phase === 'before' ? 'Before' : 'After'}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((m) => (
                <MediaThumb key={m.id} item={m} size={84} onOpen={() => setIndex(list.findIndex((x) => x.id === m.id))} />
              ))}
              <label
                className={`grid size-[84px] cursor-pointer place-items-center rounded-md border-[1.5px] border-dashed border-[var(--rule-strong)] text-[var(--ink)] transition-colors duration-150 hover:border-[var(--ink)] hover:bg-[var(--band)] ${busy ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  ref={(el) => {
                    inputs.current[phase] = el;
                  }}
                  type="file"
                  accept="image/*,video/*"
                  className="sr-only"
                  disabled={busy}
                  onChange={(e) => void add(phase, e.target.files)}
                />
                {busy ? (
                  <span className="spinner" aria-label="Uploading" />
                ) : (
                  <span className="flex flex-col items-center gap-0.5 text-[12.5px] font-semibold">
                    <Icon name="camera" size={20} />
                    Add
                  </span>
                )}
              </label>
            </div>
          </div>
        );
      })}
      {error && (
        <p role="alert" className="text-[14px] text-[var(--bad)]">
          {error}
        </p>
      )}
      <MediaViewer media={list} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
    </div>
  );
}
