import ActivityNav from "@/features/admin_dashboard/activity/components/ActivityNav";
import type { ReactNode } from "react";

export default function ActivityShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full px-4 py-6 sm:px-5 lg:px-6">
      <div className="space-y-6">
        <ActivityNav />
        <main>{children}</main>
      </div>
    </div>
  );
}