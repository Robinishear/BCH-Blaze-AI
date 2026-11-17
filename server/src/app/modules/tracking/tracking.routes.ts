import express, { NextFunction, Request, Response, Router } from "express";
import status from "http-status";
import AppError from "../../error-helpers/AppError";
import { validateRequest } from "../../middleware/validateRequest";
import { TrackingController } from "./tracking.controller";
import { trackBatchSchema } from "./tracking.validation";
import { trackLimiter } from "../../config/rate-limit";
import { optionalAuth } from "../../lib/tracking-auth";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma";

const router = Router();

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

router.get("/online",checkAuth(Role.ADMIN), TrackingController.online);
router.get("/sessions", checkAuth(Role.ADMIN), TrackingController.sessions);
router.get("/sessions/:id", checkAuth(Role.ADMIN),TrackingController.sessionTimeline);
router.get("/users/:userId",checkAuth(Role.ADMIN), TrackingController.userActivity);
router.get("/visitors/:visitorId", checkAuth(Role.ADMIN),TrackingController.visitorActivity);
router.get("/ips/:ip", checkAuth(Role.ADMIN),TrackingController.ipActivity);
router.get("/events", checkAuth(Role.ADMIN),TrackingController.events);
router.get("/stats/overview", checkAuth(Role.ADMIN),TrackingController.overview);
router.get("/stats/pages", checkAuth(Role.ADMIN),TrackingController.pageStats);

export const TrackingRoutes = router;