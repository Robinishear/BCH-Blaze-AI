import { PageStatsData } from "../_core/activity.types";
import styles from "../css/tables.module.css";
import ui from "../css/ui.module.css";

export default function PageStats({ data }: { data: PageStatsData }) {
  return (
    <div className={ui.shell}>
      <h2 className={ui.cardTitle}>Most visited pages</h2>
      {data.pages.length === 0 ? (
        <div className={ui.card}><div className={ui.empty}>No data in this range.</div></div>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Path</th><th className={styles.num}>Views</th><th className={styles.num}>Clicks</th><th className={styles.num}>Visitors</th></tr>
            </thead>
            <tbody>
              {data.pages.map((p) => (
                <tr key={p.path}>
                  <td className={styles.mono}>{p.path}</td>
                  <td className={styles.num}>{p.views}</td>
                  <td className={styles.num}>{p.clicks}</td>
                  <td className={styles.num}>{p.visitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className={ui.cardTitle}>Most clicked elements</h2>
      {data.topClicks.length === 0 ? (
        <div className={ui.card}><div className={ui.empty}>No clicks in this range.</div></div>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead><tr><th>Element</th><th>Page</th><th className={styles.num}>Clicks</th></tr></thead>
            <tbody>
              {data.topClicks.map((c, i) => (
                <tr key={i}>
                  <td>
                    {c.text || c.selector || "-"}
                    {c.text && c.selector ? <span className={`${styles.sub} ${styles.mono}`}>{c.selector}</span> : null}
                  </td>
                  <td className={styles.mono}>{c.path}</td>
                  <td className={styles.num}>{c.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className={ui.cardTitle}>DevTools suspected, by page</h2>
      {data.devtoolsByPath.length === 0 ? (
        <div className={ui.card}><div className={ui.empty}>None in this range.</div></div>
      ) : (
        <div className={styles.wrap}>
          <table className={styles.table}>
            <thead><tr><th>Page</th><th className={styles.num}>Count</th></tr></thead>
            <tbody>
              {data.devtoolsByPath.map((d) => (
                <tr key={d.path}><td className={styles.mono}>{d.path}</td><td className={styles.num}>{d.count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}