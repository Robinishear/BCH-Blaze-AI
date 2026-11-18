import { getSessionTimeline } from "@/features/admin_dashboard/activity/_core/activity.service";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";
import SessionTimeline from "@/features/admin_dashboard/activity/components/SessionTimeline";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSessionTimeline(id);

  return (
    <>
      <PageHeader title="Session timeline" subtitle={`${data.session.eventCount} events`} />
      <SessionTimeline data={data} />
    </>
  );
}