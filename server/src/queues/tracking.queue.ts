import { Queue } from "bullmq";
import { TRACK_QUEUE_NAME } from "../app/modules/tracking/tracking.constants";
import { TrackJobData } from "../app/modules/tracking/tracking.interface";
import { hasRedis, queueConnection } from "./tracking.connection";


let queue: Queue<TrackJobData> | null = null;

export const getTrackQueue = (): Queue<TrackJobData> | null => {
  if (!hasRedis()) return null;
  if (!queue) {
    queue = new Queue<TrackJobData>(TRACK_QUEUE_NAME, {
      connection: queueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 1_000 },
      },
    });
    queue.on("error", (e) => console.error("[track-queue] error:", e.message));
  }
  return queue;
};

export const closeTrackQueue = async () => {
  const q = queue;
  queue = null;
  if (q) await q.close().catch(() => undefined);
};