// These shapes match the real responses of the backend /admin/activity APIs

export type TrackEventType =
  | "page_view" | "click" | "scroll" | "visibility" | "devtools_suspected"
  | "error" | "copy" | "paste" | "right_click" | "rage_click" | "form_submit" | "custom";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserLite {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

export interface SessionRow {
  id: string;
  visitorId: string;
  clientSessionId: string;
  userId: string | null;
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  userAgent: string;
  screen: string | null;
  language: string | null;
  entryPath: string;
  referrer: string | null;
  isBot: boolean;
  eventCount: number;
  pageViewCount: number;
  devtoolsCount: number;
  startedAt: string;
  lastSeenAt: string;
  visitorType: "user" | "anonymous";
  user: UserLite | null;
}

export interface EventLite {
  id: number;
  type: TrackEventType;
  path: string;
  props: Record<string, unknown> | null;
  at: string;
}

export interface OnlineSession extends SessionRow {
  currentPath: string;
  lastEventType: TrackEventType | null;
  lastEventAt: string | null;
}

export interface OnlineData {
  windowMinutes: number;
  onlineCount: number;
  loggedIn: number;
  anonymous: number;
  sessions: OnlineSession[];
}

export interface TimelineData {
  session: SessionRow & { durationSeconds: number };
  typeCounts: Record<string, number>;
  eventsTruncated: boolean;
  events: EventLite[];
}

export interface ActivityTotals {
  sessionCount: number;
  totalEvents: number;
  totalPageViews: number;
  devtoolsSuspectedCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface IpRow {
  ip: string;
  country: string | null;
  city: string | null;
  sessions: number;
  lastSeen: string | null;
}

export interface DeviceRow {
  browser: string | null;
  os: string | null;
  device: string | null;
  sessions: number;
}

export interface ActivityInfo {
  summary: ActivityTotals;
  ips: IpRow[];
  devices: DeviceRow[];
}

export interface UserActivity extends ActivityInfo {
  user: UserLite;
  sessions: SessionRow[];
}

export interface VisitorActivity extends ActivityInfo {
  visitorId: string;
  linkedUsers: UserLite[];
  sessions: SessionRow[];
}

export interface IpActivity {
  ip: string;
  visitors: { visitorId: string; sessions: number; lastSeen: string | null }[];
  users: UserLite[];
  summary: ActivityTotals;
  devices: DeviceRow[];
  sessions: SessionRow[];
}

export interface EventRow extends EventLite {
  sessionId: string;
  session: {
    id: string;
    visitorId: string;
    userId: string | null;
    ip: string;
    country: string | null;
    city: string | null;
    isBot: boolean;
  };
  visitorType: "user" | "anonymous";
  user: UserLite | null;
}

export interface OverviewData {
  rangeDays: number;
  from: string;
  onlineNow: number;
  totals: {
    sessions: number;
    visitors: number;
    users: number;
    userSessions: number;
    anonymousSessions: number;
    devtoolsSessions: number;
    events: number;
    pageViews: number;
  };
  daily: { day: string; sessions: number; visitors: number }[];
  topCountries: { country: string; sessions: number }[];
  devices: { device: string; sessions: number }[];
  browsers: { browser: string; sessions: number }[];
}

export interface PageStatsData {
  rangeDays: number;
  from: string;
  pages: { path: string; views: number; clicks: number; visitors: number }[];
  topClicks: { path: string; selector: string | null; text: string | null; clicks: number }[];
  devtoolsByPath: { path: string; count: number }[];
}

// ----- filters (URL query -> API params) -----

export interface SessionFilters {
  page?: string;
  limit?: string;
  type?: string;
  country?: string;
  ip?: string;
  userId?: string;
  visitorId?: string;
  device?: string;
  devtools?: string;
  isBot?: string;
  from?: string;
  to?: string;
}

export interface EventFilters {
  page?: string;
  limit?: string;
  type?: string;
  path?: string;
  sessionId?: string;
  userId?: string;
  visitorId?: string;
  ip?: string;
  from?: string;
  to?: string;
}