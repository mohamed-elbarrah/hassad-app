import {
  buildDefaultClientStats,
  ClientProfileCard,
  ClientProfileOverviewCard,
  type ClientDetailEntity,
} from "@/components/client-detail/ClientDetailPattern";

export function ClientInfoCards({ client }: { client: ClientDetailEntity }) {
  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
      <ClientProfileOverviewCard
        client={client}
        profile={client.profile}
        stats={buildDefaultClientStats(client, "admin")}
      />
      <ClientProfileCard
        client={client}
        profile={client.profile}
        mode="admin"
        title="بيانات النشاط"
        description="المعلومات التعريفية والتسويقية المسجلة للعميل."
        businessOnly
      />
    </div>
  );
}
