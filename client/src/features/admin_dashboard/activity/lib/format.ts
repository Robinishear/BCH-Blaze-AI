import { EventLite, SessionRow } from "../_core/activity.types";

// Times are shown in this time zone
export const DISPLAY_TZ = "Asia/Dhaka";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TZ, day: "2-digit", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
});
const timeOnly = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});
const dayOnly = new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TZ, day: "2-digit", month: "short" });

export const formatDateTime = (iso?: string | null) => (iso ? dateTime.format(new Date(iso)) : "-");
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));
export const formatDay = (iso: string) => dayOnly.format(new Date(iso));

export const timeAgo = (iso?: string | null, now = Date.now()) => {
  if (!iso) return "-";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${seconds % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const countryFlag = (code?: string | null) =>
  code && /^[A-Z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)))
    : "🌐";

let regionNames: Intl.DisplayNames | null = null;
export const countryName = (code?: string | null) => {
  if (!code) return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

export const locationLabel = (s: { city?: string | null; country?: string | null }) =>
  s.country ? `${s.city ? `${s.city}, ` : ""}${countryName(s.country)}` : "Unknown location";

export const deviceLabel = (s: { browser?: string | null; os?: string | null; device?: string | null }) =>
  [s.browser, s.os, s.device].filter(Boolean).join(" · ") || "Unknown device";

export const shortId = (id: string) => id.slice(0, 8);

export const visitorLabel = (s: Pick<SessionRow, "user" | "visitorId">) =>
  s.user ? s.user.name || s.user.email : `Visitor ${shortId(s.visitorId)}`;

// A readable text for one event
export const describeEvent = (e: Pick<EventLite, "type" | "props">): { label: string; detail: string } => {
  const p = (e.props ?? {}) as Record<string, string | number | undefined>;
  const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
  switch (e.type) {
    case "page_view": return { label: "Page view", detail: s(p.title) };
    case "click": return { label: "Click", detail: s(p.text) || s(p.name) || s(p.selector) };
    case "rage_click": return { label: "Rage click", detail: `${s(p.selector)} ×${s(p.count)}` };
    case "scroll": return { label: "Scroll", detail: `${s(p.depth)}%` };
    case "visibility": return { label: "Tab", detail: s(p.state) };
    case "devtools_suspected": return { label: "DevTools suspected", detail: s(p.via) };
    case "error": return { label: "Error", detail: s(p.message) };
    case "copy": return { label: "Copy", detail: `${s(p.length)} chars` };
    case "paste": return { label: "Paste", detail: s(p.tag) };
    case "right_click": return { label: "Right click", detail: s(p.selector) };
    case "form_submit": return { label: "Form submit", detail: s(p.selector) };
    default: return { label: "Custom", detail: e.props ? JSON.stringify(e.props).slice(0, 120) : "" };
  }
};

// Which events are shown in a warning color
export const isAlertType = (t: string) =>
  t === "devtools_suspected" || t === "error" || t === "rage_click";