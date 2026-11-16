export const EVENT_TYPES = [
  "page_view",
  "click",
  "scroll",
  "visibility",
  "devtools_suspected",
  "error",
  "copy",
  "paste",
  "right_click",
  "rage_click",
  "form_submit",
  "custom",
] as const;

export const MAX_EVENTS_PER_BATCH = 50;
export const MAX_PROPS_BYTES = 2000;
export const MAX_CLOCK_SKEW_MS = 24 * 60 * 60_000;

export const ID_REGEX = /^[\w-]{16,64}$/;

export const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i;

export const TRACK_QUEUE_NAME = "track-events";
export const TRACK_WORKER_CONCURRENCY = 3;