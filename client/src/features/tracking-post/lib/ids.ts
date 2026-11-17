import { TRACKING_CONFIG as C } from "../tracking.config";

const VISITOR_KEY = "trk_vid";
const SESSION_KEY = "trk_sess";

// If localStorage is blocked (private mode etc.), it falls back to memory
const memory = new Map<string, string>();

export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  set(key: string, value: string) {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};

// The backend accepts only ids matching /^[\w-]{16,64}$/
const newId = (): string => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  let s = "";
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
};

// For every browser: the same id every time
export const getVisitorId = (): string => {
  let id = storage.get(VISITOR_KEY);
  if (!id || !/^[\w-]{16,64}$/.test(id)) {
    id = newId();
    storage.set(VISITOR_KEY, id);
  }
  return id;
};

interface SessionState {
  id: string;
  last: number;
}

let cached: SessionState | null = null;
let lastWrite = 0;

const readSession = (): SessionState | null => {
  try {
    const raw = storage.get(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionState;
    return s && typeof s.id === "string" && typeof s.last === "number" ? s : null;
  } catch {
    return null;
  }
};

// Called on every activity: after 30 minutes of inactivity a new session starts
export const touchSession = (): string => {
  const now = Date.now();
  let s = cached ?? readSession();

  if (!s || now - s.last > C.sessionIdleMs || !/^[\w-]{16,64}$/.test(s.id)) {
    s = { id: newId(), last: now };
    lastWrite = 0;
  } else {
    s = { id: s.id, last: now };
  }

  cached = s;
  // localStorage is written at most once every 10 seconds
  if (now - lastWrite > 10_000) {
    storage.set(SESSION_KEY, JSON.stringify(s));
    lastWrite = now;
  }
  return s.id;
};

export const getSessionId = (): string => cached?.id ?? touchSession();

export const isTrackingAllowed = (): boolean => storage.get("trk_consent") !== "denied";