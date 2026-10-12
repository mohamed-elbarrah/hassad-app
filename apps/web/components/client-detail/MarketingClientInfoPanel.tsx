"use client";

import { OperationalClientInfoPanel } from "@/components/client-detail/OperationalClientInfoPanel";
import { useGetMarketingClientInfoQuery } from "@/features/marketing/marketingApi";

export function MarketingClientInfoPanel({
  clientId,
  active,
}: {
  clientId?: string;
  active: boolean;
}) {
  const query = useGetMarketingClientInfoQuery(clientId ?? "", {
    skip: !active || !clientId,
  });

  return (
    <OperationalClientInfoPanel
      clientId={clientId}
      active={active}
      query={query}
    />
  );
}
