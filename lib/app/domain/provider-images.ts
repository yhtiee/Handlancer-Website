// Ported from Handlancer-Mobile-Application/src/lib/provider-images.ts @ 8968d5c — keep the diff minimal so later syncs stay easy.
/**
 * Deterministic placeholder photos for providers that have no `avatar_url`.
 *
 * We theme the image to the Nigerian artisan scenario by tagging the request
 * with the provider's primary skill. LoremFlickr returns a real (Flickr-sourced)
 * photo per tag set, and the `lock` seed — derived from the provider id — keeps
 * the same provider showing the same photo across renders. Swap the base URL for
 * a self-hosted asset set later without touching call sites.
 */

/** Maps free-text skills onto a tag LoremFlickr is likely to have photos for. */
const SKILL_KEYWORDS: Record<string, string> = {
  plumber: 'plumber',
  plumbing: 'plumber',
  electrician: 'electrician',
  electrical: 'electrician',
  carpenter: 'carpenter',
  carpentry: 'carpenter',
  mechanic: 'mechanic',
  painter: 'painter',
  painting: 'painter',
  cleaner: 'cleaning',
  cleaning: 'cleaning',
  tailor: 'tailor',
  fashion: 'tailor',
  barber: 'barber',
  hairdresser: 'hairdresser',
  hair: 'hairdresser',
  mason: 'bricklayer',
  bricklayer: 'bricklayer',
  welder: 'welder',
  driver: 'driver',
  cook: 'chef',
  chef: 'chef',
  catering: 'chef',
  gardener: 'gardener',
  farmer: 'farmer',
  general: 'general'
};
const SKILL_IMAGES: Record<string, string> = {
  plumber: '/app/providers/plumber.webp',
  electrician: '/app/providers/electrician.webp',
  carpenter: '/app/providers/carpenter.webp',
  mechanic: '/app/providers/mechanic.webp',
  painter: '/app/providers/painter.webp',
  cleaning: '/app/providers/cleaning.webp',
  tailor: '/app/providers/tailor.webp',
  barber: '/app/providers/barber.webp',
  hairdresser: '/app/providers/hairdresser.webp',
  bricklayer: '/app/providers/bricklayer.webp',
  welder: '/app/providers/welder.webp',
  driver: '/app/providers/driver.webp',
  chef: '/app/providers/chef.webp',
  gardener: '/app/providers/gardener.webp',
  farmer: '/app/providers/farmer.webp',
  general: '/app/providers/general.webp',
  artisan: '/app/providers/artisan.webp',
};

/**
 * Returns a stable, skill-themed placeholder image URL or local asset for a provider.
 * Use only when `provider.avatar_url` is missing.
 */
export function providerImageFallback(provider: { id: string; services?: string[] | null }): string {
  const skill = provider.services?.[0]?.toLowerCase().trim() ?? 'general';
  const keyword = SKILL_KEYWORDS[skill] ?? 'artisan';
  return SKILL_IMAGES[keyword] ?? SKILL_IMAGES['artisan'];
}

/** A workshop photo for each service category, from the same shoot as the provider photos. */
const CATEGORY_PHOTO: Record<string, string> = {
  plumbing: 'plumber',
  electrical: 'electrician',
  carpentry: 'carpenter',
  painting: 'painter',
  cleaning: 'cleaning',
  appliance: 'mechanic',
  masonry: 'bricklayer',
  ac: 'general',
  auto: 'mechanic',
  gardening: 'gardener',
  moving: 'driver',
  other: 'artisan',
};

export function categoryPhoto(categoryId: string): string {
  return SKILL_IMAGES[CATEGORY_PHOTO[categoryId] ?? 'artisan'] ?? SKILL_IMAGES['artisan'];
}
