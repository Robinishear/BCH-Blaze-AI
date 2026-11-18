import Link from "next/link";
import { activityPaths } from "../lib/activity.paths";
import {
  countryFlag, deviceLabel, formatDateTime, locationLabel, timeAgo, visitorLabel,
} from "../lib/format";
import { SessionRow } from "../_core/activity.types";
import Badge, { VisitorBadges } from "./Badge";
import styles from "../css/Tables.module.css";
import ui from "../css/ui.module.css";

export default function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  if (!sessions.length) return <div className={ui.card}><div className={ui.empty}>No sessions found.</div></div>;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Started</th>
            <th>Visitor</th>
            <th>IP / Location</th>
            <th>Device</th>
            <th className={styles.num}>Pages</th>
            <th className={styles.num}>Events</th>
            <th>DevTools</th>
            <th>Last seen</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>
                {formatDateTime(s.startedAt)}
                <span className={styles.sub}>{timeAgo(s.startedAt)}</span>
              </td>
              <td>
                <div className={styles.stack}>
                  <Link
                    className={styles.link}
                    href={s.userId ? activityPaths.user(s.userId) : activityPaths.visitor(s.visitorId)}
                  >
                    {visitorLabel(s)}
                  </Link>
                  <span><VisitorBadges type={s.visitorType} isBot={s.isBot} /></span>
                </div>
              </td>
              <td>
                <Link className={`${styles.link} ${styles.mono}`} href={activityPaths.ip(s.ip)}>
                  {s.ip}
                </Link>
                <span className={styles.sub}>
                  {countryFlag(s.country)} {locationLabel(s)}
                </span>
              </td>
              <td>{deviceLabel(s)}</td>
              <td className={styles.num}>{s.pageViewCount}</td>
              <td className={styles.num}>{s.eventCount}</td>
              <td>{s.devtoolsCount > 0 ? <Badge tone="warn">{s.devtoolsCount} suspected</Badge> : "-"}</td>
              <td>{timeAgo(s.lastSeenAt)}</td>
              <td>
                <Link className={styles.link} href={activityPaths.session(s.id)}>
                  Timeline →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}