export const ACTIVITY_BASE = "/admin-dashboard/activity";

export const activityPaths = {
  overview: ACTIVITY_BASE,
  online: `${ACTIVITY_BASE}/online`,
  sessions: `${ACTIVITY_BASE}/sessions`,
  events: `${ACTIVITY_BASE}/events`,
  pages: `${ACTIVITY_BASE}/pages`,
  session: (id: string) => `${ACTIVITY_BASE}/sessions/${encodeURIComponent(id)}`,
  user: (id: string) => `${ACTIVITY_BASE}/users/${encodeURIComponent(id)}`,
  visitor: (id: string) => `${ACTIVITY_BASE}/visitors/${encodeURIComponent(id)}`,
  ip: (ip: string) => `${ACTIVITY_BASE}/ips/${encodeURIComponent(ip)}`,
};