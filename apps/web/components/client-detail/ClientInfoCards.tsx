import {
  buildDefaultClientStats,
  ClientProfileCard,
  ClientProfileOverviewCard,
  type ClientDetailEntity,
  type ClientDetailMode,
  type ClientStatItem,
} from "@/components/client-detail/ClientDetailPattern";

export function ClientInfoCards({
  client,
  mode = "admin",
  stats,
}: {
  client: ClientDetailEntity;
  mode?: ClientDetailMode;
  stats?: ClientStatItem[];
}) {
  const clientStats =
    stats ??
    (mode === "internal" || mode === "pm"
      ? []
      : buildDefaultClientStats(client, mode));

  return (
    <div className="grid min-w-0 items-start gap-6 xl:grid-cols-2">
      <ClientProfileOverviewCard
        client={client}
        profile={client.profile}
        mode={mode}
        stats={clientStats}
      />
      <ClientProfileCard
        client={client}
        profile={client.profile}
        mode={mode}
        title="بيانات النشاط"
        description="المعلومات التعريفية والتسويقية المسجلة للعميل."
        businessOnly
      />
    </div>
  );
}
