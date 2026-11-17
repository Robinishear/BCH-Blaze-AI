export const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

// Keeps only the origin and path of a URL: the query string and hash are dropped (they can contain tokens or emails)
export const cleanUrl = (raw: string | null | undefined): string | undefined => {
  if (!raw) return undefined;
  try {
    const u = new URL(raw, window.location.href);
    if (u.protocol === "mailto:" || u.protocol === "tel:") return u.protocol;
    if (u.origin === window.location.origin) return trunc(u.pathname, 200);
    return trunc(u.origin + u.pathname, 200);
  } catch {
    return undefined;
  }
};

// A short label for an element, e.g. "div.card > button.btn-primary"
export const describe = (el: Element): string => {
  const parts: string[] = [];
  let cur: Element | null = el;
  for (let i = 0; cur && i < 3 && cur !== document.body; i++) {
    let s = cur.tagName.toLowerCase();
    if (cur.id) {
      s += `#${trunc(cur.id, 40)}`;
      parts.unshift(s);
      break;
    }
    const cls = Array.from(cur.classList)
      .slice(0, 2)
      .map((c) => trunc(c, 30))
      .join(".");
    if (cls) s += `.${cls}`;
    parts.unshift(s);
    cur = cur.parentElement;
  }
  return trunc(parts.join(" > "), 150);
};