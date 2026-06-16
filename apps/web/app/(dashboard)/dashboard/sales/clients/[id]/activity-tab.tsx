"use client";

import type { Client } from "@hassad/shared";
import { ClientTimeline } from "@/components/dashboard/crm/ClientTimeline";

interface ActivityTabProps {
  client: Client;
}

export function ActivityTab({ client }: ActivityTabProps) {
  return <ClientTimeline activities={client.historyLogs ?? []} />;
}
