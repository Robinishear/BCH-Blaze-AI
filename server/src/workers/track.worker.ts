import { Worker } from "bullmq";
import {
  TRACK_QUEUE_NAME,
  TRACK_WORKER_CONCURRENCY,
} from "../app/modules/tracking/tracking.constants";
import { TrackJobData } from "../app/modules/tracking/tracking.interface";
import { processBatch } from "../app/modules/tracking/tracking.processor";
import { hasRedis, workerConnection } from "../queues/Connection";
import { closeTrackQueue } from "../queues/track.queue";

let worker: Worker<TrackJobData> | null = null;

export const startTrackWorker = () => {
  if (worker) return;
  if (!hasRedis()) {
    console.warn("[track-worker] REDIS_URL not set: events are written directly to the DB");
    return;
  }

  worker = new Worker<TrackJobData>(
    TRACK_QUEUE_NAME,
    async (job) => processBatch(job.data),
    { connection: workerConnection(), concurrency: TRACK_WORKER_CONCURRENCY },
  );

  worker.on("error", (e) => console.error("[track-worker] error:", e.message));
  worker.on("failed", (job, e) =>
    console.error(`[track-worker] job ${job?.id} failed:`, e.message),
  );
  console.log("[track-worker] started");
};

export const stopTrackWorker = async () => {
  const w = worker;
  worker = null;
  if (w) await w.close().catch(() => undefined);
  await closeTrackQueue();
};