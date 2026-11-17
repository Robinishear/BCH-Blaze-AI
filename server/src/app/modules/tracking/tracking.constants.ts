import z from "zod";
import { eventsQuery, sessionsQuery } from "./tracking.validation";
import { envVars } from "../../config/env";

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



export const MAX_TIMELINE_EVENTS = 2000;
export const DAY_MS = 24 * 60 * 60_000;
export type SessionsQuery = z.infer<typeof sessionsQuery>;
export type EventsQuery = z.infer<typeof eventsQuery>;


export const hasRedis = () => {
  const url = envVars.REDIS_URL?.trim();
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "redis:" || protocol === "rediss:";
  } catch {
    return false;
  }
};

const base = () => {
  const u = new URL(envVars.REDIS_URL);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    db: u.pathname.length > 1 ? Number(u.pathname.slice(1)) : undefined,
    ...(u.protocol === "rediss:" ? { tls: {} } : {}),
  };
};

export const queueConnection = () => ({ ...base(), enableOfflineQueue: false });

export const workerConnection = () => ({ ...base(), maxRetriesPerRequest: null });