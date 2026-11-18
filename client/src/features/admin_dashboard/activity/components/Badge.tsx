import styles from "../css/ui.module.css";

type Tone = "user" | "anon" | "bot" | "warn" | "info" | "muted";

export default function Badge({ tone = "muted", children }: { tone?: Tone; children: React.ReactNode }) {
  const toneClass = tone === "muted" ? "" : styles[tone];
  return <span className={`${styles.badge} ${toneClass}`}>{children}</span>;
}

export function VisitorBadges({ type, isBot }: { type: "user" | "anonymous"; isBot?: boolean }) {
  return (
    <>
      <Badge tone={type === "user" ? "user" : "anon"}>{type === "user" ? "User" : "Anonymous"}</Badge>
      {isBot ? <Badge tone="bot">Bot</Badge> : null}
    </>
  );
}