import { TrackBatchBody } from "./tracking.validation";

export interface TrackJobData {
  visitorId: string;
  sessionId: string;
  userId: string | null;
  ip: string;
  userAgent: string;
  context: TrackBatchBody["context"];
  events: TrackBatchBody["events"];
  receivedAt: number;
}

export interface IngestInput {
  body: TrackBatchBody;
  ip: string;
  userId: string | null;
  userAgent: string;
}
