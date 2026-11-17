import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TrackingService } from "./tracking.service";
import { getClientIp } from "./tracking.utils";
import { eventsQuery, onlineQuery, pagesQuery, paginationQuery, sessionsQuery, statsQuery } from "./tracking.validation";

const ingest = catchAsync(async (req, res) => {
  await TrackingService.ingest({
    body: req.body,
    ip: getClientIp(req),
    userId: req.user?.userId ?? null,
    userAgent: req.get("user-agent") ?? "",
  });

  sendResponse(res, {
    httpStatusCode: status.ACCEPTED,
    success: true,
    message: "Accepted",
  });
});

//# TODO det

const online = catchAsync(async (req, res) => {
  const data = await TrackingService.getOnline(onlineQuery.parse(req.query));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Online visitors fetched",
    data,
  });
});

const sessions = catchAsync(async (req, res) => {
  const { data, meta } = await TrackingService.getSessions(
    sessionsQuery.parse(req.query),
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Sessions fetched",
    data,
    meta,
  });
});

const sessionTimeline = catchAsync(async (req, res) => {
  const data = await TrackingService.getSessionTimeline(req.params.id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Session timeline fetched",
    data,
  });
});

const userActivity = catchAsync(async (req, res) => {
  const { page, limit } = paginationQuery.parse(req.query);
  const { meta, ...data } = await TrackingService.getUserActivity(
    req.params.userId as string,
    page,
    limit,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User activity fetched",
    data,
    meta,
  });
});

const visitorActivity = catchAsync(async (req, res) => {
  const { page, limit } = paginationQuery.parse(req.query);
  const { meta, ...data } = await TrackingService.getVisitorActivity(
    req.params.visitorId as string,
    page,
    limit,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Visitor activity fetched",
    data,
    meta,
  });
});

const ipActivity = catchAsync(async (req, res) => {
  const { page, limit } = paginationQuery.parse(req.query);
  const { meta, ...data } = await TrackingService.getIpActivity(
    req.params.ip as string,
    page,
    limit,
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "IP activity fetched",
    data,
    meta,
  });
});

const events = catchAsync(async (req, res) => {
  const { data, meta } = await TrackingService.getEvents(eventsQuery.parse(req.query));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Events fetched",
    data,
    meta,
  });
});

const overview = catchAsync(async (req, res) => {
  const data = await TrackingService.getOverview(statsQuery.parse(req.query));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Overview fetched",
    data,
  });
});

const pageStats = catchAsync(async (req, res) => {
  const data = await TrackingService.getPageStats(pagesQuery.parse(req.query));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Page stats fetched",
    data,
  });
});

export const TrackingController = {
  ingest,
  online,
  sessions,
  sessionTimeline,
  userActivity,
  visitorActivity,
  ipActivity,
  events,
  overview,
  pageStats,
  };