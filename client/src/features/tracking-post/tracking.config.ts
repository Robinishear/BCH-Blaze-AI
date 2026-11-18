const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export const TRACKING_CONFIG = {
  endpoint: `${API_BASE}/track`,
  enabled: Boolean(API_BASE),

  excludedPathPrefixes: ["/admin-dashboard"],

  flushIntervalMs: 5_000,
  maxBatch: 20,
  maxQueue: 200,
  maxEventsPerPage: 300,
  maxPropsChars: 1_500,

  sessionIdleMs: 30 * 60_000,

  scrollMarks: [25, 50, 75, 100],
  clickTextMax: 50,
  rageClickCount: 4,
  rageClickWindowMs: 1_500,
  rageClickRadiusPx: 30,
  maxErrorsPerPage: 10,

  devtoolsCheckMs: 2_000,
  devtoolsWidthPx: 160,
  devtoolsHeightPx: 260,
} as const;