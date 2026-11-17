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


//# TODO get  
const bool = z.enum(["true", "false"]).transform((v) => v === "true");

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const onlineQuery = z.object({
  minutes: z.coerce.number().int().min(1).max(60).default(5),
  includeBots: bool.default(false),
});

export const sessionsQuery = z.object({
  ...pagination,
  type: z.enum(["all", "user", "anonymous"]).default("all"),
  country: z.string().max(2).optional(),
  ip: z.string().max(64).optional(),
  userId: z.string().max(64).optional(),
  visitorId: z.string().max(64).optional(),
  device: z.string().max(20).optional(),
  devtools: bool.optional(),
  isBot: bool.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const paginationQuery = z.object(pagination);

export const eventsQuery = z.object({
  ...pagination,
  type: z.enum(EVENT_TYPES).optional(),
  path: z.string().max(300).optional(),
  sessionId: z.string().max(64).optional(),
  userId: z.string().max(64).optional(),
  visitorId: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const statsQuery = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
  includeBots: bool.default(false),
});

export const pagesQuery = statsQuery.extend({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});