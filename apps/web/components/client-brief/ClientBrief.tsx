"use client";

import type { Client, ClientProfile } from "@hassad/shared";
import { ClientBriefIdentity } from "./ClientBriefIdentity";
import { ClientBriefOverview } from "./ClientBriefOverview";
import { ClientBriefSidebar } from "./ClientBriefSidebar";

interface ClientBriefProps {
  client: Client;
  profile: ClientProfile | null;
}

export function ClientBrief({ client, profile }: ClientBriefProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" dir="rtl">
      <div className="lg:col-span-3">
        <ClientBriefIdentity client={client} profile={profile} />
      </div>
      <div className="lg:col-span-6">
        <ClientBriefOverview client={client} profile={profile} />
      </div>
      <div className="lg:col-span-3">
        <ClientBriefSidebar client={client} profile={profile} />
      </div>
    </div>
  );
}
