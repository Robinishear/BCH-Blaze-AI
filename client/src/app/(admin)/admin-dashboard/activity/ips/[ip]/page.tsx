import Link from "next/link";

import tables from "@/features/admin_dashboard/activity/css/Tables.module.css";
import ui from "@/features/admin_dashboard/activity/css/ui.module.css";
import { pickParams, RawSearchParams } from "@/features/admin_dashboard/activity/lib/filters";
import { getIpActivity } from "@/features/admin_dashboard/activity/_core/activity.service";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import ActivitySummary from "@/features/admin_dashboard/activity/components/ActivitySummary";
import SessionsTable from "@/features/admin_dashboard/activity/components/SessionsTable";
import Pagination from "@/features/admin_dashboard/activity/components/Pagination";


const safeDecode = (v: string) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export default async function IpActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ ip: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const ip = safeDecode((await params).ip);
  const { page } = pickParams(await searchParams, ["page"] as const);
  const data = await getIpActivity(ip, { page });

  return (
    <>
      <PageHeader title={`IP ${data.ip}`} subtitle={`${data.visitors.length} different browsers, ${data.users.length} logged-in users`} />
      {data.users.length ? (
        <div className={ui.chips}>
          <span>Users from this IP:</span>
          {data.users.map((u) => (
            <Link key={u.id} className={tables.link} href={activityPaths.user(u.id)}>
              {u.name || u.email}
            </Link>
          ))}
        </div>
      ) : null}
      {data.visitors.length ? (
        <div className={ui.chips}>
          <span>Browsers:</span>
          {data.visitors.map((v) => (
            <Link key={v.visitorId} className={`${tables.link} ${tables.mono}`} href={activityPaths.visitor(v.visitorId)}>
              {v.visitorId.slice(0, 8)} ({v.sessions})
            </Link>
          ))}
        </div>
      ) : null}
      <ActivitySummary info={{ summary: data.summary, ips: [], devices: data.devices }} />
      <SessionsTable sessions={data.sessions} />
      <Pagination meta={data.meta} basePath={activityPaths.ip(data.ip)} />
    </>
  );
}