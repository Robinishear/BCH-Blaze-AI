import z from "zod";
import { Prisma } from "../../../generated/prisma";
import { getTrackQueue } from "../../../queues/tracking.queue";
import AppError from "../../error-helpers/AppError";
import { prisma } from "../../lib/prisma";
import { DAY_MS, EventsQuery, MAX_TIMELINE_EVENTS, SessionsQuery } from "./tracking.constants";
import { IngestInput, TrackJobData } from "./tracking.interface";
import { processBatch } from "./tracking.processor";
import { onlineQuery, pagesQuery, statsQuery } from "./tracking.validation";
import status from "http-status";

const ingest = async ({ body, ip, userId, userAgent }: IngestInput) => {
  const job: TrackJobData = {
    visitorId: body.visitorId,
    sessionId: body.sessionId,
    userId,
    ip,
    userAgent,
    context: body.context,
    events: body.events,
    receivedAt: Date.now(),
  };

  const queue = getTrackQueue();
  if (queue) {
    try {
      await queue.add("batch", job);
      return;
    } catch (e) {
      console.error("[track] queue unavailable, writing directly:", (e as Error).message);
    }
  }

  void processBatch(job).catch((e) =>
    console.error("[track] direct write failed:", (e as Error).message),
  );
};

//# TODO get
const makeMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// BigInt (from raw SQL COUNT/SUM) cannot go into JSON, so it is converted to a Number
const toNum = (row: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v]),
  );

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
} as const;

// TrackSession has no relation with User (so that tracking never blocks user deletion), hence it is joined here
const attachUsers = async <T extends { userId: string | null }>(rows: T[]) => {
  const ids = [
    ...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x)),
  ];
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: ids } },
        select: USER_SELECT,
      })
    : [];
  const map = new Map(users.map((u) => [u.id, u]));
  return rows.map((r) => ({
    ...r,
    visitorType: r.userId ? ("user" as const) : ("anonymous" as const),
    user: r.userId ? (map.get(r.userId) ?? null) : null,
  }));
};

const botWhere = (includeBots: boolean): Prisma.TrackSessionWhereInput =>
  includeBots ? {} : { isBot: false };

const buildSessionWhere = (q: SessionsQuery): Prisma.TrackSessionWhereInput => ({
  ...(q.type === "user" ? { userId: { not: null } } : {}),
  ...(q.type === "anonymous" ? { userId: null } : {}),
  ...(q.userId ? { userId: q.userId } : {}),
  ...(q.visitorId ? { visitorId: q.visitorId } : {}),
  ...(q.ip ? { ip: q.ip } : {}),
  ...(q.country ? { country: q.country.toUpperCase() } : {}),
  ...(q.device ? { device: q.device } : {}),
  ...(q.devtools === true ? { devtoolsCount: { gt: 0 } } : {}),
  ...(q.devtools === false ? { devtoolsCount: 0 } : {}),
  ...(q.isBot !== undefined ? { isBot: q.isBot } : {}),
  ...(q.from || q.to
    ? { startedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
    : {}),
});

const listSessions = async (
  where: Prisma.TrackSessionWhereInput,
  page: number,
  limit: number,
) => {
  const [rows, total] = await Promise.all([
    prisma.trackSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.trackSession.count({ where }),
  ]);
  return { data: await attachUsers(rows), meta: makeMeta(page, limit, total) };
};

// The common summary of a user, visitor or IP: totals, IP list, device list
const summarize = async (where: Prisma.TrackSessionWhereInput) => {
  const [agg, ips, devices] = await Promise.all([
    prisma.trackSession.aggregate({
      where,
      _count: { _all: true },
      _sum: { eventCount: true, pageViewCount: true, devtoolsCount: true },
      _min: { startedAt: true },
      _max: { lastSeenAt: true },
    }),
    prisma.trackSession.groupBy({
      by: ["ip", "country", "city"],
      where,
      _count: { _all: true },
      _max: { lastSeenAt: true },
      orderBy: { _max: { lastSeenAt: "desc" } },
      take: 50,
    }),
    prisma.trackSession.groupBy({
      by: ["browser", "os", "device"],
      where,
      _count: { _all: true },
      orderBy: { _count: { browser: "desc" } },
      take: 20,
    }),
  ]);

  return {
    summary: {
      sessionCount: agg._count._all, // how many times the browser was opened
      totalEvents: agg._sum.eventCount ?? 0,
      totalPageViews: agg._sum.pageViewCount ?? 0,
      devtoolsSuspectedCount: agg._sum.devtoolsCount ?? 0,
      firstSeen: agg._min.startedAt,
      lastSeen: agg._max.lastSeenAt,
    },
    ips: ips.map((i) => ({
      ip: i.ip,
      country: i.country,
      city: i.city,
      sessions: i._count._all,
      lastSeen: i._max.lastSeenAt,
    })),
    devices: devices.map((d) => ({
      browser: d.browser,
      os: d.os,
      device: d.device,
      sessions: d._count._all,
    })),
  };
};

// ---------- 2. online ----------

const getOnline = async (q: z.infer<typeof onlineQuery>) => {
  const since = new Date(Date.now() - q.minutes * 60_000);
  const sessions = await prisma.trackSession.findMany({
    where: { lastSeenAt: { gte: since }, ...botWhere(q.includeBots) },
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });

  const lastEvents = sessions.length
    ? await prisma.trackEvent.findMany({
        where: {
          sessionId: { in: sessions.map((s) => s.id) },
          at: { gte: new Date(since.getTime() - 10 * 60_000) },
        },
        orderBy: { at: "desc" },
        distinct: ["sessionId"],
        select: { sessionId: true, type: true, path: true, at: true },
      })
    : [];
  const lastMap = new Map(lastEvents.map((e) => [e.sessionId, e]));

  const rows = (await attachUsers(sessions)).map((s) => ({
    ...s,
    currentPath: lastMap.get(s.id)?.path ?? s.entryPath,
    lastEventType: lastMap.get(s.id)?.type ?? null,
    lastEventAt: lastMap.get(s.id)?.at ?? null,
  }));

  return {
    windowMinutes: q.minutes,
    onlineCount: rows.length,
    loggedIn: rows.filter((r) => r.userId).length,
    anonymous: rows.filter((r) => !r.userId).length,
    sessions: rows,
  };
};

// ---------- 3. sessions list ----------

const getSessions = (q: SessionsQuery) =>
  listSessions(buildSessionWhere(q), q.page, q.limit);

// ---------- 4. session timeline ----------

const getSessionTimeline = async (id: string) => {
  const session = await prisma.trackSession.findUnique({ where: { id } });
  if (!session) throw new AppError(status.NOT_FOUND, "Session not found");

  const [events, typeCounts, [withUser]] = await Promise.all([
    prisma.trackEvent.findMany({
      where: { sessionId: id },
      orderBy: { at: "asc" },
      take: MAX_TIMELINE_EVENTS,
      select: { id: true, type: true, path: true, props: true, at: true },
    }),
    prisma.trackEvent.groupBy({
      by: ["type"],
      where: { sessionId: id },
      _count: { _all: true },
    }),
    attachUsers([session]),
  ]);

  return {
    session: {
      ...withUser,
      durationSeconds: Math.round(
        (session.lastSeenAt.getTime() - session.startedAt.getTime()) / 1000,
      ),
    },
    typeCounts: Object.fromEntries(typeCounts.map((t) => [t.type, t._count._all])),
    eventsTruncated: session.eventCount > MAX_TIMELINE_EVENTS,
    events,
  };
};

// ---------- 5. one user ----------

const getUserActivity = async (userId: string, page: number, limit: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const where = { userId };
  const [info, sessions] = await Promise.all([
    summarize(where),
    listSessions(where, page, limit),
  ]);
  return { user, ...info, sessions: sessions.data, meta: sessions.meta };
};

// ---------- 6. one anonymous visitor / browser ----------

const getVisitorActivity = async (visitorId: string, page: number, limit: number) => {
  const where = { visitorId };
  const exists = await prisma.trackSession.count({ where });
  if (!exists) throw new AppError(status.NOT_FOUND, "Visitor not found");

  const [info, sessions, linked] = await Promise.all([
    summarize(where),
    listSessions(where, page, limit),
    prisma.trackSession.groupBy({
      by: ["userId"],
      where: { visitorId, userId: { not: null } },
    }),
  ]);

  const users = linked.length
    ? await prisma.user.findMany({
        where: { id: { in: linked.map((l) => l.userId as string) } },
        select: USER_SELECT,
      })
    : [];

  return { visitorId, linkedUsers: users, ...info, sessions: sessions.data, meta: sessions.meta };
};

// ---------- 7. one IP ----------

const getIpActivity = async (ip: string, page: number, limit: number) => {
  const where = { ip };
  const exists = await prisma.trackSession.count({ where });
  if (!exists) throw new AppError(status.NOT_FOUND, "No activity from this IP");

  const [info, sessions, visitors, linked] = await Promise.all([
    summarize(where),
    listSessions(where, page, limit),
    prisma.trackSession.groupBy({
      by: ["visitorId"],
      where,
      _count: { _all: true },
      _max: { lastSeenAt: true },
      orderBy: { _max: { lastSeenAt: "desc" } },
      take: 50,
    }),
    prisma.trackSession.groupBy({
      by: ["userId"],
      where: { ip, userId: { not: null } },
    }),
  ]);

  const users = linked.length
    ? await prisma.user.findMany({
        where: { id: { in: linked.map((l) => l.userId as string) } },
        select: USER_SELECT,
      })
    : [];

  return {
    ip,
    visitors: visitors.map((v) => ({
      visitorId: v.visitorId,
      sessions: v._count._all,
      lastSeen: v._max.lastSeenAt,
    })),
    users,
    summary: info.summary,
    devices: info.devices,
    sessions: sessions.data,
    meta: sessions.meta,
  };
};

// ---------- 8. raw event feed ----------

const getEvents = async (q: EventsQuery) => {
  const sessionFilter: Prisma.TrackSessionWhereInput = {
    ...(q.userId ? { userId: q.userId } : {}),
    ...(q.visitorId ? { visitorId: q.visitorId } : {}),
    ...(q.ip ? { ip: q.ip } : {}),
  };

  const where: Prisma.TrackEventWhereInput = {
    ...(q.type ? { type: q.type } : {}),
    ...(q.path ? { path: { contains: q.path, mode: "insensitive" } } : {}),
    ...(q.sessionId ? { sessionId: q.sessionId } : {}),
    ...(Object.keys(sessionFilter).length ? { session: { is: sessionFilter } } : {}),
    ...(q.from || q.to
      ? { at: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.trackEvent.findMany({
      where,
      orderBy: { at: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        session: {
          select: {
            id: true,
            visitorId: true,
            userId: true,
            ip: true,
            country: true,
            city: true,
            isBot: true,
          },
        },
      },
    }),
    prisma.trackEvent.count({ where }),
  ]);

  const withUsers = await attachUsers(
    rows.map((r) => ({ ...r, userId: r.session.userId })),
  );

  return {
    data: withUsers.map(({ userId: _u, ...rest }) => rest),
    meta: makeMeta(q.page, q.limit, total),
  };
};

// ---------- 9. stats ----------

const getOverview = async (q: z.infer<typeof statsQuery>) => {
  const from = new Date(Date.now() - q.days * DAY_MS);
  const onlineSince = new Date(Date.now() - 5 * 60_000);
  const bot = q.includeBots ? Prisma.empty : Prisma.sql`AND "isBot" = false`;
  const where: Prisma.TrackSessionWhereInput = {
    startedAt: { gte: from },
    ...botWhere(q.includeBots),
  };

  const [totals, daily, onlineNow, countries, devices, browsers] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT COUNT(*) AS sessions,
             COUNT(DISTINCT "visitorId") AS visitors,
             COUNT(DISTINCT "userId") AS users,
             COUNT(*) FILTER (WHERE "userId" IS NOT NULL) AS "userSessions",
             COUNT(*) FILTER (WHERE "userId" IS NULL) AS "anonymousSessions",
             COUNT(*) FILTER (WHERE "devtoolsCount" > 0) AS "devtoolsSessions",
             COALESCE(SUM("eventCount"), 0) AS events,
             COALESCE(SUM("pageViewCount"), 0) AS "pageViews"
      FROM track_session
      WHERE "startedAt" >= ${from} ${bot}`),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT date_trunc('day', "startedAt") AS day,
             COUNT(*) AS sessions,
             COUNT(DISTINCT "visitorId") AS visitors
      FROM track_session
      WHERE "startedAt" >= ${from} ${bot}
      GROUP BY 1 ORDER BY 1`),
    prisma.trackSession.count({
      where: { lastSeenAt: { gte: onlineSince }, ...botWhere(q.includeBots) },
    }),
    prisma.trackSession.groupBy({
      by: ["country"],
      where,
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.trackSession.groupBy({
      by: ["device"],
      where,
      _count: { _all: true },
      orderBy: { _count: { device: "desc" } },
      take: 5,
    }),
    prisma.trackSession.groupBy({
      by: ["browser"],
      where,
      _count: { _all: true },
      orderBy: { _count: { browser: "desc" } },
      take: 5,
    }),
  ]);

  return {
    rangeDays: q.days,
    from,
    onlineNow,
    totals: toNum(totals[0] ?? {}),
    daily: daily.map((d) => toNum(d)),
    topCountries: countries.map((c) => ({ country: c.country ?? "Unknown", sessions: c._count._all })),
    devices: devices.map((d) => ({ device: d.device ?? "Unknown", sessions: d._count._all })),
    browsers: browsers.map((b) => ({ browser: b.browser ?? "Unknown", sessions: b._count._all })),
  };
};

const getPageStats = async (q: z.infer<typeof pagesQuery>) => {
  const from = new Date(Date.now() - q.days * DAY_MS);
  const bot = q.includeBots ? Prisma.empty : Prisma.sql`AND s."isBot" = false`;

  const [pages, clicks, devtools] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT e.path,
             COUNT(*) FILTER (WHERE e.type = 'page_view') AS views,
             COUNT(*) FILTER (WHERE e.type = 'click') AS clicks,
             COUNT(DISTINCT s."visitorId") AS visitors
      FROM track_event e
      JOIN track_session s ON s.id = e."sessionId"
      WHERE e.at >= ${from} ${bot}
      GROUP BY e.path
      ORDER BY views DESC
      LIMIT ${q.limit}`),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT e.path,
             e.props->>'selector' AS selector,
             e.props->>'text' AS text,
             COUNT(*) AS clicks
      FROM track_event e
      JOIN track_session s ON s.id = e."sessionId"
      WHERE e.type = 'click' AND e.at >= ${from} ${bot}
      GROUP BY 1, 2, 3
      ORDER BY clicks DESC
      LIMIT ${q.limit}`),
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT e.path, COUNT(*) AS count
      FROM track_event e
      JOIN track_session s ON s.id = e."sessionId"
      WHERE e.type = 'devtools_suspected' AND e.at >= ${from} ${bot}
      GROUP BY e.path
      ORDER BY count DESC
      LIMIT ${q.limit}`),
  ]);

  return {
    rangeDays: q.days,
    from,
    pages: pages.map((p) => toNum(p)),
    topClicks: clicks.map((c) => toNum(c)),
    devtoolsByPath: devtools.map((d) => toNum(d)),
  };
};

export const TrackingService = {
  ingest,
  getOnline,
  getSessions,
  getSessionTimeline,
  getUserActivity,
  getVisitorActivity,
  getIpActivity,
  getEvents,
  getOverview,
  getPageStats, 
  };