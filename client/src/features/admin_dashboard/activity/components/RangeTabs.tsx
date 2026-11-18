import Link from "next/link";
import styles from "../css/ui.module.css";

const RANGES = [1, 7, 30, 90];

export default function RangeTabs({ basePath, days }: { basePath: string; days: number }) {
  return (
    <div className={styles.range}>
      {RANGES.map((d) => (
        <Link
          key={d}
          href={`${basePath}?days=${d}`}
          className={`${styles.rangeLink} ${d === days ? styles.rangeOn : ""}`}
        >
          {d === 1 ? "24h" : `${d}d`}
        </Link>
      ))}
    </div>
  );
}