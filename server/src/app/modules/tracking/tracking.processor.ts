import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { TrackJobData } from "./tracking.interface";
import {
  clampAt,
  isUniqueViolation,
  lookupGeo,
  parseUserAgent,
} from "./tracking.utils";

const findOrCreateSession = async (job: TrackJobData) => {
  const key = {
    visitorId_clientSessionId: {
      visitorId: job.visitorId,
      clientSessionId: job.sessionId,
    },
  };

  const existing = await prisma.trackSession.findUnique({ where: key });
  if (existing) return existing;

  const ua = parseUserAgent(job.userAgent);
  const geo = lookupGeo(job.ip);

  try {
    return await prisma.trackSession.create({
      data: {
        visitorId: job.visitorId,
        clientSessionId: job.sessionId,
        userId: job.userId,
        ip: job.ip,
        ...geo,
        timezone: geo.timezone ?? job.context?.timezone ?? null,
        ...ua,
        userAgent: job.userAgent.slice(0, 500),
        screen: job.context?.screen ?? null,
        language: job.context?.language ?? null,
        entryPath: job.events[0].path,
        referrer: job.context?.referrer ?? null,
        startedAt: new Date(job.receivedAt),
        lastSeenAt: new Date(job.receivedAt),
      },
    });
  } catch (e) {
    // If two jobs of the same new session run at once, one of them hits the unique constraint
    if (!isUniqueViolation(e)) throw e;
    return prisma.trackSession.findUniqueOrThrow({ where: key });
  }
};

// Used by both the queue worker and the direct-write fallback
export const processBatch = async (job: TrackJobData) => {
  const session = await findOrCreateSession(job);

  const rows = job.events.map((e) => ({
    sessionId: session.id,
    type: e.type,
    path: e.path,
    props: (e.props ?? undefined) as Prisma.InputJsonValue | undefined,
    at: clampAt(e.at, job.receivedAt),
  }));

  const pageViews = job.events.filter((e) => e.type === "page_view").length;
  const devtools = job.events.filter(
    (e) => e.type === "devtools_suspected",
  ).length;

  await prisma.$transaction([
    prisma.trackEvent.createMany({ data: rows }),
    prisma.trackSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: new Date(job.receivedAt),
        eventCount: { increment: rows.length },
        pageViewCount: { increment: pageViews },
        devtoolsCount: { increment: devtools },
        ...(job.userId && !session.userId ? { userId: job.userId } : {}),
      },
    }),
  ]);

  // Login detected: the earlier anonymous sessions of this browser are linked to the user
  if (job.userId) {
    await prisma.trackSession.updateMany({
      where: { visitorId: job.visitorId, userId: null },
      data: { userId: job.userId },
    });
  }
};