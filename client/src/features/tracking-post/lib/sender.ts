import { TRACKING_CONFIG as C } from "../tracking.config";
import { TrackBatch } from "../tracking.types";

// Sent directly from the browser to the backend (not through the Next server), so the real IP and User-Agent of the visitor reach the backend.
export const sendBatch = (payload: TrackBatch): void => {
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(C.endpoint, blob)) return;
    }
  } catch {
    /* falls back to fetch */
  }

  try {
    void fetch(C.endpoint, {
      method: "POST",
      body,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      keepalive: true,
      credentials: "include",
      mode: "cors",
    }).catch(() => undefined);
  } catch {
    /* tracking must never break the site */
  }
};