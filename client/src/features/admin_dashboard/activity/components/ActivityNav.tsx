"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activityPaths } from "../lib/activity.paths";
import styles from "../css/ui.module.css";

const ITEMS = [
  { href: activityPaths.overview, label: "Overview", exact: true },
  { href: activityPaths.online, label: "Online now" },
  { href: activityPaths.sessions, label: "Sessions" },
  { href: activityPaths.events, label: "Events" },
  { href: activityPaths.pages, label: "Pages" },
];

export default function ActivityNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className={styles.nav}>
      {ITEMS.map((i) => {
        const on = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`${styles.navLink} ${on ? styles.active : ""}`}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}