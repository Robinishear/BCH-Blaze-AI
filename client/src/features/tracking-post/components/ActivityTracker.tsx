"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { onNewPage } from "../lib/listeners";
import { track } from "../lib/queue";
import { startTracking } from "../lib/start";
import { cleanUrl, trunc } from "../lib/utils";

let previousPath: string | undefined;

// An invisible component. It is placed once in the root layout, and it shows nothing.
export default function ActivityTracker() {
  const pathname = usePathname();

  // All listeners start once
  useEffect(() => startTracking(), []);

  // Page view on every route change (pathname has no query string)
  useEffect(() => {
    const at = Date.now();
    onNewPage();

    // A short wait so that the new page's <title> is set
    const t = window.setTimeout(() => {
      track(
        "page_view",
        {
          title: trunc(document.title, 100),
          from: previousPath ?? cleanUrl(document.referrer),
        },
        at,
      );
      previousPath = pathname;
    }, 150);

    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}