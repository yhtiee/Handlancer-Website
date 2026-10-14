'use client';

/**
 * Edit profile. Ported from mobile components/profile/edit-profile-screen.tsx,
 * and components/ui/location-input.tsx (whose
 * browser branch — geolocation plus an OpenStreetMap reverse lookup — is used
 * as is). Trades and services come from components/app/service-picker.tsx. Bank details are not here: they go through the verified flow under
 * Wallet → Bank account.
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Icon } from '@/components/app/icon';
import { ServicePicker } from '@/components/app/service-picker';
import { Avatar, Button, ErrorNote, Field, Note, PageHeader, Section } from '@/components/app/ui';
import { useAuth } from '@/lib/app/auth';
import { routes } from '@/lib/app/domain/routes';
import type { ServiceOption } from '@/lib/app/service-options';
import type { Profile } from '@/lib/app/services/database.types';
import { updateProfile, uploadAvatarImage } from '@/lib/app/services/profiles';

type Availability = NonNullable<Profile['availability']>;

const AVAILABILITY_OPTIONS: { label: string; value: Availability }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Busy', value: 'busy' },
  { label: 'On call', value: 'on_call' },
  { label: 'Offline', value: 'offline' },
];

export function EditProfileForm({ services: serviceOptions }: { services: ServiceOption[] }) {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const isProvider = profile?.role === 'provider';

  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [latitude, setLatitude] = useState<number | null | undefined>(profile?.latitude);
  const [longitude, setLongitude] = useState<number | null | undefined>(profile?.longitude);
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [services, setServices] = useState<string[]>(profile?.services ?? []);
  const [availability, setAvailability] = useState<Availability>(profile?.availability || 'available');
  const [businessName, setBusinessName] = useState(profile?.business_name ?? '');
  const [locating, setLocating] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickAvatar(file: File | undefined) {
    if (!file || !profile) return;
    setError(null);
    const uri = URL.createObjectURL(file);
    setUploadingAvatar(true);
    try {
      const uploaded = await uploadAvatarImage(profile.id, uri, file.type);
      setAvatarUrl(uploaded);
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload photo.');
    } finally {
      URL.revokeObjectURL(uri);
      setUploadingAvatar(false);
    }
  }

  function useMyLocation() {
    setLocError(null);
    if (!navigator.geolocation) return setLocError('Location is not available in this browser. Please type it in.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        let address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const addr = data?.address ?? {};
          const parts = [addr.road || addr.suburb, addr.city || addr.town || addr.county || addr.state].filter(Boolean);
          if (parts.length) address = parts.join(', ');
        } catch {
          // Fall back to coordinates.
        }
        setLocation(address);
        setLatitude(lat);
        setLongitude(lon);
        setLocating(false);
      },
      () => {
        setLocError('Could not fetch location automatically. Please type it in.');
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNameError(null);
    if (!name.trim()) return setNameError('Enter your name');
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        avatar_url: avatarUrl,
        name: name.trim(),
        phone: phone.trim() || null,
        location: location.trim() || null,
        latitude,
        longitude,
        bio: bio.trim() || null,
        services: isProvider ? services : (profile.services ?? []),
        service_radius_km: profile.service_radius_km ?? 20,
        availability,
        business_name: businessName.trim() || null,
      });
      await refreshProfile();
      router.push(routes.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="mx-auto max-w-[720px]">
      <PageHeader back={{ href: routes.profile, label: 'Profile' }} title={isProvider ? 'Edit your artisan profile' : 'Edit profile'} />

      <div className="space-y-6">
        <section className="card enter flex items-center gap-4 p-4">
          <Avatar src={avatarUrl} name={name || profile?.name} size={72} />
          <label className={`btn btn-ghost !h-10 cursor-pointer ${uploadingAvatar ? 'pointer-events-none opacity-60' : ''}`}>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pickAvatar(e.target.files?.[0])} />
            {uploadingAvatar ? <span className="spinner" aria-hidden="true" /> : <Icon name="camera" size={18} />}
            {uploadingAvatar ? 'Uploading photo…' : 'Change photo'}
          </label>
        </section>

        <Section title="Basic information">
          <div className="space-y-5">
            <Field label="Full name" htmlFor="name" error={nameError}>
              <input id="name" className="input !h-11" autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); setNameError(null); }} />
            </Field>
            <Field label="Phone number" htmlFor="phone" optional>
              <input id="phone" className="input !h-11" type="tel" autoComplete="tel" placeholder="+234 800 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label="Base location" htmlFor="location" error={locError}>
              <div className="flex gap-2">
                <input
                  id="location"
                  className="input !h-11 flex-1"
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    // Typed by hand: the old coordinates no longer describe it.
                    setLatitude(null);
                    setLongitude(null);
                  }}
                />
                <Button variant="ghost" icon="location" loading={locating} onClick={useMyLocation}>
                  <span className="hidden sm:inline">Use my location</span>
                </Button>
              </div>
            </Field>
          </div>
        </Section>

        {isProvider ? (
          <>
            <Section title="Professional profile">
              <div className="space-y-5">
                <Field label="Bio & service overview" htmlFor="bio">
                  <textarea id="bio" className="input min-h-[120px]" placeholder="Describe your services, skills, equipment, and experience…" value={bio} onChange={(e) => setBio(e.target.value)} />
                </Field>
                <div>
                  <p className="mb-3 text-[14px] font-semibold text-[var(--ink)]">What you do</p>
                  <ServicePicker value={services} onChange={setServices} options={serviceOptions} onLimit={setError} />
                </div>
                <fieldset>
                  <legend className="mb-2 text-[14px] font-semibold text-[var(--ink)]">Current availability</legend>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_OPTIONS.map((o) => (
                      <button key={o.value} type="button" aria-pressed={availability === o.value} className="chip" onClick={() => setAvailability(o.value)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </Section>
            <Section title="Business details">
              <Field label="Registered business name" htmlFor="business" optional>
                <input id="business" className="input !h-11" placeholder="e.g. Adaeze Plumbing Services Ltd" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </Field>
              <div className="mt-4">
                <Note icon="business">Add your payout bank account under Wallet → Bank account. We verify it with your bank before any withdrawal.</Note>
              </div>
            </Section>
          </>
        ) : (
          <Section title="About you">
            <Field label="Bio" htmlFor="bio" optional>
              <textarea id="bio" className="input min-h-[110px]" placeholder="Tell us about yourself…" value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
          </Section>
        )}

        <ErrorNote>{error}</ErrorNote>
        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving}>
            Save changes
          </Button>
        </div>
      </div>
    </form>
  );
}
