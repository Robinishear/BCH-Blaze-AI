import { formatDay } from "../lib/format";
import { countryFlag } from "../lib/format";
import { OverviewData } from "../_core/activity.types";
import styles from "../css/overview.module.css";
import ui from "../css/ui.module.css";

const Stat = ({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: "live" | "alert" }) => (
  <div className={styles.stat}>
    <div className={styles.statLabel}>{label}</div>
    <div className={`${styles.statValue} ${tone ? styles[tone] : ""}`}>{value.toLocaleString("en-US")}</div>
    {hint ? <div className={styles.statHint}>{hint}</div> : null}
  </div>
);

export default function OverviewCards({ data }: { data: OverviewData }) {
  const t = data.totals;
  const total = t.userSessions + t.anonymousSessions || 1;
  const maxDay = Math.max(1, ...data.daily.map((d) => d.sessions));

  return (
    <div className={ui.shell}>
      <div className={styles.grid}>
        <Stat label="Online now" value={data.onlineNow} hint="last 5 minutes" tone="live" />
        <Stat label="Sessions" value={t.sessions} hint="times the site was opened" />
        <Stat label="Unique visitors" value={t.visitors} hint="different browsers" />
        <Stat label="Logged-in users" value={t.users} hint="different accounts" />
        <Stat label="Page views" value={t.pageViews} />
        <Stat label="Events" value={t.events} />
        <Stat label="DevTools suspected" value={t.devtoolsSessions} hint="sessions" tone={t.devtoolsSessions ? "alert" : undefined} />
      </div>

      <div className={ui.card}>
        <h3 className={ui.cardTitle}>Users vs anonymous (sessions)</h3>
        <div className={styles.split}>
          <div className={styles.splitUser} style={{ width: `${(t.userSessions / total) * 100}%` }} />
          <div className={styles.splitAnon} style={{ width: `${(t.anonymousSessions / total) * 100}%` }} />
        </div>
        <div className={styles.legend}>
          <span>Logged-in: {t.userSessions}</span>
          <span>Anonymous: {t.anonymousSessions}</span>
        </div>
      </div>

      <div className={ui.card}>
        <h3 className={ui.cardTitle}>Sessions per day</h3>
        {data.daily.length === 0 ? (
          <div className={ui.empty}>No data in this range.</div>
        ) : (
          <div className={styles.chart}>
            {data.daily.map((d) => (
              <div key={d.day} className={styles.barCol} title={`${d.sessions} sessions, ${d.visitors} visitors`}>
                <span className={styles.barValue}>{d.sessions}</span>
                <div className={styles.bar} style={{ height: `${(d.sessions / maxDay) * 100}%` }} />
                <span className={styles.barLabel}>{formatDay(d.day)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.lists}>
        <div className={ui.card}>
          <h3 className={ui.cardTitle}>Top countries</h3>
          <ul className={styles.list}>
            {data.topCountries.map((c) => (
              <li key={c.country} className={styles.listItem}>
                <span>{countryFlag(c.country.length === 2 ? c.country : null)} {c.country}</span>
                <span className={styles.listCount}>{c.sessions}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={ui.card}>
          <h3 className={ui.cardTitle}>Devices</h3>
          <ul className={styles.list}>
            {data.devices.map((d) => (
              <li key={d.device} className={styles.listItem}><span>{d.device}</span><span className={styles.listCount}>{d.sessions}</span></li>
            ))}
          </ul>
        </div>
        <div className={ui.card}>
          <h3 className={ui.cardTitle}>Browsers</h3>
          <ul className={styles.list}>
            {data.browsers.map((b) => (
              <li key={b.browser} className={styles.listItem}><span>{b.browser}</span><span className={styles.listCount}>{b.sessions}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}