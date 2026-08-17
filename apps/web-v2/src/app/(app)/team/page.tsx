import type { Metadata } from "next";

import { TeamOverviewWorkspace } from "@/features/team/components/team-overview-workspace";

export const metadata: Metadata = {
  title: "My Work | Hassad",
};

export default function TeamOverviewPage() {
  return <TeamOverviewWorkspace />;
}
