/** A `redirect` search param is only honoured when it is a path on this site. */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/')) return undefined
  // "//host" and "/\host" are read by browsers as another origin; control characters are never a path.
  if (value.startsWith('//') || value.startsWith('/\\') || [...value].some((c) => c.charCodeAt(0) < 32)) return undefined
  return value
}
