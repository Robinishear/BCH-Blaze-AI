"use client";

import { useEffect, useRef, useState } from "react";
export default function CountUp({
  value,
  prefix = "",
  suffix = "",
  delay = 0,
  duration = 1800,
  className,
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const target = Number(value) || 0;
  const decimals = Math.min(8, String(value).split(".")[1]?.length ?? 0);
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }

    let raf = 0;
    let timer = 0;
    let started = false;

    const run = () => {
      started = true;
      timer = window.setTimeout(() => {
        let t0 = 0;
        const step = (t: number) => {
          if (!t0) t0 = t;
          const p = Math.min(1, (t - t0) / duration);
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
          setN(target * eased);
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, delay);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delay, duration]);

  const text = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className ?? "tabular-nums"}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}