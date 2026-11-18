import { getOverview } from "@/features/admin_dashboard/activity/_core/activity.service";
import AutoRefresh from "@/features/admin_dashboard/activity/components/AutoRefresh";
import OverviewCards from "@/features/admin_dashboard/activity/components/OverviewCards";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import RangeTabs from "@/features/admin_dashboard/activity/components/RangeTabs";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import { pickParams, RawSearchParams } from "@/features/admin_dashboard/activity/lib/filters";

export default async function ActivityOverviewPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const { days } = pickParams(await searchParams, ["days"] as const);
  const range = [1, 7, 30, 90].includes(Number(days)) ? Number(days) : 7;
  const data = await getOverview({ days: range });

  return (
    <>
      <AutoRefresh seconds={30} />
      <PageHeader
        title="Activity overview"
        subtitle="Visitors and users of your site (bots are not counted)"
        right={<RangeTabs basePath={activityPaths.overview} days={range} />}
      />
      <OverviewCards data={data} />
    </>
  );
}