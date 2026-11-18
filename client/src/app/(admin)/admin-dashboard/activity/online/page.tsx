import { getOnline } from "@/features/admin_dashboard/activity/_core/activity.service";
import AutoRefresh from "@/features/admin_dashboard/activity/components/AutoRefresh";
import OnlineList from "@/features/admin_dashboard/activity/components/OnlineList";
import PageHeader from "@/features/admin_dashboard/activity/components/PageHeader";

export default async function OnlinePage() {
  const data = await getOnline({ minutes: 5 });

  return (
    <>
      <AutoRefresh seconds={10} />
      <PageHeader
        title="Online now"
        subtitle={`${data.onlineCount} active in the last ${data.windowMinutes} minutes · ${data.loggedIn} logged-in · ${data.anonymous} anonymous`}
      />
      <OnlineList data={data} />
    </>
  );
}