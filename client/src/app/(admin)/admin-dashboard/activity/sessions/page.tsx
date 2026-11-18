import { getSessions } from "@/features/admin_dashboard/activity/_core/activity.service";
import FilterBar from "@/features/admin_dashboard/activity/components/FilterBar";
import { SESSION_FIELDS } from "@/features/admin_dashboard/activity/components/FilterFields";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import Pagination from "@/features/admin_dashboard/activity/components/Pagination";
import SessionsTable from "@/features/admin_dashboard/activity/components/SessionsTable";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import { pickParams, RawSearchParams, SESSION_FILTER_KEYS, withEndOfDay } from "@/features/admin_dashboard/activity/lib/filters";

export default async function SessionsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = pickParams(await searchParams, SESSION_FILTER_KEYS);
  const { items, meta } = await getSessions(withEndOfDay(filters));

  return (
    <>
      <PageHeader title="Sessions" subtitle={`${meta.total} sessions`} />
      <FilterBar action={activityPaths.sessions} fields={SESSION_FIELDS} values={filters} />
      <SessionsTable sessions={items} />
      <Pagination meta={meta} basePath={activityPaths.sessions} params={filters} />
    </>
  );
}