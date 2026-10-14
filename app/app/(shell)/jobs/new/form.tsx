'use client';

/**
 * Post a job. Ported from mobile src/app/(user)/job/post.tsx: the same fields,
 * validation and three ways out — post publicly, save a draft, or (with
 * ?provider=) send a direct invite. ?category= preselects the trade.
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/app/icon';
import { Avatar, Button, ErrorNote, Field, Note, PageHeader, Section } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { Categories, type CategoryId } from '@/lib/app/constants/categories';
import { routes } from '@/lib/app/domain/routes';
import { useCreateJob } from '@/lib/app/queries/use-jobs';
import { useProvider } from '@/lib/app/queries/use-providers';
import { uploadJobMedia, type MediaAsset } from '@/lib/app/services/media';

type Picked = MediaAsset & { file: File };

const MAX_BYTES = 50 * 1024 * 1024;

export function PostJobForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { session, profile } = useAuth();
  const createJob = useCreateJob();

  const providerId = params.get('provider');
  const presetCategory = params.get('category');
  const isDirect = Boolean(providerId);
  const { data: invited } = useProvider(providerId ?? '');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(
    Categories.some((c) => c.id === presetCategory) ? (presetCategory as CategoryId) : null,
  );
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<Picked[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Default the location to the person's own, once the profile is here.
  const [seeded, setSeeded] = useState(false);
  if (!seeded && profile) {
    setSeeded(true);
    if (profile.location) setLocation(profile.location);
  }

  // Object URLs for previews are released when the form goes away.
  useEffect(() => () => media.forEach((m) => URL.revokeObjectURL(m.uri)), [media]);

  function addMedia(files: FileList | null) {
    setMediaError(null);
    const next: Picked[] = [];
    for (const file of Array.from(files ?? [])) {
      if (file.size > MAX_BYTES) {
        setMediaError(`${file.name} is over 50 MB and was skipped.`);
        continue;
      }
      next.push({ file, uri: URL.createObjectURL(file), kind: file.type.startsWith('video/') ? 'video' : 'photo', mimeType: file.type });
    }
    setMedia((prev) => [...prev, ...next]);
  }

  async function submit(publish: boolean) {
    setError(null);
    setTitleError(null);
    setCategoryError(null);

    let hasError = false;
    if (!title.trim()) {
      setTitleError('Give your job a title');
      hasError = true;
    }
    if (!category) {
      setCategoryError('Pick a category');
      hasError = true;
    }
    if (hasError) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    try {
      setUploading(true);
      const job = await createJob.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        category,
        budget: budget ? Number(budget.replace(/[^0-9.]/g, '')) : null,
        location: location.trim() || null,
        publish,
        directProviderId: providerId ?? null,
      });
      for (const asset of media) {
        await uploadJobMedia({ providerId: session!.user.id, jobId: job.id, phase: 'before', asset });
      }
      router.replace(routes.jobDetail(job.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post the job.');
      setUploading(false);
    }
  }

  const busy = createJob.isPending || uploading;

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        title={isDirect ? 'Invite to a job' : 'Post a job'}
        description={
          isDirect
            ? 'Describe the work. Only the artisan you invite sees it, and they reply with a quote.'
            : 'Describe the work once. Artisans nearby send itemised quotes; you pick one and pay into escrow.'
        }
        back={{ href: isDirect && providerId ? routes.providerProfile(providerId) : routes.myJobs, label: isDirect ? 'Back to profile' : 'My jobs' }}
      />

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit(!isDirect);
        }}
        className="space-y-6"
      >
        {isDirect && invited && (
          <div className="card flex items-center gap-3 p-4">
            <Avatar src={invited.avatar_url} name={invited.name} size={44} />
            <div className="min-w-0">
              <p className="label !text-[10.5px]">Inviting</p>
              <p className="truncate font-semibold text-[var(--ink)]">{invited.name ?? 'Artisan'}</p>
            </div>
          </div>
        )}

        <Section title="The job">
          <div className="space-y-5">
            <Field label="Title" htmlFor="title" error={titleError}>
              <input
                id="title"
                className="input !h-11"
                placeholder="e.g. Fix leaking kitchen sink"
                autoFocus
                value={title}
                aria-invalid={!!titleError}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(null);
                }}
              />
            </Field>

            <fieldset>
              <legend className="mb-2 text-[14px] font-semibold text-[var(--ink)]">Category</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-invalid={!!categoryError}>
                {Categories.map((c) => {
                  const on = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setCategory(c.id);
                        setCategoryError(null);
                      }}
                      className={`flex h-12 items-center gap-2.5 rounded-md border px-3 text-left text-[14px] font-medium transition-colors duration-150 ${
                        on ? 'border-[var(--navy)] bg-[var(--teal-wash)] text-[var(--navy)]' : 'border-[var(--rule-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)]'
                      }`}
                    >
                      <Icon name={c.icon} size={18} className="shrink-0 text-[var(--navy)]" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
              {categoryError && (
                <p role="alert" className="mt-1.5 text-[13.5px] text-[var(--bad)]">
                  {categoryError}
                </p>
              )}
            </fieldset>

            <Field label="Description" htmlFor="description" optional>
              <textarea
                id="description"
                className="input min-h-[120px]"
                placeholder="Describe the work, materials and any details artisans should know."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Money and place">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Budget" htmlFor="budget" optional hint="Leave it open and let the quotes tell you.">
              <div className="relative">
                <span className="figure pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">₦</span>
                <input
                  id="budget"
                  className="input figure !h-11 pl-7"
                  inputMode="numeric"
                  placeholder="50,000"
                  value={budget}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    setBudget(digits ? Number(digits).toLocaleString('en-NG') : '');
                  }}
                />
              </div>
            </Field>
            <Field label="Location" htmlFor="location" optional>
              <input
                id="location"
                className="input !h-11"
                placeholder="e.g. Lekki, Lagos"
                autoComplete="address-level2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Photos and videos">
          <p className="mb-3 text-[14px] text-[var(--muted)]">Optional. A photo of the problem gets you better quotes.</p>
          <div className="flex flex-wrap gap-2">
            {media.map((m, i) => (
              <div key={m.uri} className="relative size-[84px] overflow-hidden rounded-md bg-[var(--band-deep)]">
                {m.kind === 'video' ? (
                  <video src={m.uri} muted playsInline className="size-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- local preview (blob: URL).
                  <img src={m.uri} alt="" className="size-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(m.uri);
                    setMedia((prev) => prev.filter((_, j) => j !== i));
                  }}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
                  aria-label="Remove"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
            <label className="grid size-[84px] cursor-pointer place-items-center rounded-md border-[1.5px] border-dashed border-[var(--rule-strong)] transition-colors duration-150 hover:border-[var(--ink)] hover:bg-[var(--band)]">
              <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => addMedia(e.target.files)} />
              <span className="flex flex-col items-center gap-0.5 text-[12.5px] font-semibold text-[var(--ink)]">
                <Icon name="camera" size={20} />
                Add
              </span>
            </label>
          </div>
          {mediaError && <p className="mt-2 text-[13.5px] text-[var(--bad)]">{mediaError}</p>}
        </Section>

        {!isDirect && (
          <Note icon="lock-closed">Nothing is charged now. You pay into escrow only after you accept a quote.</Note>
        )}

        <ErrorNote>{error}</ErrorNote>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isDirect ? (
            <Button type="submit" size="lg" icon="send" loading={busy}>
              Send invite
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="lg" disabled={busy} onClick={() => void submit(false)}>
                Save as draft
              </Button>
              <Button type="submit" size="lg" loading={busy}>
                Post publicly
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
