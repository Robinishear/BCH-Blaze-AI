import Link from "next/link";
import { activityPaths } from "../lib/activity.paths";
import { countryFlag, deviceLabel, formatDateTime, locationLabel, timeAgo } from "../lib/format";
import { ActivityInfo, DeviceRow, IpRow } from "../_core/activity.types";
import overview from "../css/Overview.module.css";
import styles from "../css/Tables.module.css";
import ui from "../css/ui.module.css";

const Stat = ({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) => (
  <div className={overview.stat}>
    <div className={overview.statLabel}>{label}</div>
    <div className={`${overview.statValue} ${alert ? overview.alert : ""}`}>{value}</div>
  </div>
);

export function IpTable({ ips }: { ips: IpRow[] }) {
  if (!ips.length) return null;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr><th>IP</th><th>Location</th><th className={styles.num}>Sessions</th><th>Last seen</th></tr>
        </thead>
        <tbody>
          {ips.map((i) => (
            <tr key={i.ip}>
              <td><Link className={`${styles.link} ${styles.mono}`} href={activityPaths.ip(i.ip)}>{i.ip}</Link></td>
              <td>{countryFlag(i.country)} {locationLabel(i)}</td>
              <td className={styles.num}>{i.sessions}</td>
              <td>{timeAgo(i.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DeviceTable({ devices }: { devices: DeviceRow[] }) {
  if (!devices.length) return null;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead><tr><th>Device</th><th className={styles.num}>Sessions</th></tr></thead>
        <tbody>
          {devices.map((d, i) => (
            <tr key={i}><td>{deviceLabel(d)}</td><td className={styles.num}>{d.sessions}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The common top part of the user, visitor and IP pages
export default function ActivitySummary({ info }: { info: Pick<ActivityInfo, "summary" | "ips" | "devices"> }) {
  const s = info.summary;
  return (
    <>
      <div className={overview.grid}>
        <Stat label="Times opened" value={s.sessionCount} />
        <Stat label="Page views" value={s.totalPageViews} />
        <Stat label="Events" value={s.totalEvents} />
        <Stat label="DevTools suspected" value={s.devtoolsSuspectedCount} alert={s.devtoolsSuspectedCount > 0} />
        <Stat label="First seen" value={formatDateTime(s.firstSeen)} />
        <Stat label="Last seen" value={formatDateTime(s.lastSeen)} />
      </div>
      {info.ips.length ? <><h2 className={ui.cardTitle}>IP addresses</h2><IpTable ips={info.ips} /></> : null}
      {info.devices.length ? <><h2 className={ui.cardTitle}>Devices</h2><DeviceTable devices={info.devices} /></> : null}
    </>
  );
}