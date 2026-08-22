import type { JsonLdGraph } from '@/lib/schema';

/**
 * Renders one JSON-LD graph as a script tag.
 *
 * The payload is built entirely from our own typed builders — no user input
 * ever reaches it — so `dangerouslySetInnerHTML` is the correct escape hatch
 * here. `<` is still escaped so a string containing `</script>` cannot break
 * out of the tag.
 */
export function JsonLd({ graph }: { graph: JsonLdGraph }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
    />
  );
}
