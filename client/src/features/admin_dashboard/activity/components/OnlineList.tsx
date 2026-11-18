import Link from "next/link";
import { activityPaths } from "../lib/activity.paths";
import { countryFlag, deviceLabel, describeEvent, locationLabel, timeAgo, visitorLabel } from "../lib/format";
import { OnlineData } from "../_core/activity.types";
import { VisitorBadges } from "./Badge";
import styles from "../css/tables.module.css";
import ui from "../css/ui.module.css";

export default function OnlineList({ data }: { data: OnlineData }) {
  if (!data.sessions.length) {
    return (
      <div className={ui.card}>
        <div className={ui.empty}>Nobody has been active in the last {data.windowMinutes} minutes.</div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Visitor</th>
            <th>IP / Location</th>
            <th>Device</th>
            <th>Now on</th>
            <th>Last action</th>
            <th>Since</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.sessions.map((s) => {
            const last = s.lastEventType ? describeEvent({ type: s.lastEventType, props: null }).label : "-";
            return (
              <tr key={s.id}>
                <td>
                  <div className={styles.stack}>
                    <span>
                      <span className={styles.pulse} />
                      <Link
                        className={styles.link}
                        href={s.userId ? activityPaths.user(s.userId) : activityPaths.visitor(s.visitorId)}
                      >
                        {visitorLabel(s)}
                      </Link>
                    </span>
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
                <td className={styles.mono}>{s.currentPath}</td>
                <td>
                  {last}
                  <span className={styles.sub}>{timeAgo(s.lastEventAt ?? s.lastSeenAt)}</span>
                </td>
                <td>{timeAgo(s.startedAt)}</td>
                <td>
                  <Link className={styles.link} href={activityPaths.session(s.id)}>
                    Timeline →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}