import Link from "next/link";
import { PageMeta } from "../_core/activity.types";
import styles from "../css/ui.module.css";

export default function Pagination({
  meta,
  basePath,
  params = {},
}: {
  meta: PageMeta;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  const href = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") q.set(k, v);
    q.set("page", String(page));
    return `${basePath}?${q.toString()}`;
  };

  const hasPrev = meta.page > 1;
  const hasNext = meta.page < meta.totalPages;

  return (
    <div className={styles.pagination}>
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className={styles.pageLinks}>
        <Link href={href(meta.page - 1)} className={`${styles.pageLink} ${hasPrev ? "" : styles.pageLinkOff}`}>
          ← Prev
        </Link>
        <Link href={href(meta.page + 1)} className={`${styles.pageLink} ${hasNext ? "" : styles.pageLinkOff}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}