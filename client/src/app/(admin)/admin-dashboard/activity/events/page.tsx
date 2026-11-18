import { getEvents } from "@/features/admin_dashboard/activity/_core/activity.service";
import EventsFeed from "@/features/admin_dashboard/activity/components/EventsFeed";
import FilterBar from "@/features/admin_dashboard/activity/components/FilterBar";
import { EVENT_FIELDS } from "@/features/admin_dashboard/activity/components/FilterFields";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import Pagination from "@/features/admin_dashboard/activity/components/Pagination";
import { activityPaths } from "@/features/admin_dashboard/activity/lib/activity.paths";
import { EVENT_FILTER_KEYS, pickParams, RawSearchParams, withEndOfDay } from "@/features/admin_dashboard/activity/lib/filters";


export default async function EventsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = pickParams(await searchParams, EVENT_FILTER_KEYS);
  const { items, meta } = await getEvents(withEndOfDay(filters));

  return (
    <>
      <PageHeader title="Events" subtitle={`${meta.total} events`} />
      <FilterBar action={activityPaths.events} fields={EVENT_FIELDS} values={filters} />
      <EventsFeed events={items} />
      <Pagination meta={meta} basePath={activityPaths.events} params={filters} />
    </>
  );
}