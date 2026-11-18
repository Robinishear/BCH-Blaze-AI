"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Refreshes the server data of the page every few seconds (it pauses when the tab is hidden)
export default function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);

  return null;
}