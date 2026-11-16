
import { Request } from "express";
import { UAParser } from "ua-parser-js";
import { BOT_UA_REGEX, MAX_CLOCK_SKEW_MS } from "./tracking.constants";
import geoip from "geoip-lite";

export const getClientIp = (req: Request): string => {
  const raw = req.ip ?? req.socket.remoteAddress ?? "unknown";
  return raw.replace(/^::ffff:/i, "");
};

export const parseUserAgent = (ua: string) => {
  const r = new UAParser(ua).getResult();

  const major = r.browser.version?.split(".")[0];

  return {
    browser: r.browser.name
      ? `${r.browser.name}${major ? ` ${major}` : ""}`
      : null,

    os: r.os.name
      ? `${r.os.name}${r.os.version ? ` ${r.os.version}` : ""}`
      : null,

    device: r.device.type ?? null,

    isBot: BOT_UA_REGEX.test(ua),
  };
};

export const lookupGeo = (ip: string) => {
  const g = geoip.lookup(ip);

  return {
    country: g?.country || null,
    region: g?.region || null,
    city: g?.city || null,
    timezone: g?.timezone || null,
  };
};

// The client's clock may be wrong.
export const clampAt = (at: number, now: number): Date =>
  new Date(
    Math.abs(now - at) > MAX_CLOCK_SKEW_MS ? now : at
  );

export const isUniqueViolation = (e: unknown) =>
  (e as { code?: string })?.code === "P2002";
