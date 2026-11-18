import { getUserActivity } from "@/features/admin_dashboard/activity/_core/activity.service";
import ActivitySummary from "@/features/admin_dashboard/activity/components/ActivitySummary";
import Badge from "@/features/admin_dashboard/activity/components/Badge";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import Pagination from "@/features/admin_dashboard/activity/components/Pagination";
import SessionsTable from "@/features/admin_dashboard/activity/components/SessionsTable";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import { pickParams, RawSearchParams } from "@/features/admin_dashboard/activity/lib/filters";


export default async function UserActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { userId } = await params;
  const { page } = pickParams(await searchParams, ["page"] as const);
  const data = await getUserActivity(userId, { page });

  return (
    <>
      <PageHeader
        title={data.user.name || data.user.email}
        subtitle={data.user.email}
        right={<Badge tone="user">{data.user.role}</Badge>}
      />
      <ActivitySummary info={data} />
      <SessionsTable sessions={data.sessions} />
      <Pagination meta={data.meta} basePath={activityPaths.user(userId)} />
    </>
  );
}