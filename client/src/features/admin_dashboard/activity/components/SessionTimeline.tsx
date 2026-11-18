import Link from "next/link";
import { activityPaths } from "../lib/activity.paths";
import {
  countryFlag, describeEvent, deviceLabel, formatDateTime, formatDuration, formatTime,
  isAlertType, locationLabel, visitorLabel,
} from "../lib/format";
import { TimelineData } from "../_core/activity.types";
import Badge, { VisitorBadges } from "./Badge";
import styles from "../css/timeline.module.css";
import ui from "../css/ui.module.css";
import tables from "../css/tables.module.css";

export default function SessionTimeline({ data }: { data: TimelineData }) {
  const s = data.session;
  let lastPath = "";

  return (
    <div className={ui.shell}>
      <div className={ui.card}>
        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Visitor</span>
            <Link className={tables.link} href={s.userId ? activityPaths.user(s.userId) : activityPaths.visitor(s.visitorId)}>
              {visitorLabel(s)}
            </Link>
            <span><VisitorBadges type={s.visitorType} isBot={s.isBot} /></span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>IP</span>
            <Link className={`${tables.link} ${tables.mono}`} href={activityPaths.ip(s.ip)}>{s.ip}</Link>
            <span>{countryFlag(s.country)} {locationLabel(s)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Device</span>
            <span>{deviceLabel(s)}</span>
            <span className={tables.sub}>{[s.screen, s.language, s.timezone].filter(Boolean).join(" · ")}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Session</span>
            <span>{formatDateTime(s.startedAt)}</span>
            <span className={tables.sub}>Lasted {formatDuration(s.durationSeconds)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Came from</span>
            <span>{s.referrer || "Direct"}</span>
            <span className={`${tables.sub} ${tables.mono}`}>Entry: {s.entryPath}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>DevTools</span>
            {s.devtoolsCount > 0 ? <Badge tone="warn">{s.devtoolsCount} suspected</Badge> : <span>None</span>}
          </div>
        </div>
      </div>

      <div className={styles.counts}>
        {Object.entries(data.typeCounts).map(([type, n]) => (
          <Badge key={type} tone={isAlertType(type) ? "warn" : "muted"}>
            {describeEvent({ type: type as never, props: null }).label}: {n}
          </Badge>
        ))}
      </div>

      <div className={ui.card}>
        {data.events.length === 0 ? (
          <div className={ui.empty}>No events.</div>
        ) : (
          <ol className={styles.list}>
            {data.events.map((e) => {
              const { label, detail } = describeEvent(e);
              const alert = isAlertType(e.type);
              const pathChanged = e.path !== lastPath;
              lastPath = e.path;
              return (
                <li key={e.id}>
                  {pathChanged ? <div className={`${styles.pathHead} ${tables.mono}`}>{e.path}</div> : null}
                  <div className={styles.item}>
                    <span className={styles.time}>{formatTime(e.at)}</span>
                    <span className={styles.dotCol}>
                      <span className={styles.dot} data-type={e.type} data-alert={alert} />
                    </span>
                    <span>
                      <span className={`${styles.label} ${alert ? styles.alertLabel : ""}`}>{label}</span>
                      {detail ? <span className={styles.detail}>{detail}</span> : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {data.eventsTruncated ? (
          <p className={styles.note}>Only the first events are shown (the session has more).</p>
        ) : null}
      </div>
    </div>
  );
}