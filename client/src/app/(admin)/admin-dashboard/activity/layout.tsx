import ActivityShell from "@/features/admin_dashboard/activity/components/ActivityShell";

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return <ActivityShell>{children}</ActivityShell>;
}