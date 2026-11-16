import { z } from "zod";
import {
  EVENT_TYPES,
  ID_REGEX,
  MAX_EVENTS_PER_BATCH,
  MAX_PROPS_BYTES,
} from "./tracking.constants";

const idSchema = z.string().regex(ID_REGEX, "Invalid id");

const eventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  path: z.string().min(1).max(300),
  at: z.number().int().positive(),
  props: z
    .record(z.string(), z.unknown())
    .optional()
    .refine((p) => !p || JSON.stringify(p).length <= MAX_PROPS_BYTES, {
      message: `props must be at most ${MAX_PROPS_BYTES} bytes`,
    }),
});

export const trackBatchSchema = z.object({
  visitorId: idSchema,
  sessionId: idSchema,
  context: z
    .object({
      referrer: z.string().max(500).optional(),
      screen: z.string().max(20).optional(),
      language: z.string().max(20).optional(),
      timezone: z.string().max(60).optional(),
    })
    .optional(),
  events: z.array(eventSchema).min(1).max(MAX_EVENTS_PER_BATCH),
});

export type TrackBatchBody = z.infer<typeof trackBatchSchema>;