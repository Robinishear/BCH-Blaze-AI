import { getTrackQueue } from "../../../queues/tracking.queue";
import { IngestInput, TrackJobData } from "./tracking.interface";
import { processBatch } from "./tracking.processor";

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

export const TrackingService = { ingest };