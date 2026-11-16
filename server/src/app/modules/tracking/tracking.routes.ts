import express, { NextFunction, Request, Response, Router } from "express";
import status from "http-status";
import AppError from "../../error-helpers/AppError";
import { validateRequest } from "../../middleware/validateRequest";
import { TrackingController } from "./tracking.controller";
import { trackBatchSchema } from "./tracking.validation";
import { trackLimiter } from "../../config/rate-limit";
import { optionalAuth } from "../../lib/optionalAuth";

const router = Router();

// navigator.sendBeacon sends text/plain: it is parsed as JSON here (so no CORS preflight is needed either)
const parseBeaconBody = (req: Request, _res: Response, next: NextFunction) => {
  if (typeof req.body === "string") {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      return next(new AppError(status.BAD_REQUEST, "Invalid JSON body."));
    }
  }
  next();
};

router.post(
  "/",
  trackLimiter,
  express.text({ type: "text/plain", limit: "64kb" }),
  parseBeaconBody,
  optionalAuth,
  validateRequest(trackBatchSchema),
  TrackingController.ingest,
);

export const TrackingRoutes = router;