import { TRACKING_CONFIG as C } from "../tracking.config";
import { TrackContext, TrackEvent, TrackEventType, TrackProps } from "../tracking.types";
import { getSessionId, getVisitorId, isTrackingAllowed, touchSession } from "./ids";
import { sendBatch } from "./sender";
import { trunc } from "./utils";

let buffer: TrackEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let pageEventCount = 0;
let context: TrackContext | null = null;

export const isExcluded = (path: string) =>
  C.excludedPathPrefixes.some((p) => path === p || path.startsWith(`${p}/`));

// Resets the per-page limit when a new page starts
export const resetPageCounter = () => {
  pageEventCount = 0;
};

// Long text is trimmed, and if props are still too big they are dropped (the backend limit is 2000)
const sanitizeProps = (props?: TrackProps): TrackProps | undefined => {
  if (!props) return undefined;
  const out: TrackProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    out[k] = typeof v === "string" ? trunc(v, 200) : v;
  }
  return JSON.stringify(out).length > C.maxPropsChars ? undefined : out;
};

const getContext = (): TrackContext => {
  if (context) return context;
  let timezone: string | undefined;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    /* ignore */
  }
  context = {
    referrer: document.referrer ? trunc(document.referrer.split(/[?#]/)[0], 500) : undefined,
    screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
    language: trunc(navigator.language ?? "", 20) || undefined,
    timezone: timezone ? trunc(timezone, 60) : undefined,
  };
  return context;
};

export const flush = (): void => {
  try {
    if (timer) clearTimeout(timer);
    timer = null;
    while (buffer.length) {
      const events = buffer.splice(0, C.maxBatch);
      sendBatch({
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        context: getContext(),
        events,
      });
    }
  } catch {
    /* ignore */
  }
};

// The only way to add an event. If anything goes wrong inside, it is swallowed silently.
export const track = (type: TrackEventType, props?: TrackProps, at: number = Date.now()): void => {
  try {
    if (!C.enabled || typeof window === "undefined" || !isTrackingAllowed()) return;

    const path = trunc(window.location.pathname || "/", 300);
    if (isExcluded(path)) return;
    if (type !== "page_view" && pageEventCount >= C.maxEventsPerPage) return;
    pageEventCount++;

    touchSession();
    buffer.push({ type, path, at, props: sanitizeProps(props) });
    if (buffer.length > C.maxQueue) buffer.splice(0, buffer.length - C.maxQueue);

    if (buffer.length >= C.maxBatch) flush();
    else if (!timer) timer = setTimeout(flush, C.flushIntervalMs);
  } catch {
    /* ignore */
  }
};