"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activityPaths } from "../lib/activity.paths";
import { cn } from "cn";

const ITEMS = [
  { href: activityPaths.overview, label: "Overview", exact: true },
  { href: activityPaths.online, label: "Online now" },
  { href: activityPaths.sessions, label: "Sessions" },
  { href: activityPaths.events, label: "Events" },
  { href: activityPaths.pages, label: "Pages" },
];

const PETAL_ANGLES = [0, 45, 90, 135];

function Flower({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      {PETAL_ANGLES.map((r) => (
        <ellipse
          key={r}
          rx="42"
          ry="13"
          transform={`rotate(${r})`}
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="1.2"
        />
      ))}
      <circle r="5" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

export default function ActivityNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Activity"
      className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map((i) => {
        const active = i.exact
          ? pathname === i.href
          : pathname === i.href || pathname.startsWith(`${i.href}/`);

        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative isolate whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
              "transition-colors duration-300",
              active
                ? "text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full bg-zinc-800/80 ring-1 ring-white/10"
              >
                <Flower className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 animate-[spin_14s_linear_infinite] text-zinc-700 opacity-50 motion-reduce:animate-none" />
                <Flower className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 animate-[spin_9s_linear_infinite_reverse] text-zinc-400 opacity-40 motion-reduce:animate-none" />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.10),transparent_70%)] animate-pulse motion-reduce:animate-none" />
              </span>
            )}
            <span className="relative">{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}