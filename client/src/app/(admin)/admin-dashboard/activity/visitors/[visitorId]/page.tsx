import Link from "next/link";

import { getVisitorActivity } from "@/features/admin_dashboard/activity/_core/activity.service";
import ActivitySummary from "@/features/admin_dashboard/activity/components/ActivitySummary";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import Pagination from "@/features/admin_dashboard/activity/components/Pagination";
import SessionsTable from "@/features/admin_dashboard/activity/components/SessionsTable";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import { pickParams, RawSearchParams } from "@/features/admin_dashboard/activity/lib/filters";
import tables from "@/features/admin_dashboard/activity/css/Tables.module.css";
import ui from "@/features/admin_dashboard/activity/css/ui.module.css";

export default async function VisitorActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ visitorId: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { visitorId } = await params;
  const { page } = pickParams(await searchParams, ["page"] as const);
  const data = await getVisitorActivity(visitorId, { page });

  return (
    <>
      <PageHeader title="Visitor (browser)" subtitle={data.visitorId} />
      {data.linkedUsers.length ? (
        <div className={ui.chips}>
          <span>Logged in later as:</span>
          {data.linkedUsers.map((u) => (
            <Link key={u.id} className={tables.link} href={activityPaths.user(u.id)}>
              {u.name || u.email}
            </Link>
          ))}
        </div>
      ) : null}
      <ActivitySummary info={data} />
      <SessionsTable sessions={data.sessions} />
      <Pagination meta={data.meta} basePath={activityPaths.visitor(visitorId)} />
    </>
  );
}