"use client";

import type { Client } from "@hassad/shared";
import { ClientTimeline } from "@/components/dashboard/crm/ClientTimeline";

interface ActivityEntry {
  id: string;
  action: string;
  details?: string | null;
  createdAt: string;
  userId: string;
}

interface ActivityTabProps {
  client: Client;
}

export function ActivityTab({ client }: ActivityTabProps) {
  const clientWithActivities = client as Client & {
    activities?: ActivityEntry[];
  };

  return (
    <ClientTimeline activities={clientWithActivities.activities ?? []} />
  );
}
