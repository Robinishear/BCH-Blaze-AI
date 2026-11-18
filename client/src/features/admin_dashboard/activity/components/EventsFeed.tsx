import Link from "next/link";
import { activityPaths } from "../lib/activity.paths";
import { countryFlag, describeEvent, formatDateTime, isAlertType, visitorLabel } from "../lib/format";
import { EventRow } from "../_core/activity.types";
import Badge, { VisitorBadges } from "./Badge";
import styles from "../css/tables.module.css";
import ui from "../css/ui.module.css";

export default function EventsFeed({ events }: { events: EventRow[] }) {
  if (!events.length) return <div className={ui.card}><div className={ui.empty}>No events found.</div></div>;

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr><th>Time</th><th>Event</th><th>Path</th><th>Visitor</th><th>IP</th><th /></tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const { label, detail } = describeEvent(e);
            return (
              <tr key={e.id}>
                <td>{formatDateTime(e.at)}</td>
                <td>
                  <div className={styles.stack}>
                    <Badge tone={isAlertType(e.type) ? "warn" : "muted"}>{label}</Badge>
                    {detail ? <span className={`${styles.sub} ${styles.detail}`}>{detail}</span> : null}
                  </div>
                </td>
                <td className={styles.mono}>{e.path}</td>
                <td>
                  <div className={styles.stack}>
                    <Link
                      className={styles.link}
                      href={e.session.userId ? activityPaths.user(e.session.userId) : activityPaths.visitor(e.session.visitorId)}
                    >
                      {visitorLabel({ user: e.user, visitorId: e.session.visitorId })}
                    </Link>
                    <span><VisitorBadges type={e.visitorType} isBot={e.session.isBot} /></span>
                  </div>
                </td>
                <td>
                  <Link className={`${styles.link} ${styles.mono}`} href={activityPaths.ip(e.session.ip)}>{e.session.ip}</Link>
                  <span className={styles.sub}>{countryFlag(e.session.country)} {e.session.city ?? ""}</span>
                </td>
                <td><Link className={styles.link} href={activityPaths.session(e.sessionId)}>Session →</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}