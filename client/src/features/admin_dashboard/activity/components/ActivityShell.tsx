import ActivityNav from "./ActivityNav";
import styles from "../css/ui.module.css";

// The common frame of all activity pages (used in the layout)
export default function ActivityShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <ActivityNav />
      {children}
    </div>
  );
}