"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientBrief } from "@/components/client-brief";

interface OverviewTabProps {
  client: Client;
  profile: ClientProfile | null;
}

export function OverviewTab({ client, profile }: OverviewTabProps) {
  return <ClientBrief client={client} profile={profile ?? null} viewAs="sales" />;
}
