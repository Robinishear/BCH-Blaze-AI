import { httpClient } from "@/_core/axios/httpClient";
import {
  EventFilters,
  EventRow,
  IpActivity,
  OnlineData,
  OverviewData,
  PageMeta,
  PageStatsData,
  SessionFilters,
  SessionRow,
  TimelineData,
  UserActivity,
  VisitorActivity,
} from "./activity.types";

const BASE = "/track";

type Envelope<T> = { data: T; meta?: PageMeta };
export type Paged<T> = { items: T; meta: PageMeta };

const EMPTY_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 1 };

// Empty values are not sent to the API
const clean = (params?: Record<string, unknown>) =>
  params
    ? Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
      )
    : undefined;

const get = async <T>(path: string, params?: Record<string, unknown>) =>
  (await httpClient.get<T>(`${BASE}${path}`, { params: clean(params) })) as unknown as Envelope<T>;

export const getOnline = async (params?: { minutes?: number; includeBots?: boolean }) =>
  (await get<OnlineData>("/online", params)).data;

export const getSessions = async (filters: SessionFilters): Promise<Paged<SessionRow[]>> => {
  const r = await get<SessionRow[]>("/sessions", { ...filters });
  return { items: r.data ?? [], meta: r.meta ?? EMPTY_META };
};

export const getSessionTimeline = async (id: string) =>
  (await get<TimelineData>(`/sessions/${encodeURIComponent(id)}`)).data;

export const getUserActivity = async (userId: string, params?: { page?: string; limit?: string }) => {
  const r = await get<UserActivity>(`/users/${encodeURIComponent(userId)}`, params);
  return { ...r.data, meta: r.meta ?? EMPTY_META };
};

export const getVisitorActivity = async (visitorId: string, params?: { page?: string; limit?: string }) => {
  const r = await get<VisitorActivity>(`/visitors/${encodeURIComponent(visitorId)}`, params);
  return { ...r.data, meta: r.meta ?? EMPTY_META };
};

export const getIpActivity = async (ip: string, params?: { page?: string; limit?: string }) => {
  const r = await get<IpActivity>(`/ips/${encodeURIComponent(ip)}`, params);
  return { ...r.data, meta: r.meta ?? EMPTY_META };
};

export const getEvents = async (filters: EventFilters): Promise<Paged<EventRow[]>> => {
  const r = await get<EventRow[]>("/events", { ...filters });
  return { items: r.data ?? [], meta: r.meta ?? EMPTY_META };
};

export const getOverview = async (params?: { days?: number; includeBots?: boolean }) =>
  (await get<OverviewData>("/stats/overview", params)).data;

export const getPageStats = async (params?: { days?: number; limit?: number; includeBots?: boolean }) =>
  (await get<PageStatsData>("/stats/pages", params)).data;