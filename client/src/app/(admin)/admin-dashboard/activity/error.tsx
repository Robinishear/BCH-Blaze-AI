"use client";

import styles from "@/features/admin_dashboard/activity/css/ui.module.css";

export default function ActivityError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className={`${styles.card} ${styles.errorBox}`}>
      <p>The activity data could not be loaded. Check that you are logged in as an admin and the backend is running.</p>
      <button type="button" className={styles.button} onClick={reset}>
        Try again
      </button>
    </div>
  );
}