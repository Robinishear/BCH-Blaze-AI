import Link from "next/link";
import styles from "../css/ui.module.css";

export type FilterField =
  | { name: string; label: string; kind: "text"; placeholder?: string }
  | { name: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { name: string; label: string; kind: "date" }
  | { name: string; label: string; kind: "checkbox"; value: string };

// A plain GET form: it needs no JavaScript, and the filters live in the URL (so the link can be shared)
export default function FilterBar({
  action,
  fields,
  values,
}: {
  action: string;
  fields: FilterField[];
  values: Record<string, string | undefined>;
}) {
  return (
    <form method="get" action={action} className={styles.filters}>
      {fields.map((f) => {
        const current = values[f.name] ?? "";
        if (f.kind === "checkbox") {
          return (
            <label key={f.name} className={`${styles.field} ${styles.check}`}>
              <input type="checkbox" name={f.name} value={f.value} defaultChecked={current === f.value} />
              {f.label}
            </label>
          );
        }
        return (
          <label key={f.name} className={styles.field}>
            <span>{f.label}</span>
            {f.kind === "select" ? (
              <select name={f.name} defaultValue={current} className={styles.input}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.kind === "date" ? "date" : "text"}
                name={f.name}
                defaultValue={current}
                placeholder={f.kind === "text" ? f.placeholder : undefined}
                className={styles.input}
              />
            )}
          </label>
        );
      })}
      <button type="submit" className={styles.button}>
        Apply
      </button>
      <Link href={action} className={styles.reset}>
        Reset
      </Link>
    </form>
  );
}