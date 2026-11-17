import { TRACKING_CONFIG as C } from "../tracking.config";
import { TrackProps } from "../tracking.types";
import { flush, resetPageCounter, track } from "./queue";
import { cleanUrl, describe, trunc } from "./utils";

const INTERACTIVE =
  'a,button,[role="button"],[role="link"],[role="tab"],[role="menuitem"],input,select,textarea,summary,label,[data-track]';

// Page-wise state
const reachedScroll = new Set<number>();
let errorsThisPage = 0;

const checkScroll = () => {
  const doc = document.documentElement;
  const total = Math.max(doc.scrollHeight, document.body?.scrollHeight ?? 0);
  if (!total) return;
  const seen = window.scrollY + window.innerHeight;
  const pct = Math.min(100, Math.round((seen / total) * 100));
  for (const mark of C.scrollMarks) {
    if (pct >= mark && !reachedScroll.has(mark)) {
      reachedScroll.add(mark);
      track("scroll", { depth: mark });
    }
  }
};

// Called when a new page starts
export const onNewPage = () => {
  reachedScroll.clear();
  errorsThisPage = 0;
  resetPageCounter();
  // A short page may already be 100% visible
  window.setTimeout(checkScroll, 600);
};

export const startListeners = (): (() => void) => {
  const recent: { t: number; x: number; y: number }[] = [];

  const onClick = (e: MouseEvent) => {
    const raw = e.target;
    if (!(raw instanceof Element)) return;
    if (raw.closest("[data-no-track]")) return;

    const interactive = raw.closest(INTERACTIVE);
    const el = interactive ?? raw;
    const tag = el.tagName.toLowerCase();
    const isField = tag === "input" || tag === "textarea" || tag === "select";

    const props: TrackProps = {
      tag,
      selector: describe(el),
      x: Math.round(e.clientX),
      y: Math.round(e.clientY),
    };

    const name = el.getAttribute("data-track");
    if (name) props.name = trunc(name, 60);

    if (isField) {
      // Only the kind of field is recorded, never what was typed
      props.inputType = (el as HTMLInputElement).type || tag;
    } else if (interactive) {
      const label =
        el.getAttribute("aria-label") || (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (label) props.text = trunc(label, C.clickTextMax);
    }
    if (tag === "a") props.href = cleanUrl(el.getAttribute("href"));

    track("click", props);

    // Rage click: many clicks in a short time on the same spot
    const now = Date.now();
    recent.push({ t: now, x: e.clientX, y: e.clientY });
    while (recent.length && now - recent[0].t > C.rageClickWindowMs) recent.shift();
    const near = recent.filter(
      (r) => Math.hypot(r.x - e.clientX, r.y - e.clientY) <= C.rageClickRadiusPx,
    );
    if (near.length >= C.rageClickCount) {
      track("rage_click", { selector: describe(el), count: near.length });
      recent.length = 0;
    }
  };

  const onContextMenu = (e: MouseEvent) => {
    if (!(e.target instanceof Element) || e.target.closest("[data-no-track]")) return;
    track("right_click", { tag: e.target.tagName.toLowerCase(), selector: describe(e.target) });
  };

  const onCopy = () => {
    // Only the length of the copied text is recorded, never the text
    track("copy", { length: window.getSelection()?.toString().length ?? 0 });
  };

  const onPaste = (e: ClipboardEvent) => {
    if (e.target instanceof Element && e.target.closest("[data-no-track]")) return;
    // The pasted content is never read
    track("paste", {
      tag: e.target instanceof Element ? e.target.tagName.toLowerCase() : undefined,
    });
  };

  const onSubmit = (e: Event) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || form.closest("[data-no-track]")) return;
    // Nothing from inside the form (values) is recorded
    track("form_submit", {
      selector: describe(form),
      action: cleanUrl(form.getAttribute("action")),
      method: (form.getAttribute("method") ?? "get").toLowerCase(),
    });
  };

  let scrollTimer: number | null = null;
  const onScroll = () => {
    if (scrollTimer !== null) return;
    scrollTimer = window.setTimeout(() => {
      scrollTimer = null;
      checkScroll();
    }, 200);
  };

  const onVisibility = () => {
    track("visibility", { state: document.visibilityState });
    if (document.visibilityState === "hidden") flush();
  };

  const onPageHide = () => flush();

  let lastError = "";
  let lastErrorAt = 0;
  const reportError = (kind: string, message: string, extra?: TrackProps) => {
    if (errorsThisPage >= C.maxErrorsPerPage) return;
    const now = Date.now();
    const key = `${kind}:${message}`;
    if (key === lastError && now - lastErrorAt < 5_000) return;
    lastError = key;
    lastErrorAt = now;
    errorsThisPage++;
    track("error", { kind, message: trunc(message, 200), ...extra });
  };

  const onError = (e: ErrorEvent) =>
    reportError("js", e.message || "Script error", {
      source: cleanUrl(e.filename),
      line: e.lineno,
      col: e.colno,
    });

  const onRejection = (e: PromiseRejectionEvent) => {
    const r = e.reason;
    reportError("promise", r instanceof Error ? r.message : String(r ?? "Unhandled rejection"));
  };

  document.addEventListener("click", onClick, true);
  document.addEventListener("contextmenu", onContextMenu, true);
  document.addEventListener("copy", onCopy, true);
  document.addEventListener("paste", onPaste, true);
  document.addEventListener("submit", onSubmit, true);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("contextmenu", onContextMenu, true);
    document.removeEventListener("copy", onCopy, true);
    document.removeEventListener("paste", onPaste, true);
    document.removeEventListener("submit", onSubmit, true);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    if (scrollTimer !== null) window.clearTimeout(scrollTimer);
    flush();
  };
};