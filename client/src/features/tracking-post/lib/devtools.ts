import { TRACKING_CONFIG as C } from "../tracking.config";
import { track } from "./queue";

// There is no reliable way to know if DevTools is open. These are only "suspicion" signals.
// The `debugger` timing trick is deliberately not used: it pauses the page for the visitor.
export const startDevtoolsWatch = (): (() => void) => {
  let lastVia = "";
  let lastAt = 0;

  const report = (via: string, extra?: Record<string, number>) => {
    const now = Date.now();
    if (via === lastVia && now - lastAt < 1_000) return;
    lastVia = via;
    lastAt = now;
    track("devtools_suspected", { via, ...extra });
  };

  // Shortcut keys. The event is not blocked, only recorded. e.code is used because on a Mac, Option changes e.key.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "F12") return report("F12");

    const letter =
      typeof e.code === "string" && e.code.startsWith("Key")
        ? e.code.slice(3)
        : "";
    if ((e.ctrlKey && e.shiftKey) && ["I", "J", "C", "K"].includes(letter)) {
      return report(`Ctrl+Shift+${letter}`);
    }
    if (e.metaKey && e.altKey && ["I", "J", "C"].includes(letter)) {
      return report(`Cmd+Opt+${letter}`);
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && letter === "U") {
      return report("view-source");
    }
  };

  // When DevTools is docked, the difference between the outer and inner window size grows
  let open = false;
  const checkSize = () => {
    if (document.hidden) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return; // phone or tablet
    if (!window.outerWidth || !window.outerHeight) return;

    const w = window.outerWidth - window.innerWidth;
    const h = window.outerHeight - window.innerHeight;
    const now = w > C.devtoolsWidthPx || h > C.devtoolsHeightPx;
    if (now && !open) report("size-heuristic", { w, h });
    open = now;
  };

  document.addEventListener("keydown", onKey, true);
  const id = window.setInterval(checkSize, C.devtoolsCheckMs);

  return () => {
    document.removeEventListener("keydown", onKey, true);
    window.clearInterval(id);
  };
};