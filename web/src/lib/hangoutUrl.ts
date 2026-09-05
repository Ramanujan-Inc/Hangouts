/**
 * Utility functions for clean, compact hangout URLs using short IDs.
 */

export function getHangoutShortId(hangout?: { id?: string; short_id?: string | null } | null): string {
  if (!hangout) return ''
  if (hangout.short_id) return hangout.short_id
  if (hangout.id) {
    return hangout.id.length > 8 ? hangout.id.slice(0, 8) : hangout.id
  }
  return ''
}

export function getHangoutUrl(hangout?: { id?: string; short_id?: string | null } | null): string {
  const shortId = getHangoutShortId(hangout)
  return shortId ? `/hangout/${shortId}` : '/timeline'
}
