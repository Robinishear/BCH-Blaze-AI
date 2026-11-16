import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TrackingService } from "./tracking.service";
import { getClientIp } from "./tracking.utils";

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

export const TrackingController = { ingest };