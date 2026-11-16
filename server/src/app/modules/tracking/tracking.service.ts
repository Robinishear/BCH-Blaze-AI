import { getTrackQueue } from "../../../queues/track.queue";
import { TrackJobData } from "./tracking.interface";
import { processBatch } from "./tracking.processor";
import { TrackBatchBody } from "./tracking.validation";

interface IngestInput {
  body: TrackBatchBody;
  ip: string;
  userId: string | null;
  userAgent: string;
}

// The request is not held up: first the job goes to the queue, and if the queue is unavailable it is written directly to the DB.
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