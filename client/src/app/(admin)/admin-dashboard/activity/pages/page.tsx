import { getPageStats } from "@/features/admin_dashboard/activity/_core/activity.service";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import PageStats from "@/features/admin_dashboard/activity/components/PageStats";
import RangeTabs from "@/features/admin_dashboard/activity/components/RangeTabs";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import { pickParams, RawSearchParams } from "@/features/admin_dashboard/activity/lib/filters";

export default async function PageStatsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const { days } = pickParams(await searchParams, ["days"] as const);
  const range = [1, 7, 30, 90].includes(Number(days)) ? Number(days) : 7;
  const data = await getPageStats({ days: range, limit: 20 });

  return (
    <>
      <PageHeader
        title="Pages"
        subtitle="Most visited pages, most clicked elements"
        right={<RangeTabs basePath={activityPaths.pages} days={range} />}
      />
      <PageStats data={data} />
    </>
  );
}