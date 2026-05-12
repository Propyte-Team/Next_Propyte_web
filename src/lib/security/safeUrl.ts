/**
 * Reject any URL that isn't http(s). Blocks javascript:, data:, vbscript:, etc.
 * Returns null when the input is empty or fails the protocol allowlist —
 * callers should treat null as "do not render this link".
 */
export function safeExternalUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    // Treat protocol-relative or scheme-less input as https:// for convenience
    // (admin editors often paste "www.example.com").
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
      try {
        return new URL(`https://${trimmed.replace(/^\/\//, '')}`).toString();
      } catch {
        return null;
      }
    }
    return null;
  }
}
