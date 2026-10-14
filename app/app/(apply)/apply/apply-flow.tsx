'use client';

/**
 * The artisan application: five short steps, saved as you go, then a person
 * reviews it in the admin console. Until approved an artisan is not
 * discoverable and cannot quote (supabase/artisan_review.sql enforces both).
 *
 * The profile row IS the application — every step writes straight to it, so
 * leaving half way loses nothing and the reviewer sees exactly what customers
 * will. The final step sets provider_status to 'pending'; the database checks
 * the required fields again before it allows that.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/admin/brand-logo';
import { Icon } from '@/components/app/icon';
import { ServicePicker } from '@/components/app/service-picker';
import { Avatar, Button, ButtonLink, ErrorNote, Field, Note } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { Categories } from '@/lib/app/constants/categories';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP_DISPLAY } from '@/lib/app/constants/support';
import { providerStatus } from '@/lib/app/domain/artisan-status';
import { routes } from '@/lib/app/domain/routes';
import { applicationError, deleteWorkPhoto, uploadWorkPhoto } from '@/lib/app/services/applications';
import type { ServiceOption } from '@/lib/app/service-options';
import type { Profile } from '@/lib/app/services/database.types';
import { updateProfile, uploadAvatarImage } from '@/lib/app/services/profiles';
import { ARTISAN_RULES, REVIEW_CRITERIA } from '@/lib/artisan-program';

const STEPS = ['You', 'What you do', 'Experience', 'Work photos', 'Rules'] as const;
const MAX_PHOTOS = 6;
const MIN_BIO = 40;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type Availability = NonNullable<Profile['availability']>;

export function ApplyFlow({ services }: { services: ServiceOption[] }) {
  const router = useRouter();
  const { loading, session, profile } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) router.replace(`${routes.signIn}?next=${encodeURIComponent(routes.apply)}`);
    else if (!profile) router.replace(`${routes.onboarding}?role=provider`);
    else if (profile.role !== 'provider') router.replace(routes.home);
  }, [loading, session, profile, router]);

  if (loading || !profile || profile.role !== 'provider') {
    return (
      <Frame>
        <div className="skeleton h-64 rounded" />
      </Frame>
    );
  }

  const status = providerStatus(profile);
  if (status === 'pending' || status === 'approved' || status === 'suspended') return <StatusView profile={profile} />;
  return <Wizard profile={profile} services={services} />;
}

// ─────────────────────────── Frame ───────────────────────────

function Frame({ children, step }: { children: React.ReactNode; step?: number }) {
  return (
    <div className="min-h-dvh bg-[var(--band)]">
      <header className="hl-topbar sticky top-0 z-20 border-b border-[var(--rule)] bg-[var(--paper)]">
        <div className="mx-auto flex h-full max-w-[760px] items-center gap-3 px-4">
          <Link href="/app" className="flex items-center gap-2.5" aria-label="HandLancer home">
            <BrandLogo height={24} priority />
            <span className="text-[17px] font-bold tracking-[-0.03em] text-[var(--navy)]">HandLancer</span>
          </Link>
          <span className="label ml-1 hidden sm:inline">Artisan application</span>
          {/* Everything is saved per step; the app itself waits until the application is in. */}
          <SignOutLink />
        </div>
        {step != null && (
          <div className="mx-auto max-w-[760px] px-4 pb-2.5">
            <ol className="grid grid-cols-5 gap-1.5" aria-label="Application steps">
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === step ? 'step' : undefined}>
                  <span className={`block h-1 rounded-full ${i <= step ? 'bg-[var(--teal)]' : 'bg-[var(--band-deep)]'}`} />
                  <span className={`mt-1 hidden text-[11.5px] sm:block ${i === step ? 'font-semibold text-[var(--navy)]' : 'text-[var(--muted)]'}`}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-[760px] px-4 pb-[calc(40px+env(safe-area-inset-bottom))] pt-6 md:pt-10">{children}</main>
    </div>
  );
}

function SignOutLink() {
  const { signOut } = useAuth();
  return (
    <button type="button" onClick={() => void signOut()} className="ml-auto text-[13.5px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
      Save &amp; sign out
    </button>
  );
}

function StepHead({ n, title, lede }: { n: number; title: React.ReactNode; lede: string }) {
  return (
    <div className="enter mb-6">
      <p className="label">
        Step {n + 1} of {STEPS.length}
      </p>
      <h1 className="mt-2 !text-[clamp(1.6rem,4vw,2.1rem)]">{title}</h1>
      <p className="lede mt-1.5 !text-[16.5px]">{lede}</p>
    </div>
  );
}

function Actions({ onBack, saving, label = 'Save and continue' }: { onBack?: () => void; saving: boolean; label?: string }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
      {onBack ? (
        <Button variant="ghost" icon="chevron-back" onClick={onBack} disabled={saving}>
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" size="lg" loading={saving}>
        {label}
      </Button>
    </div>
  );
}

// ─────────────────────────── Wizard ───────────────────────────

/** First step with anything missing, so returning to a half-done application picks up where it stopped. */
function firstIncomplete(p: Profile): number {
  if (!p.avatar_url || !p.name?.trim() || !p.phone?.trim() || !p.location?.trim()) return 0;
  if (!p.services?.length) return 1;
  if (p.years_experience == null || (p.bio?.trim().length ?? 0) < MIN_BIO) return 2;
  if (!p.work_photos?.length) return 3;
  return 4;
}

function Wizard({ profile, services }: { profile: Profile; services: ServiceOption[] }) {
  const [step, setStep] = useState(() => firstIncomplete(profile));
  const next = () => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0 });
  };

  return (
    <Frame step={step}>
      {profile.provider_status === 'rejected' && (
        <div className="mb-6">
          <Note icon="warning">
            <b className="text-[var(--ink)]">Your last application needs changes.</b> {profile.provider_review_note?.trim() || 'Update your details and send it again.'}
          </Note>
        </div>
      )}
      {step === 0 && <YouStep profile={profile} onDone={next} />}
      {step === 1 && <TradesStep profile={profile} services={services} onDone={next} onBack={back} />}
      {step === 2 && <ExperienceStep profile={profile} onDone={next} onBack={back} />}
      {step === 3 && <PhotosStep profile={profile} onDone={next} onBack={back} />}
      {step === 4 && <RulesStep profile={profile} onBack={back} />}
    </Frame>
  );
}

/** Saves a patch to the profile, refreshes the session's copy, then moves on. */
function useSave(profile: Profile) {
  const { refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(patch: Partial<Profile>, onDone?: () => void) {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(profile.id, patch);
      await refreshProfile();
      onDone?.();
    } catch (e) {
      setError(applicationError(e, 'Could not save. Check your connection and try again.'));
    } finally {
      setSaving(false);
    }
  }
  return { save, saving, error, setError };
}

// ── 1 · You ──

function YouStep({ profile, onDone }: { profile: Profile; onDone: () => void }) {
  const { refreshProfile } = useAuth();
  const { save, saving, error, setError } = useSave(profile);
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
  });
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function pickPhoto(file?: File) {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) return setError('That photo is over 10 MB. Pick a smaller one.');
    setUploading(true);
    setError(null);
    const uri = URL.createObjectURL(file);
    try {
      setAvatar(await uploadAvatarImage(profile.id, uri, file.type));
      await refreshProfile();
    } catch (e) {
      setError(applicationError(e, 'Could not upload your photo.'));
    } finally {
      URL.revokeObjectURL(uri);
      setUploading(false);
    }
  }

  // The mobile LocationInput's browser branch: geolocation, then an OpenStreetMap reverse lookup.
  function useMyLocation() {
    if (!navigator.geolocation) return setErrors((e) => ({ ...e, location: 'Location isn’t available here. Please type your area.' }));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const addr = (await res.json())?.address ?? {};
          const parts = [addr.road || addr.suburb, addr.city || addr.town || addr.county || addr.state].filter(Boolean);
          if (parts.length) address = parts.join(', ');
        } catch {
          // Coordinates will do.
        }
        setLocation(address);
        setCoords({ latitude, longitude });
        setLocating(false);
      },
      () => {
        setErrors((e) => ({ ...e, location: 'Could not get your location. Please type your area.' }));
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!avatar) next.avatar = 'Add a clear photo of yourself.';
    if (!name.trim()) next.name = 'Enter your full name.';
    if (phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a phone number we can call.';
    if (!location.trim()) next.location = 'Tell us the area you work in.';
    setErrors(next);
    if (Object.keys(next).length) return;
    void save({ name: name.trim(), phone: phone.trim(), location: location.trim(), ...coords }, onDone);
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHead n={0} title={<>Who customers <em>will meet</em></>} lede="Your name, face and number. A real photo is the first thing customers — and our reviewers — look for." />
      <div className="card space-y-6 p-5 md:p-6">
        <div>
          <div className="flex items-center gap-4">
            <Avatar src={avatar} name={name || profile.name} size={80} />
            <div className="space-y-1.5">
              <label className={`btn btn-ghost !h-10 cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
                {uploading ? <span className="spinner" aria-hidden="true" /> : <Icon name="camera" size={18} />}
                {avatar ? 'Change photo' : 'Add your photo'}
              </label>
              <p className="text-[13px] text-[var(--muted)]">Your face, in good light. Not a logo.</p>
            </div>
          </div>
          {errors.avatar && <p className="mt-2 text-[13.5px] text-[var(--bad)]">{errors.avatar}</p>}
        </div>
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <input id="name" className="input !h-11" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Phone number" htmlFor="phone" error={errors.phone} hint="We may call to confirm your application.">
          <input id="phone" className="input !h-11" type="tel" autoComplete="tel" placeholder="0803 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Where you work" htmlFor="location" error={errors.location}>
          <div className="flex gap-2">
            <input
              id="location"
              className="input !h-11 flex-1"
              placeholder="e.g. Ewet Housing, Uyo"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCoords({ latitude: null, longitude: null });
              }}
            />
            <Button variant="ghost" icon="location" loading={locating} onClick={useMyLocation}>
              <span className="hidden sm:inline">Use my location</span>
            </Button>
          </div>
        </Field>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <Actions saving={saving} />
    </form>
  );
}

// ── 2 · What you do ──

function TradesStep({ profile, services: options, onDone, onBack }: { profile: Profile; services: ServiceOption[]; onDone: () => void; onBack: () => void }) {
  const { save, saving, error, setError } = useSave(profile);
  const [services, setServices] = useState<string[]>(profile.services ?? []);
  const trades = services.filter((s) => Categories.some((c) => c.id === s));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!trades.length) return setError('Pick at least one trade, or a service from the list.');
    void save({ services }, onDone);
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHead
        n={1}
        title={<>What you <em>do</em></>}
        lede="Search for every service you offer, or open a trade and tick them. Can’t find one? Type it and add it. Customers find you by these, and jobs in your trades are shown to you first."
      />
      <div className="card p-5 md:p-6">
        <ServicePicker
          value={services}
          options={options}
          onLimit={setError}
          onChange={(next) => {
            setError(null);
            setServices(next);
          }}
        />
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <Actions onBack={onBack} saving={saving} />
    </form>
  );
}

// ── 3 · Experience ──

const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: 'available', label: 'Available now' },
  { value: 'busy', label: 'Busy this week' },
  { value: 'on_call', label: 'On call' },
];

function ExperienceStep({ profile, onDone, onBack }: { profile: Profile; onDone: () => void; onBack: () => void }) {
  const { save, saving, error } = useSave(profile);
  const [years, setYears] = useState(profile.years_experience != null ? String(profile.years_experience) : '');
  const [rate, setRate] = useState(profile.hourly_rate ? profile.hourly_rate.toLocaleString('en-NG') : '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [business, setBusiness] = useState(profile.business_name ?? '');
  const [availability, setAvailability] = useState<Availability>(profile.availability === 'offline' || !profile.availability ? 'available' : profile.availability);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const y = Number(years);
    if (years === '' || !Number.isFinite(y) || y < 0 || y > 60) next.years = 'How many years have you done this work?';
    if (bio.trim().length < MIN_BIO) next.bio = `A few sentences, please — at least ${MIN_BIO} characters.`;
    setErrors(next);
    if (Object.keys(next).length) return;
    const r = Number(rate.replace(/\D/g, ''));
    void save(
      {
        years_experience: Math.round(y),
        hourly_rate: r > 0 ? r : null,
        bio: bio.trim(),
        business_name: business.trim() || null,
        availability,
      },
      onDone,
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHead n={2} title={<>How you <em>work</em></>} lede="In your own words. Customers read this before asking you for a quote." />
      <div className="card space-y-6 p-5 md:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Years of experience" htmlFor="years" error={errors.years}>
            <input id="years" className="input figure !h-11" inputMode="numeric" placeholder="e.g. 6" value={years} onChange={(e) => setYears(e.target.value.replace(/\D/g, '').slice(0, 2))} />
          </Field>
          <Field label="Starting hourly rate" htmlFor="rate" optional hint="Leave blank to price every job by quote.">
            <div className="relative">
              <span className="figure pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">₦</span>
              <input
                id="rate"
                className="input figure !h-11 pl-7"
                inputMode="numeric"
                placeholder="3,000"
                value={rate}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '');
                  setRate(d ? Number(d).toLocaleString('en-NG') : '');
                }}
              />
            </div>
          </Field>
        </div>
        <Field label="About your work" htmlFor="bio" error={errors.bio} hint={`${bio.trim().length} / ${MIN_BIO}+ characters. What you do best, jobs you’re proud of, tools you bring.`}>
          <textarea
            id="bio"
            className="input min-h-[140px]"
            placeholder="I’m a plumber with 6 years’ experience in Uyo. I fix leaks, install water heaters and lay pipework for new builds, and I bring my own tools…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Field>
        <Field label="Business name" htmlFor="business" optional>
          <input id="business" className="input !h-11" placeholder="e.g. Adaeze Plumbing Services" value={business} onChange={(e) => setBusiness(e.target.value)} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-[14px] font-semibold text-[var(--ink)]">Right now you are</legend>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((o) => (
              <button key={o.value} type="button" aria-pressed={availability === o.value} className="chip" onClick={() => setAvailability(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <Actions onBack={onBack} saving={saving} />
    </form>
  );
}

// ── 4 · Work photos ──

function PhotosStep({ profile, onDone, onBack }: { profile: Profile; onDone: () => void; onBack: () => void }) {
  const { refreshProfile } = useAuth();
  const [photos, setPhotos] = useState<string[]>(profile.work_photos ?? []);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function persist(next: string[]) {
    setPhotos(next);
    await updateProfile(profile.id, { work_photos: next });
    await refreshProfile();
  }

  async function add(files: FileList | null) {
    setError(null);
    const list = Array.from(files ?? []).slice(0, MAX_PHOTOS - photos.length);
    if (!list.length) return;
    setUploading(list.length);
    let next = [...photos];
    try {
      for (const file of list) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > MAX_PHOTO_BYTES) {
          setError(`${file.name} is over 10 MB and was skipped.`);
          continue;
        }
        next = [...next, await uploadWorkPhoto(profile.id, file)];
        setUploading((n) => n - 1);
      }
      await persist(next);
    } catch (e) {
      setError(applicationError(e, 'Upload failed. Check your connection and try again.'));
      await persist(next).catch(() => {});
    } finally {
      setUploading(0);
    }
  }

  async function remove(url: string) {
    setError(null);
    try {
      await persist(photos.filter((p) => p !== url));
      void deleteWorkPhoto(url);
    } catch (e) {
      setError(applicationError(e, 'Could not remove that photo.'));
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!photos.length) return setError('Add at least one photo of work you’ve done.');
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHead n={3} title={<>Show us <em>your work</em></>} lede={`Up to ${MAX_PHOTOS} photos of jobs you’ve done — finished work, before-and-afters, your workshop. This is what our reviewers weigh most.`} />
      <div className="card p-5 md:p-6">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-md bg-[var(--band-deep)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage URL. */}
              <img src={url} alt="" className="size-full object-cover" />
              <button type="button" onClick={() => void remove(url)} className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove photo">
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }, (_, i) => (
            <div key={`u${i}`} className="skeleton aspect-square rounded-md" />
          ))}
          {photos.length + uploading < MAX_PHOTOS && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-md border-[1.5px] border-dashed border-[var(--rule-strong)] transition-colors duration-150 hover:border-[var(--ink)] hover:bg-[var(--band)]">
              <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading > 0} onChange={(e) => void add(e.target.files)} />
              <span className="flex flex-col items-center gap-1 text-[13px] font-semibold text-[var(--ink)]">
                <Icon name="camera" size={22} />
                Add photos
              </span>
            </label>
          )}
        </div>
        <p className="mt-4 text-[13.5px] text-[var(--muted)]">Only photos of your own work. Photos of someone else’s work get an application turned down.</p>
      </div>
      {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
      <Actions onBack={onBack} saving={uploading > 0} label="Continue" />
    </form>
  );
}

// ── 5 · Rules ──

function RulesStep({ profile, onBack }: { profile: Profile; onBack: () => void }) {
  const { save, saving, error } = useSave(profile);
  const [agreed, setAgreed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return setLocalError('Tick the box to accept the artisan rules.');
    setLocalError(null);
    void save({ provider_terms_accepted_at: new Date().toISOString(), provider_status: 'pending' }, () => window.scrollTo({ top: 0 }));
  }

  return (
    <form onSubmit={submit} noValidate>
      <StepHead n={4} title={<>The rules, <em>plainly</em></>} lede="What every artisan on HandLancer agrees to. They protect your money as much as the customer’s." />
      <div className="card divide-y divide-[var(--rule)]">
        {ARTISAN_RULES.map((r, i) => (
          <div key={r.title} className="flex gap-4 p-4 md:p-5">
            <span className="figure shrink-0 pt-0.5 text-[13px] text-[var(--navy)]">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <p className="font-semibold text-[var(--ink)]">{r.title}</p>
              <p className="mt-1 text-[14.5px] text-[var(--muted)]">
                {r.body}{' '}
                <a href={`/terms#${r.terms}`} target="_blank" rel="noopener" className="whitespace-nowrap text-[13px] font-semibold text-[var(--navy)] hover:underline">
                  In the terms →
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Note icon="information-circle">
          <b className="text-[var(--ink)]">What happens next:</b> a person at HandLancer reviews your application. We check for {REVIEW_CRITERIA.length} things — a clear photo, a reachable phone, your area and trades, real work photos and an honest description — and may call you. You’ll get a notification either way.
        </Note>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-[var(--rule-strong)] bg-[var(--paper)] p-4">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--navy)]" />
        <span className="text-[15px] text-[var(--ink)]">
          I’ve read and agree to the artisan rules above, the{' '}
          <a href="/terms" target="_blank" rel="noopener" className="ulink">
            Terms of Service
          </a>{' '}
          and the{' '}
          <a href="/privacy" target="_blank" rel="noopener" className="ulink">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {(localError || error) && <div className="mt-4"><ErrorNote>{localError ?? error}</ErrorNote></div>}
      <Actions onBack={onBack} saving={saving} label="Submit for review" />
    </form>
  );
}

// ─────────────────────────── After submitting ───────────────────────────

function StatusView({ profile }: { profile: Profile }) {
  const status = providerStatus(profile);
  return (
    <Frame>
      <section className="card enter p-6 text-center md:p-10">
        <span
          className={`mx-auto grid size-16 place-items-center rounded-full ${
            status === 'approved' ? 'bg-[var(--teal-wash)] text-[var(--navy)]' : status === 'suspended' ? 'bg-[#fdeeee] text-[var(--bad)]' : 'bg-[var(--band)] text-[var(--navy)]'
          }`}
        >
          <Icon name={status === 'approved' ? 'shield-checkmark' : status === 'suspended' ? 'warning' : 'time'} size={30} />
        </span>
        {status === 'approved' ? (
          <>
            <h1 className="mt-5">
              You’re <em>approved</em>
            </h1>
            <p className="lede mx-auto mt-2 max-w-[44ch] !text-[17px]">Customers can find you now, and you can quote on open jobs near you.</p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <ButtonLink href={routes.findWork} size="lg" icon="search">
                Find work
              </ButtonLink>
              <ButtonLink href={routes.providerProfile(profile.id)} variant="ghost" size="lg">
                See your public profile
              </ButtonLink>
            </div>
          </>
        ) : status === 'suspended' ? (
          <>
            <h1 className="mt-5">Your artisan account is suspended</h1>
            <p className="lede mx-auto mt-2 max-w-[44ch] !text-[17px]">{profile.provider_review_note?.trim() || 'Contact support to find out why and what happens next.'}</p>
            <p className="mt-4 text-[14px] text-[var(--muted)]">
              {SUPPORT_EMAIL} · {SUPPORT_WHATSAPP_DISPLAY}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-5">
              Application <em>received</em>
            </h1>
            <p className="lede mx-auto mt-2 max-w-[46ch] !text-[17px]">
              A person at HandLancer is reviewing it and may call you on {profile.phone || 'your number'}. You’ll get a notification as soon as there’s a decision.
            </p>
            <ul className="mx-auto mt-6 max-w-[420px] space-y-2.5 text-left text-[14.5px] text-[var(--muted)]">
              <li className="flex gap-2.5">
                <Icon name="checkmark-circle" size={18} className="mt-0.5 shrink-0 text-[var(--navy)]" />
                Meanwhile you can browse open jobs and finish setting up your wallet.
              </li>
              <li className="flex gap-2.5">
                <Icon name="checkmark-circle" size={18} className="mt-0.5 shrink-0 text-[var(--navy)]" />
                Quoting and appearing in search switch on when you’re approved.
              </li>
            </ul>
            <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
              <ButtonLink href={routes.findWork} size="lg">
                Browse open jobs
              </ButtonLink>
              <ButtonLink href={routes.walletBank()} variant="ghost" size="lg" icon="business">
                Link your bank account
              </ButtonLink>
            </div>
          </>
        )}
      </section>
    </Frame>
  );
}
