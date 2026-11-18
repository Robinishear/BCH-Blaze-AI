export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Picks only the allowed keys from the URL query
export const pickParams = <K extends string>(sp: RawSearchParams, keys: readonly K[]) => {
  const out: Partial<Record<K, string>> = {};
  for (const k of keys) {
    const v = first(sp[k])?.trim();
    if (v) out[k] = v;
  }
  return out;
};

// The date input gives "2026-11-18": the end date should include that whole day
export const withEndOfDay = <T extends { to?: string }>(f: T): T =>
  f.to && f.to.length === 10 ? { ...f, to: `${f.to}T23:59:59.999Z` } : f;

export const SESSION_FILTER_KEYS = [
  "page", "type", "country", "ip", "userId", "visitorId", "device", "devtools", "isBot", "from", "to",
] as const;

export const EVENT_FILTER_KEYS = [
  "page", "type", "path", "sessionId", "userId", "visitorId", "ip", "from", "to",
] as const;