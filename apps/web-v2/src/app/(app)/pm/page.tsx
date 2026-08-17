import type { Metadata } from "next";

import { PmProjectsWorkspace } from "@/features/pm-projects/components/pm-projects-workspace";

export const metadata: Metadata = {
  title: "PM Overview | Hassad",
};

export default function PmOverviewPage() {
  return <PmProjectsWorkspace />;
}
